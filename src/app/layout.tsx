import type { Metadata } from "next";

import { getSession } from "~/auth";
import "~/app/globals.css";
import { Providers } from "~/app/providers";
import { APP_NAME, APP_DESCRIPTION } from "~/lib/constants";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        <Providers session={session}>{children}</Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
