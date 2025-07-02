import { ImageResponse } from "next/og";
import { APP_NAME } from "~/lib/constants";

export const alt = `${APP_NAME} - Community Powered DeFi Vault`;
export const size = {
  width: 600,
  height: 400,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        tw="h-full w-full flex flex-col items-center justify-center relative"
        style={{
          background: "linear-gradient(145deg, #1a5c3a 0%, #FBCC5C 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Subtle background pattern */}
        <div
          tw="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, #35D07F 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        {/* Main container */}
        <div tw="flex flex-col items-center justify-center w-full h-full px-4">
          {/* Compact Celo logo mark */}
          <div tw="flex mb-4">
            <div tw="flex bg-white/90 p-3 rounded-xl shadow-lg">
              <div tw="flex">
                <div tw="w-12 h-12 rounded-full bg-[#35D07F] shadow-md" />
                <div tw="w-12 h-12 rounded-full bg-[#FBCC5C] shadow-md -ml-2 transform rotate-6" />
                <div tw="w-12 h-12 rounded-full bg-[#5EA33B] shadow-md -ml-2 transform -rotate-6" />
              </div>
            </div>
          </div>

          {/* Scaled-down title */}
          <h1
            tw="text-4xl font-bold text-center mb-1 leading-tight"
            style={{
              background: "linear-gradient(90deg, #ffffff 30%, #FBCC5C 100%)",
              backgroundClip: "text",
              color: "transparent",
              textShadow: "0 2px 3px rgba(0,0,0,0.3)",
              letterSpacing: "-0.5px",
            }}
          >
            Bank of Celo
          </h1>

          {/* Adjusted subtitle */}
          <h2
            tw="text-xl text-white/90 text-center mb-6 px-8 leading-tight"
            style={{
              textShadow: "0 1px 2px rgba(0,0,0,0.4)",
            }}
          >
            The community-powered vault for Celo OGs
          </h2>

          {/* Compact footer */}
          <div
            tw="absolute bottom-0 w-full flex flex-col items-center pb-3"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 70%)",
            }}
          >
            <div tw="text-sm text-white/80 font-medium">Powered by</div>
            <div tw="text-lg text-white font-bold tracking-wide">CELO</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
