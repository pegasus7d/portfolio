import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon (Save to Home Screen, some link previews). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: 36,
          border: "3px solid rgba(59, 130, 246, 0.35)",
        }}
      >
        <span
          style={{
            fontSize: 100,
            fontWeight: 700,
            color: "#3b82f6",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
            letterSpacing: "-0.06em",
          }}
        >
          d
        </span>
      </div>
    ),
    { ...size },
  );
}
