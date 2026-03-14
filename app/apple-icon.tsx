import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 40,
        background: "#111111",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 24,
          height: 16,
          width: 16,
          borderRadius: 999,
          background: "#22c55e",
        }}
      />
      <svg
        fill="none"
        height="92"
        viewBox="0 0 64 64"
        width="92"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Oracle icon</title>
        <path
          d="M31.051 14.283a1 1 0 0 1 1.898 0l2.838 10.526a2 2 0 0 0 1.404 1.404l10.526 2.838a1 1 0 0 1 0 1.898l-10.526 2.838a2 2 0 0 0-1.404 1.404l-2.838 10.526a1 1 0 0 1-1.898 0l-2.838-10.526a2 2 0 0 0-1.404-1.404l-10.526-2.838a1 1 0 0 1 0-1.898l10.526-2.838a2 2 0 0 0 1.404-1.404z"
          fill="#F8FAFC"
        />
      </svg>
    </div>,
    size
  );
}
