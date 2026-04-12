import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Tab + bookmark favicon — matches dark UI + accent (see globals.css). */
export default function Icon() {
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
          borderRadius: 7,
          border: "1.5px solid rgba(59, 130, 246, 0.45)",
        }}
      >
        <span
          style={{
            fontSize: 19,
            fontWeight: 700,
            color: "#3b82f6",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
            letterSpacing: "-0.05em",
          }}
        >
          d
        </span>
      </div>
    ),
    { ...size },
  );
}
