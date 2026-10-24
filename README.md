# Портфолио Максима

Статический одностраничный сайт и два необязательных Cloudflare Worker'а: заявки в Telegram и живая статистика.

## Структура

```
site/              ← всё, что выкладывается на хостинг (корень сайта)
  index.html       сайт целиком: разметка, стили, скрипт
  articles/        6 SEO-статей (RU/EN)
  docs/            PDF: образец договора и чек-лист
  fonts/           шрифты Geologica, Playfair Display, JetBrains Mono
  video/           1.mp4 первый экран, 2.mp4 «Ещё один проект», 3–6.mp4 шорты «Обо мне»
  img/             og.png (превью ссылки в соцсетях) и картинки проектов
  robots.txt, sitemap.xml
workers/
  lead/            заявки с сайта -> Telegram (+ Turnstile, honeypot)
  stats/           счётчик визитов и время на сайте (KV)
tools/avatar/      сборка вращающегося 3D-аватара; reference.png — исходный образ
tests/             Playwright (вёрстка на 320–1440 px, ошибки JS, битые файлы) и Lighthouse
_archive/          старые версии v12–v21 и посторонние файлы; не выкладывается, в git не попадает
```

Версии больше не копируются в файлы `_vNN.html`: история ведётся в git (`git log`).

## Запуск и проверка

```sh
npm install
npm start          # http://localhost:3000
npm test           # 9 проверок в установленном Google Chrome
npm run lighthouse # LCP < 2,5 с, CLS < 0,1, доступность ≥ 95
```

## Перед публикацией: что заменить

1. **Настройки** — блок `НАСТРОЙКИ` в начале скрипта в `site/index.html`:

   | Константа | Что это | Если пусто |
   |---|---|---|
   | `MAIL` | ваша почта (сейчас `hello@example.com`!) | — обязательно заменить |
   | `ENDPOINT` | адрес воркера `workers/lead` | заявка открывается письмом (mailto) |
   | `CONTACT` | `tg` — имя без @, `wa` — номер цифрами | кнопок мессенджеров нет |
   | `TURNSTILE_KEY` | sitekey Cloudflare Turnstile | капчи нет, остаётся honeypot |
   | `STATS_URL` | адрес воркера `workers/stats` | блока статистики нет |
   | `TZ` | часовой пояс для «Моё время» | — |

   Там же ниже: `P` (проекты), `COMP` (компании), `REV` (отзывы), `CASES` (кейсы и демо), `CALC` (цены калькулятора).

2. **Домен** — замените `YOUR-DOMAIN.com` на свой во всех файлах `site/` (index.html, robots.txt, sitemap.xml, 6 статей).

3. **Цифры** в блоке «Обо мне» (50 проектов, 12 стран и т. д.) — проверьте, что они правдивые.

## Медиа, которые можно добавить

Сайт работает и без них: недостающие картинки и видео тихо скрываются.

| Файл | Где появится |
|---|---|
| `site/video/p1.mp4` … `p8.mp4` | видео в карточках проектов (сейчас — цветные обложки) |
| `site/img/p1.jpg` … `p8.jpg` | постеры этих видео |
| `site/img/a1.jpg` … `a3.jpg` | плитки «Контроль», «Глубина», «Игра на Unity» |
| `site/video/avatar-360.mp4` / `.webm`, `site/img/avatar-poster.jpg` | раздел «Привет, это я» с аватаром 360° |

### Аватар 360°

1. Сделайте 3D-модель `.glb` (Ready Player Me, Meshy, Luma — можно по `tools/avatar/reference.png`).
2. `blender -b -P tools/avatar/render_turntable.py -- avatar.glb frames/` — 120 кадров полного оборота.
3. `sh tools/avatar/encode.sh frames` (нужен ffmpeg) — файлы сами лягут в `site/video/` и `site/img/`.

## Хостинг

Подойдёт любой статический: Cloudflare Pages, Netlify, GitHub Pages. Папка публикации — `site`, сборка не нужна.

## Воркеры (Cloudflare)

```sh
npm i -g wrangler && wrangler login

# заявки -> Telegram
cd workers/lead
wrangler secret put TG_TOKEN        # токен бота от @BotFather
wrangler secret put TG_CHAT         # ваш chat id
wrangler secret put TURNSTILE_SECRET   # по желанию
wrangler deploy                     # адрес вставить в ENDPOINT

# статистика
cd ../stats
wrangler kv namespace create STATS  # id вписать в wrangler.toml
wrangler deploy                     # адрес вставить в STATS_URL
```

В обоих `wrangler.toml` укажите свой домен в `ALLOW`.

**Ограничение статистики:** бесплатный KV даёт 1000 записей в сутки, а один визит пишет 5–15 раз (пинг каждые 20 с). Этого хватает примерно на 100 визитов в день; при большем трафике нужен платный план или перенос на D1 / Durable Objects. KV не атомарен, поэтому при одновременных заходах возможна погрешность в несколько процентов. Куки не пишутся, при Do Not Track / GPC визит не считается.

## Аналитика

Цели (`form_start`, `form_sent`, `brief_sent`, `calc_used`, `quiz_done`, `cta_write`, `demo_open`, `messenger_click` и др.) уходят в `dataLayer` и автоматически в Plausible, Umami, Яндекс Метрику (`window.YM_ID`) или GA4 — в тот счётчик, который подключён.
