import "server-only";
import { connection, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { database } from "./db";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function body(req: Request, max = 100000) {
  if (Number(req.headers.get("content-length") || 0) > max)
    throw new HttpError(413, "Conteúdo muito grande.");
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "Envie JSON válido.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const r = await reader.read();
    if (r.done) break;
    size += r.value.length;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, "Conteúdo muito grande.");
    }
    chunks.push(r.value);
  }
  try {
    const v = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!v || typeof v !== "object" || Array.isArray(v)) throw Error();
    return v as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "Envie JSON válido.");
  }
}
export function text(v: unknown, min: number, max: number, label: string) {
  if (typeof v !== "string" || v.trim().length < min || v.trim().length > max)
    throw new HttpError(400, label + " inválido.");
  return v.trim();
}
export function uuid(v: unknown) {
  if (
    typeof v !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v,
    )
  )
    throw new HttpError(400, "Identificador inválido.");
  return v;
}
export function check(error: unknown) {
  if (error)
    throw new HttpError(
      503,
      "Não foi possível acessar os dados. Tente novamente.",
    );
}
export async function limit(
  req: Request,
  action: string,
  max = 30,
  seconds = 60,
  identity?: string,
) {
  const ip = process.env.VERCEL
    ? req.headers.get("x-vercel-forwarded-for")?.split(",")[0] || "unknown"
    : "local";
  const key = createHash("sha256")
    .update(action + ":" + (identity || ip))
    .digest("hex");
  const r = await database().rpc("app_rate_limit", {
    p_key: key,
    p_max: max,
    p_seconds: seconds,
  });
  check(r.error);
  if (!r.data)
    throw new HttpError(429, "Muitas tentativas. Aguarde e tente novamente.");
}
export function endpoint(fn: (req: Request) => Promise<unknown>) {
  return async (req: Request) => {
    await connection();
    try {
      return NextResponse.json(await fn(req), {
        headers: { "Cache-Control": "no-store" },
      });
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500)
        console.error("Falha interna", e instanceof Error ? e.name : "erro");
      return NextResponse.json(
        {
          error:
            e instanceof HttpError
              ? e.message
              : "Não foi possível concluir. Tente novamente.",
        },
        { status, headers: { "Cache-Control": "no-store" } },
      );
    }
  };
}
