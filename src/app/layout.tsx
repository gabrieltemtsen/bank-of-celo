import type { Metadata } from "next";
import "~/app/globals.css";

export const metadata: Metadata = {
  title: "Bank of Celo - Coming Soon",
  description: "Something amazing is coming. Stay tuned!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
