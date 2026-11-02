const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const packageSizes = {
  "不确定": "阻值代码无法确定封装；请按外形或 BOM 确认。",
  "0201": "0.6 × 0.3 mm", "0402": "1.0 × 0.5 mm", "0603": "1.6 × 0.8 mm",
  "0805": "2.0 × 1.25 mm", "1206": "3.2 × 1.6 mm", "1210": "3.2 × 2.5 mm",
  "2010": "5.0 × 2.5 mm", "2512": "6.3 × 3.2 mm",
  "SOT-23": "约 2.9 × 1.3 mm", "SOT-223": "约 6.5 × 3.5 mm", "TO-92": "常见直插三极管封装"
};
let resistorMode = "series";
let loadMode = "resistor";
let resistorCount = 2;
let resistorValues = ["100", "220"];

function cleanNumber(value, digits = 6) {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits, useGrouping: false }).format(value);
}
function eng(value, unit) {
  if (!Number.isFinite(value)) return "—";
  const a = Math.abs(value); let n = value, prefix = "";
  if (unit === "Ω") {
    if (a >= 1e6) { n = value / 1e6; prefix = "M"; }
    else if (a >= 1e3) { n = value / 1e3; prefix = "k"; }
    else if (a > 0 && a < 1e-3) { n = value * 1e6; prefix = "µ"; }
    else if (a > 0 && a < 1) { n = value * 1e3; prefix = "m"; }
  } else if (unit === "V" || unit === "W") {
    if (a >= 1e3) { n = value / 1e3; prefix = "k"; }
    else if (a > 0 && a < 1e-3) { n = value * 1e6; prefix = "µ"; }
    else if (a > 0 && a < 1) { n = value * 1e3; prefix = "m"; }
  } else if (unit === "A") {
    if (a > 0 && a < 1e-3) { n = value * 1e6; prefix = "µ"; }
    else if (a > 0 && a < 1) { n = value * 1e3; prefix = "m"; }
  }
  return `${cleanNumber(n)} ${prefix}${unit}`;
}
function hint(text) { return `<div class="hint">${text}</div>`; }
function resultCard(title, value, detail) {
  return `<div class="result-card"><div class="result-kicker">${title}</div><div class="result-main">${value}</div><div class="result-detail">${detail}</div></div>`;
}
function resultLines(items) {
  return `<div class="result-list">${items.map(({ symbol, label, value }) => `<div class="result-line"><i>${symbol}</i><span>${label}</span><b>${value}</b></div>`).join("")}</div>`;
}

function renderResistors() {
  const list = $("#resistor-list");
  list.innerHTML = Array.from({ length: resistorCount }, (_, index) => `
    <label class="field-row"><b class="field-label">R${index + 1}</b>
      <input class="resistance-input" aria-label="电阻 R${index + 1}，单位欧姆" type="number" inputmode="decimal" min="0" step="any" value="${resistorValues[index] ?? ""}" placeholder="输入阻值">
      <em>Ω</em>${index > 1 ? `<button type="button" data-remove-resistor="${index}" aria-label="移除 R${index + 1}">×</button>` : ""}
    </label>`).join("");
  calculateResistors();
}
function calculateResistors() {
  const values = $$(".resistance-input").map((input) => Number(input.value)).filter((value) => Number.isFinite(value) && value > 0);
  if (values.length < 2 || values.length !== $$(".resistance-input").length) {
    $("#resistor-result").innerHTML = hint("请输入至少两个大于 0 的有效阻值。"); return;
  }
  const equivalent = resistorMode === "series" ? values.reduce((sum, value) => sum + value, 0) : 1 / values.reduce((sum, value) => sum + 1 / value, 0);
  const modeName = resistorMode === "series" ? "串联" : "并联";
  $("#resistor-result").innerHTML = resultCard("等效电阻", eng(equivalent, "Ω"), `${modeName} · ${cleanNumber(equivalent)} Ω`);
}

function calculatePower() {
  const vars = ["v", "i", "r", "p"];
  const values = vars.map((key) => ({ key, value: Number($("#power-" + key).value) })).filter((item) => $("#power-" + item.key).value.trim() !== "" && item.value > 0 && Number.isFinite(item.value));
  if (values.length !== 2) { $("#power-result").innerHTML = hint("填写恰好两个大于 0 的参数后，显示 V、A、Ω 和 W 的结果。"); return; }
  const map = Object.fromEntries(values.map(({ key, value }) => [key, value]));
  let v, i, r, p;
  if ("v" in map && "i" in map) { v = map.v; i = map.i; r = v / i; p = v * i; }
  else if ("v" in map && "r" in map) { v = map.v; r = map.r; i = v / r; p = v * i; }
  else if ("v" in map && "p" in map) { v = map.v; p = map.p; i = p / v; r = v / i; }
  else if ("i" in map && "r" in map) { i = map.i; r = map.r; v = i * r; p = v * i; }
  else if ("i" in map && "p" in map) { i = map.i; p = map.p; v = p / i; r = v / i; }
  else if ("r" in map && "p" in map) { r = map.r; p = map.p; v = Math.sqrt(p * r); i = v / r; }
  if (![v, i, r, p].every(Number.isFinite)) { $("#power-result").innerHTML = hint("数值超出可计算范围，请检查输入。"); return; }
  $("#power-result").innerHTML = resultLines([
    { symbol: "V", label: "电压", value: eng(v, "V") },
    { symbol: "I", label: "电流", value: eng(i, "A") },
    { symbol: "R", label: "电阻", value: eng(r, "Ω") },
    { symbol: "P", label: "功率", value: eng(p, "W") }
  ]);
}

function updateLoadLabel() {
  const labels = { resistor: ["负载阻值", "Ω"], current: ["目标电流", "A"], power: ["目标功率", "W"] };
  $("#load-setting-label").textContent = labels[loadMode][0];
  $("#load-setting-unit").textContent = labels[loadMode][1];
  $("#load-presets").hidden = loadMode !== "resistor";
}
function calculateLoad() {
  const voltage = Number($("#load-voltage").value), setting = Number($("#load-setting").value);
  if (!(voltage > 0 && setting > 0 && Number.isFinite(voltage) && Number.isFinite(setting))) {
    $("#load-result").innerHTML = hint("请输入大于 0 的电压和负载参数。"); $("#rating-result").textContent = ""; return;
  }
  let current, resistance, power;
  if (loadMode === "resistor") { resistance = setting; current = voltage / resistance; power = voltage * current; }
  else if (loadMode === "current") { current = setting; resistance = voltage / current; power = voltage * current; }
  else { power = setting; current = power / voltage; resistance = voltage / current; }
  if (![current, resistance, power].every(Number.isFinite)) { $("#load-result").innerHTML = hint("计算结果超出范围，请检查输入。"); return; }
  $("#load-result").innerHTML = resultLines([
    { symbol: "I", label: "负载电流", value: eng(current, "A") },
    { symbol: "R", label: "等效阻值", value: eng(resistance, "Ω") },
    { symbol: "P", label: "负载功耗", value: eng(power, "W") }
  ]);
  const rating = Number($("#load-rating").value), percent = power / rating * 100;
  $("#rating-result").textContent = percent > 100
    ? `估算功耗约为额定值的 ${cleanNumber(percent, 1)}%，已超过 ${cleanNumber(rating)} W。`
    : `估算功耗约为额定值的 ${cleanNumber(percent, 1)}%。`;
}

function decodeMarking(input) {
  const code = input.trim().toUpperCase();
  if (!code) return null;
  if ((code.match(/R/g) || []).length === 1) {
    const pieces = code.split("R");
    if (pieces.length === 2 && pieces.every((part) => /^\d*$/.test(part)) && (pieces[0] || pieces[1])) {
      const value = Number(`${pieces[0] || "0"}.${pieces[1] || "0"}`);
      return Number.isFinite(value) ? { value, explanation: `R 表示小数点：${code} → ${eng(value, "Ω")}` } : null;
    }
    return null;
  }
  if (!/^\d{3,4}$/.test(code)) return null;
  const significant = Number(code.slice(0, -1)), multiplier = Number(code.slice(-1));
  const value = significant * (10 ** multiplier);
  if (!Number.isFinite(value)) return null;
  return { value, explanation: `${code.length === 3 ? "前两位为有效数字，末位 0 表示乘数 10⁰" : "前三位为有效数字，末位表示 10 的乘方"}：${code} → ${eng(value, "Ω")}` };
}
function updateDecoder() {
  const decoded = decodeMarking($("#marking-code").value);
  $("#decode-result").innerHTML = decoded
    ? `<div class="decode-card"><small>识别结果</small><strong>${eng(decoded.value, "Ω")}</strong><p>${decoded.explanation}</p><span class="type-pill">▱　固定电阻 · 阻值</span></div>`
    : `<div class="invalid">暂不支持此格式。可输入 3 位码（510）、4 位码（1001）或 R 码（4R7）。</div>`;
}
function updatePackage() {
  const value = $("#package-select").value;
  $("#package-result").textContent = value === "不确定" ? packageSizes[value] : `${value} · ${packageSizes[value]}。这是常见外形尺寸参考，不同标准或厂商可能略有差异。`;
}

document.addEventListener("click", (event) => {
  const page = event.target.closest(".main-tab");
  if (page) {
    $$(".main-tab").forEach((button) => button.classList.toggle("active", button === page));
    $$(".page").forEach((section) => { section.hidden = section.id !== page.dataset.page; });
  }
  const mode = event.target.closest(".mode-tab");
  if (mode) {
    $$(".mode-tab").forEach((button) => button.classList.toggle("active", button === mode));
    ["resistor", "power", "load"].forEach((key) => { $("#" + key + "-panel").hidden = key !== mode.dataset.mode; });
  }
  const resistorType = event.target.closest("[data-resistor-mode]");
  if (resistorType) {
    resistorMode = resistorType.dataset.resistorMode;
    $$("[data-resistor-mode]").forEach((button) => button.classList.toggle("selected", button === resistorType));
    calculateResistors();
  }
  const loadType = event.target.closest("[data-load-mode]");
  if (loadType) {
    loadMode = loadType.dataset.loadMode;
    $$("[data-load-mode]").forEach((button) => button.classList.toggle("selected", button === loadType));
    updateLoadLabel(); calculateLoad();
  }
  const remove = event.target.closest("[data-remove-resistor]");
  if (remove && resistorCount > 2) {
    resistorValues.splice(Number(remove.dataset.removeResistor), 1);
    resistorCount--; renderResistors();
  }
  if (event.target.closest("#add-resistor") && resistorCount < 6) { resistorValues.push(""); resistorCount++; renderResistors(); }
  const preset = event.target.closest("[data-preset]");
  if (preset) { $("#load-setting").value = preset.dataset.preset; calculateLoad(); }
  if (event.target.closest("#clear-code")) { $("#marking-code").value = ""; updateDecoder(); $("#marking-code").focus(); }
});
document.addEventListener("input", (event) => {
  if (event.target.matches(".resistance-input")) {
    const index = $$(".resistance-input").indexOf(event.target);
    if (index >= 0) resistorValues[index] = event.target.value;
    calculateResistors();
  }
  if (event.target.id.startsWith("power-")) calculatePower();
  if (["load-voltage", "load-setting"].includes(event.target.id)) calculateLoad();
  if (event.target.id === "marking-code") updateDecoder();
});
document.addEventListener("change", (event) => {
  if (event.target.id === "load-rating") calculateLoad();
  if (event.target.id === "package-select") updatePackage();
});

renderResistors(); calculatePower(); updateLoadLabel(); calculateLoad(); updateDecoder(); updatePackage();
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
