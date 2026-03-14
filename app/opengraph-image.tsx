import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = siteConfig.ogImageAlt;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #f8f7f1 0%, #edf7f3 50%, #ffffff 100%)",
        color: "#111111",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 32,
          borderRadius: 28,
          border: "1px solid rgba(17, 17, 17, 0.08)",
          background: "rgba(255, 255, 255, 0.7)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 42,
          top: 42,
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            width: 24,
            height: 24,
            background: "#111111",
          }}
        />
        <span
          style={{
            marginLeft: 8,
            fontSize: 20,
            letterSpacing: "-0.03em",
          }}
        >
          github.com/murabcd
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "110px 72px 72px",
          width: "100%",
          gap: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            alignSelf: "flex-start",
            padding: "10px 18px",
            borderRadius: 999,
            background: "rgba(17, 17, 17, 0.06)",
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "-0.03em",
          }}
        >
          Visual AI Playground
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            maxWidth: 960,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 132,
              fontWeight: 800,
              letterSpacing: "-0.07em",
              lineHeight: 0.92,
            }}
          >
            Oracle
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 42,
              lineHeight: 1.25,
              color: "rgba(17, 17, 17, 0.72)",
              letterSpacing: "-0.04em",
            }}
          >
            Build node-based text, image, and reasoning workflows.
          </div>
        </div>
      </div>
    </div>,
    size
  );
}
