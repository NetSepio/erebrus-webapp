// Reuse the AI OpenGraph card for the Twitter card. `runtime` must be declared
// locally — Next.js forbids re-exporting the route segment config.
export { default, alt, size, contentType } from "./opengraph-image";

export const runtime = "edge";
