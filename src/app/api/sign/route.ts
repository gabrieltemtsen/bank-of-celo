// app/api/sign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, keccak256, encodePacked } from "viem";
import { celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// Type definitions for request body
interface SignRequest {
  type: "checkIn" | "claimReward";
  userAddress: `0x${string}`;
  day?: number;
  fid?: number;
  round: number;
}

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const { type, userAddress, day, fid, round }: SignRequest = body;

    // Validate required fields
    if (!type || !userAddress || round === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: type, userAddress, round" },
        { status: 400 },
      );
    }

    // Validate type
    if (!["checkIn", "claimReward"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type: must be either 'checkIn' or 'claimReward'" },
        { status: 400 },
      );
    }

    // Validate userAddress format
    if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return NextResponse.json(
        { error: "Invalid Ethereum address format" },
        { status: 400 },
      );
    }

    // Type-specific validation
    if (type === "checkIn") {
      if (day === undefined || day < 1 || day > 7) {
        return NextResponse.json(
          { error: "For checkIn, day must be between 1 and 7" },
          { status: 400 },
        );
      }
    } else if (type === "claimReward" && fid === undefined) {
      return NextResponse.json(
        { error: "For claimReward, fid is required" },
        { status: 400 },
      );
    }

    // Validate round is a positive number
    if (round < 0) {
      return NextResponse.json(
        { error: "Round must be a positive number" },
        { status: 400 },
      );
    }

    // Get and validate private key
    const privateKey = process.env.SPONSOR_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error(
        "SPONSOR_PRIVATE_KEY not configured in environment variables",
      );
    }

    if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
      throw new Error("Invalid SPONSOR_PRIVATE_KEY format");
    }

    // Initialize signer
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: celo,
      transport: http(),
    });

    // Generate message hash based on type using encodePacked
    let messageHash: `0x${string}`;
    if (type === "checkIn") {
      messageHash = keccak256(
        encodePacked(
          ["address", "uint256", "uint256"],
          [userAddress, BigInt(day!), BigInt(round)],
        ),
      );
    } else {
      messageHash = keccak256(
        encodePacked(
          ["address", "uint256", "uint256"],
          [userAddress, BigInt(fid!), BigInt(round)],
        ),
      );
    }

    // Sign the message
    const signature = await walletClient.signMessage({
      message: { raw: messageHash },
    });

    return NextResponse.json({ signature });
  } catch (error) {
    console.error("Signature generation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    const statusCode =
      error instanceof Error && error.message.includes("private key")
        ? 500
        : 400;

    return NextResponse.json(
      { error: `Signature generation failed: ${errorMessage}` },
      { status: statusCode },
    );
  }
}
