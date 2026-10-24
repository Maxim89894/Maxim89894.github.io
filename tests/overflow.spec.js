// npm test — сервер поднимается сам (см. playwright.config.js)
const {test,expect}=require('@playwright/test');
const langs=['ru','en'];
const sizes=[[320,640],[390,844],[768,1024],[1440,900]];

for(const l of langs)for(const [w,h] of sizes)test(`no overflow ${l} ${w}`,async({browser})=>{
 const ctx=await browser.newContext({locale:l,viewport:{width:w,height:h}}),p=await ctx.newPage();
 await p.goto('/');await p.waitForTimeout(500);
 // элементы внутри контейнера со своей прокруткой (таблица сравнения) страницу не расширяют
 const bad=await p.evaluate(()=>{const scrolls=e=>{for(let a=e.parentElement;a&&a!=document.body;a=a.parentElement)if(/auto|scroll|hidden|clip/.test(getComputedStyle(a).overflowX))return true;return false};
  return[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1&&!e.closest('video,.mesh,.cur,[aria-hidden]')&&!scrolls(e)}).slice(0,5).map(e=>e.className||e.tagName)});
 expect(bad,'элементы вылезают за экран').toEqual([]);
 expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'страница шире экрана').toBe(true);
 await p.screenshot({path:`tests/shots/${l}-${w}.png`,fullPage:true});await ctx.close()});

test('no JS errors and no missing files',async({page})=>{
 const errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{const u=r.url();if(r.status()>=400&&!/\/(img\/|video\/(p\d|avatar-360))/.test(u))missing.push(r.status()+' '+u)});
 await page.goto('/');await page.waitForTimeout(1500);
 await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(1000);
 expect(errors).toEqual([]);
 expect(missing,'необязательные медиа (img/, video/p*.mp4, аватар) не учитываются').toEqual([]);
});
