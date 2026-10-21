import { cookies } from "next/headers";
import { endpoint } from "@/lib/http";
import { SESSION_COOKIE, revokeSession } from "@/lib/session";
export const POST = async (req: Request) => {
  const res = await endpoint(async () => {
    await revokeSession((await cookies()).get(SESSION_COOKIE)?.value);
    return { ok: true };
  })(req);
  if (res.ok)
    res.cookies.set(SESSION_COOKIE, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  return res;
};
