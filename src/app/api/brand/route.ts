import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const HEX = /^#[0-9a-fA-F]{6}$/;
const FONT_KEYS = ["inter", "poppins", "montserrat", "playfair", "bebas", "space", "dmserif", "outfit"];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const kit = await db.brandKit.findUnique({ where: { userId: user.id } });
  return NextResponse.json(kit || {});
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  if (typeof b.displayName === "string") data.displayName = b.displayName.slice(0, 60);
  if (typeof b.handle === "string") data.handle = b.handle.replace(/^@/, "").replace(/[^a-zA-Z0-9_.]/g, "").slice(0, 30);
  if (typeof b.avatarUrl === "string" || b.avatarUrl === null) {
    if (typeof b.avatarUrl === "string" && b.avatarUrl.length > 2_500_000) {
      return NextResponse.json({ error: "Avatar muito grande." }, { status: 413 });
    }
    data.avatarUrl = b.avatarUrl;
  }
  for (const k of ["primary", "secondary", "accent", "bgColor", "textColor"]) {
    if (typeof b[k] === "string" && HEX.test(b[k] as string)) data[k] = b[k];
  }
  for (const k of ["headingFont", "bodyFont"]) {
    if (typeof b[k] === "string" && FONT_KEYS.includes(b[k] as string)) data[k] = b[k];
  }
  if (typeof b.useBrand === "boolean") data.useBrand = b.useBrand;

  const kit = await db.brandKit.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, displayName: user.name, handle: "meuperfil", ...data },
  });
  return NextResponse.json(kit);
}
