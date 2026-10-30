/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  SITE_ORIGIN?: string;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };


const DEFAULT_ORIGIN = "https://www.elyonwear.com";
function canonicalOrigin(env: Env): URL {
  try { const u = new URL(String(env.SITE_ORIGIN || "").trim()); if (u.protocol === "https:") return u; } catch {}
  return new URL(DEFAULT_ORIGIN);
}
// URLs of the previous shop on this domain that Google still remembers → permanent redirects.
function legacyPath(path: string): string | null {
  const p = path.toLowerCase();
  if (/^\/sitemap(_[a-z0-9_]+)?\.xml$/.test(p) && p !== "/sitemap.xml") return "/sitemap.xml";
  if (/^\/(nueva-coleccion|collections|products|catalog|tienda|shop\/all)(\/|$)/.test(p)) return "/shop";
  if (/^\/pages\/(contact|contacto)/.test(p)) return "/contact";
  if (/^\/pages\/(about|nosotros|sobre|quienes)/.test(p)) return "/about";
  if (/^\/pages\/(faq|ayuda|envios|shipping|devoluciones|returns|tallas|size)/.test(p)) return "/help";
  if (/^\/(pages|blogs|policies)(\/|$)/.test(p)) return "/";
  if (p === "/account/login") return "/account";
  if (p === "/account/register") return "/account?mode=register";
  if (p === "/search") return "/shop?search=1";
  return null;
}
const PRIVATE = /^\/(admin|account|cart|checkout)(\/|$)|^\/api\/(?!images\/)/;

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const readOnly = request.method === "GET" || request.method === "HEAD";
    const canonical = canonicalOrigin(env);
    const apex = canonical.hostname.replace(/^www\./, "");
    const productionHost = url.hostname === apex || url.hostname === `www.${apex}`;

    if (readOnly && !url.pathname.startsWith("/api/")) {
      // One single indexable host (www vs non-www, http → https).
      if (productionHost && (url.hostname !== canonical.hostname || url.protocol !== "https:")) {
        return Response.redirect(`${canonical.origin}${url.pathname}${url.search}`, 301);
      }
      const legacy = legacyPath(url.pathname);
      if (legacy) return Response.redirect(`${productionHost ? canonical.origin : url.origin}${legacy}`, 301);
      // No duplicate URLs with a trailing slash.
      if (url.pathname.length > 1 && url.pathname.endsWith("/") && !/\.[a-z0-9]+\/$/i.test(url.pathname)) {
        return Response.redirect(`${url.origin}${url.pathname.replace(/\/+$/, "")}${url.search}`, 301);
      }
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const response=await handler.fetch(request, env, ctx);
    const secure=new Response(response.body,response);
    secure.headers.set('X-Content-Type-Options','nosniff');
    secure.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
    secure.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    // Keep the workers.dev preview host and private areas out of search results.
    if(url.hostname.endsWith('.workers.dev')||PRIVATE.test(url.pathname))secure.headers.set('X-Robots-Tag','noindex, nofollow');
    if(url.pathname==='/robots.txt'||url.pathname==='/sitemap.xml')secure.headers.set('Cache-Control','public, max-age=3600');
    if((url.pathname.startsWith('/api/')&&!url.pathname.startsWith('/api/images/'))||url.pathname.startsWith('/account')||url.pathname.startsWith('/admin'))secure.headers.set('Cache-Control','no-store');
    return secure;
  },
};

export default worker;
