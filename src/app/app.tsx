"use client";

import dynamic from "next/dynamic";
import { Toaster } from "~/components/ui/sonner";
import { APP_NAME } from "~/lib/constants";

// note: dynamic import is required for components that use the Frame SDK
const Main = dynamic(() => import("~/components/Main"), {
  ssr: false,
});

export default function App(
  { title }: { title?: string; } = { title: APP_NAME }
) {
  return (
    <>
      <Main title={title} />
      <Toaster position="top-right" />
    </>
  );
}
