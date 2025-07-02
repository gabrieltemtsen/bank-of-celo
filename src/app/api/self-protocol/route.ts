/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { getUserIdentifier, SelfBackendVerifier } from "@selfxyz/core";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const convex = new ConvexHttpClient(CONVEX_URL);

export async function POST(req: NextRequest) {
  try {
    const { proof, publicSignals } = await req.json();

    // if (!proof || !publicSignals) {
    //   return NextResponse.json(
    //     { message: 'Proof and publicSignals are required' },
    //     { status: 400 }
    //   );
    // }

    console.log("Received USER**:", req.body);

    // Extract user ID from the proof
    const USERID = await getUserIdentifier(publicSignals);
    console.log("Extracted userId:", USERID);
    console.log("Proof:", proof);

    // Initialize and configure the verifier
    const selfBackendVerifier = new SelfBackendVerifier(
      `bank-of-celo`, // scope
      `https://bank-of-celo.vercel.app/api/self-protocol`, // endpoint
      "hex", // user_identifier_type
      // mockPassport
    );
    console.log("passed");

    console.log("Initialized SelfBackendVerifier:", selfBackendVerifier);

    // Verify the proof
    const result = await selfBackendVerifier.verify(proof, publicSignals);
    console.log("Verification result:", result);

    if (result.isValid) {
      // Return successful verification response
      // await convex.mutation(api.users.verifyOG, { address: result.userId });

      return NextResponse.json({
        status: "success",
        result: true,
        credentialSubject: result.credentialSubject,
      });
    }

    // Return failed verification response
    return NextResponse.json(
      {
        status: "error",
        result: false,
        message: "Verification failed",
        details: result.isValidDetails,
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error verifying proof:", error);
    return NextResponse.json(
      {
        status: "error",
        result: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
