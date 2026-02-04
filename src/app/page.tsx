import { Metadata } from "next";
import App from "./app";

export const metadata: Metadata = {
  title: "Bank of Celo - Coming Soon",
  description: "Something amazing is coming. Stay tuned!",
  openGraph: {
    title: "Bank of Celo - Coming Soon",
    description: "We're working on something cool. Stay tuned for the big reveal!",
  },
};

export default function Home() {
  return <App />;
}
