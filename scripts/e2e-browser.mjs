import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3005';
const ADMIN = process.env.ADMIN_SECRET || 'localtest123';

function log(ok, msg) {
  console.log(`${ok ? '✅' : '❌'} ${msg}`);
  if (!ok) process.exitCode = 1;
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const ctx = await browser.newContext();
const page = await ctx.newPage();

try {
  // 1. Landing
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  log(
    (await page.content()).includes('Publique sua vaga local'),
    'Landing carrega com headline'
  );

  // 2. Submission form
  await page.goto(`${BASE}/anunciar`, { waitUntil: 'networkidle' });
  await page.fill('#companyName', 'Padaria Aurora E2E');
  await page.fill('#cnpj', '12.345.678/0001-90');
  await page.fill('#roleTitle', 'Atendente de Balcão');
  await page.selectOption('#niche', 'VAREJO');
  await page.selectOption('#contractType', 'CLT');
  await page.fill('#neighborhood', 'Pinheiros');
  await page.fill('#salary', 'R$ 1.900');
  await page.fill('#benefits', 'VT, VR');
  await page.selectOption('#applicationMethod', 'WHATSAPP');
  await page.fill('#applicationWhatsapp', '11999998888');
  // plan radio (first) is default-checked; confirmation checkbox
  await page.check('input[name="confirmation"]');
  await Promise.all([
    page.waitForURL(/\/vagas\/.+\/confirmacao/, { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
  const confUrl = page.url();
  log(/\/vagas\/.+\/confirmacao/.test(confUrl), `Submissão válida redireciona p/ confirmação`);
  const jobId = confUrl.match(/vagas\/([^/]+)\/confirmacao/)?.[1];

  // 3. Confirmation content
  const conf = await page.content();
  log(conf.includes('Padaria Aurora E2E'), 'Confirmação mostra a empresa');
  log(conf.includes('Aguardando pagamento') || conf.includes('Pagar agora'), 'Confirmação mostra status/pagamento');

  // 4. Status page
  await page.goto(`${BASE}/vagas/${jobId}`, { waitUntil: 'networkidle' });
  const status = await page.content();
  log(status.includes('Status da sua vaga'), 'Página de status pública carrega');
  log(status.includes('Atendente de Balcão'), 'Status mostra o cargo');

  // 5. Story art image
  const art = await page.goto(`${BASE}/api/story-art/${jobId}`);
  const ct = art.headers()['content-type'] || '';
  log(art.status() === 200 && ct.includes('image'), `Story art gera imagem (${art.status()}, ${ct})`);

  // 6. Validation rejects generic title
  await page.goto(`${BASE}/anunciar`, { waitUntil: 'networkidle' });
  await page.fill('#companyName', 'Empresa Teste');
  await page.fill('#roleTitle', 'vaga');
  await page.selectOption('#niche', 'VAREJO');
  await page.selectOption('#contractType', 'CLT');
  await page.fill('#neighborhood', 'Centro');
  await page.fill('#salary', 'R$ 2.000');
  await page.selectOption('#applicationMethod', 'EMAIL');
  await page.check('input[name="confirmation"]');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
  log(!/confirmacao/.test(page.url()), 'Validação bloqueia título genérico ("vaga")');

  // 7. Admin gate + login
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  log((await page.content()).includes('Acesso administrativo'), 'Admin pede senha');
  await page.fill('#secret', ADMIN);
  await Promise.all([
    page.waitForURL(/\/admin$/, { timeout: 10000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(1000);
  const admin = await page.content();
  log(admin.includes('Painel de vagas') || admin.includes('Total de vagas'), 'Admin dashboard abre após login');
  log(admin.includes('Padaria Aurora E2E'), 'Dashboard lista a vaga criada');

  console.log(`\nJOB_ID=${jobId}`);
} finally {
  await browser.close();
}
