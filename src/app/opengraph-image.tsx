import { ImageResponse } from "next/og";
export const alt = "Magic Carousels — Suas ideias merecem um bom carrossel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#111116",
          color: "white",
          height: "100%",
          width: "100%",
          display: "flex",
          padding: 80,
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 32, display: "flex" }}>
          Magic <span style={{ color: "#fa72a1" }}>Carousels</span>
        </div>
        <div
          style={{
            fontSize: 76,
            lineHeight: 1.1,
            display: "flex",
            maxWidth: 950,
          }}
        >
          Suas ideias merecem um bom carrossel.
        </div>
        <div style={{ fontSize: 28, color: "#fa72a1", display: "flex" }}>
          Crie. Edite. Compartilhe.
        </div>
      </div>
    ),
    size,
  );
}
