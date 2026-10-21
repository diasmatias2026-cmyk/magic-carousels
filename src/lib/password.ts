import { HttpError } from "./http";
export function password(value: unknown, min = 12) {
  if (
    typeof value !== "string" ||
    value.length < min ||
    Buffer.byteLength(value, "utf8") > 72
  )
    throw new HttpError(
      400,
      "A senha deve ter pelo menos " +
        min +
        " caracteres e no máximo 72 bytes.",
    );
  return value;
}
