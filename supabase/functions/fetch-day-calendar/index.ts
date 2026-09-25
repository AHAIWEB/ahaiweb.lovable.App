import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const monthNames = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

function clean(text: string) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function findAfter(text: string, labels: string[]) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${escaped}\\s*[:：-]?\\s*([^|•।,;\\n]+)`, "i"));
    if (match?.[1]) return match[1].trim().slice(0, 80);
  }
  return "—";
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}));
    const dateValue = String(body.date || new Date().toISOString().slice(0, 10));
    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return new Response(JSON.stringify({ error: 'valid date required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const url = `https://www.bangladatetoday.com/bn/shaka-calendar/${year}/${month}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        Accept: 'text/html,*/*',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'calendar source failed', status: response.status }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = await response.text();
    const text = clean(html);
    const dayWindowMatch = text.match(new RegExp(`(.{0,800}${day}.{0,1800})`));
    const scope = dayWindowMatch?.[1] || text;

    const data = {
      source_url: url,
      weekday: date.toLocaleDateString('bn-BD', { weekday: 'long' }),
      gregorian: `${date.toLocaleDateString('bn-BD', { day: 'numeric' })} ${monthNames[date.getMonth()]} ${date.toLocaleDateString('bn-BD', { year: 'numeric' })}`,
      bangla: findAfter(scope, ['বাংলা', 'বঙ্গাব্দ', 'বাংলা তারিখ']),
      hijri: findAfter(scope, ['হিজরি', 'ইসলামিক']),
      season: findAfter(scope, ['ঋতু']),
      tithi: findAfter(scope, ['তিথি']),
      vikram: findAfter(scope, ['বিক্রম', 'বিক্রম সংবৎ']),
      nakshatra: findAfter(scope, ['নক্ষত্র']),
      shaka: findAfter(scope, ['শক', 'শক সংবৎ']),
      sunrise: findAfter(scope, ['সূর্যোদয়', 'সূর্যোদয়']),
      sunset: findAfter(scope, ['সূর্যাস্ত']),
    };

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})