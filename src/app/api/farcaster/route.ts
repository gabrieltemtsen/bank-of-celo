import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
      {
        headers: {
          accept: "application/json",
          api_key: process.env.NEYNAR_API_KEY || "",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.statusText}`);
    }

    const data = await response.json();
    const user = data[address.toLowerCase()];
    const fid = user?.[0]?.fid;
    const userScore = user?.[0]?.experimental.neynar_user_score;

    if (!fid) {
      return NextResponse.json(
        { fid: null, error: "No FID found for this address" },
        { status: 404 },
      );
    }

    return NextResponse.json({ fid, userScore }, { status: 200 });
  } catch (error) {
    console.error("Neynar API error:", error);
    return NextResponse.json(
      {
        error: `Failed to fetch FID: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}