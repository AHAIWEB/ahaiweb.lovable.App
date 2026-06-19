// Dictionary scraper — accepts URLs and extracts Bengali words/meanings
// Supports bangladict.net pattern and a generic fallback (definition lists, dt/dd)
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface ParsedWord {
  word: string;
  pronunciation?: string;
  part_of_speech?: string;
  meaning_bn?: string;
  meaning_en?: string;
  example?: string;
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

function parseBangladict(html: string, url: string): ParsedWord[] {
  const results: ParsedWord[] = [];

  // Primary: <div class="searchword"><h2 ...>WORD</h2></div>
  let word = "";
  const swMatch = html.match(/<div[^>]*class="searchword"[^>]*>\s*<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (swMatch) word = stripHtml(swMatch[1]);

  // Fallback: og:title -> "অভিধানে 'WORD' এর অর্থ"
  if (!word) {
    const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogTitle) {
      const t = ogTitle[1];
      const m1 = t.match(/['"‘“]([^'"”’]+)['"”’]\s*এর অর্থ/);
      if (m1) word = m1[1].trim();
      else if (t.includes(" এর অর্থ")) word = t.split(" এর অর্থ")[0].replace(/.*?-\s*/, "").trim();
    }
  }

  // URL-decoded slug fallback
  if (!word) {
    try {
      const slug = decodeURIComponent(new URL(url).pathname.replace(/^\/+|\/+$/g, ""));
      if (slug && slug.length < 60 && !slug.includes("/")) word = slug;
    } catch { /* ignore */ }
  }

  // Meanings: <div class="meaningsword">...comma separated links...</div>
  let meaning = "";
  const mwMatch = html.match(/<div[^>]*class="meaningsword"[^>]*>([\s\S]*?)<\/div>/i);
  if (mwMatch) meaning = stripHtml(mwMatch[1]);

  // Fallback: og:description
  if (!meaning) {
    const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (ogDesc) meaning = ogDesc[1].trim();
  }

  if (word && meaning && word.length < 80) {
    results.push({
      word,
      meaning_bn: meaning,
      source_url: url,
      source_name: "bangladict.net",
    });
  }
  return results;
}

function parseGeneric(html: string, url: string, sourceName: string): ParsedWord[] {
  const results: ParsedWord[] = [];

  // <dt>word</dt><dd>meaning</dd>
  const dlRegex = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  let m;
  while ((m = dlRegex.exec(html)) !== null) {
    const word = stripHtml(m[1]);
    const meaning = stripHtml(m[2]);
    if (word && meaning && word.length < 60) {
      results.push({ word, meaning_bn: meaning, source_url: url, source_name: sourceName });
    }
  }

  if (results.length === 0) {
    // table rows pattern
    const trRegex = /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;
    while ((m = trRegex.exec(html)) !== null) {
      const word = stripHtml(m[1]);
      const meaning = stripHtml(m[2]);
      if (word && meaning && word.length < 60 && word.length > 0) {
        results.push({ word, meaning_bn: meaning, source_url: url, source_name: sourceName });
      }
    }
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const urls: string[] = Array.isArray(body.urls)
      ? body.urls
      : (body.url ? [body.url] : []);
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

    const crawl: boolean = body.crawl !== false; // default true: follow internal word links
    const maxFollow: number = Math.min(Number(body.max_follow) || 25, 50);

    let totalSaved = 0;
    const errors: string[] = [];
    const perUrl: Record<string, number> = {};
    const visited = new Set<string>();

    async function fetchAndParse(u: string): Promise<ParsedWord[]> {
      if (visited.has(u)) return [];
      visited.add(u);
      const res = await fetch(u, {
        headers: { "User-Agent": "Mozilla/5.0 AHAiWEB-Dictionary-Bot" },
      });
      if (!res.ok) {
        errors.push(`${u}: HTTP ${res.status}`);
        return [];
      }
      const html = await res.text();
      const host = new URL(u).hostname.replace("www.", "");
      let words: ParsedWord[] = [];
      if (host.includes("bangladict")) words = parseBangladict(html, u);
      if (words.length === 0) words = parseGeneric(html, u, host);

      // collect follow-up links for bangladict
      if (crawl && host.includes("bangladict")) {
        const linkRegex = /href=["'](https?:\/\/(?:www\.)?bangladict\.net\/[^"'#?]+)["']/gi;
        const links: string[] = [];
        let lm;
        while ((lm = linkRegex.exec(html)) !== null) {
          const link = lm[1];
          if (visited.has(link)) continue;
          if (/\.(png|jpg|gif|css|js|ico)$/i.test(link)) continue;
          if (/\/(privacy-policy|about|contact|index)/i.test(link)) continue;
          links.push(link);
          if (links.length >= maxFollow) break;
        }
        for (const link of links) {
          try {
            const sub = await fetchAndParse(link);
            words = words.concat(sub);
          } catch (e) {
            errors.push(`${link}: ${(e as Error).message}`);
          }
        }
      }
      return words;
    }

    for (const url of urls.slice(0, 50)) {
      try {
        const words = await fetchAndParse(url);
        for (const w of words.slice(0, 2000)) {
          const { error } = await supabase
            .from("dictionary_words")
            .upsert(
              {
                word: w.word,
                word_normalized: normalize(w.word),
                language: "bn",
                meaning_bn: w.meaning_bn,
                meaning_en: w.meaning_en,
                pronunciation: w.pronunciation,
                part_of_speech: w.part_of_speech,
                example: w.example,
                synonyms: w.synonyms,
                source_url: w.source_url,
                source_name: w.source_name,
              },
              { onConflict: "word_normalized,language,source_name" },
            );
          if (!error) totalSaved++;
        }
        perUrl[url] = words.length;
      } catch (e) {
        errors.push(`${url}: ${(e as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, total_saved: totalSaved, per_url: perUrl, errors: errors.slice(0, 20) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
