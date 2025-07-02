/* eslint-disable @typescript-eslint/no-unused-vars */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { mnemonicToAccount } from "viem/accounts";
import {
  APP_BUTTON_TEXT,
  APP_ICON_URL,
  APP_NAME,
  APP_OG_IMAGE_URL,
  APP_SPLASH_BACKGROUND_COLOR,
  APP_URL,
} from "./constants";
import { APP_SPLASH_URL } from "./constants";

interface FrameMetadata {
  accountAssociation?: {
    header: string;
    payload: string;
    signature: string;
  };
  frame: {
    version: string;
    name: string;
    iconUrl: string;
    homeUrl: string;
    imageUrl: string;
    buttonTitle: string;
    splashImageUrl: string;
    splashBackgroundColor: string;
    webhookUrl: string;
  };
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSecretEnvVars() {
  const seedPhrase = process.env.SEED_PHRASE;
  const fid = process.env.FID;

  if (!seedPhrase || !fid) {
    return null;
  }

  return { seedPhrase, fid };
}

export async function getFarcasterMetadata(): Promise<FrameMetadata> {
  // 1) Pre-signed FRAME_METADATA?
  if (process.env.FRAME_METADATA) {
    try {
      const metadata = JSON.parse(process.env.FRAME_METADATA);
      console.log("Using pre-signed frame metadata from environment");
      return metadata;
    } catch (error) {
      console.warn("Failed to parse FRAME_METADATA from environment:", error);
    }
  }

  // 2) APP_URL must be set
  if (!APP_URL) {
    throw new Error("NEXT_PUBLIC_URL (APP_URL) not configured");
  }

  // 3) Hardcoded account association
  const accountAssociation = {
    header:
      "eyJmaWQiOjQyMDU2NCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGREOGVFNTU1NTc0NGQ2ODQyZTNjNTcyZTQ2RjQyMDkyZWQ3MzI2YjYifQ",
    payload: "eyJkb21haW4iOiJiYW5rLW9mLWNlbG8udmVyY2VsLmFwcCJ9",
    signature:
      "MHg0MTI0YWMzZDMwMGJjNWMwMGRhYjFhODgyNmQxYzIyYTk5NDM1OWRmYjA4NWQyNGYwZmQ0YzdmZjk1ZDM2MjcxN2VmZGY2MGU5NzFiNTQ4ODk2NzM2MzlmOWE4ZTVhMjI5N2Q0MGEwYzZkMGE1YjI5OGQwMzZhZWQ4YzYyN2VkMjFj",
  };
  console.log("Using hardcoded account association");

  // 4) Determine webhook URL
  const webhookUrl =
    process.env.NEYNAR_API_KEY && process.env.NEYNAR_CLIENT_ID
      ? `https://api.neynar.com/f/app/${process.env.NEYNAR_CLIENT_ID}/event`
      : `${APP_URL}/api/webhook`;

  // 5) Build and return FrameMetadata
  return {
    accountAssociation,
    frame: {
      version: "1",
      name: APP_NAME ?? "Frames v2 Demo",
      iconUrl: APP_ICON_URL,
      homeUrl: APP_URL,
      imageUrl: APP_OG_IMAGE_URL,
      buttonTitle: APP_BUTTON_TEXT ?? "Launch Frame",
      splashImageUrl: APP_SPLASH_URL,
      splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
      webhookUrl,
    },
  };
}
