"use client";

import dynamic from "next/dynamic";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { FrameProvider } from "~/components/providers/FrameProvider";
import { CashbackProvider } from "~/components/providers/CashbackProvider";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ChainModeProvider } from "./chain-mode/context";

const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  {
    ssr: false,
  },
);

export function Providers({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider session={session}>
      <WagmiProvider>
        <ChainModeProvider>
          <FrameProvider>
            <CashbackProvider>
              <ConvexClientProvider>{children}</ConvexClientProvider>
            </CashbackProvider>
          </FrameProvider>
        </ChainModeProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
