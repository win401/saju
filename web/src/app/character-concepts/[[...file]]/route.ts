import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Keep unfinished design concepts out of public production assets.
const files: Record<string, string> = {
  "index.html": "text/html; charset=utf-8",
  "style.css": "text/css; charset=utf-8",
  "a-story-guide.png": "image/png",
  "a-story-guide-v2.png": "image/png",
  "b-night-navigator.png": "image/png",
  "b-night-navigator-v2.png": "image/png",
  "c-moon-rabbit.png": "image/png",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ file?: string[] }> },
) {
  if (process.env.NODE_ENV !== "development")
    return new Response(null, { status: 404 });

  const segments = (await context.params).file;
  const name = segments?.length === 1 ? segments[0] : "index.html";
  const contentType = files[name];
  if (!contentType || (segments && segments.length > 1))
    return new Response(null, { status: 404 });

  try {
    const data = await readFile(
      join(process.cwd(), "..", "design", "characters", name),
    );
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
