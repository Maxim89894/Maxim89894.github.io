// Cloudflare Worker: заявки с сайта -> Telegram. Turnstile и honeypot проверяются здесь.
// Секреты: wrangler secret put TG_TOKEN (токен бота от @BotFather), TG_CHAT (ваш chat id), TURNSTILE_SECRET (по желанию).
// Переменная ALLOW (адрес сайта) задаётся в wrangler.toml. Адрес воркера вставьте в site/index.html в ENDPOINT.

const TITLE = {request: 'Новая заявка', checklist: 'Запрос чек-листа', brief: 'Ответы на бриф'};

export default {
  async fetch(r, env) {
    const H = {'Access-Control-Allow-Origin': env.ALLOW, 'Access-Control-Allow-Headers': 'content-type', 'Content-Type': 'application/json'};
    const reply = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: H});
    if (r.method == 'OPTIONS') return new Response(null, {headers: H});
    if (r.method != 'POST') return reply({}, 405);

    const b = await r.json().catch(() => null);
    if (!b) return reply({}, 400);
    if (b.hp) return reply({ok: true}); // бот заполнил скрытое поле: делаем вид, что всё прошло

    if (env.TURNSTILE_SECRET) {
      const v = await (await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: new URLSearchParams({secret: env.TURNSTILE_SECRET, response: b.cf_token || '', remoteip: r.headers.get('CF-Connecting-IP') || ''}),
      })).json();
      if (!v.success) return reply({ok: false}, 403);
    }

    const t = s => String(s || '').slice(0, 1500);
    const line = (label, v) => v ? label + ': ' + t(v) : '';
    // ответы брифа приходят полями вида «q1 Текст вопроса»
    const brief = Object.keys(b).filter(k => /^q\d+ /.test(k) && b[k]).map(k => k.replace(/^q\d+ /, '') + '\n' + t(b[k]));
    const text = [
      TITLE[b.kind] || 'Сообщение с сайта (' + t(b.kind) + ')',
      line('Имя', b.name),
      line('Связь', b.contact),
      line('Что нужно', b.type),
      t(b.message),
      ...brief,
      line('Реферал', b.ref),
      line('Заголовок на сайте', b.ab),
    ].filter(Boolean).join('\n');

    const x = await fetch('https://api.telegram.org/bot' + env.TG_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({chat_id: env.TG_CHAT, text}),
    });
    return reply({ok: x.ok}, x.ok ? 200 : 502);
  },
};
