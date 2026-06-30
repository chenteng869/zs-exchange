import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT = "D:/3、系统项目开发/trae_projects/Stock Exchange dapp20260608-01";
const OUT = path.join(ROOT, "docs", "ZS_Exchange_董事局报备与技术团队交接_2026-06-30.pptx");
const PREVIEW = path.join(ROOT, "output");
const SIZE = { width: 1280, height: 720 };

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

async function readBlob(filePath) {
  const bytes = await fs.readFile(filePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

const C = {
  ink: "#111827",
  muted: "#5B6475",
  rule: "#CBD5E1",
  panel: "#F1F5F9",
  panel2: "#F8FAFC",
  orange: "#F97316",
  blue: "#2563EB",
  green: "#16A34A",
  red: "#DC2626",
  purple: "#7C3AED",
};

function addText(slide, text, x, y, w, h, opts = {}) {
  const s = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  s.text = text;
  s.text.style = {
    fontSize: opts.size ?? 18,
    bold: opts.bold ?? false,
    color: opts.color ?? C.ink,
    alignment: opts.align ?? "left",
  };
  return s;
}

function addPanel(slide, x, y, w, h, fill = C.panel2, line = C.rule) {
  return slide.shapes.add({
    geometry: "rect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: line, width: 1 },
  });
}

function addHeader(slide, title, section = "ZS Exchange 交付报备") {
  addText(slide, section, 52, 34, 360, 24, { size: 16, color: C.muted, bold: true });
  addText(slide, title, 52, 68, 900, 54, { size: 38, bold: true });
  slide.shapes.add({
    geometry: "rect",
    position: { left: 52, top: 130, width: 1176, height: 2 },
    fill: C.ink,
    line: { style: "solid", fill: C.ink, width: 0 },
  });
}

function addFooter(slide, index) {
  addText(slide, "董事局报备 / 技术团队交接 · 2026-06-30", 52, 676, 500, 22, {
    size: 12,
    color: C.muted,
  });
  addText(slide, String(index).padStart(2, "0"), 1180, 676, 50, 22, {
    size: 12,
    color: C.muted,
    align: "right",
  });
}

function addBullet(slide, text, x, y, w, h, color = C.ink) {
  addText(slide, "■", x, y + 5, 18, 20, { size: 13, color });
  addText(slide, text, x + 26, y, w - 26, h, { size: 18, color: C.ink });
}

function addMetric(slide, value, label, x, y, w, color = C.ink) {
  addPanel(slide, x, y, w, 116, "#FFFFFF", C.rule);
  addText(slide, value, x + 20, y + 22, w - 40, 42, { size: 40, bold: true, color });
  addText(slide, label, x + 20, y + 72, w - 40, 28, { size: 16, color: C.muted });
}

async function addSvg(slide, file, x, y, w, h, alt) {
  slide.images.add({
    blob: await readBlob(path.join(ROOT, file)),
    contentType: "image/svg+xml",
    alt,
    fit: "contain",
    position: { left: x, top: y, width: w, height: h },
  });
}

function node(slide, text, x, y, w, h, fill, line = C.rule, size = 16) {
  addPanel(slide, x, y, w, h, fill, line);
  addText(slide, text, x + 10, y + 10, w - 20, h - 18, {
    size,
    bold: true,
    align: "center",
  });
}

function bar(slide, x1, y1, x2, y2, color = C.rule) {
  if (Math.abs(x2 - x1) >= Math.abs(y2 - y1)) {
    addPanel(slide, Math.min(x1, x2), y1 - 1, Math.abs(x2 - x1), 2, color, color);
  } else {
    addPanel(slide, x1 - 1, Math.min(y1, y2), 2, Math.abs(y2 - y1), color, color);
  }
}

function drawOverallArchitecture(slide) {
  const xs = [65, 300, 535, 770, 1005];
  const rowY = [170, 285, 435, 585];
  addText(slide, "用户入口", 85, 148, 180, 24, { size: 18, bold: true, color: C.muted });
  node(slide, "Web / H5\n用户端", xs[0], rowY[0], 180, 70, "#E0F2FE", "#7DD3FC");
  node(slide, "管理后台\n运营与风控", xs[1], rowY[0], 180, 70, "#E0F2FE", "#7DD3FC");
  node(slide, "移动端壳\nCapacitor", xs[2], rowY[0], 180, 70, "#E0F2FE", "#7DD3FC");

  addText(slide, "应用层", 85, 263, 180, 24, { size: 18, bold: true, color: C.muted });
  node(slide, "页面路由\nsrc/app", xs[0], rowY[1], 180, 70, "#DCFCE7", "#86EFAC");
  node(slide, "API Routes\nsrc/app/api", xs[1], rowY[1], 180, 70, "#DCFCE7", "#86EFAC");
  node(slide, "组件 / 状态\nhooks / stores", xs[2], rowY[1], 180, 70, "#DCFCE7", "#86EFAC");

  addText(slide, "核心业务域", 85, 413, 180, 24, { size: 18, bold: true, color: C.muted });
  const domains = [
    ["用户认证\nJWT/RBAC", xs[0]],
    ["行情\nK线/深度", xs[1]],
    ["交易\n订单/撮合", xs[2]],
    ["钱包\n充提/对账", xs[3]],
    ["Web3/DID\n签名/DApp", xs[4]],
  ];
  domains.forEach(([t, x]) => node(slide, t, x, rowY[2], 180, 70, "#FFF7ED", "#FDBA74"));

  addText(slide, "数据、外部依赖与运维", 85, 563, 260, 24, { size: 18, bold: true, color: C.muted });
  const infra = [
    ["PostgreSQL\nPrisma", xs[0]],
    ["Redis\n缓存/队列", xs[1]],
    ["区块链 RPC\nEVM/Solana", xs[2]],
    ["KMS/MPC\n生产签名", xs[3]],
    ["监控/测试\nDocker/K8s", xs[4]],
  ];
  infra.forEach(([t, x]) => node(slide, t, x, rowY[3], 180, 70, "#F3E8FF", "#C4B5FD"));

  [155, 390, 625].forEach((x) => bar(slide, x, 240, x, 285));
  [155, 390, 625].forEach((x) => bar(slide, x, 355, x, 435));
  [155, 390, 625, 860, 1095].forEach((x) => bar(slide, x, 505, x, 585));
  bar(slide, 390, 355, 1095, 355, C.rule);
  bar(slide, 155, 505, 1095, 505, C.rule);
}

function drawTradeWalletFlow(slide) {
  const y1 = 185, y2 = 345, y3 = 505;
  const w = 118, h = 62;
  const steps1 = [
    ["注册/登录", 70], ["充值地址", 225], ["链上充值", 380], ["充值监听", 535], ["入账余额", 690],
  ];
  steps1.forEach(([t, x]) => node(slide, t, x, y1, w, h, "#E0F2FE", "#7DD3FC", 15));
  for (let i = 0; i < steps1.length - 1; i++) bar(slide, steps1[i][1] + w, y1 + 31, steps1[i + 1][1], y1 + 31);

  const steps2 = [
    ["用户下单", 210], ["冻结余额", 365], ["撮合引擎", 520], ["成交记录", 675], ["清结算", 830],
  ];
  steps2.forEach(([t, x]) => node(slide, t, x, y2, w, h, "#FFF7ED", "#FDBA74", 15));
  for (let i = 0; i < steps2.length - 1; i++) bar(slide, steps2[i][1] + w, y2 + 31, steps2[i + 1][1], y2 + 31);
  bar(slide, 749, y1 + h, 270, y2);

  const steps3 = [
    ["提现申请", 455], ["后台审核", 610], ["KMS/MPC\n签名", 765], ["链上广播", 920], ["对账审计", 1075],
  ];
  steps3.forEach(([t, x], i) => node(slide, t, x, y3, w, h, i === 1 ? "#FEF2F2" : "#F3E8FF", i === 1 ? "#FCA5A5" : "#C4B5FD", 15));
  for (let i = 0; i < steps3.length - 1; i++) bar(slide, steps3[i][1] + w, y3 + 31, steps3[i + 1][1], y3 + 31);
  bar(slide, 889, y2 + h, 514, y3);

  node(slide, "风控规则\n限额/黑名单/异常行为", 70, y3, 190, 62, "#FEF2F2", "#FCA5A5", 15);
  bar(slide, 260, y3 + 31, 455, y3 + 31, "#FCA5A5");
  addText(slide, "验收口径：脚本可跑、前端可演示、资金可对账、失败可恢复、关键操作可审计。", 75, 615, 1040, 30, {
    size: 22,
    bold: true,
    color: C.ink,
  });
}

function drawDeployment(slide) {
  const y = 175, w = 150, h = 62;
  const pipeline = [
    ["开发/测试", 70], ["CI 门禁", 250], ["构建镜像", 430], ["预生产", 610], ["冒烟检查", 790], ["灰度发布", 970],
  ];
  pipeline.forEach(([t, x]) => node(slide, t, x, y, w, h, "#EFF6FF", "#93C5FD", 15));
  for (let i = 0; i < pipeline.length - 1; i++) bar(slide, pipeline[i][1] + w, y + 31, pipeline[i + 1][1], y + 31);

  addText(slide, "生产运行态", 80, 305, 200, 24, { size: 22, bold: true });
  node(slide, "Next.js\n服务", 80, 345, 170, 70, "#DCFCE7", "#86EFAC");
  node(slide, "PostgreSQL\n主数据", 310, 345, 170, 70, "#DCFCE7", "#86EFAC");
  node(slide, "Redis\n缓存队列", 80, 455, 170, 70, "#DCFCE7", "#86EFAC");
  node(slide, "主备 RPC\n链上依赖", 310, 455, 170, 70, "#DCFCE7", "#86EFAC");
  node(slide, "KMS/MPC\n生产签名", 195, 565, 170, 70, "#DCFCE7", "#86EFAC");
  bar(slide, 250, 380, 310, 380); bar(slide, 165, 415, 165, 455); bar(slide, 250, 392, 310, 455); bar(slide, 280, 525, 280, 565);

  addText(slide, "可观测与应急", 710, 305, 240, 24, { size: 22, bold: true });
  node(slide, "Prometheus\n指标采集", 710, 345, 180, 70, "#FFF7ED", "#FDBA74");
  node(slide, "Grafana\n看板", 970, 345, 180, 70, "#FFF7ED", "#FDBA74");
  node(slide, "告警通道\n飞书/邮件", 710, 455, 180, 70, "#FFF7ED", "#FDBA74");
  node(slide, "日志审计\n资金/业务", 970, 455, 180, 70, "#FFF7ED", "#FDBA74");
  node(slide, "一键回滚\n5分钟恢复", 840, 565, 180, 70, "#FEF2F2", "#FCA5A5");
  bar(slide, 890, 380, 970, 380); bar(slide, 800, 415, 800, 455); bar(slide, 1060, 415, 1060, 455); bar(slide, 800, 525, 930, 565, "#FCA5A5"); bar(slide, 1060, 525, 930, 565, "#FCA5A5");
}

async function main() {
  const p = Presentation.create({ slideSize: SIZE });

  // 1. Cover
  {
    const s = p.slides.add();
    s.background.fill = "#FFFFFF";
    addText(s, "ZS Exchange", 58, 72, 520, 70, { size: 56, bold: true });
    addText(s, "交付工作包：董事局报备与技术团队交接", 58, 154, 840, 46, {
      size: 34,
      bold: true,
    });
    addText(s, "工程资产已成型，MVP 主干接近可联调；尚未达到生产上线、主网上链、真实资金大规模承载标准。", 58, 235, 770, 80, {
      size: 24,
      color: C.muted,
    });
    addPanel(s, 860, 96, 310, 190, C.panel);
    addText(s, "67 / 100", 895, 132, 240, 62, { size: 56, bold: true, color: C.orange });
    addText(s, "当前完成度评估", 895, 214, 220, 28, { size: 22, bold: true });
    addText(s, "可交接、可冲刺；不建议直接生产发布", 895, 250, 240, 26, { size: 16, color: C.muted });
    addPanel(s, 58, 470, 1064, 2, C.ink, C.ink);
    addText(s, "2026-06-30", 58, 500, 300, 32, { size: 24, color: C.muted });
    addText(s, "Stock Exchange dapp / Web3 交易平台工程交付", 58, 536, 560, 28, {
      size: 18,
      color: C.muted,
    });
  }

  // 2. Executive conclusion
  {
    const s = p.slides.add();
    addHeader(s, "董事局摘要：不是空壳，也不是生产系统");
    addMetric(s, "已成型", "工程资产、文档、模块、脚本完整沉淀", 68, 180, 250, C.green);
    addMetric(s, "67分", "按 100 分制的当前交付评估", 358, 180, 250, C.orange);
    addMetric(s, "33分", "剩余缺口集中在真实资金与生产安全", 648, 180, 250, C.red);
    addMetric(s, "4条", "下一阶段董事局重点决策主线", 938, 180, 250, C.blue);
    addBullet(s, "可以交付技术团队接管，进入 MVP 冲刺、生产加固、内测准备阶段。", 90, 360, 1040, 34, C.green);
    addBullet(s, "不建议直接对外生产发布，尤其不能承载真实资金大规模流转。", 90, 408, 1040, 34, C.red);
    addBullet(s, "下一阶段重点不是继续堆页面，而是跑通交易、钱包、签名、监控、回滚和审计闭环。", 90, 456, 1040, 34, C.orange);
    addFooter(s, 2);
  }

  // 3. Progress score
  {
    const s = p.slides.add();
    addHeader(s, "100 分制进度：当前建议口径 67 / 100");
    const rows = [
      ["基础工程", 9, 10, C.green],
      ["数据库与模型", 10, 12, C.green],
      ["API 主干", 8, 12, C.orange],
      ["交易闭环", 7, 12, C.orange],
      ["钱包资金安全", 8, 15, C.orange],
      ["DID / Web3 / DApp", 6, 10, C.orange],
      ["前端与后台", 6, 10, C.orange],
      ["测试与质量门禁", 5, 8, C.red],
      ["运维监控与上线", 4, 7, C.red],
      ["合规、安全与审计", 4, 4, C.green],
    ];
    let y = 170;
    for (const [name, got, total, color] of rows) {
      addText(s, name, 72, y, 190, 24, { size: 18, bold: true });
      addPanel(s, 280, y + 4, 650, 16, "#E5E7EB", "#E5E7EB");
      addPanel(s, 280, y + 4, (650 * got) / total, 16, color, color);
      addText(s, `${got}/${total}`, 955, y - 1, 90, 24, { size: 18, bold: true, color });
      y += 45;
    }
    addPanel(s, 1060, 172, 150, 370, "#FFFFFF", C.rule);
    addText(s, "67", 1085, 214, 100, 58, { size: 50, bold: true, color: C.orange, align: "center" });
    addText(s, "当前总分", 1085, 288, 100, 28, { size: 18, bold: true, align: "center" });
    addText(s, "可交接\n可冲刺\n不可直接上线", 1085, 352, 100, 100, { size: 18, color: C.muted, align: "center" });
    addFooter(s, 3);
  }

  // 4. Engineering assets
  {
    const s = p.slides.add();
    addHeader(s, "交付工程清单：技术团队可以按域接收");
    const items = [
      ["主应用框架", "Next.js / React / TypeScript / Tailwind / Ant Design"],
      ["数据层", "Prisma 覆盖用户、交易、钱包、Web3、审计、合约"],
      ["API 层", "用户、行情、交易、钱包、Solana、DID、后台管理"],
      ["交易能力", "现货订单、撮合、成交、深度、永续合约代码"],
      ["钱包能力", "充值、提现、地址、余额、热钱包、链监听、对账"],
      ["Web3 / DID", "多链账户、签名、VC、钱包绑定、DApp Browser"],
      ["运维与测试", "Docker、K8s 文档、Prometheus、P0 health scripts"],
      ["文档体系", "技术、功能、实施计划、MVP 路线、上线审计"],
    ];
    let x = 70, y = 170;
    items.forEach((it, i) => {
      addPanel(s, x, y, 520, 82, i % 2 === 0 ? "#FFFFFF" : C.panel2, C.rule);
      addText(s, it[0], x + 22, y + 16, 150, 26, { size: 20, bold: true });
      addText(s, it[1], x + 180, y + 16, 305, 42, { size: 17, color: C.muted });
      if (i % 2 === 0) x = 690; else { x = 70; y += 104; }
    });
    addFooter(s, 4);
  }

  // 5. Overall architecture
  {
    const s = p.slides.add();
    addHeader(s, "技术架构图 1：总体技术架构");
    drawOverallArchitecture(s);
    addFooter(s, 5);
  }

  // 6. Trade wallet flow
  {
    const s = p.slides.add();
    addHeader(s, "技术架构图 2：交易与钱包核心闭环");
    drawTradeWalletFlow(s);
    addFooter(s, 6);
  }

  // 7. Production deployment
  {
    const s = p.slides.add();
    addHeader(s, "技术架构图 3：生产部署与监控");
    drawDeployment(s);
    addFooter(s, 7);
  }

  // 8. Business value
  {
    const s = p.slides.add();
    addHeader(s, "商业价值：从交易平台到 Web3 资产入口");
    const vals = [
      ["交易基础设施", "行情、订单、撮合、钱包、充提构成交易所基础盘。", C.blue],
      ["合规身份能力", "DID、VC、KYC、审计日志为机构合作与合规扩展打基础。", C.green],
      ["Web3 资产入口", "Web3 钱包、DApp 浏览器、WalletConnect 构成用户资产入口。", C.purple],
      ["业务扩展空间", "DeFi、NFT、电商、福建老酒链上权益为多业务线预留接口。", C.orange],
    ];
    vals.forEach((v, i) => {
      const x = i % 2 === 0 ? 80 : 660;
      const y = i < 2 ? 190 : 390;
      addPanel(s, x, y, 500, 145, "#FFFFFF", C.rule);
      addText(s, v[0], x + 28, y + 28, 350, 34, { size: 26, bold: true, color: v[2] });
      addText(s, v[1], x + 28, y + 76, 425, 46, { size: 18, color: C.muted });
    });
    addFooter(s, 8);
  }

  // 9. Implementation plan
  {
    const s = p.slides.add();
    addHeader(s, "业务落地计划：30 / 60 / 90 天推进");
    const stages = [
      ["30 天", "MVP 核心演示", "注册、行情、充值、余额、下单、撮合、提现、后台审核、对账审计。", C.orange],
      ["60 天", "预生产准入", "权限、密钥、监控、告警、回滚、测试门禁、72h 稳定性准备。", C.blue],
      ["90 天", "小流量试运营", "白名单用户、小额资金、限额交易、每日审计、正式运营评审。", C.green],
    ];
    stages.forEach((st, i) => {
      const x = 92 + i * 390;
      addPanel(s, x, 190, 320, 330, "#FFFFFF", C.rule);
      addText(s, st[0], x + 30, 224, 150, 54, { size: 44, bold: true, color: st[3] });
      addText(s, st[1], x + 30, 300, 230, 34, { size: 25, bold: true });
      addText(s, st[2], x + 30, 360, 250, 96, { size: 19, color: C.muted });
    });
    addText(s, "推进原则：先跑通闭环，再扩展生态；先控制资金风险，再扩大用户规模。", 92, 570, 960, 34, { size: 24, bold: true });
    addFooter(s, 9);
  }

  // 10. Risk red lines
  {
    const s = p.slides.add();
    addHeader(s, "上线红线：任一存在，不得生产发布");
    const risks = [
      "明文私钥或本地文件私钥用于生产签名",
      "JWT / 管理员权限存在默认兜底或绕过",
      "充值监听、提币广播、余额对账未真实验证",
      "无 Prometheus 告警、无日志审计、无 5 分钟回滚",
      "依赖 critical / high 漏洞未修复或无隔离说明",
      "DID / Web3 / Admin 敏感接口未鉴权或响应字段未白名单",
    ];
    let y = 180;
    risks.forEach((r) => {
      addPanel(s, 92, y, 1020, 54, "#FFF7F7", "#FECACA");
      addText(s, "P0", 116, y + 14, 50, 24, { size: 18, bold: true, color: C.red });
      addText(s, r, 180, y + 13, 850, 28, { size: 20, bold: true, color: C.ink });
      y += 72;
    });
    addFooter(s, 10);
  }

  // 11. Handover organization
  {
    const s = p.slides.add();
    addHeader(s, "技术团队接收：建议按负责人拆包");
    const cols = [
      ["技术负责人", "架构把关、代码合并策略、质量门禁"],
      ["后端/API", "接口、权限、Repository、DTO、业务联调"],
      ["交易引擎", "撮合、订单、余额、成交、手续费"],
      ["钱包/Web3", "充提、链监听、签名、DID、DApp"],
      ["前端", "用户端、后台端、核心流程真实化"],
      ["测试/SRE", "自动化、监控、告警、回滚、安全治理"],
    ];
    cols.forEach((c, i) => {
      const x = i % 3 === 0 ? 70 : i % 3 === 1 ? 470 : 870;
      const y = i < 3 ? 190 : 395;
      addPanel(s, x, y, 310, 132, "#FFFFFF", C.rule);
      addText(s, c[0], x + 24, y + 26, 220, 30, { size: 24, bold: true });
      addText(s, c[1], x + 24, y + 70, 246, 42, { size: 18, color: C.muted });
    });
    addFooter(s, 11);
  }

  // 12. Decisions
  {
    const s = p.slides.add();
    addHeader(s, "董事局需要确认的三项决策");
    const decisions = [
      ["确认 MVP 边界", "先做注册、行情、下单、撮合、充值、提现、余额、后台审核；暂缓复杂生态模块。"],
      ["确认上线红线", "资金安全、密钥隔离、权限、监控、测试、回滚任一未达标，不得生产上线。"],
      ["确认专项负责人", "交易、钱包、安全、前端、SRE、测试必须各有负责人，避免一人扛全部 P0。"],
    ];
    decisions.forEach((d, i) => {
      addPanel(s, 105, 180 + i * 130, 960, 92, i === 1 ? "#FFF7ED" : "#FFFFFF", i === 1 ? "#FDBA74" : C.rule);
      addText(s, `0${i + 1}`, 130, 204 + i * 130, 55, 32, { size: 26, bold: true, color: C.orange });
      addText(s, d[0], 210, 194 + i * 130, 260, 32, { size: 25, bold: true });
      addText(s, d[1], 210, 234 + i * 130, 760, 32, { size: 18, color: C.muted });
    });
    addText(s, "建议结论：批准进入“技术团队接管 + MVP 冲刺 + 生产加固”阶段。", 105, 598, 960, 34, { size: 26, bold: true, color: C.green });
    addFooter(s, 12);
  }

  // QA artifacts
  for (const [i, slide] of p.slides.items.entries()) {
    const stem = `zs-board-slide-${String(i + 1).padStart(2, "0")}`;
    await writeBlob(path.join(PREVIEW, `${stem}.png`), await p.export({ slide, format: "png", scale: 1 }));
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(PREVIEW, `${stem}.layout.json`), await layout.text(), "utf8");
  }
  await writeBlob(path.join(PREVIEW, "zs-board-deck-montage.webp"), await p.export({ format: "webp", montage: true, scale: 1 }));
  const inspect = await p.inspect({ kind: "slide,textbox,shape,image", maxChars: 16000 });
  await fs.writeFile(path.join(PREVIEW, "zs-board-deck-inspect.ndjson"), inspect.ndjson, "utf8");

  const pptx = await PresentationFile.exportPptx(p);
  await pptx.save(OUT);
  console.log(OUT);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
