const formatCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const formatDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const TABLE_COLUMNS = [
  { key: "statusCalculado", label: "Status", type: "text" },
  { key: "diasParaVencimento", label: "Dias", type: "number" },
  { key: "dataVencimento", label: "Vencimento", type: "date" },
  { key: "contrato", label: "Contrato", type: "text" },
  { key: "processo", label: "Processo", type: "text" },
  { key: "modalidade", label: "Modalidade", type: "text", value: (item) => `${item.modalidade || ""} ${item.numeroModalidade || ""}` },
  { key: "objeto", label: "Objeto", type: "text" },
  { key: "empresa", label: "Empresa", type: "text" },
  { key: "valor", label: "Valor", type: "number" },
  { key: "gestor", label: "Gestor", type: "text" },
  { key: "fiscal", label: "Fiscal", type: "text" },
  { key: "pendencias", label: "Pendências", type: "number", value: (item) => item.pendencias.length },
  { key: "observacoes", label: "Observações", type: "text" },
];

const CHART_COLORS = [
  "var(--color-blue-700)",
  "var(--color-teal-700)",
  "var(--color-green-700)",
  "var(--color-orange-700)",
  "var(--color-blue-900)",
  "var(--color-teal-600)",
  "var(--color-yellow-700)",
  "var(--color-slate-500)",
];

const elements = {
  search: document.querySelector("#global-search"),
  searchForm: document.querySelector(".top-search"),
  modalidade: document.querySelector("#filter-modalidade"),
  status: document.querySelector("#filter-status"),
  statusOriginal: document.querySelector("#filter-status-original"),
  categoria: document.querySelector("#filter-categoria"),
  empresa: document.querySelector("#filter-empresa"),
  gestor: document.querySelector("#filter-gestor"),
  fiscal: document.querySelector("#filter-fiscal"),
  prazo: document.querySelector("#filter-prazo"),
  pendencias: document.querySelector("#filter-pendencias"),
  valor: document.querySelector("#filter-valor"),
  clearFilters: document.querySelector("#clear-filters"),
  tableHead: document.querySelector("#contracts-head"),
  table: document.querySelector("#contracts-table"),
  resultCount: document.querySelector("#result-count"),
  pageStatus: document.querySelector("#page-status"),
  pageRange: document.querySelector("#page-range"),
  pageSize: document.querySelector("#page-size"),
  prevPage: document.querySelector("#prev-page"),
  nextPage: document.querySelector("#next-page"),
  detailBackdrop: document.querySelector("#detail-backdrop"),
  detailDrawer: document.querySelector("#contract-detail"),
  detailTitle: document.querySelector("#detail-title"),
  detailBody: document.querySelector("#detail-body"),
  closeDetail: document.querySelector("#close-detail"),
  lastUpdate: document.querySelector("#last-update"),
  quickActive: document.querySelector("#quick-active"),
  quickSoon: document.querySelector("#quick-soon"),
  quickOverdue: document.querySelector("#quick-overdue"),
  kpiTotal: document.querySelector("#kpi-total"),
  kpiValue: document.querySelector("#kpi-value"),
  kpiOverdue: document.querySelector("#kpi-overdue"),
  kpiSoon: document.querySelector("#kpi-soon"),
  kpiAttention: document.querySelector("#kpi-attention"),
  kpiActive: document.querySelector("#kpi-active"),
  kpiNoDue: document.querySelector("#kpi-no-due"),
  kpiQuality: document.querySelector("#kpi-quality"),
  kpiNoManager: document.querySelector("#kpi-no-manager"),
  kpiNoFiscal: document.querySelector("#kpi-no-fiscal"),
  priorityAlerts: document.querySelector("#priority-alerts"),
  baseHealth: document.querySelector("#base-health"),
  appStatus: document.querySelector("#app-status"),
  footerUpdated: document.querySelector("#footer-updated"),
  activeContractsList: document.querySelector("#active-contracts-list"),
  activeContractsSummary: document.querySelector("#active-contracts-summary"),
  statusChart: document.querySelector("#status-chart"),
  valueModalidadeChart: document.querySelector("#value-modalidade-chart"),
  countModalidadeChart: document.querySelector("#count-modalidade-chart"),
  valueCategoriaChart: document.querySelector("#value-categoria-chart"),
  monthlyDueChart: document.querySelector("#monthly-due-chart"),
  topCompaniesChart: document.querySelector("#top-companies-chart"),
  topManagersChart: document.querySelector("#top-managers-chart"),
  pendenciasChart: document.querySelector("#pendencias-chart"),
  upcomingList: document.querySelector("#upcoming-list"),
};

let contracts = [];
let filteredContracts = [];
let metadata = {};
let currentPage = 1;
let sortState = {
  key: "diasParaVencimento",
  direction: "asc",
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  setAppStatus("loading", "Carregando dados dos contratos...");
  renderTableHead();
  bindEvents();

  try {
    const payload = await loadContracts();
    metadata = payload.meta || {};
    contracts = ContractData.normalizeContracts(payload.contracts || payload);

    ContractData.logNormalizationSummary(contracts);
    populateFilters(contracts);
    render(contracts);
    setAppStatus("loading", "", true);
  } catch (error) {
    console.error("Erro ao carregar os dados de contratos.", error);
    renderErrorState();
  }
}

async function loadContracts() {
  if (window.CONTRATOS_DATA) {
    return window.CONTRATOS_DATA;
  }

  try {
    const response = await fetch("data/contratos.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  } catch (error) {
    throw new Error(`Não foi possível carregar data/contratos.json. ${error.message || ""}`);
  }
}

function setAppStatus(type, message, hidden = false) {
  if (!elements.appStatus) {
    return;
  }

  elements.appStatus.hidden = hidden;
  elements.appStatus.className = `app-status app-status--${type}`;
  elements.appStatus.textContent = message;
}

function renderErrorState() {
  metadata = {};
  contracts = [];
  filteredContracts = [];
  populateFilters([]);
  renderQuickAccess([]);
  renderIndicators([]);
  renderActiveContracts([]);
  renderCharts([]);
  renderTable([]);
  elements.lastUpdate.textContent = "Dados indisponíveis";
  if (elements.footerUpdated) {
    elements.footerUpdated.textContent = "Última atualização dos dados: indisponível";
  }
  setAppStatus(
    "error",
    "Não foi possível carregar a base de contratos. Verifique se data/contratos.js ou data/contratos.json está disponível."
  );
}

function bindEvents() {
  if (elements.searchForm) {
    elements.searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      currentPage = 1;
      renderFiltered();
    });
  }

  if (elements.search) {
    elements.search.addEventListener("input", () => {
      currentPage = 1;
      renderFiltered();
    });
  }

  filterControls().forEach((select) => {
    select.addEventListener("change", () => {
      currentPage = 1;
      renderFiltered();
    });
  });

  elements.clearFilters.addEventListener("click", () => {
    clearAllFilters();
    renderFiltered();
  });

  elements.pageSize.addEventListener("change", () => {
    currentPage = 1;
    renderTable(filteredContracts);
  });

  elements.prevPage.addEventListener("click", () => {
    currentPage -= 1;
    renderTable(filteredContracts);
  });

  elements.nextPage.addEventListener("click", () => {
    currentPage += 1;
    renderTable(filteredContracts);
  });

  elements.tableHead.addEventListener("click", (event) => {
    const button = event.target.closest("[data-sort-key]");
    if (!button) {
      return;
    }
    updateSort(button.dataset.sortKey);
    renderTableHead();
    renderTable(filteredContracts);
  });

  elements.table.addEventListener("click", (event) => {
    const row = event.target.closest("[data-contract-id]");
    if (row) {
      openContractDetail(row.dataset.contractId);
    }
  });

  elements.table.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    const row = event.target.closest("[data-contract-id]");
    if (row) {
      event.preventDefault();
      openContractDetail(row.dataset.contractId);
    }
  });

  if (elements.activeContractsList) {
    elements.activeContractsList.addEventListener("click", (event) => {
      const card = event.target.closest("[data-contract-id]");
      if (card) {
        openContractDetail(card.dataset.contractId);
      }
    });

    elements.activeContractsList.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      const card = event.target.closest("[data-contract-id]");
      if (card) {
        event.preventDefault();
        openContractDetail(card.dataset.contractId);
      }
    });
  }

  elements.closeDetail.addEventListener("click", closeContractDetail);
  elements.detailBackdrop.addEventListener("click", closeContractDetail);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.detailDrawer.classList.contains("is-open")) {
      closeContractDetail();
    }
  });

  document.querySelectorAll("[data-quick-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      clearAllFilters();
      const filter = button.dataset.quickFilter;
      if (filter === "vencidos") {
        elements.prazo.value = "overdue";
      } else if (filter === "vencendo") {
        elements.prazo.value = "30";
      } else {
        elements.status.value = "Vigente";
      }
      renderFiltered();
      document.querySelector(filter === "vigentes" ? "#vigentes" : "#tabela").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function filterControls() {
  return [
    elements.modalidade,
    elements.status,
    elements.statusOriginal,
    elements.categoria,
    elements.empresa,
    elements.gestor,
    elements.fiscal,
    elements.prazo,
    elements.pendencias,
    elements.valor,
  ].filter(Boolean);
}

function clearAllFilters() {
  if (elements.search) {
    elements.search.value = "";
  }
  filterControls().forEach((control) => {
    control.value = "";
  });
  currentPage = 1;
}

function populateFilters(items) {
  fillSelect(elements.status, ContractData.STATUS_LABELS, "Todos");
  fillSelect(elements.statusOriginal, unique(items.map((item) => item.statusOriginal)), "Todos");
  fillSelect(elements.modalidade, unique(items.map((item) => item.modalidade)), "Todas");
  fillSelect(elements.categoria, unique(items.map((item) => item.categoria)), "Todas");
  fillSelect(elements.empresa, unique(items.map((item) => item.empresa)), "Todas");
  fillSelect(elements.gestor, unique(items.map((item) => item.gestor)), "Todos");
  fillSelect(elements.fiscal, unique(items.map((item) => item.fiscal)), "Todos");
}

function fillSelect(select, values, firstLabel) {
  select.innerHTML = "";
  select.append(new Option(firstLabel, ""));
  values.forEach((value) => {
    select.append(new Option(value, value));
  });
}

function renderFiltered() {
  render(applyFilters(contracts));
}

function applyFilters(items) {
  const query = ContractData.normalizeSearchText(elements.search ? elements.search.value : "");
  const filters = {
    modalidade: elements.modalidade.value,
    status: elements.status.value,
    statusOriginal: elements.statusOriginal.value,
    categoria: elements.categoria.value,
    empresa: elements.empresa.value,
    gestor: elements.gestor.value,
    fiscal: elements.fiscal.value,
    prazo: elements.prazo.value,
    pendencias: elements.pendencias.value,
    valor: elements.valor.value,
  };

  return items.filter((item) => {
    if (query && !item._normalizado.busca.includes(query)) {
      return false;
    }
    if (filters.status && item.statusCalculado !== filters.status) {
      return false;
    }
    if (filters.statusOriginal && item.statusOriginal !== filters.statusOriginal) {
      return false;
    }
    if (filters.modalidade && item.modalidade !== filters.modalidade) {
      return false;
    }
    if (filters.categoria && item.categoria !== filters.categoria) {
      return false;
    }
    if (filters.empresa && item.empresa !== filters.empresa) {
      return false;
    }
    if (filters.gestor && item.gestor !== filters.gestor) {
      return false;
    }
    if (filters.fiscal && item.fiscal !== filters.fiscal) {
      return false;
    }
    if (filters.prazo && !matchesDeadlineRange(item, filters.prazo)) {
      return false;
    }
    if (filters.pendencias === "with" && !item.possuiPendencias) {
      return false;
    }
    if (filters.pendencias === "complete" && item.possuiPendencias) {
      return false;
    }
    if (filters.valor && !matchesValueRange(item, filters.valor)) {
      return false;
    }
    return true;
  });
}

function matchesDeadlineRange(item, range) {
  const days = item.diasParaVencimento;
  if (range === "nodue") {
    return days === null;
  }
  if (days === null) {
    return false;
  }
  if (range === "overdue") {
    return days < 0;
  }
  if (range === "above90") {
    return days > 90;
  }
  const limit = Number(range);
  return Number.isFinite(limit) && days >= 0 && days <= limit;
}

function matchesValueRange(item, range) {
  const value = item.valor;
  if (range === "none") {
    return typeof value !== "number";
  }
  if (typeof value !== "number") {
    return false;
  }
  if (range === "upto10k") {
    return value <= 10000;
  }
  if (range === "10k100k") {
    return value > 10000 && value <= 100000;
  }
  if (range === "100k1m") {
    return value > 100000 && value <= 1000000;
  }
  if (range === "above1m") {
    return value > 1000000;
  }
  return true;
}

function render(items) {
  filteredContracts = items;
  renderLastUpdate();
  renderQuickAccess(contracts);
  renderIndicators(items);
  renderActiveContracts(items);
  renderCharts(items);
  renderTable(items);
}

function renderLastUpdate() {
  const generatedAt = metadata.generatedAt ? new Date(metadata.generatedAt) : null;
  const source = metadata.source ? ` · Fonte: ${metadata.source}` : "";
  const hasValidDate = generatedAt && !Number.isNaN(generatedAt.getTime());
  const updateText = hasValidDate
    ? `Dados gerados em ${generatedAt.toLocaleString("pt-BR")}${source}`
    : `Dados carregados${source}`;

  elements.lastUpdate.textContent = updateText;
  if (elements.footerUpdated) {
    elements.footerUpdated.textContent = hasValidDate
      ? `Última atualização dos dados: ${generatedAt.toLocaleString("pt-BR")}`
      : "Última atualização dos dados: não informada";
  }
}

function renderQuickAccess(items) {
  const summary = buildDashboardSummary(items);
  elements.quickActive.textContent = summary.statusCounts.Vigente || 0;
  elements.quickSoon.textContent = (summary.statusCounts["Vence hoje"] || 0) + (summary.statusCounts["Vence em até 30 dias"] || 0);
  elements.quickOverdue.textContent = summary.statusCounts.Vencido || 0;
}

function renderIndicators(items) {
  const summary = buildDashboardSummary(items);

  elements.kpiTotal.textContent = summary.total;
  elements.kpiValue.textContent = formatCurrency.format(summary.totalValue);
  elements.kpiOverdue.textContent = summary.statusCounts.Vencido || 0;
  elements.kpiSoon.textContent = (summary.statusCounts["Vence hoje"] || 0) + (summary.statusCounts["Vence em até 30 dias"] || 0);
  elements.kpiAttention.textContent = summary.statusCounts["Atenção 31 a 60 dias"] || 0;
  elements.kpiActive.textContent = summary.statusCounts.Vigente || 0;
  elements.kpiNoDue.textContent = summary.statusCounts["Sem vencimento"] || 0;
  elements.kpiQuality.textContent = summary.withPendencias;
  elements.kpiNoManager.textContent = summary.noManager;
  elements.kpiNoFiscal.textContent = summary.noFiscal;
  renderPriorityAlerts(summary);
  renderBaseHealth(summary);
}

function renderCharts(items) {
  renderStatusChart(items);
  renderValueByModalidadeChart(items);
  renderCountByModalidadeChart(items);
  renderValueByCategoriaChart(items);
  renderMonthlyDueChart(items);
  renderTopCompaniesChart(items);
  renderTopManagersChart(items);
  renderPendenciasChart(items);
  renderUpcoming(items);
}

function renderPriorityAlerts(summary) {
  const alerts = [
    {
      label: "Vencidos",
      value: summary.statusCounts.Vencido || 0,
      detail: "contratos fora do prazo",
      badge: "badge--danger",
    },
    {
      label: "Vencem hoje",
      value: summary.statusCounts["Vence hoje"] || 0,
      detail: "exigem ação imediata",
      badge: "badge--danger",
    },
    {
      label: "Até 30 dias",
      value: summary.statusCounts["Vence em até 30 dias"] || 0,
      detail: "renovação ou encerramento próximo",
      badge: "badge--warning",
    },
    {
      label: "Sem fiscal",
      value: summary.noFiscal,
      detail: "fiscal não informado",
      badge: "badge--warning",
    },
    {
      label: "Sem gestor",
      value: summary.noManager,
      detail: "gestor não informado",
      badge: "badge--warning",
    },
    {
      label: "Sem vencimento",
      value: summary.noDueDate,
      detail: "data de vencimento ausente",
      badge: "badge--neutral",
    },
    {
      label: "Valores ausentes",
      value: summary.noValue,
      detail: "sem valor numérico válido",
      badge: "badge--neutral",
    },
  ];

  elements.priorityAlerts.innerHTML = alerts.map((alert) => `
    <div class="alert-item">
      <span class="badge ${alert.badge}">${alert.value}</span>
      <div>
        <strong>${escapeHtml(alert.label)}</strong>
        <small>${escapeHtml(alert.detail)}</small>
      </div>
    </div>
  `).join("");
}

function renderBaseHealth(summary) {
  const total = summary.total || 0;
  const rows = [
    ["Registros completos", total - summary.withPendencias],
    ["Com fiscal preenchido", summary.withFiscal],
    ["Com gestor preenchido", summary.withManager],
    ["Com valor preenchido", summary.withValue],
    ["Com vencimento preenchido", summary.withDueDate],
  ];

  elements.baseHealth.innerHTML = rows.map(([label, value]) => {
    const percent = percentOf(value, total);
    return `
      <div class="health-row">
        <div class="health-row__meta">
          <span>${escapeHtml(label)}</span>
          <strong>${percent}%</strong>
        </div>
        <div class="bar-track">
          <span class="bar-fill" style="width: ${percent}%; background: ${healthColor(percent)}"></span>
        </div>
        <small>${value} de ${total} registros</small>
      </div>
    `;
  }).join("");
}

function renderStatusChart(items) {
  const rows = ContractData.STATUS_LABELS.map((status) => {
    const statusItems = items.filter((item) => item.statusCalculado === status);
    const totalValue = sumNumericValue(statusItems);
    return {
      label: status,
      value: statusItems.length,
      valueLabel: formatContractCount(statusItems.length),
      detailLabel: formatCurrency.format(totalValue),
      color: statusColor(status),
      title: `${status}: ${formatContractCount(statusItems.length)} · ${formatCurrency.format(totalValue)}`,
    };
  }).filter((row) => row.value > 0);

  renderHorizontalMetricChart(elements.statusChart, rows, {
    maxValue: items.length,
    emptyMessage: chartEmptyMessage(items),
  });
}

function renderValueByModalidadeChart(items) {
  const rows = buildValueRows(items, (item) => item.modalidade || "Não informado")
    .map((row, index) => ({
      ...row,
      valueLabel: formatCurrency.format(row.value),
      detailLabel: formatContractCount(row.count),
      color: chartColor(index),
      title: `${row.label}: ${formatCurrency.format(row.value)} · ${formatContractCount(row.count)}`,
    }));

  renderHorizontalMetricChart(elements.valueModalidadeChart, rows, {
    emptyMessage: chartEmptyMessage(items),
  });
}

function renderCountByModalidadeChart(items) {
  const rows = buildCountRows(items, (item) => item.modalidade || "Não informado")
    .map((row, index) => ({
      ...row,
      valueLabel: formatContractCount(row.value),
      detailLabel: `${percentOf(row.value, items.length)}% da base filtrada`,
      color: chartColor(index),
      title: `${row.label}: ${formatContractCount(row.value)}`,
    }));

  renderHorizontalMetricChart(elements.countModalidadeChart, rows, {
    maxValue: items.length,
    emptyMessage: chartEmptyMessage(items),
  });
}

function renderValueByCategoriaChart(items) {
  const rows = buildValueRows(items, (item) => item.categoria || "Outros/Pendente")
    .map((row, index) => ({
      ...row,
      valueLabel: formatCurrency.format(row.value),
      detailLabel: formatContractCount(row.count),
      color: chartColor(index),
      title: `${row.label}: ${formatCurrency.format(row.value)} · ${formatContractCount(row.count)}`,
    }));

  renderHorizontalMetricChart(elements.valueCategoriaChart, rows, {
    emptyMessage: chartEmptyMessage(items),
  });
}

function renderMonthlyDueChart(items) {
  const grouped = items.reduce((map, item) => {
    const key = monthKey(item.dataVencimento);
    if (!key) {
      return map;
    }

    const current = map.get(key) || {
      label: formatMonthLabel(key),
      value: 0,
      totalValue: 0,
    };

    current.value += 1;
    if (typeof item.valor === "number") {
      current.totalValue += item.valor;
    }
    map.set(key, current);
    return map;
  }, new Map());

  const rows = [...grouped.entries()]
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([, row], index) => ({
      ...row,
      valueLabel: String(row.value),
      detailLabel: formatCurrency.format(row.totalValue),
      color: chartColor(index),
      title: `${row.label}: ${formatContractCount(row.value)} · ${formatCurrency.format(row.totalValue)}`,
    }));

  renderVerticalMetricChart(elements.monthlyDueChart, rows, {
    emptyMessage: chartEmptyMessage(items),
  });
}

function renderTopCompaniesChart(items) {
  const rows = buildValueRows(items, (item) => item.empresa)
    .slice(0, 10)
    .map((row, index) => ({
      ...row,
      valueLabel: formatCurrency.format(row.value),
      detailLabel: formatContractCount(row.count),
      color: chartColor(index),
      title: `${row.label}: ${formatCurrency.format(row.value)} · ${formatContractCount(row.count)}`,
    }));

  renderHorizontalMetricChart(elements.topCompaniesChart, rows, {
    emptyMessage: chartEmptyMessage(items),
  });
}

function renderTopManagersChart(items) {
  const rows = buildValueRows(items, (item) => item.gestor)
    .slice(0, 10)
    .map((row, index) => ({
      ...row,
      valueLabel: formatCurrency.format(row.value),
      detailLabel: formatContractCount(row.count),
      color: chartColor(index),
      title: `${row.label}: ${formatCurrency.format(row.value)} · ${formatContractCount(row.count)}`,
    }));

  renderHorizontalMetricChart(elements.topManagersChart, rows, {
    emptyMessage: chartEmptyMessage(items),
  });
}

function renderPendenciasChart(items) {
  const rows = [
    {
      label: "Sem fiscal",
      value: items.filter((item) => !item.fiscal).length,
      color: "var(--color-orange-700)",
    },
    {
      label: "Sem gestor",
      value: items.filter((item) => !item.gestor).length,
      color: "var(--color-orange-700)",
    },
    {
      label: "Sem valor",
      value: items.filter((item) => typeof item.valor !== "number").length,
      color: "var(--color-slate-500)",
    },
    {
      label: "Sem vencimento",
      value: items.filter((item) => !item.dataVencimento).length,
      color: "var(--color-slate-500)",
    },
    {
      label: "Sem contrato",
      value: items.filter((item) => !item.contrato).length,
      color: "var(--color-red-700)",
    },
    {
      label: "Sem empresa",
      value: items.filter((item) => !item.empresa).length,
      color: "var(--color-red-700)",
    },
  ].filter((row) => row.value > 0)
    .map((row) => ({
      ...row,
      valueLabel: formatContractCount(row.value),
      detailLabel: `${percentOf(row.value, items.length)}% da base filtrada`,
      title: `${row.label}: ${formatContractCount(row.value)}`,
    }));

  renderHorizontalMetricChart(elements.pendenciasChart, rows, {
    maxValue: items.length,
    emptyMessage: chartEmptyMessage(items),
  });
}

function renderHorizontalMetricChart(container, rows, options = {}) {
  if (!container) {
    return;
  }

  if (!rows.length) {
    renderChartEmpty(container, options.emptyMessage || "Sem dados suficientes para este gráfico");
    return;
  }

  const maxValue = options.maxValue || Math.max(...rows.map((row) => row.value), 1);

  container.innerHTML = rows.map((row) => {
    const percent = Math.max(2, Math.round((row.value / maxValue) * 100));
    return `
      <div class="metric-row" title="${escapeHtml(row.title || row.label)}">
        <div class="metric-row__header">
          <span class="metric-label">${escapeHtml(row.label)}</span>
          <strong>${escapeHtml(row.valueLabel || String(row.value))}</strong>
        </div>
        <div class="bar-track metric-track" aria-hidden="true">
          <span class="bar-fill metric-fill" style="width: ${percent}%; background: ${row.color || "var(--color-blue-700)"}"></span>
        </div>
        ${row.detailLabel ? `<small>${escapeHtml(row.detailLabel)}</small>` : ""}
      </div>
    `;
  }).join("");
}

function renderVerticalMetricChart(container, rows, options = {}) {
  if (!container) {
    return;
  }

  if (!rows.length) {
    renderChartEmpty(container, options.emptyMessage || "Sem dados suficientes para este gráfico");
    return;
  }

  const maxValue = Math.max(...rows.map((row) => row.value), 1);

  container.innerHTML = `
    <div class="vertical-bars" role="list">
      ${rows.map((row) => {
        const percent = Math.max(4, Math.round((row.value / maxValue) * 100));
        return `
          <div class="vertical-bar" role="listitem" title="${escapeHtml(row.title || row.label)}">
            <strong>${escapeHtml(row.valueLabel || String(row.value))}</strong>
            <div class="vertical-bar__track" aria-hidden="true">
              <span class="vertical-bar__fill" style="height: ${percent}%; background: ${row.color || "var(--color-blue-700)"}"></span>
            </div>
            <small>${escapeHtml(row.label)}</small>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderChartEmpty(container, message) {
  container.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function renderActiveContracts(items) {
  if (!elements.activeContractsList) {
    return;
  }

  const activeContracts = items
    .filter(isActiveContract)
    .sort(sortActiveContracts);

  const totalValue = sumNumericValue(activeContracts);
  const summary = activeContracts.length
    ? `${formatContractCount(activeContracts.length)} vigentes · ${formatCurrency.format(totalValue)} · ordenados por vencimento`
    : "Nenhum contrato vigente encontrado nos filtros atuais";

  if (elements.activeContractsSummary) {
    elements.activeContractsSummary.textContent = summary;
  }

  if (!activeContracts.length) {
    elements.activeContractsList.innerHTML = '<p class="empty-state">Nenhum contrato vigente encontrado para os filtros selecionados.</p>';
    return;
  }

  elements.activeContractsList.innerHTML = activeContracts.map((item) => `
    <article class="active-contract-card ${activeContractClass(item)}" data-contract-id="${escapeAttribute(item.id)}" tabindex="0" aria-label="Abrir detalhes do contrato vigente ${escapeAttribute(item.contrato || item.id)}">
      <div class="active-contract-card__top">
        <span class="active-contract-card__date">
          <svg class="icon" aria-hidden="true"><use href="#icon-calendar"></use></svg>
          ${escapeHtml(formatDateISO(item.dataVencimento))}
        </span>
        <span class="badge ${statusBadgeClass(item.statusCalculado)}">${escapeHtml(item.statusCalculado)}</span>
      </div>
      <div class="active-contract-card__body">
        <strong>${escapeHtml(item.contrato || "Sem contrato")}</strong>
        <p>${escapeHtml(item.objeto || "Objeto não informado")}</p>
      </div>
      <dl class="active-contract-meta">
        <div>
          <dt>Dias</dt>
          <dd>${escapeHtml(formatDays(item.diasParaVencimento))}</dd>
        </div>
        <div>
          <dt>Empresa</dt>
          <dd>${escapeHtml(item.empresa || "Não informada")}</dd>
        </div>
        <div>
          <dt>Valor</dt>
          <dd>${escapeHtml(formatValueText(item))}</dd>
        </div>
        <div>
          <dt>Gestor</dt>
          <dd>${escapeHtml(item.gestor || "Não informado")}</dd>
        </div>
      </dl>
    </article>
  `).join("");
}

function renderUpcoming(items) {
  const upcoming = items
    .filter((item) => item.diasParaVencimento !== null)
    .sort(sortPriorityDeadlines)
    .slice(0, 12);

  if (!upcoming.length) {
    elements.upcomingList.innerHTML = '<p class="empty-state">Nenhum vencimento encontrado nos filtros atuais.</p>';
    return;
  }

  elements.upcomingList.innerHTML = upcoming.map((item) => `
    <article class="deadline-item ${item.diasParaVencimento < 0 ? "deadline-item--overdue" : ""}">
      <div class="deadline-item__top">
        <span>${escapeHtml(item.contrato || "Sem contrato")}</span>
        <span class="badge ${statusBadgeClass(item.statusCalculado)}">${escapeHtml(item.statusCalculado)}</span>
      </div>
      <strong>${escapeHtml(item.objeto || "Objeto não informado")}</strong>
      <dl class="deadline-meta">
        <div>
          <dt>Empresa</dt>
          <dd>${escapeHtml(item.empresa || "Não informada")}</dd>
        </div>
        <div>
          <dt>Vencimento</dt>
          <dd>${formatDateISO(item.dataVencimento)} · ${formatDays(item.diasParaVencimento)}</dd>
        </div>
        <div>
          <dt>Valor</dt>
          <dd>${escapeHtml(formatValueText(item))}</dd>
        </div>
        <div>
          <dt>Gestor/Fiscal</dt>
          <dd>${escapeHtml(formatResponsiblePair(item))}</dd>
        </div>
      </dl>
    </article>
  `).join("");
}

function renderTableHead() {
  const cells = TABLE_COLUMNS.map((column) => {
    const isSorted = sortState.key === column.key;
    const directionLabel = sortState.direction === "asc" ? "crescente" : "decrescente";
    const arrow = !isSorted ? "↕" : sortState.direction === "asc" ? "↑" : "↓";
    const ariaSort = !isSorted ? "none" : sortState.direction === "asc" ? "ascending" : "descending";
    return `
      <th scope="col" aria-sort="${ariaSort}">
        <button class="sort-button" type="button" data-sort-key="${escapeAttribute(column.key)}" aria-label="Ordenar por ${escapeAttribute(column.label)}${isSorted ? `, ordem ${directionLabel}` : ""}">
          <span>${escapeHtml(column.label)}</span>
          <span aria-hidden="true">${arrow}</span>
        </button>
      </th>
    `;
  }).join("");

  elements.tableHead.innerHTML = `<tr>${cells}</tr>`;
}

function renderTable(items) {
  const sortedItems = sortItems(items);
  const total = sortedItems.length;
  const pageSize = getPageSize(total);
  const totalPages = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(total / pageSize));
  currentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const pageStart = pageSize === Infinity ? 0 : (currentPage - 1) * pageSize;
  const pageEnd = pageSize === Infinity ? total : Math.min(total, pageStart + pageSize);
  const pageItems = sortedItems.slice(pageStart, pageEnd);

  elements.resultCount.textContent = `${total} ${total === 1 ? "registro filtrado" : "registros filtrados"}`;
  elements.pageStatus.textContent = `Página ${total ? currentPage : 0} de ${total ? totalPages : 0}`;
  elements.pageRange.textContent = total
    ? `${pageStart + 1}-${pageEnd} de ${total} registros exibidos`
    : "0 registros exibidos";
  elements.prevPage.disabled = !total || currentPage <= 1;
  elements.nextPage.disabled = !total || currentPage >= totalPages;

  if (!pageItems.length) {
    elements.table.innerHTML = `<tr><td colspan="${TABLE_COLUMNS.length}" class="empty-state">Nenhum contrato encontrado para os filtros selecionados.</td></tr>`;
    return;
  }

  elements.table.innerHTML = pageItems.map((item) => `
    <tr class="${tableRowClass(item)}" data-contract-id="${escapeAttribute(item.id)}" tabindex="0" aria-label="Abrir detalhes do contrato ${escapeAttribute(item.contrato || item.id)}">
      ${TABLE_COLUMNS.map((column) => renderTableCell(item, column)).join("")}
    </tr>
  `).join("");
}

function renderTableCell(item, column) {
  if (column.key === "statusCalculado") {
    const statusNote = item.statusOriginal && item.statusOriginal !== item.statusCalculado
      ? `<small class="status-note">Original: ${escapeHtml(item.statusOriginal)}</small>`
      : "";
    return `
      <td class="status-cell">
        <span class="badge ${statusBadgeClass(item.statusCalculado)}">${escapeHtml(item.statusCalculado)}</span>
        ${statusNote}
      </td>
    `;
  }

  if (column.key === "diasParaVencimento") {
    return `<td class="numeric-cell">${item.diasParaVencimento === null ? "—" : item.diasParaVencimento}</td>`;
  }

  if (column.key === "dataVencimento") {
    return `<td>${formatDateISO(item.dataVencimento)}</td>`;
  }

  if (column.key === "contrato") {
    return `<td><strong>${escapeHtml(item.contrato || "Não informado")}</strong></td>`;
  }

  if (column.key === "processo") {
    return `<td>${escapeHtml(item.processo || "Não informado")}</td>`;
  }

  if (column.key === "modalidade") {
    return `
      <td>
        ${escapeHtml(item.modalidade || "Não informado")}
        <small class="muted-cell">${escapeHtml(item.numeroModalidade || "")}</small>
      </td>
    `;
  }

  if (column.key === "objeto") {
    return `<td class="object-cell">${escapeHtml(item.objeto || "Objeto não informado")}</td>`;
  }

  if (column.key === "empresa") {
    return `<td class="wrap-cell">${escapeHtml(item.empresa || "Não informado")}</td>`;
  }

  if (column.key === "valor") {
    return `<td class="numeric-cell">${formatValue(item)}</td>`;
  }

  if (column.key === "gestor") {
    return `<td class="wrap-cell">${escapeHtml(item.gestor || "Não informado")}</td>`;
  }

  if (column.key === "fiscal") {
    return `<td class="wrap-cell">${escapeHtml(item.fiscal || "Não informado")}</td>`;
  }

  if (column.key === "pendencias") {
    return `<td>${formatPendencias(item)}</td>`;
  }

  if (column.key === "observacoes") {
    return `<td class="notes-cell">${escapeHtml(item.observacoes || "Sem observações")}</td>`;
  }

  return `<td>${escapeHtml(item[column.key] || "Não informado")}</td>`;
}

function updateSort(key) {
  if (sortState.key === key) {
    sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
    return;
  }
  sortState = {
    key,
    direction: key === "valor" ? "desc" : "asc",
  };
}

function sortItems(items) {
  const column = TABLE_COLUMNS.find((item) => item.key === sortState.key) || TABLE_COLUMNS[0];
  return [...items].sort((a, b) => {
    const valueA = getSortValue(a, column);
    const valueB = getSortValue(b, column);
    const comparison = compareValues(valueA, valueB, column.type);
    if (comparison !== 0) {
      return sortState.direction === "asc" ? comparison : -comparison;
    }
    return compareValues(a.objeto, b.objeto, "text");
  });
}

function getSortValue(item, column) {
  if (column.value) {
    return column.value(item);
  }
  return item[column.key];
}

function compareValues(a, b, type) {
  const blankA = a === null || a === undefined || a === "";
  const blankB = b === null || b === undefined || b === "";
  if (blankA && blankB) {
    return 0;
  }
  if (blankA) {
    return 1;
  }
  if (blankB) {
    return -1;
  }
  if (type === "number") {
    return Number(a) - Number(b);
  }
  if (type === "date") {
    return ContractData.parseDateValue(a).getTime() - ContractData.parseDateValue(b).getTime();
  }
  return String(a).localeCompare(String(b), "pt-BR", { numeric: true, sensitivity: "base" });
}

function getPageSize(total) {
  return elements.pageSize.value === "all" ? Infinity : Number(elements.pageSize.value) || total || 25;
}

function openContractDetail(contractId) {
  const contract = contracts.find((item) => String(item.id) === String(contractId));
  if (!contract) {
    return;
  }

  elements.detailTitle.textContent = contract.contrato || `Registro ${contract.id}`;
  elements.detailBody.innerHTML = renderContractDetail(contract);
  elements.detailBackdrop.hidden = false;
  elements.detailDrawer.hidden = false;
  elements.detailDrawer.setAttribute("aria-hidden", "false");
  elements.detailDrawer.classList.add("is-open");
  document.body.classList.add("detail-open");
  elements.detailDrawer.focus();
}

function closeContractDetail() {
  elements.detailDrawer.classList.remove("is-open");
  elements.detailDrawer.setAttribute("aria-hidden", "true");
  elements.detailDrawer.hidden = true;
  elements.detailBackdrop.hidden = true;
  document.body.classList.remove("detail-open");
}

function renderContractDetail(item) {
  const calculatedRows = [
    ["Status calculado", `<span class="badge ${statusBadgeClass(item.statusCalculado)}">${escapeHtml(item.statusCalculado)}</span>`],
    ["Status original", escapeHtml(item.statusOriginal || "Não informado")],
    ["Dias para vencimento", item.diasParaVencimento === null ? "Não informado" : `${item.diasParaVencimento} (${escapeHtml(formatDays(item.diasParaVencimento))})`],
    ["Categoria", escapeHtml(item.categoria || "Outros/Pendente")],
    ["Pendências", item.possuiPendencias ? escapeHtml(item.pendencias.join("; ")) : "Sem pendências"],
  ];

  const mainRows = [
    ["Contrato", escapeHtml(item.contrato || "Não informado")],
    ["Processo", escapeHtml(item.processo || "Não informado")],
    ["Modalidade", escapeHtml([item.modalidade, item.numeroModalidade].filter(Boolean).join(" · ") || "Não informado")],
    ["Objeto", escapeHtml(item.objeto || "Objeto não informado")],
    ["Empresa", escapeHtml(item.empresa || "Não informado")],
    ["Valor", escapeHtml(formatValueText(item))],
    ["Data de início", escapeHtml(formatDateISO(item.dataInicio))],
    ["Data de vencimento", escapeHtml(formatDateISO(item.dataVencimento))],
    ["Gestor", escapeHtml(item.gestor || "Não informado")],
    ["Fiscal", escapeHtml(item.fiscal || "Não informado")],
    ["Observações", escapeHtml(item.observacoes || "Sem observações")],
  ];

  const rawRows = Object.entries(item._raw || {})
    .filter(([key]) => !key.startsWith("_"))
    .map(([key, value]) => [key, escapeHtml(formatRawValue(value))]);

  return `
    <section class="detail-section">
      <h3>Resumo administrativo</h3>
      ${renderDefinitionList(mainRows)}
    </section>
    <section class="detail-section">
      <h3>Campos calculados</h3>
      ${renderDefinitionList(calculatedRows)}
    </section>
    <section class="detail-section">
      <h3>Campos originais da planilha</h3>
      ${renderDefinitionList(rawRows)}
    </section>
  `;
}

function renderDefinitionList(rows) {
  return `
    <dl class="detail-list">
      ${rows.map(([label, value]) => `
        <div>
          <dt>${escapeHtml(label)}</dt>
          <dd>${value || "Não informado"}</dd>
        </div>
      `).join("")}
    </dl>
  `;
}

function tableRowClass(item) {
  if (item.statusCalculado === "Vencido") {
    return "row--overdue";
  }
  if (item.statusCalculado === "Vence hoje") {
    return "row--today";
  }
  if (item.statusCalculado === "Vence em até 30 dias") {
    return "row--soon";
  }
  if (item.statusCalculado === "Atenção 31 a 60 dias") {
    return "row--attention";
  }
  return "";
}

function buildDashboardSummary(items) {
  return items.reduce((summary, item) => {
    summary.total += 1;
    summary.statusCounts[item.statusCalculado] = (summary.statusCounts[item.statusCalculado] || 0) + 1;

    const modalidade = item.modalidade || "Não informado";
    summary.modalidadeCounts[modalidade] = (summary.modalidadeCounts[modalidade] || 0) + 1;

    if (typeof item.valor === "number") {
      summary.totalValue += item.valor;
      summary.withValue += 1;
    } else {
      summary.noValue += 1;
    }

    if (item.possuiPendencias) {
      summary.withPendencias += 1;
    }

    if (item.gestor) {
      summary.withManager += 1;
    } else {
      summary.noManager += 1;
    }

    if (item.fiscal) {
      summary.withFiscal += 1;
    } else {
      summary.noFiscal += 1;
    }

    if (item.dataVencimento) {
      summary.withDueDate += 1;
    } else {
      summary.noDueDate += 1;
    }

    return summary;
  }, {
    total: 0,
    statusCounts: Object.fromEntries(ContractData.STATUS_LABELS.map((status) => [status, 0])),
    modalidadeCounts: {},
    totalValue: 0,
    withValue: 0,
    noValue: 0,
    withPendencias: 0,
    withManager: 0,
    noManager: 0,
    withFiscal: 0,
    noFiscal: 0,
    withDueDate: 0,
    noDueDate: 0,
  });
}

function formatValue(item) {
  const value = formatValueText(item);
  if (typeof item.valor === "number") {
    return value;
  }
  if (item.valorDescricao) {
    return `<span class="muted-cell">${escapeHtml(value)}</span>`;
  }
  return value;
}

function formatValueText(item) {
  if (typeof item.valor === "number") {
    return formatCurrency.format(item.valor);
  }
  if (item.valorDescricao) {
    return item.valorDescricao;
  }
  return "Não informado";
}

function formatPendencias(item) {
  if (!item.possuiPendencias) {
    return '<span class="badge badge--success">Completo</span>';
  }

  const label = `${item.pendencias.length} ${item.pendencias.length === 1 ? "pendência" : "pendências"}`;
  return `
    <span class="badge badge--warning">${label}</span>
    <small class="pendencias-list">${escapeHtml(item.pendencias.join("; "))}</small>
  `;
}

function formatDays(days) {
  if (days < 0) {
    const overdueDays = Math.abs(days);
    return overdueDays === 1 ? "1 dia vencido" : `${overdueDays} dias vencidos`;
  }
  if (days === 0) {
    return "vence hoje";
  }
  if (days === 1) {
    return "1 dia";
  }
  return `${days} dias`;
}

function formatResponsiblePair(item) {
  const gestor = item.gestor || "Gestor não informado";
  const fiscal = item.fiscal || "Fiscal não informado";
  return `${gestor} / ${fiscal}`;
}

function isActiveContract(item) {
  return item.diasParaVencimento !== null && item.diasParaVencimento >= 0;
}

function sortActiveContracts(a, b) {
  if (a.diasParaVencimento !== b.diasParaVencimento) {
    return a.diasParaVencimento - b.diasParaVencimento;
  }

  const dateComparison = compareValues(a.dataVencimento, b.dataVencimento, "date");
  if (dateComparison !== 0) {
    return dateComparison;
  }

  return (b.valor || 0) - (a.valor || 0);
}

function activeContractClass(item) {
  if (item.statusCalculado === "Vence hoje") {
    return "active-contract-card--today";
  }
  if (item.statusCalculado === "Vence em até 30 dias") {
    return "active-contract-card--soon";
  }
  if (item.statusCalculado === "Atenção 31 a 60 dias") {
    return "active-contract-card--attention";
  }
  if (item.statusCalculado === "Monitorar 61 a 90 dias") {
    return "active-contract-card--monitor";
  }
  return "";
}

function sortPriorityDeadlines(a, b) {
  const overdueA = a.diasParaVencimento < 0 ? 0 : 1;
  const overdueB = b.diasParaVencimento < 0 ? 0 : 1;
  if (overdueA !== overdueB) {
    return overdueA - overdueB;
  }

  if (a.diasParaVencimento !== b.diasParaVencimento) {
    return a.diasParaVencimento - b.diasParaVencimento;
  }

  return (b.valor || 0) - (a.valor || 0);
}

function statusBadgeClass(status) {
  if (status === "Vencido") {
    return "badge--danger";
  }
  if (status === "Vence hoje") {
    return "badge--danger";
  }
  if (status === "Vence em até 30 dias") {
    return "badge--warning";
  }
  if (status === "Atenção 31 a 60 dias") {
    return "badge--attention";
  }
  if (status === "Monitorar 61 a 90 dias") {
    return "badge--notice";
  }
  if (status === "Vigente") {
    return "badge--success";
  }
  return "badge--neutral";
}

function statusColor(status) {
  if (status === "Vencido" || status === "Vence hoje") {
    return "var(--color-red-700)";
  }
  if (status === "Vence em até 30 dias") {
    return "var(--color-orange-700)";
  }
  if (status === "Atenção 31 a 60 dias") {
    return "var(--color-yellow-700)";
  }
  if (status === "Monitorar 61 a 90 dias") {
    return "var(--color-blue-700)";
  }
  if (status === "Vigente") {
    return "var(--color-green-700)";
  }
  return "var(--color-slate-500)";
}

function healthColor(percent) {
  if (percent >= 85) {
    return "var(--color-green-700)";
  }
  if (percent >= 65) {
    return "var(--color-orange-700)";
  }
  return "var(--color-red-700)";
}

function percentOf(value, total) {
  if (!total) {
    return 0;
  }
  return Math.round((value / total) * 100);
}

function sumNumericValue(items) {
  return items.reduce((sum, item) => sum + (typeof item.valor === "number" ? item.valor : 0), 0);
}

function buildCountRows(items, keyResolver) {
  const map = items.reduce((accumulator, item) => {
    const key = keyResolver(item);
    if (!key) {
      return accumulator;
    }
    accumulator.set(key, (accumulator.get(key) || 0) + 1);
    return accumulator;
  }, new Map());

  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort(sortMetricRows);
}

function buildValueRows(items, keyResolver) {
  const map = items.reduce((accumulator, item) => {
    const key = keyResolver(item);
    if (!key || typeof item.valor !== "number") {
      return accumulator;
    }

    const current = accumulator.get(key) || { label: key, value: 0, count: 0 };
    current.value += item.valor;
    current.count += 1;
    accumulator.set(key, current);
    return accumulator;
  }, new Map());

  return [...map.values()]
    .filter((row) => row.value > 0)
    .sort(sortMetricRows);
}

function sortMetricRows(a, b) {
  if (b.value !== a.value) {
    return b.value - a.value;
  }
  return a.label.localeCompare(b.label, "pt-BR");
}

function chartColor(index) {
  return CHART_COLORS[index % CHART_COLORS.length];
}

function chartEmptyMessage(items) {
  if (!items.length) {
    return "Nenhum contrato encontrado para os filtros selecionados";
  }

  return "Sem dados suficientes para este gráfico";
}

function formatContractCount(value) {
  return value === 1 ? "1 contrato" : `${value} contratos`;
}

function monthKey(value) {
  const date = ContractData.parseDateValue(value);
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  const monthLabel = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return `${monthLabel}/${String(year).slice(-2)}`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function formatDateISO(value) {
  const date = ContractData.parseDateValue(value);
  return date ? formatDate.format(date) : "Não informado";
}

function formatRawValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Não informado";
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDate.format(value);
  }
  if (typeof value === "number") {
    return String(value);
  }
  return String(value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
