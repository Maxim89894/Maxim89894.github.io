// Cloudflare Worker + KV: счётчик визитов, «сейчас на сайте» и время на сайте.
// Привязка KV называется STATS, переменная ALLOW (адрес сайта) — в wrangler.toml.
// Адрес воркера вставьте в site/index.html в STATS_URL.
const inc = async (K, k, n = 1) => K.put(k, String((+(await K.get(k)) || 0) + n));

export default {async fetch(r, env) {
  const H = {'Access-Control-Allow-Origin': env.ALLOW, 'Access-Control-Allow-Headers': 'content-type', 'Content-Type': 'application/json'};
  const u = new URL(r.url), K = env.STATS;
  if (r.method == 'OPTIONS') return new Response(null, {headers: H});
  if (r.method == 'POST') {
    const b = await r.json().catch(() => ({}));
    if (u.pathname == '/hit') await inc(K, 'visits');
    else if (u.pathname == '/ping' && /^[\w-]{6,40}$/.test(b.id || '')) await K.put('on:' + b.id, '1', {expirationTtl: 60});
    else if (u.pathname == '/end') { const s = Math.min(+b.s || 0, 7200);
      if (s >= 3) { await inc(K, 'sum', s); await inc(K, 'n'); await inc(K, 'b' + (s < 30 ? 0 : s < 120 ? 1 : s < 300 ? 2 : 3)); } }
    return new Response('{}', {headers: H});
  }
  const [v, sum, n, ...bs] = await Promise.all(['visits', 'sum', 'n', 'b0', 'b1', 'b2', 'b3'].map(k => K.get(k)));
  const online = (await K.list({prefix: 'on:', limit: 1000})).keys.length;
  return new Response(JSON.stringify({visits: +v || 0, online, avg: n ? Math.round(sum / n) : 0, b: bs.map(x => +x || 0)}), {headers: {...H, 'Cache-Control': 'max-age=15'}});
}};
