// app/api/claim/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { BANK_OF_CELO_CONTRACT_ABI, BANK_OF_CELO_CONTRACT_ADDRESS } from "~/lib/constants";
import { encodeFunctionData } from "viem";
import { submitReferral } from "@divvi/referral-sdk";

export async function POST(req: NextRequest) {
  try {
    const { address, fid, deadline, signature, nonce, dataSuffix } = await req.json();

    if (!address || !fid || !deadline || !signature || nonce === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Initialize public client
    const publicClient = createPublicClient({
      chain: celo,
      transport: http("https://forno.celo.org"),
    });

    // Check user's CELO balance
    const balance = await publicClient.getBalance({ address: address as `0x${string}` });
    const minBalance = parseEther("0.001"); // Minimum to cover gas (~0.001 CELO)

    if (balance > minBalance) {
      // User has CELO: Return transaction request for claim
      const gas = await publicClient.estimateContractGas({
        address: BANK_OF_CELO_CONTRACT_ADDRESS,
        abi: BANK_OF_CELO_CONTRACT_ABI,
        functionName: "claim",
        args: [BigInt(fid), BigInt(deadline), signature],
        account: address,
      });

      const contractData = encodeFunctionData({
        abi: BANK_OF_CELO_CONTRACT_ABI,
        functionName: "claim",
        args: [BigInt(fid), BigInt(deadline), signature],
      });

      const finalData = dataSuffix ? contractData + (dataSuffix.startsWith("0x") ? dataSuffix.slice(2) : dataSuffix) : contractData;

      const txRequest = {
        to: BANK_OF_CELO_CONTRACT_ADDRESS as `0x${string}`,
        data: finalData as `0x${string}`,
        value: 0n,
        gas,
        gasPrice: await publicClient.getGasPrice(),
      };

      return NextResponse.json({
        action: "signAndSend",
        transaction: txRequest,
      });
    } else {
      // User has no CELO: Use private key to call executeGaslessClaim
      const privateKey = process.env.SPONSOR_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("SPONSOR_PRIVATE_KEY not configured in environment variables");
      }

      // Validate private key format
      const hexRegex = /^0x[0-9a-fA-F]{64}$/;
      if (!hexRegex.test(privateKey)) {
        throw new Error(
          "Invalid SPONSOR_PRIVATE_KEY: must be a 64-character hex string starting with 0x"
        );
      }

      const account = privateKeyToAccount(privateKey as `0x${string}`);
      const walletClient = createWalletClient({
        account,
        chain: celo,
        transport: http("https://forno.celo.org"),
      });

      // Encode executeGaslessClaim data
      const contractData = encodeFunctionData({
        abi: BANK_OF_CELO_CONTRACT_ABI,
        functionName: "executeGaslessClaim",
        args: [address, BigInt(fid), BigInt(deadline), signature],
      });

      // Append dataSuffix if provided
      const finalData = dataSuffix ? contractData + (dataSuffix.startsWith("0x") ? dataSuffix.slice(2) : dataSuffix) : contractData;

      // Call executeGaslessClaim
      const hash = await walletClient.sendTransaction({
        account,
        to: BANK_OF_CELO_CONTRACT_ADDRESS,
        data: finalData as `0x${string}`,
        value: 0n,
      });

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Report to Divi
      if (dataSuffix) {
        try {
          await submitReferral({
            txHash: receipt.transactionHash,
            chainId: 42220, // Celo mainnet
          });
        } catch (diviError) {
          console.log("Divi submitReferral error:", diviError);
          // Continue to return success, as referral tracking is secondary
        }
      }

      return NextResponse.json({ transactionHash: receipt.transactionHash });
    }
  } catch (error) {
    console.log("Claim error:", error);
    return NextResponse.json(
      { error: `Failed to process claim: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}