/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

// Environment variables
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

// Define types for Neynar API response
interface Cast {
  timestamp: string;
  author: {
    fid: number;
    username: string;
    score?: number;
  };
  reactions: {
    likes_count: number;
    recasts_count: number;
  };
}

interface User {
  fid: number;
  username: string;
  custody_address: string;
  verified_addresses: {
    eth_addresses?: string[];
    sol_addresses?: string[];
    primary?: {
      eth_address?: string;
      sol_address?: string;
    };
  };
}

interface NeynarResponse {
  casts: Cast[];
  next?: { cursor: string };
}

interface BulkUsersResponse {
  users: User[];
}

// Initialize Convex client
const convex = new ConvexHttpClient(CONVEX_URL);

export async function POST() {
  try {
    const oneWeekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    let casts: Cast[] = [];
    let cursor: string | null = null;
    const limit = 100;

    // Step 1: Fetch all casts with pagination
    do {
      const url = `https://api.neynar.com/v2/farcaster/feed/channels?with_recasts=true&members_only=true&limit=${limit}&channel_ids=celo${cursor ? `&cursor=${cursor}` : ""}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-api-key": NEYNAR_API_KEY,
          "x-neynar-experimental": "false",
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Neynar API error: ${response.status} - ${response.statusText} - ${errorBody}`,
        );
      }

      const data: NeynarResponse = await response.json();
      casts = casts.concat(
        data.casts.filter((cast) => cast.timestamp >= oneWeekAgo),
      );
      cursor = data.next?.cursor || null;
    } while (cursor && casts.length < 5000);

    // Step 2: Get all unique FIDs from casts
    const fids = casts.map((cast) => cast.author.fid);
    const uniqueFids = [...new Set(fids)];

    // Step 3: Fetch user details in bulk to get addresses
    let usersWithAddresses: User[] = [];
    if (uniqueFids.length > 0) {
      const usersResponse = await fetch(
        `https://api.neynar.com/v2/farcaster/user/bulk?fids=${uniqueFids.join(",")}`,
        {
          method: "GET",
          headers: {
            api_key: NEYNAR_API_KEY,
          },
        },
      );

      if (!usersResponse.ok) {
        const errorBody = await usersResponse.text();
        throw new Error(
          `Neynar Users API error: ${usersResponse.status} - ${usersResponse.statusText} - ${errorBody}`,
        );
      }

      const usersData: BulkUsersResponse = await usersResponse.json();
      usersWithAddresses = usersData.users;
    }

    // Create a map of FID to user details for quick lookup
    const userDetailsMap = new Map<number, User>();
    usersWithAddresses.forEach((user) => {
      userDetailsMap.set(user.fid, user);
    });

    // Step 4: Process casts and update user scores with address information
    const userScores = new Map<
      string,
      { score: number; username: string; address: string }
    >();
    for (const cast of casts) {
      const fid = cast.author.fid.toString();
      const userDetails = userDetailsMap.get(cast.author.fid);

      // Get the primary ETH address or fallback to custody address
      const ethAddress =
        userDetails?.verified_addresses?.primary?.eth_address?.toLowerCase() ||
        userDetails?.verified_addresses?.eth_addresses?.[0]?.toLowerCase() ||
        userDetails?.custody_address?.toLowerCase() ||
        "";

      const currentScore = userScores.get(fid) || {
        score: cast.author.score || 0,
        username: cast.author.username,
        address: ethAddress,
      };

      // Scoring: 1 point per cast, 0.5 per like, 0.3 per recast
      const castScore =
        1 +
        cast.reactions.likes_count * 0.5 +
        cast.reactions.recasts_count * 0.3;
      userScores.set(fid, {
        score: currentScore.score + castScore,
        username: currentScore.username,
        address: ethAddress || currentScore.address,
      });
    }

    // Step 5: Update users in Convex
    for (const [fid, { score, username, address }] of userScores) {
      const existingUser = await convex.query(api.users.getUserByFid, { fid });

      // Skip if user's score was updated recently (optional: adjust as needed)
      if (
        existingUser &&
        Date.now() - existingUser.lastUpdated < 7 * 24 * 60 * 60 * 1000
      ) {
        continue;
      }

      await convex.mutation(api.users.addOrUpdateUser, {
        fid,
        username,
        score,
        address: address || existingUser?.address || "",
        isOG: existingUser?.isOG || false,
      });
    }

    return NextResponse.json({
      success: true,
      castsProcessed: casts.length,
      usersProcessed: userScores.size,
    });
  } catch (error: any) {
    console.error("Error syncing Celo feed:", error);
    return NextResponse.json(
      { error: "Failed to sync feed", details: error.message },
      { status: 500 },
    );
  }
}
