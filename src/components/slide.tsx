/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import type { Slide, CarouselFormat } from "@/lib/types";
import { getTemplate, FONTS, type FontKey } from "@/templates";
export function SlideView({
  slide,
  index,
  total,
  templateId,
  format,
  appearance = {},
}: {
  slide: Slide;
  index: number;
  total: number;
  templateId: string;
  format: CarouselFormat;
  appearance?: Record<string, unknown>;
}) {
  const t = getTemplate(templateId);
  const a = appearance;
  const bg = String(a.bgColor || t.colors.bg);
  const ink = String(a.textColor || t.colors.text);
  const accent = String(a.accent || t.colors.accent);
  const style: CSSProperties = {
    width: 360,
    height: format === "1:1" ? 360 : format === "9:16" ? 640 : 450,
    background: a.bgColor
      ? bg
      : t.style === "gradient"
        ? `linear-gradient(135deg,${bg},${t.colors.bg2})`
        : bg,
    color: ink,
    fontFamily: FONTS[(a.bodyFont || t.fonts.body) as FontKey]?.css,
    position: "relative",
    padding: 30,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    textAlign: slide.align || "left",
  };
  return (
    <div className={"slide-art style-" + t.style} style={style}>
      {slide.image && slide.imageMode === "background" && (
        <img
          alt=""
          src={slide.image}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.2,
          }}
        />
      )}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
        }}
      >
        {!!a.avatarUrl && (
          <img
            src={String(a.avatarUrl)}
            alt=""
            width={28}
            height={28}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        )}
        <span>
          {String(a.displayName || "Seu conteúdo")}
          <br />
          {a.handle ? "@" + String(a.handle).replace(/^@/, "") : ""}
        </span>
        <span
          style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}
        >
          {index + 1} / {total}
        </span>
      </div>
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 14,
        }}
      >
        {slide.image && slide.imageMode === "top" && (
          <img
            src={slide.image}
            alt=""
            style={{
              maxHeight: 130,
              width: "100%",
              objectFit: "cover",
              borderRadius: 8,
            }}
          />
        )}
        {slide.kicker && (
          <span style={{ color: accent, fontSize: 12, fontWeight: 700 }}>
            {slide.kicker}
          </span>
        )}
        {slide.stat && (
          <strong style={{ fontSize: 56, color: accent }}>{slide.stat}</strong>
        )}
        <h2
          style={{
            fontSize: Number(a.titleSize || 32),
            lineHeight: 1.12,
            margin: 0,
            fontFamily:
              FONTS[(a.headingFont || t.fonts.heading) as FontKey]?.css,
            textTransform: a.uppercase || t.uppercase ? "uppercase" : "none",
            overflowWrap: "anywhere",
          }}
        >
          {slide.title}
        </h2>
        {slide.body && (
          <p style={{ fontSize: 16, lineHeight: 1.5, margin: 0 }}>
            {slide.body}
          </p>
        )}
        {slide.bullets && (
          <ul style={{ fontSize: 16, paddingLeft: 20, lineHeight: 1.6 }}>
            {slide.bullets.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        )}
        {slide.author && <p style={{ fontSize: 12 }}>— {slide.author}</p>}
        {slide.cta && (
          <span
            style={{
              padding: "10px 16px",
              background: accent,
              color: bg,
              alignSelf: "flex-start",
              borderRadius: 6,
              fontWeight: 700,
            }}
          >
            {slide.cta}
          </span>
        )}
      </div>
      <div style={{ height: 3, width: 40, background: accent }} />
    </div>
  );
}
