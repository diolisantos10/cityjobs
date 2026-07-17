import { chromium } from 'playwright';

const BASE = process.env.BASE_URL;
const ADMIN = process.env.ADMIN_SECRET;
if (!BASE || !ADMIN) throw new Error('set BASE_URL and ADMIN_SECRET');

function log(ok, msg) {
  console.log(`${ok ? '✅' : '❌'} ${msg}`);
  if (!ok) process.exitCode = 1;
}

const proxyServer = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  ...(proxyServer ? { proxy: { server: proxyServer } } : {}),
});
// Test browser goes through the sandbox's mandatory TLS-intercepting proxy,
// whose CA the browser doesn't carry — ignore cert errors for this run only.
const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();

try {
  // Submit a clearly-labelled test vacancy
  await page.goto(`${BASE}/anunciar`, { waitUntil: 'networkidle' });
  await page.fill('#companyName', 'TESTE CityJobs (apagar)');
  await page.fill('#cnpj', '11.222.333/0001-44');
  await page.fill('#roleTitle', 'Vaga de Teste — Verificação de Deploy');
  await page.selectOption('#niche', 'ESCRITORIO');
  await page.selectOption('#contractType', 'CLT');
  await page.fill('#neighborhood', 'Pinheiros');
  await page.fill('#salary', 'R$ 3.000');
  await page.fill('#benefits', 'VT, VR');
  await page.selectOption('#applicationMethod', 'WHATSAPP');
  await page.fill('#applicationWhatsapp', '11999990000');
  await page.check('input[name="confirmation"]');
  await Promise.all([
    page.waitForURL(/\/vagas\/.+\/confirmacao/, { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  const jobId = page.url().match(/vagas\/([^/]+)\/confirmacao/)?.[1];
  log(!!jobId, `Submissão em PRODUÇÃO cria a vaga (id ${jobId})`);

  const conf = await page.content();
  log(conf.includes('R$ 29') || conf.includes('Pagar agora'), 'Confirmação mostra plano/preço/pagamento');

  // Story art in prod
  const art = await page.goto(`${BASE}/api/story-art/${jobId}`);
  log(art.status() === 200 && (art.headers()['content-type'] || '').includes('image'), 'Arte do Story gerada em produção');

  // Admin: login, confirm listed, then ARCHIVE (cleanup)
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  await page.fill('#secret', ADMIN);
  await Promise.all([page.waitForTimeout(2000), page.click('button[type="submit"]')]);
  await page.goto(`${BASE}/admin/jobs/${jobId}`, { waitUntil: 'networkidle' });
  log((await page.content()).includes('TESTE CityJobs'), 'Admin abre a vaga de teste');
  await Promise.all([page.waitForTimeout(2000), page.click('button:has-text("Arquivar")')]);
  await page.goto(`${BASE}/admin/jobs/${jobId}`, { waitUntil: 'networkidle' });
  log((await page.content()).includes('Arquivada'), 'Vaga de teste ARQUIVADA (limpeza)');

  console.log(`\nJOB_ID=${jobId}`);
} finally {
  await browser.close();
}
