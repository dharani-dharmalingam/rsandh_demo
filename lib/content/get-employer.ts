import { headers } from "next/headers";

export async function getEmployerSlug(): Promise<string> {
  const h = await headers();
  const slug = h.get("x-employer-slug");
  if (!slug) {
    throw new Error(
      "No employer context. Ensure the request comes from a subdomain or includes ?employer= param."
    );
  }
  return slug;
}
