#!/usr/bin/env node

import { createRequire } from "node:module";
import { performance } from "node:perf_hooks";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

require(path.join(rootDir, "js/data-normalizer.js"));

const ContractData = globalThis.ContractData;
const payload = JSON.parse(await readFile(path.join(rootDir, "data/contratos.json"), "utf8"));
const referenceDateArg = process.argv.find((arg) => arg.startsWith("--reference-date="));
const referenceDate = referenceDateArg
  ? new Date(`${referenceDateArg.split("=")[1]}T00:00:00`)
  : new Date();

const failures = [];
const timings = {};

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`falhou - ${name}`);
    console.error(`  ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: esperado ${expected}, recebido ${actual}`);
  }
}

function countBy(items, getter) {
  return items.reduce((counter, item) => {
    const key = getter(item) || "Não informado";
    counter[key] = (counter[key] || 0) + 1;
    return counter;
  }, {});
}

function sumValues(items) {
  return items.reduce((total, item) => total + (typeof item.valor === "number" ? item.valor : 0), 0);
}

function filterItems(items, filters = {}) {
  const query = ContractData.normalizeSearchText(filters.query || "");

  return items.filter((item) => {
    if (query && !item._normalizado.busca.includes(query)) return false;
    if (filters.status && item.statusCalculado !== filters.status) return false;
    if (filters.statusOriginal && item.statusOriginal !== filters.statusOriginal) return false;
    if (filters.modalidade && item.modalidade !== filters.modalidade) return false;
    if (filters.categoria && item.categoria !== filters.categoria) return false;
    if (filters.empresa && item.empresa !== filters.empresa) return false;
    if (filters.gestor && item.gestor !== filters.gestor) return false;
    if (filters.fiscal && item.fiscal !== filters.fiscal) return false;
    if (filters.pendencias === "with" && !item.possuiPendencias) return false;
    if (filters.pendencias === "complete" && item.possuiPendencias) return false;
    if (filters.prazo && !matchesDeadlineRange(item, filters.prazo)) return false;
    if (filters.valor && !matchesValueRange(item, filters.valor)) return false;
    return true;
  });
}

function matchesDeadlineRange(item, range) {
  const days = item.diasParaVencimento;
  if (range === "nodue") return days === null;
  if (days === null) return false;
  if (range === "overdue") return days < 0;
  if (range === "above90") return days > 90;
  const limit = Number(range);
  return Number.isFinite(limit) && days >= 0 && days <= limit;
}

function matchesValueRange(item, range) {
  const value = item.valor;
  if (range === "none") return typeof value !== "number";
  if (typeof value !== "number") return false;
  if (range === "upto10k") return value <= 10000;
  if (range === "10k100k") return value > 10000 && value <= 100000;
  if (range === "100k1m") return value > 100000 && value <= 1000000;
  if (range === "above1m") return value > 1000000;
  return true;
}

function valueRows(items, getter) {
  const grouped = new Map();
  for (const item of items) {
    const key = getter(item) || "Não informado";
    const current = grouped.get(key) || { label: key, value: 0, count: 0 };
    current.count += 1;
    if (typeof item.valor === "number") current.value += item.valor;
    grouped.set(key, current);
  }
  return [...grouped.values()].sort((a, b) => b.value - a.value || b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));
}

function monthKey(date) {
  return date ? date.slice(0, 7) : "";
}

const normalizeStart = performance.now();
const contracts = ContractData.normalizeContracts(payload.contracts, { referenceDate });
timings.normalizacaoMs = performance.now() - normalizeStart;

const summary = ContractData.buildSummary(contracts);
const statusCounts = countBy(contracts, (item) => item.statusCalculado);
const modalidadeCounts = countBy(contracts, (item) => item.modalidade);
const categoriaCounts = countBy(contracts, (item) => item.categoria);
const monthCounts = countBy(contracts.filter((item) => item.dataVencimento), (item) => monthKey(item.dataVencimento));
const topCompanies = valueRows(contracts, (item) => item.empresa).slice(0, 10);
const topManagers = valueRows(contracts, (item) => item.gestor).slice(0, 10);

test("carrega a base de contratos derivada", () => {
  assert(Array.isArray(payload.contracts), "contracts precisa ser uma lista");
  assertEqual(payload.contracts.length, payload.meta.recordCount, "recordCount deve bater com a lista");
  assertEqual(contracts.length, payload.contracts.length, "normalização deve preservar quantidade de registros");
});

test("recalcula vencimentos a partir da data de referência", () => {
  const sample = ContractData.normalizeContracts([
    { contrato: "A", "Data Vencimento": "01/05/2026" },
    { contrato: "B", "Data Vencimento": "31/05/2026" },
    { contrato: "C", "Data Vencimento": "30/04/2026" },
  ], { referenceDate: new Date("2026-05-01T00:00:00") });

  assertEqual(sample[0].diasParaVencimento, 0, "vencimento do dia deve ser zero");
  assertEqual(sample[0].statusCalculado, "Vence hoje", "status do dia deve ser Vence hoje");
  assertEqual(sample[1].diasParaVencimento, 30, "vencimento em 30 dias deve ser 30");
  assertEqual(sample[1].statusCalculado, "Vence em até 30 dias", "status de 30 dias deve ser Até 30");
  assertEqual(sample[2].statusCalculado, "Vencido", "data anterior deve ser Vencido");
});

test("ignora acentos e caixa na busca", () => {
  const result = filterItems(contracts, { query: "saude" });
  const accentResult = filterItems(contracts, { query: "SAÚDE" });
  assert(result.length > 0, "busca por saude deve encontrar contratos");
  assertEqual(result.length, accentResult.length, "busca com e sem acento deve retornar a mesma quantidade");
});

test("aplica cada filtro individual sem erro", () => {
  for (const status of Object.keys(statusCounts)) assert(filterItems(contracts, { status }).length > 0, `status sem retorno: ${status}`);
  for (const statusOriginal of Object.keys(countBy(contracts, (item) => item.statusOriginal))) assert(filterItems(contracts, { statusOriginal }).length > 0, `status original sem retorno: ${statusOriginal}`);
  for (const modalidade of Object.keys(modalidadeCounts)) assert(filterItems(contracts, { modalidade }).length > 0, `modalidade sem retorno: ${modalidade}`);
  for (const categoria of Object.keys(categoriaCounts)) assert(filterItems(contracts, { categoria }).length > 0, `categoria sem retorno: ${categoria}`);

  const empresa = contracts.find((item) => item.empresa)?.empresa;
  const gestor = contracts.find((item) => item.gestor)?.gestor;
  const fiscal = contracts.find((item) => item.fiscal)?.fiscal;
  assert(filterItems(contracts, { empresa }).length > 0, "filtro por empresa deve retornar dados");
  assert(filterItems(contracts, { gestor }).length > 0, "filtro por gestor deve retornar dados");
  assert(filterItems(contracts, { fiscal }).length > 0, "filtro por fiscal deve retornar dados");
});

test("combina múltiplos filtros", () => {
  const base = contracts.find((item) => item.statusCalculado === "Vencido" && item.modalidade && item.categoria);
  assert(base, "deve existir contrato para combinação de filtros");
  const result = filterItems(contracts, {
    status: base.statusCalculado,
    modalidade: base.modalidade,
    categoria: base.categoria,
    pendencias: base.possuiPendencias ? "with" : "complete",
  });
  assert(result.length > 0, "combinação de filtros deve retornar pelo menos um contrato");
});

test("ordena lista por dias e por valor", () => {
  const byDays = [...contracts].sort((a, b) => (a.diasParaVencimento ?? Infinity) - (b.diasParaVencimento ?? Infinity));
  assert(byDays.every((item, index, arr) => index === 0 || (arr[index - 1].diasParaVencimento ?? Infinity) <= (item.diasParaVencimento ?? Infinity)), "ordenação por dias inconsistente");

  const withValue = contracts.filter((item) => typeof item.valor === "number").sort((a, b) => b.valor - a.valor);
  assert(withValue.every((item, index, arr) => index === 0 || arr[index - 1].valor >= item.valor), "ordenação por valor inconsistente");
});

test("mantém dados suficientes para abrir detalhe", () => {
  const item = contracts[0];
  assert(item.id, "detalhe precisa de id");
  assert(item._raw, "detalhe precisa preservar registro bruto");
  assert(Object.prototype.hasOwnProperty.call(item, "statusOriginal"), "detalhe precisa de status original");
  assert(Object.prototype.hasOwnProperty.call(item, "statusCalculado"), "detalhe precisa de status calculado");
});

test("estado vazio retorna zero registros", () => {
  assertEqual(filterItems(contracts, { query: "zzzzzz-sem-resultado" }).length, 0, "busca impossível deve retornar zero");
});

test("identifica contratos sem valor, sem vencimento e com pendências", () => {
  assert(contracts.some((item) => typeof item.valor !== "number"), "deve haver contratos sem valor numérico");
  assert(contracts.some((item) => !item.dataVencimento), "deve haver contratos sem vencimento");
  assert(contracts.some((item) => item.possuiPendencias), "deve haver contratos com pendências");
});

test("calcula totais e status", () => {
  assertEqual(summary.totalContratos, 158, "total de contratos");
  assert(Math.abs(sumValues(contracts) - 193313544.47) < 0.01, "valor total contratado divergente");
  assertEqual(statusCounts.Vencido || 0, 30, "total de vencidos");
  assertEqual(statusCounts["Vence em até 30 dias"] || 0, 16, "total vencendo em até 30 dias");
  assertEqual(statusCounts["Sem vencimento"] || 0, 15, "total sem vencimento");
  assertEqual(contracts.filter((item) => !item.fiscal).length, 31, "total sem fiscal");
  assertEqual(contracts.filter((item) => !item.gestor).length, 21, "total sem gestor");
});

test("agrupamentos fecham com o total", () => {
  assertEqual(Object.values(statusCounts).reduce((a, b) => a + b, 0), contracts.length, "status devem somar o total");
  assertEqual(Object.values(modalidadeCounts).reduce((a, b) => a + b, 0), contracts.length, "modalidades devem somar o total");
  assertEqual(Object.values(categoriaCounts).reduce((a, b) => a + b, 0), contracts.length, "categorias devem somar o total");
  assert(Object.keys(monthCounts).length > 0, "agrupamento mensal deve ter dados");
});

test("rankings de empresas e gestores estão em ordem decrescente", () => {
  assertEqual(topCompanies.length, 10, "ranking de empresas deve ter 10 itens");
  assertEqual(topManagers.length, 10, "ranking de gestores deve ter 10 itens");
  assert(topCompanies.every((item, index, arr) => index === 0 || arr[index - 1].value >= item.value), "ranking de empresas fora de ordem");
  assert(topManagers.every((item, index, arr) => index === 0 || arr[index - 1].value >= item.value), "ranking de gestores fora de ordem");
});

test("normalizador tolera valores, datas e campos inesperados", () => {
  const synthetic = ContractData.normalizeContracts([
    {
      ID: "X1",
      Modalidade: "Pregão",
      Objeto: "Serviço de Saúde",
      Contrato: "",
      "Empresa Contratada": "SMADS: Empresa Teste",
      "Valor (R$)": "R$ 1.234,56",
      "Data Início": "31/02/2026",
      "Data Vencimento": "2026-05-01",
      Gestor: "SMADS: oda gomes",
      Fiscal: "",
      colunaExtra: "deve ser ignorada",
    },
    {
      ID: "X2",
      Objeto: "Linha com coluna faltando",
      "Valor (R$)": "valor inválido",
      "Data Vencimento": "",
    },
  ], { referenceDate: new Date("2026-05-01T00:00:00") });

  assertEqual(synthetic[0].valor, 1234.56, "valor brasileiro deve ser convertido");
  assertEqual(synthetic[0].dataInicio, null, "data inválida deve virar nula");
  assertEqual(synthetic[0].statusCalculado, "Vence hoje", "ISO deve ser lido como data válida");
  assertEqual(synthetic[0].empresa, "Empresa Teste", "prefixo departamental deve ser removido");
  assert(synthetic[0].pendencias.includes("Contrato não informado"), "contrato vazio deve gerar pendência");
  assert(synthetic[0].pendencias.includes("Fiscal não informado"), "fiscal vazio deve gerar pendência");
  assertEqual(synthetic[1].valor, null, "valor inválido deve virar nulo");
  assertEqual(synthetic[1].statusCalculado, "Sem vencimento", "vencimento vazio deve gerar status Sem vencimento");
});

test("performance local permanece confortável", () => {
  const start = performance.now();
  const repeated = [];
  for (let index = 0; index < 25; index += 1) repeated.push(...payload.contracts);
  const normalized = ContractData.normalizeContracts(repeated, { referenceDate });
  const filtered = filterItems(normalized, { query: "saude", pendencias: "with" });
  const duration = performance.now() - start;
  timings.cargaSinteticaMs = duration;
  assert(normalized.length === payload.contracts.length * 25, "carga sintética deve preservar registros");
  assert(Array.isArray(filtered), "filtro da carga sintética deve retornar lista");
  assert(duration < 1500, `validação sintética lenta demais: ${duration.toFixed(1)}ms`);
});

console.log("\nResumo validado:");
console.log(`- referência de data: ${referenceDate.toISOString().slice(0, 10)}`);
console.log(`- total de contratos: ${summary.totalContratos}`);
console.log(`- valor total: ${sumValues(contracts).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`);
console.log(`- status calculados: ${JSON.stringify(statusCounts)}`);
console.log(`- modalidades: ${JSON.stringify(modalidadeCounts)}`);
console.log(`- categorias: ${JSON.stringify(categoriaCounts)}`);
console.log(`- meses com vencimento: ${Object.keys(monthCounts).length}`);
console.log(`- normalização: ${timings.normalizacaoMs.toFixed(1)}ms`);
console.log(`- carga sintética: ${timings.cargaSinteticaMs.toFixed(1)}ms`);

if (failures.length) {
  console.error(`\n${failures.length} teste(s) falharam.`);
  process.exit(1);
}

console.log("\nTodos os testes passaram.");
