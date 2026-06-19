// Dictionary scraper — bangladict.net + generic fallback. Saves incrementally.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface ParsedWord {
  word: string;
  meaning_bn?: string;
  meaning_en?: string;
  synonyms?: string[];
  source_url: string;
  source_name: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseBangladict(html: string, url: string): ParsedWord | null {
  let word = "";
  const swMatch = html.match(/<div[^>]*class="searchword"[^>]*>\s*<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (swMatch) word = stripHtml(swMatch[1]);
  if (!word) {
    try {
      const slug = decodeURIComponent(new URL(url).pathname.replace(/^\/+|\/+$/g, ""));
      if (slug && slug.length < 80 && !slug.includes("/")) word = slug;
    } catch { /* ignore */ }
  }
  if (!word) return null;

  let meaning = "";
  const mwMatch = html.match(/<div[^>]*class="meaningsword"[^>]*>([\s\S]*?)<\/div>/i);
  if (mwMatch) meaning = stripHtml(mwMatch[1]);

  // Collect English defs from "English to English" section
  const engDefs: string[] = [];
  const defRegex = /<strong>[^<]*<\/strong>\s*<em>[^<]*<\/em>\s*([^<]+)<\/div>/gi;
  let dm;
  while ((dm = defRegex.exec(html)) !== null) {
    const d = stripHtml(dm[1]);
    if (d) engDefs.push(d);
    if (engDefs.length >= 6) break;
  }

  const synonyms = meaning ? meaning.split(/[,،]/).map((s) => s.trim()).filter(Boolean).slice(0, 30) : [];

  if (!meaning && engDefs.length === 0) return null;

  return {
    word,
    meaning_bn: meaning || undefined,
    meaning_en: engDefs.join(" | ") || undefined,
    synonyms: synonyms.length ? synonyms : undefined,
    source_url: url,
    source_name: "bangladict.net",
  };
}

function parseGeneric(html: string, url: string, sourceName: string): ParsedWord[] {
  const results: ParsedWord[] = [];
  const dlRegex = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  let m;
  while ((m = dlRegex.exec(html)) !== null) {
    const word = stripHtml(m[1]);
    const meaning = stripHtml(m[2]);
    if (word && meaning && word.length < 60) {
      results.push({ word, meaning_bn: meaning, source_url: url, source_name: sourceName });
    }
  }
  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const urls: string[] = Array.isArray(body.urls) ? body.urls : (body.url ? [body.url] : []);
    if (urls.length === 0) {
      return new Response(JSON.stringify({ error: "URLs required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const crawl: boolean = body.crawl !== false;
    const maxFollow: number = Math.min(Number(body.max_follow) || 30, 60);
    const concurrency = 6;

    let totalSaved = 0;
    const errors: string[] = [];
    const visited = new Set<string>();

    async function saveWord(w: ParsedWord) {
      const { error } = await supabase.from("dictionary_words").upsert(
        {
          word: w.word,
          word_normalized: normalize(w.word),
          language: "bn",
          meaning_bn: w.meaning_bn,
          meaning_en: w.meaning_en,
          synonyms: w.synonyms,
          source_url: w.source_url,
          source_name: w.source_name,
        },
        { onConflict: "word_normalized,language,source_name" },
      );
      if (error) errors.push(`save ${w.word}: ${error.message}`);
      else totalSaved++;
    }

    async function fetchPage(u: string): Promise<{ html: string; host: string } | null> {
      try {
        const res = await fetch(u, {
          headers: { "User-Agent": "Mozilla/5.0 AHAiWEB-Dictionary-Bot" },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
          errors.push(`${u}: HTTP ${res.status}`);
          return null;
        }
        const html = await res.text();
        const host = new URL(u).hostname.replace("www.", "");
        return { html, host };
      } catch (e) {
        errors.push(`${u}: ${(e as Error).message}`);
        return null;
      }
    }

    async function processOne(u: string): Promise<string[]> {
      if (visited.has(u)) return [];
      visited.add(u);
      const page = await fetchPage(u);
      if (!page) return [];

      const followLinks: string[] = [];
      if (page.host.includes("bangladict")) {
        const w = parseBangladict(page.html, u);
        if (w) await saveWord(w);
        if (crawl) {
          const linkRegex = /href=["'](https?:\/\/(?:www\.)?bangladict\.net\/[^"'#?]+)["']/gi;
          let lm;
          while ((lm = linkRegex.exec(page.html)) !== null) {
            const link = lm[1];
            if (visited.has(link)) continue;
            if (/\.(png|jpg|gif|css|js|ico)$/i.test(link)) continue;
            if (/\/(privacy-policy|about|contact|index|getmeaning)/i.test(link)) continue;
            followLinks.push(link);
          }
        }
      } else {
        const words = parseGeneric(page.html, u, page.host);
        for (const w of words.slice(0, 200)) await saveWord(w);
      }
      return followLinks;
    }

    // Seed queue with input URLs
    let queue: string[] = [...urls];
    const seenInQueue = new Set(queue);
    let followBudget = maxFollow * urls.length;

    while (queue.length > 0 && followBudget >= 0) {
      const batch = queue.splice(0, concurrency);
      const results = await Promise.all(batch.map((u) => processOne(u)));
      for (const links of results) {
        for (const link of links) {
          if (followBudget <= 0) break;
          if (seenInQueue.has(link)) continue;
          seenInQueue.add(link);
          queue.push(link);
          followBudget--;
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        total_saved: totalSaved,
        pages_visited: visited.size,
        errors: errors.slice(0, 20),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
