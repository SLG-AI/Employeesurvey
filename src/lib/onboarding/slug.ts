import { randomBytes } from "crypto";

export function generateSlug(): string {
  return randomBytes(16).toString("hex");
}
