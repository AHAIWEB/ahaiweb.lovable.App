// Smart URL scraper with auto-routing:
// - bani.com.bd/author/* -> quotes_pool (per-author quote list)
// - *.wikipedia.org/wiki/* -> posts (Wikipedia person article, full HTML)
// - everything else -> posts (generic article: title + main content + og:image)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AuthUser = { id: string; email?: string };

function strip(s: string) {
  return s.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ").trim();
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80) || `post-${Date.now()}`;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,*/*",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

async function requireUser(req: Request, supabaseUrl: string, anonKey: string): Promise<AuthUser> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new Error("authenticated session required");

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("invalid authenticated session");
  const user = await res.json();
  if (!user?.id) throw new Error("invalid authenticated session");
  return { id: user.id, email: user.email };
}

function pick(html: string, re: RegExp): string | null {
  const m = re.exec(html); return m ? m[1].trim() : null;
}

function detectType(url: string): "bani-author" | "wiki" | "generic" {
  try {
    const u = new URL(url);
    if (u.hostname.includes("bani.com.bd") && /\/author\/\d+/.test(u.pathname)) return "bani-author";
    if (u.hostname.endsWith("wikipedia.org") && u.pathname.startsWith("/wiki/")) return "wiki";
    return "generic";
  } catch { return "generic"; }
}

// bani.com.bd/author/N pages have structure: author name in h1/h2; quotes in .single-bani / blockquote / p with author-link
function extractBaniAuthor(html: string, url: string) {
  const authorName = pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    pick(html, /<title>([\s\S]*?)(?:\s*[-|–]\s*[^<]*)?<\/title>/i) || "অজানা";
  const author = strip(authorName).replace(/\s*[-|–].*$/, "").trim();

  const out: { text: string; author: string; source_name: string; source_url: string }[] = [];
  const seen = new Set<string>();

  // bani.com.bd uses .single-bani .bani-text or blockquote
  const patterns = [
    /<div[^>]*class="[^"]*(?:single-bani|bani-text|bani-content|quote-text)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
    /<p[^>]*class="[^"]*(?:bani|quote)[^"]*"[^>]*>([\s\S]*?)<\/p>/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html)) !== null) {
      const txt = strip(m[1]);
      if (txt.length > 10 && txt.length < 1200 && !seen.has(txt)) {
        seen.add(txt);
        out.push({ text: txt, author, source_name: "bani.com.bd", source_url: `${url}#q${out.length + 1}` });
      }
    }
    if (out.length > 0) break;
  }

  // Fallback: any <p> inside main/article
  if (out.length === 0) {
    const main = pick(html, /<(?:main|article|div[^>]*class="[^"]*(?:content|main|entry)[^"]*")[^>]*>([\s\S]*?)<\/(?:main|article|div)>/i) || html;
    const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let m;
    while ((m = pRe.exec(main)) !== null) {
      const txt = strip(m[1]);
      if (txt.length > 20 && txt.length < 800 && !seen.has(txt)) {
        seen.add(txt);
        out.push({ text: txt, author, source_name: "bani.com.bd", source_url: `${url}#q${out.length + 1}` });
      }
    }
  }

  return { author, quotes: out };
}

function extractArticle(html: string, url: string) {
  const ogTitle = pick(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const title = ogTitle || pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || pick(html, /<title>([\s\S]*?)<\/title>/i) || url;
  const cleanTitle = strip(title);
  const ogImage = pick(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const description = pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);

  // Wikipedia infobox + content area
  const contentBlock =
    pick(html, /<div[^>]+id=["']mw-content-text["'][^>]*>([\s\S]*?)<div[^>]+id=["']catlinks["']/i) ||
    pick(html, /<article[^>]*>([\s\S]*?)<\/article>/i) ||
    pick(html, /<main[^>]*>([\s\S]*?)<\/main>/i) ||
    pick(html, /<div[^>]*class="[^"]*(?:entry-content|post-content|article-content|content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    "";
  const cleanedContent = (contentBlock || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<a [^>]*>/gi, "<a>") // strip href attrs
    .trim();

  return {
    title: cleanTitle,
    content: cleanedContent || strip(html).slice(0, 5000),
    excerpt: description ? strip(description).slice(0, 300) : strip(cleanedContent || html).slice(0, 300),
    featured_image: ogImage,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const body = await req.json().catch(() => ({}));
    const urls: string[] = body.urls || [];
    const hasPostUrls = urls.some((rawUrl) => detectType(String(rawUrl || "").trim()) !== "bani-author");
    const authUser = hasPostUrls ? await requireUser(req, supabaseUrl, anonKey) : null;
    if (!urls.length) {
      return new Response(JSON.stringify({ error: "urls[] required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const rawUrl of urls) {
      const url = rawUrl.trim();
      if (!url.startsWith("http")) continue;
      const type = detectType(url);
      try {
        const html = await fetchHtml(url);

        if (type === "bani-author") {
          const { author, quotes } = extractBaniAuthor(html, url);
          if (!quotes.length) { results.push({ url, type, ok: false, error: "no quotes found" }); continue; }
          const insRes = await fetch(`${supabaseUrl}/rest/v1/quotes_pool?on_conflict=source_url`, {
            method: "POST",
            headers: {
              apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
              Prefer: "resolution=ignore-duplicates,return=representation",
            },
            body: JSON.stringify(quotes),
          });
          const ok = insRes.ok;
          const data = ok ? await insRes.json() : null;
          results.push({ url, type, ok, author, found: quotes.length, inserted: data?.length ?? 0, error: ok ? null : await insRes.text() });
          continue;
        }

        // posts route (wiki / generic) — ownership is derived only from the verified bearer token
        if (!authUser) { results.push({ url, type, ok: false, error: "authenticated session required" }); continue; }
        const art = extractArticle(html, url);
        const slug = slugify(art.title) + "-" + Math.random().toString(36).slice(2, 6);
        const payload = {
          user_id: authUser.id,
          title: art.title.slice(0, 250),
          slug,
          content: art.content,
          excerpt: art.excerpt,
          featured_image: art.featured_image,
          source_url: url,
          source_name: new URL(url).hostname,
          post_type: "url",
          status: "published",
          published_at: new Date().toISOString(),
        };
        // upsert by source_url — first check existing
        const existRes = await fetch(`${supabaseUrl}/rest/v1/posts?source_url=eq.${encodeURIComponent(url)}&select=id`, {
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        });
        const existing = existRes.ok ? await existRes.json() : [];
        let inserted = false, updated = false;
        if (existing.length > 0) {
          const upRes = await fetch(`${supabaseUrl}/rest/v1/posts?id=eq.${existing[0].id}`, {
            method: "PATCH",
            headers: {
              apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json", Prefer: "return=minimal",
            },
            body: JSON.stringify({ title: payload.title, content: payload.content, excerpt: payload.excerpt, featured_image: payload.featured_image, user_id: authUser.id }),
          });
          updated = upRes.ok;
          results.push({ url, type, ok: upRes.ok, title: art.title, owner_source: "auth", updated: true, error: upRes.ok ? null : await upRes.text() });
        } else {
          const insRes = await fetch(`${supabaseUrl}/rest/v1/posts`, {
            method: "POST",
            headers: {
              apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json", Prefer: "return=representation",
            },
            body: JSON.stringify(payload),
          });
          inserted = insRes.ok;
          results.push({ url, type, ok: insRes.ok, title: art.title, owner_source: "auth", inserted: true, error: insRes.ok ? null : await insRes.text() });
        }
      } catch (e) {
        results.push({ url, type, ok: false, error: (e as Error).message });
      }
    }

    const okCount = results.filter((r) => r.ok).length;
    return new Response(JSON.stringify({ ok: okCount, total: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = (e as Error).message;
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: message.includes("authenticated") || message.includes("session") ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
