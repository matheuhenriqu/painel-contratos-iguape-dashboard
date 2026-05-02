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
  { key: "dataVencimento", label: "Vencimento", type: "date" },
  { key: "contrato", label: "Contrato", type: "text" },
  { key: "processo", label: "Processo", type: "text" },
  { key: "modalidade", label: "Modalidade", type: "text", value: (item) => `${item.modalidade || ""} ${item.numeroModalidade || ""}` },
  { key: "objeto", label: "Objeto", type: "text" },
  { key: "empresa", label: "Empresa", type: "text" },
  { key: "valor", label: "Valor", type: "number" },
  { key: "pendencias", label: "Pendências", type: "number", value: (item) => item.pendencias.length },
];

const elements = {
  tableHead: document.querySelector("#contracts-head"),
  table: document.querySelector("#contracts-table"),
  mobileCards: document.querySelector("#contracts-mobile-cards"),
  resultCount: document.querySelector("#result-count"),
  pageStatus: document.querySelector("#page-status"),
  pageRange: document.querySelector("#page-range"),
  pageSize: document.querySelector("#page-size"),
  tableSort: document.querySelector("#table-sort"),
  prevPage: document.querySelector("#prev-page"),
  nextPage: document.querySelector("#next-page"),
  detailBackdrop: document.querySelector("#detail-backdrop"),
  detailDrawer: document.querySelector("#contract-detail"),
  detailTitle: document.querySelector("#detail-title"),
  detailBody: document.querySelector("#detail-body"),
  closeDetail: document.querySelector("#close-detail"),
  heroLastUpdate: document.querySelector("#hero-last-update"),
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
  upcomingList: document.querySelector("#upcoming-list"),
  chartStatus: document.querySelector("#chart-status"),
  chartValueModalidade: document.querySelector("#chart-value-modalidade"),
  chartCountModalidade: document.querySelector("#chart-count-modalidade"),
  chartValueCategoria: document.querySelector("#chart-value-categoria"),
  chartDueMonth: document.querySelector("#chart-due-month"),
  chartTopEmpresas: document.querySelector("#chart-top-empresas"),
  chartTopGestores: document.querySelector("#chart-top-gestores"),
  chartPendencias: document.querySelector("#chart-pendencias"),
  filterSearch: document.querySelector("#filter-search"),
  filterStatusCalculado: document.querySelector("#filter-status-calculado"),
  filterStatusOriginal: document.querySelector("#filter-status-original"),
  filterModalidade: document.querySelector("#filter-modalidade"),
  filterCategoria: document.querySelector("#filter-categoria"),
  filterEmpresa: document.querySelector("#filter-empresa"),
  filterGestor: document.querySelector("#filter-gestor"),
  filterFiscal: document.querySelector("#filter-fiscal"),
  filterVencimento: document.querySelector("#filter-vencimento"),
  filterPendencias: document.querySelector("#filter-pendencias"),
  filterValor: document.querySelector("#filter-valor"),
  filterControls: document.querySelectorAll("[data-filter]"),
  activeFilters: document.querySelector("#active-filters"),
  openFilters: document.querySelector("#open-filters"),
  closeFilters: document.querySelector("#close-filters"),
  filtersPanel: document.querySelector("#filters-panel"),
  filtersBackdrop: document.querySelector("#filters-backdrop"),
  applyFilters: document.querySelector("#apply-filters"),
  applyFiltersDesktop: document.querySelector("#apply-filters-desktop"),
  clearFilters: document.querySelector("#clear-filters"),
  toggleButtons: document.querySelectorAll("[data-toggle-section]"),
};

const DEFAULT_FILTERS = {
  search: "",
  statusCalculado: "",
  statusOriginal: "",
  modalidade: "",
  categoria: "",
  empresa: "",
  gestor: "",
  fiscal: "",
  vencimento: "",
  pendencias: "all",
  valor: "",
};

const FILTER_LABELS = {
  search: "Busca",
  statusCalculado: "Status",
  statusOriginal: "Status original",
  modalidade: "Modalidade",
  categoria: "Categoria",
  empresa: "Empresa",
  gestor: "Gestor",
  fiscal: "Fiscal",
  vencimento: "Vencimento",
  pendencias: "Pendências",
  valor: "Valor",
};

const STATUS_CHART_COLORS = {
  Vencido: "var(--color-red-700)",
  "Vence hoje": "var(--color-red-700)",
  "Vence em até 30 dias": "var(--color-orange-700)",
  "Atenção 31 a 60 dias": "var(--color-yellow-700)",
  "Monitorar 61 a 90 dias": "var(--color-blue-700)",
  Vigente: "var(--color-green-700)",
  "Sem vencimento": "var(--color-slate-500)",
};

const CHART_PALETTE = [
  "var(--color-blue-700)",
  "var(--color-teal-700)",
  "var(--color-green-700)",
  "var(--color-orange-700)",
  "var(--color-yellow-700)",
  "#6f7f95",
  "#4b6b8a",
  "#007b83",
  "#3d7f5a",
  "#9a6b13",
];

let contracts = [];
let filteredContracts = [];
let metadata = {};
let currentPage = 1;
let filterState = { ...DEFAULT_FILTERS };
let filterDebounceTimer = null;
let sortState = {
  key: "dataVencimento",
  direction: "asc",
};
let lastDetailTrigger = null;

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
    populateFilterOptions(contracts);
    applyCurrentFilters({ resetPage: true });
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
  renderQuickAccess([]);
  renderIndicators([]);
  renderActiveContracts([]);
  renderUpcoming([]);
  renderCharts([]);
  renderTable([]);
  renderActiveFilterChips();
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
  elements.pageSize.addEventListener("change", () => {
    currentPage = 1;
    renderTable(filteredContracts);
  });

  elements.tableSort?.addEventListener("change", () => {
    const [key, direction] = elements.tableSort.value.split(":");
    sortState = { key, direction };
    currentPage = 1;
    renderTableHead();
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
    syncSortControl();
    renderTableHead();
    renderTable(filteredContracts);
  });

  elements.table.addEventListener("click", (event) => {
    const row = event.target.closest("[data-contract-id]");
    if (row) {
      openContractDetail(row.dataset.contractId, row);
    }
  });

  elements.table.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    const row = event.target.closest("[data-contract-id]");
    if (row) {
      event.preventDefault();
      openContractDetail(row.dataset.contractId, row);
    }
  });

  if (elements.mobileCards) {
    elements.mobileCards.addEventListener("click", (event) => {
      const card = event.target.closest("[data-contract-id]");
      if (card) {
        openContractDetail(card.dataset.contractId, card);
      }
    });

    elements.mobileCards.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      const card = event.target.closest("[data-contract-id]");
      if (card) {
        event.preventDefault();
        openContractDetail(card.dataset.contractId, card);
      }
    });
  }

  if (elements.activeContractsList) {
    elements.activeContractsList.addEventListener("click", (event) => {
      const card = event.target.closest("[data-contract-id]");
      if (card) {
        openContractDetail(card.dataset.contractId, card);
      }
    });

    elements.activeContractsList.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      const card = event.target.closest("[data-contract-id]");
      if (card) {
        event.preventDefault();
        openContractDetail(card.dataset.contractId, card);
      }
    });
  }

  syncDashboardSectionToggles();
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const button = target?.closest("[data-toggle-section]");
    if (button) {
      toggleDashboardSection(button);
    }
  });

  bindFilterEvents();

  elements.closeDetail.addEventListener("click", closeContractDetail);
  elements.detailBackdrop.addEventListener("click", closeContractDetail);
  elements.detailDrawer.addEventListener("keydown", trapDetailFocus);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("filters-open")) {
      closeFilterPanel();
      return;
    }
    if (event.key === "Escape" && elements.detailDrawer.classList.contains("is-open")) {
      closeContractDetail();
    }
  });

  window.addEventListener("resize", () => {
    if (!isMobileFilterPanel()) {
      elements.filtersBackdrop.hidden = true;
      document.body.classList.remove("filters-open");
      elements.openFilters?.setAttribute("aria-expanded", "false");
    }
    syncFilterPanelVisibility();
  });

  document.querySelectorAll("[data-quick-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetKey = button.dataset.quickTarget;
      const target = getQuickTargetSection(targetKey);
      openCollapsibleInside(target);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function bindFilterEvents() {
  if (!elements.filterControls.length) {
    return;
  }

  elements.filterControls.forEach((control) => {
    control.addEventListener("change", () => {
      syncFilterStateFromControls();
      if (!isMobileFilterPanel()) {
        applyCurrentFilters({ resetPage: true });
      }
    });
  });

  if (elements.filterSearch) {
    elements.filterSearch.addEventListener("input", () => {
      syncFilterStateFromControls();
      window.clearTimeout(filterDebounceTimer);
      filterDebounceTimer = window.setTimeout(() => {
        applyCurrentFilters({ resetPage: true });
      }, 180);
    });

    elements.filterSearch.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        syncFilterStateFromControls();
        applyCurrentFilters({ resetPage: true });
      }
    });
  }

  elements.applyFilters?.addEventListener("click", () => {
    syncFilterStateFromControls();
    applyCurrentFilters({ resetPage: true });
    closeFilterPanel();
  });

  elements.applyFiltersDesktop?.addEventListener("click", () => {
    syncFilterStateFromControls();
    applyCurrentFilters({ resetPage: true });
  });

  elements.clearFilters?.addEventListener("click", () => {
    resetFilters();
    closeFilterPanel();
  });

  elements.activeFilters?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-clear-filter]");
    if (!button) {
      return;
    }
    clearSingleFilter(button.dataset.clearFilter);
  });

  elements.openFilters?.addEventListener("click", openFilterPanel);
  elements.closeFilters?.addEventListener("click", closeFilterPanel);
  elements.filtersBackdrop?.addEventListener("click", closeFilterPanel);
  syncFilterPanelVisibility();
}

function getQuickTargetSection(targetKey) {
  if (targetKey === "vencidos") {
    return document.querySelector("#vencidos");
  }
  if (targetKey === "tabela") {
    return document.querySelector("#tabela");
  }
  if (targetKey === "vencendo" || targetKey === "vigentes") {
    return document.querySelector("#vigentes");
  }
  return document.querySelector("#vigentes");
}

function openCollapsibleInside(section) {
  const button = section?.querySelector("[data-toggle-section]");
  if (button) {
    toggleDashboardSection(button, true);
  }
}

function toggleDashboardSection(button, forceOpen = false) {
  const content = document.getElementById(button.dataset.toggleSection);
  if (!content) {
    return;
  }

  const shouldHide = forceOpen ? false : !content.hidden;
  const isExpanded = !shouldHide;
  const label = button.dataset.toggleLabel || "seção";

  content.hidden = shouldHide;
  button.setAttribute("aria-expanded", String(isExpanded));
  button.textContent = isExpanded ? "Ocultar" : "Mostrar";
  button.setAttribute("aria-label", `${isExpanded ? "Ocultar" : "Mostrar"} ${label}`);
}

function syncDashboardSectionToggles() {
  elements.toggleButtons.forEach((button) => {
    const content = document.getElementById(button.dataset.toggleSection);
    if (!content) {
      return;
    }

    const isExpanded = !content.hidden;
    const label = button.dataset.toggleLabel || "seção";
    button.setAttribute("aria-expanded", String(isExpanded));
    button.textContent = isExpanded ? "Ocultar" : "Mostrar";
    button.setAttribute("aria-label", `${isExpanded ? "Ocultar" : "Mostrar"} ${label}`);
  });
}

function populateFilterOptions(items) {
  fillSelect(elements.filterStatusCalculado, ContractData.STATUS_LABELS, "Todos");
  fillSelect(elements.filterStatusOriginal, uniqueValues(items, "statusOriginal"), "Todos");
  fillSelect(elements.filterModalidade, uniqueValues(items, "modalidade"), "Todas");
  fillSelect(elements.filterCategoria, uniqueValues(items, "categoria"), "Todas");
  fillSelect(elements.filterEmpresa, uniqueValues(items, "empresa"), "Todas");
  fillSelect(elements.filterGestor, uniqueValues(items, "gestor"), "Todos");
  fillSelect(elements.filterFiscal, uniqueValues(items, "fiscal"), "Todos");
  syncControlsFromFilterState();
}

function fillSelect(select, values, placeholder) {
  if (!select) {
    return;
  }

  const currentValue = select.value;
  const options = [`<option value="">${escapeHtml(placeholder)}</option>`]
    .concat(values
      .filter(Boolean)
      .map((value) => `<option value="${escapeAttribute(value)}">${escapeHtml(value)}</option>`));

  select.innerHTML = options.join("");
  if ([...select.options].some((option) => option.value === currentValue)) {
    select.value = currentValue;
  }
}

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), "pt-BR", { numeric: true, sensitivity: "base" }));
}

function syncFilterStateFromControls() {
  elements.filterControls.forEach((control) => {
    const filterKey = control.dataset.filter;
    if (filterKey) {
      filterState[filterKey] = control.value;
    }
  });
}

function syncControlsFromFilterState() {
  elements.filterControls.forEach((control) => {
    const filterKey = control.dataset.filter;
    if (filterKey && Object.prototype.hasOwnProperty.call(filterState, filterKey)) {
      control.value = filterState[filterKey] ?? "";
    }
  });
}

function applyCurrentFilters(options = {}) {
  if (options.resetPage) {
    currentPage = 1;
  }

  const filteredItems = contracts.filter(matchesFilters);
  render(filteredItems);
}

function matchesFilters(item) {
  const normalizedSearch = ContractData.normalizeSearchText(filterState.search);

  if (normalizedSearch && !item._normalizado.busca.includes(normalizedSearch)) {
    return false;
  }

  if (!matchesNormalizedOption(item, "statusCalculado")) {
    return false;
  }

  if (!matchesNormalizedOption(item, "statusOriginal")) {
    return false;
  }

  if (!matchesNormalizedOption(item, "modalidade")) {
    return false;
  }

  if (!matchesNormalizedOption(item, "categoria")) {
    return false;
  }

  if (!matchesNormalizedOption(item, "empresa")) {
    return false;
  }

  if (!matchesNormalizedOption(item, "gestor")) {
    return false;
  }

  if (!matchesNormalizedOption(item, "fiscal")) {
    return false;
  }

  if (!matchesDueFilter(item)) {
    return false;
  }

  if (!matchesPendingFilter(item)) {
    return false;
  }

  return matchesValueFilter(item);
}

function matchesNormalizedOption(item, key) {
  const selected = filterState[key];
  if (!selected) {
    return true;
  }

  return item._normalizado[key] === ContractData.normalizeKey(selected);
}

function matchesDueFilter(item) {
  const filter = filterState.vencimento;
  const days = item.diasParaVencimento;

  if (!filter) {
    return true;
  }
  if (filter === "noDue") {
    return days === null;
  }
  if (days === null) {
    return false;
  }
  if (filter === "overdue") {
    return days < 0;
  }
  if (filter === "next7") {
    return days >= 0 && days <= 7;
  }
  if (filter === "next15") {
    return days >= 0 && days <= 15;
  }
  if (filter === "next30") {
    return days >= 0 && days <= 30;
  }
  if (filter === "next60") {
    return days >= 0 && days <= 60;
  }
  if (filter === "next90") {
    return days >= 0 && days <= 90;
  }
  if (filter === "above90") {
    return days > 90;
  }
  return true;
}

function matchesPendingFilter(item) {
  if (filterState.pendencias === "with") {
    return item.possuiPendencias;
  }
  if (filterState.pendencias === "complete") {
    return !item.possuiPendencias;
  }
  return true;
}

function matchesValueFilter(item) {
  const filter = filterState.valor;
  const hasValue = typeof item.valor === "number";

  if (!filter) {
    return true;
  }
  if (filter === "noValue") {
    return !hasValue;
  }
  if (!hasValue) {
    return false;
  }
  if (filter === "upTo10k") {
    return item.valor <= 10000;
  }
  if (filter === "10kTo100k") {
    return item.valor > 10000 && item.valor <= 100000;
  }
  if (filter === "100kTo1m") {
    return item.valor > 100000 && item.valor <= 1000000;
  }
  if (filter === "above1m") {
    return item.valor > 1000000;
  }
  return true;
}

function renderActiveFilterChips() {
  if (!elements.activeFilters) {
    return;
  }

  const chips = Object.entries(filterState)
    .filter(([key, value]) => isActiveFilter(key, value))
    .map(([key, value]) => renderFilterChip(key, value));

  const summary = `<span class="active-filter-chips__summary">${filteredContracts.length} ${filteredContracts.length === 1 ? "contrato encontrado" : "contratos encontrados"}</span>`;
  const empty = '<span class="active-filter-chips__empty">Nenhum filtro aplicado.</span>';

  elements.activeFilters.innerHTML = `${summary}${chips.length ? chips.join("") : empty}`;
}

function renderFilterChip(key, value) {
  const readableValue = key === "search" ? value : getFilterOptionLabel(key, value);
  return `
    <button class="filter-chip" type="button" data-clear-filter="${escapeAttribute(key)}" aria-label="Remover filtro ${escapeAttribute(FILTER_LABELS[key] || key)}">
      <span>${escapeHtml(FILTER_LABELS[key] || key)}: ${escapeHtml(readableValue)}</span>
      <strong aria-hidden="true">×</strong>
    </button>
  `;
}

function getFilterOptionLabel(key, value) {
  const control = document.querySelector(`[data-filter="${key}"]`);
  const selected = [...(control?.options || [])].find((option) => option.value === value);
  return selected?.textContent || value;
}

function isActiveFilter(key, value) {
  if (key === "pendencias") {
    return value && value !== "all";
  }
  return Boolean(value);
}

function resetFilters() {
  filterState = { ...DEFAULT_FILTERS };
  syncControlsFromFilterState();
  applyCurrentFilters({ resetPage: true });
}

function clearSingleFilter(key) {
  if (!Object.prototype.hasOwnProperty.call(filterState, key)) {
    return;
  }

  filterState[key] = DEFAULT_FILTERS[key];
  syncControlsFromFilterState();
  applyCurrentFilters({ resetPage: true });
}

function openFilterPanel() {
  document.body.classList.add("filters-open");
  elements.filtersBackdrop.hidden = false;
  elements.openFilters?.setAttribute("aria-expanded", "true");
  syncFilterPanelVisibility();
}

function closeFilterPanel() {
  document.body.classList.remove("filters-open");
  if (elements.filtersBackdrop) {
    elements.filtersBackdrop.hidden = true;
  }
  elements.openFilters?.setAttribute("aria-expanded", "false");
  syncFilterPanelVisibility();
}

function syncFilterPanelVisibility() {
  const shouldHidePanel = isMobileFilterPanel() && !document.body.classList.contains("filters-open");
  elements.filtersPanel?.setAttribute("aria-hidden", String(shouldHidePanel));
}

function isMobileFilterPanel() {
  return window.matchMedia("(max-width: 720px)").matches;
}

function render(items) {
  filteredContracts = items;
  renderLastUpdate();
  renderQuickAccess(items);
  renderIndicators(items);
  renderActiveContracts(items);
  renderUpcoming(items);
  renderCharts(items);
  renderTable(items);
  renderActiveFilterChips();
}

function renderLastUpdate() {
  const generatedAt = metadata.generatedAt ? new Date(metadata.generatedAt) : null;
  const hasValidDate = generatedAt && !Number.isNaN(generatedAt.getTime());
  const updateText = hasValidDate
    ? `Dados gerados em ${generatedAt.toLocaleString("pt-BR")}`
    : "Dados carregados";

  elements.lastUpdate.textContent = updateText;
  if (elements.heroLastUpdate) {
    elements.heroLastUpdate.textContent = hasValidDate
      ? `Atualização dos dados: ${generatedAt.toLocaleString("pt-BR")}`
      : "Atualização dos dados: não informada";
  }
  if (elements.footerUpdated) {
    elements.footerUpdated.textContent = hasValidDate
      ? `Última atualização dos dados: ${generatedAt.toLocaleString("pt-BR")}`
      : "Última atualização dos dados: não informada";
  }
}

function renderQuickAccess(items) {
  const summary = buildDashboardSummary(items);
  elements.quickActive.textContent = countCurrentContracts(items);
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
  elements.kpiActive.textContent = countCurrentContracts(items);
  elements.kpiNoDue.textContent = summary.statusCounts["Sem vencimento"] || 0;
  elements.kpiQuality.textContent = summary.withPendencias;
  elements.kpiNoManager.textContent = summary.noManager;
  elements.kpiNoFiscal.textContent = summary.noFiscal;
  renderPriorityAlerts(summary);
  renderBaseHealth(summary);
}

function renderPriorityAlerts(summary) {
  const alerts = [
    {
      label: "Vencidos",
      value: summary.statusCounts.Vencido || 0,
      detail: "Regularizar encerramento, renovação ou registro.",
      badge: "badge--danger",
      tone: "danger",
    },
    {
      label: "Vencem hoje",
      value: summary.statusCounts["Vence hoje"] || 0,
      detail: "Verificar providência imediata.",
      badge: "badge--danger",
      tone: "danger",
    },
    {
      label: "Até 30 dias",
      value: summary.statusCounts["Vence em até 30 dias"] || 0,
      detail: "Planejar renovação ou encerramento.",
      badge: "badge--warning",
      tone: "warning",
    },
    {
      label: "Sem fiscal",
      value: summary.noFiscal,
      detail: "Completar responsável pela fiscalização.",
      badge: "badge--warning",
      tone: "attention",
    },
    {
      label: "Sem gestor",
      value: summary.noManager,
      detail: "Completar responsável pela gestão.",
      badge: "badge--warning",
      tone: "attention",
    },
    {
      label: "Sem vencimento",
      value: summary.noDueDate,
      detail: "Informar prazo para acompanhamento.",
      badge: "badge--neutral",
      tone: "neutral",
    },
    {
      label: "Valores ausentes",
      value: summary.noValue,
      detail: "Revisar valor numérico do contrato.",
      badge: "badge--neutral",
      tone: "neutral",
    },
  ];

  const activeAlerts = alerts.filter((alert) => alert.value > 0);
  if (!activeAlerts.length) {
    elements.priorityAlerts.innerHTML = `
      <div class="alert-empty">
        <strong>Nenhum alerta prioritário para os filtros selecionados.</strong>
        <small>A base filtrada não possui vencimentos críticos ou campos prioritários ausentes.</small>
      </div>
    `;
    return;
  }

  elements.priorityAlerts.innerHTML = activeAlerts.map((alert) => `
    <div class="alert-item alert-item--${alert.tone}">
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
  const completeRecords = Math.max(total - summary.withPendencias, 0);
  const completePercent = percentOf(completeRecords, total);
  const metrics = [
    ["Fiscal preenchido", summary.withFiscal],
    ["Gestor preenchido", summary.withManager],
    ["Valor preenchido", summary.withValue],
    ["Vencimento preenchido", summary.withDueDate],
  ];
  const missingFields = [
    ["Sem vencimento", summary.noDueDate],
    ["Sem fiscal", summary.noFiscal],
    ["Sem gestor", summary.noManager],
    ["Sem valor", summary.noValue],
  ];

  const metricRows = metrics.map(([label, value]) => {
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

  const missingRows = missingFields.map(([label, value]) => `
    <div class="health-critical">
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
    </div>
  `).join("");

  elements.baseHealth.innerHTML = `
    <div class="health-overview">
      <div class="health-overview__meta">
        <span>Registros completos</span>
        <strong>${completePercent}%</strong>
        <small>${completeRecords} de ${total} registros sem pendências críticas</small>
      </div>
      <div class="bar-track bar-track--large" aria-hidden="true">
        <span class="bar-fill" style="width: ${completePercent}%; background: ${healthColor(completePercent)}"></span>
      </div>
    </div>
    <div class="health-critical-list" aria-label="Campos críticos ausentes">
      ${missingRows}
    </div>
    <div class="health-metrics">
      ${metricRows}
    </div>
  `;
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
    ? buildActiveContractsSummary(activeContracts, totalValue)
    : "Nenhum contrato vigente encontrado";

  if (elements.activeContractsSummary) {
    elements.activeContractsSummary.textContent = summary;
  }

  if (!activeContracts.length) {
    elements.activeContractsList.innerHTML = '<p class="empty-state">Nenhum contrato vigente encontrado.</p>';
    return;
  }

  elements.activeContractsList.innerHTML = `
    <div class="table-wrap active-contracts-table-wrap">
      <table class="active-contracts-table">
        <caption class="sr-only">Tabela de contratos vigentes municipais</caption>
        <thead>${renderStaticTableHead()}</thead>
        <tbody>
          ${activeContracts.map(renderActiveContractTableRow).join("")}
        </tbody>
      </table>
    </div>
    <div class="contracts-mobile-cards active-contracts-mobile-cards" aria-live="polite">
      ${activeContracts.map(renderActiveMobileContractCard).join("")}
    </div>
  `;
}

function renderStaticTableHead() {
  return `
    <tr>
      ${TABLE_COLUMNS.map((column) => `<th scope="col" class="static-table-heading">${escapeHtml(column.label)}</th>`).join("")}
    </tr>
  `;
}

function renderActiveContractTableRow(item) {
  return `
    <tr class="${tableRowClass(item)}" data-contract-id="${escapeAttribute(item.id)}" tabindex="0" aria-label="Abrir detalhes do contrato vigente ${escapeAttribute(item.contrato || item.id)}">
      ${TABLE_COLUMNS.map((column) => renderActiveContractTableCell(item, column)).join("")}
    </tr>
  `;
}

function renderActiveContractTableCell(item, column) {
  if (column.key !== "statusCalculado") {
    return renderTableCell(item, column);
  }

  const activeBadge = activeContractBadge(item);
  const statusNote = activeBadge.label !== item.statusCalculado
    ? `<small class="status-note">${escapeHtml(item.statusCalculado)}</small>`
    : "";
  return `
    <td data-label="${escapeAttribute(column.label)}" class="status-cell">
      <span class="badge ${activeBadge.badgeClass} active-due-alert">${escapeHtml(activeBadge.label)}</span>
      ${statusNote}
    </td>
  `;
}

function renderActiveMobileContractCard(item) {
  const responsibleRows = renderMobileResponsibleRows(item);
  const daysText = item.diasParaVencimento === null ? "Sem prazo informado" : formatDays(item.diasParaVencimento);
  const contractLabel = item.contrato || `Registro ${item.id}`;
  const activeBadge = activeContractBadge(item);

  return `
    <article class="contract-mobile-card ${tableRowClass(item)}" data-contract-id="${escapeAttribute(item.id)}" tabindex="0" aria-label="Abrir detalhes do contrato vigente ${escapeAttribute(contractLabel)}">
      <div class="contract-mobile-card__header">
        <div class="contract-mobile-card__identity">
          <span>Contrato</span>
          <strong>${escapeHtml(contractLabel)}</strong>
        </div>
        <span class="badge ${activeBadge.badgeClass} active-due-alert">${escapeHtml(activeBadge.label)}</span>
      </div>

      <div class="contract-mobile-card__body">
        <p class="contract-mobile-card__company">${escapeHtml(item.empresa || "Empresa não informada")}</p>
        <p class="contract-mobile-card__object">${escapeHtml(item.objeto || "Objeto não informado")}</p>
      </div>

      <dl class="contract-mobile-card__meta">
        <div>
          <dt>Vencimento</dt>
          <dd>${escapeHtml(formatDateISO(item.dataVencimento))}</dd>
        </div>
        <div>
          <dt>Dias</dt>
          <dd>${escapeHtml(daysText)}</dd>
        </div>
        <div>
          <dt>Valor</dt>
          <dd>${escapeHtml(formatValueText(item))}</dd>
        </div>
        ${responsibleRows}
      </dl>

      <div class="contract-mobile-card__footer">
        <span>${escapeHtml([item.modalidade, item.numeroModalidade].filter(Boolean).join(" · ") || "Modalidade não informada")}</span>
        <button class="button button--ghost button--compact" type="button" data-contract-id="${escapeAttribute(item.id)}" aria-label="Ver detalhes do contrato vigente ${escapeAttribute(contractLabel)}">Ver detalhes</button>
      </div>
    </article>
  `;
}

function renderUpcoming(items) {
  const overdue = items
    .filter((item) => item.diasParaVencimento !== null && item.diasParaVencimento < 0)
    .sort(sortPriorityDeadlines)
    .slice(0, 12);

  if (!overdue.length) {
    elements.upcomingList.innerHTML = '<p class="empty-state">Nenhum contrato vencido/concluído encontrado.</p>';
    return;
  }

  elements.upcomingList.innerHTML = overdue.map((item) => `
    <article class="deadline-item deadline-item--overdue">
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

function renderCharts(items) {
  renderStatusChart(items);
  renderValueByModalidadeChart(items);
  renderCountByModalidadeChart(items);
  renderValueByCategoriaChart(items);
  renderDueMonthChart(items);
  renderTopEmpresasChart(items);
  renderTopGestoresChart(items);
  renderPendenciasChart(items);
}

function renderStatusChart(items) {
  if (!elements.chartStatus) {
    return;
  }

  const statusValues = aggregateBy(items, "statusCalculado");
  const rows = ContractData.STATUS_LABELS.map((status) => {
    const aggregate = statusValues.find((row) => row.label === status) || { count: 0, value: 0 };
    return {
      label: status,
      value: aggregate.count,
      valueText: formatChartCount(aggregate.count),
      detailText: `${formatCurrency.format(aggregate.value)} em valores numéricos`,
      color: STATUS_CHART_COLORS[status] || "var(--color-slate-500)",
    };
  }).filter((row) => row.value > 0);

  renderHorizontalBars(elements.chartStatus, rows, {
    emptyMessage: "Nenhum contrato encontrado para os filtros selecionados.",
  });
}

function renderValueByModalidadeChart(items) {
  renderValueChart(elements.chartValueModalidade, aggregateBy(items, "modalidade")
    .filter((row) => row.value > 0)
    .sort(sortByValueDesc), {
    emptyMessage: "Sem valores numéricos suficientes por modalidade.",
    maxRows: 10,
  });
}

function renderCountByModalidadeChart(items) {
  renderCountChart(elements.chartCountModalidade, aggregateBy(items, "modalidade")
    .filter((row) => row.count > 0)
    .sort(sortByCountDesc), {
    emptyMessage: "Sem contratos suficientes para agrupar por modalidade.",
  });
}

function renderValueByCategoriaChart(items) {
  renderValueChart(elements.chartValueCategoria, aggregateBy(items, "categoria")
    .filter((row) => row.value > 0)
    .sort(sortByValueDesc), {
    emptyMessage: "Sem valores numéricos suficientes por categoria.",
    maxRows: 12,
  });
}

function renderDueMonthChart(items) {
  if (!elements.chartDueMonth) {
    return;
  }

  const rows = aggregateDueMonths(items)
    .sort((a, b) => a.sortValue - b.sortValue)
    .map((row) => ({
      label: row.label,
      value: row.count,
      valueText: formatChartCount(row.count),
      detailText: formatCurrency.format(row.value),
      color: "var(--color-blue-700)",
    }));

  renderHorizontalBars(elements.chartDueMonth, rows, {
    emptyMessage: "Sem datas de vencimento para os filtros selecionados.",
  });
}

function renderTopEmpresasChart(items) {
  renderValueChart(elements.chartTopEmpresas, aggregateBy(items, "empresa", { excludeBlank: true })
    .filter((row) => row.value > 0)
    .sort(sortByValueDesc)
    .slice(0, 10), {
    emptyMessage: "Sem valores numéricos suficientes para ranking de empresas.",
    ranked: true,
  });
}

function renderTopGestoresChart(items) {
  renderValueChart(elements.chartTopGestores, aggregateBy(items, "gestor", { excludeBlank: true })
    .filter((row) => row.value > 0)
    .sort(sortByValueDesc)
    .slice(0, 10), {
    emptyMessage: "Sem valores numéricos suficientes para ranking de gestores.",
    ranked: true,
  });
}

function renderPendenciasChart(items) {
  const rows = [
    ["Sem fiscal", (item) => !item.fiscal, "var(--color-orange-700)"],
    ["Sem gestor", (item) => !item.gestor, "var(--color-orange-700)"],
    ["Sem valor", (item) => typeof item.valor !== "number", "var(--color-slate-500)"],
    ["Sem vencimento", (item) => !item.dataVencimento, "var(--color-slate-500)"],
    ["Sem contrato", (item) => !item.contrato, "var(--color-red-700)"],
    ["Sem empresa", (item) => !item.empresa, "var(--color-red-700)"],
  ].map(([label, predicate, color]) => {
    const count = items.filter(predicate).length;
    return {
      label,
      value: count,
      valueText: formatChartCount(count),
      detailText: "campo crítico ausente",
      color,
    };
  }).filter((row) => row.value > 0);

  renderHorizontalBars(elements.chartPendencias, rows, {
    emptyMessage: items.length
      ? "Nenhuma pendência cadastral crítica para os filtros selecionados."
      : "Nenhum contrato encontrado para os filtros selecionados.",
  });
}

function renderValueChart(target, rows, options = {}) {
  renderHorizontalBars(target, rows.map((row, index) => ({
    label: row.label,
    value: row.value,
    valueText: formatCurrency.format(row.value),
    detailText: `${formatChartCount(row.count)} com valor numérico`,
    color: chartPaletteColor(index),
  })), options);
}

function renderCountChart(target, rows, options = {}) {
  renderHorizontalBars(target, rows.map((row, index) => ({
    label: row.label,
    value: row.count,
    valueText: formatChartCount(row.count),
    detailText: row.value > 0 ? formatCurrency.format(row.value) : "sem valor numérico",
    color: chartPaletteColor(index),
  })), options);
}

function renderHorizontalBars(target, rows, options = {}) {
  if (!target) {
    return;
  }

  const visibleRows = rows
    .filter((row) => Number(row.value) > 0)
    .slice(0, options.maxRows || rows.length);

  if (!visibleRows.length) {
    target.innerHTML = `<p class="chart-empty">${escapeHtml(options.emptyMessage || "Sem dados suficientes para este gráfico.")}</p>`;
    return;
  }

  const maxValue = Math.max(...visibleRows.map((row) => Number(row.value) || 0), 1);
  target.innerHTML = `
    <div class="chart-bars">
      ${visibleRows.map((row, index) => {
        const percent = Math.max(3, Math.round((Number(row.value) / maxValue) * 100));
        const rank = options.ranked ? `<span class="chart-rank">${index + 1}</span>` : "";
        return `
          <div class="chart-bar" style="--bar-size: ${percent}%; --bar-color: ${row.color || chartPaletteColor(index)};">
            <div class="chart-bar__meta">
              <span>${rank}<strong>${escapeHtml(row.label)}</strong></span>
              <em>${escapeHtml(row.valueText)}</em>
            </div>
            <div class="chart-bar__track" aria-hidden="true">
              <span class="chart-bar__fill"></span>
            </div>
            ${row.detailText ? `<small>${escapeHtml(row.detailText)}</small>` : ""}
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function aggregateBy(items, key, options = {}) {
  const groups = new Map();

  items.forEach((item) => {
    const rawLabel = item[key];
    if (options.excludeBlank && !rawLabel) {
      return;
    }

    const label = rawLabel || "Não informado";
    const current = groups.get(label) || { label, count: 0, value: 0 };
    current.count += 1;
    if (typeof item.valor === "number") {
      current.value += item.valor;
    }
    groups.set(label, current);
  });

  return [...groups.values()];
}

function aggregateDueMonths(items) {
  const groups = new Map();

  items.forEach((item) => {
    const date = ContractData.parseDateValue(item.dataVencimento);
    if (!date) {
      return;
    }

    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    const current = groups.get(key) || {
      label: formatMonthYear(date),
      count: 0,
      value: 0,
      sortValue: new Date(year, month, 1).getTime(),
    };
    current.count += 1;
    if (typeof item.valor === "number") {
      current.value += item.valor;
    }
    groups.set(key, current);
  });

  return [...groups.values()];
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

  elements.resultCount.textContent = `${total} ${total === 1 ? "contrato" : "contratos"}`;
  elements.pageStatus.textContent = `Página ${total ? currentPage : 0} de ${total ? totalPages : 0}`;
  elements.pageRange.textContent = total
    ? `${pageStart + 1}-${pageEnd} de ${total} contratos exibidos`
    : "0 contratos exibidos";
  elements.prevPage.disabled = !total || currentPage <= 1;
  elements.nextPage.disabled = !total || currentPage >= totalPages;

  if (!pageItems.length) {
    elements.table.innerHTML = `<tr class="table-empty-row"><td colspan="${TABLE_COLUMNS.length}" class="empty-state">Nenhum contrato encontrado.</td></tr>`;
    renderMobileCards(pageItems);
    return;
  }

  elements.table.innerHTML = pageItems.map((item) => `
    <tr class="${tableRowClass(item)}" data-contract-id="${escapeAttribute(item.id)}" tabindex="0" aria-label="Abrir detalhes do contrato ${escapeAttribute(item.contrato || item.id)}">
      ${TABLE_COLUMNS.map((column) => renderTableCell(item, column)).join("")}
    </tr>
  `).join("");
  renderMobileCards(pageItems);
}

function renderMobileCards(items) {
  if (!elements.mobileCards) {
    return;
  }

  if (!items.length) {
    elements.mobileCards.innerHTML = '<p class="empty-state">Nenhum contrato encontrado.</p>';
    return;
  }

  elements.mobileCards.innerHTML = items.map(renderMobileContractCard).join("");
}

function renderMobileContractCard(item) {
  const responsibleRows = renderMobileResponsibleRows(item);
  const daysText = item.diasParaVencimento === null ? "Sem prazo informado" : formatDays(item.diasParaVencimento);
  const contractLabel = item.contrato || `Registro ${item.id}`;
  return `
    <article class="contract-mobile-card ${tableRowClass(item)}" data-contract-id="${escapeAttribute(item.id)}" tabindex="0" aria-label="Abrir detalhes do contrato ${escapeAttribute(contractLabel)}">
      <div class="contract-mobile-card__header">
        <div class="contract-mobile-card__identity">
          <span>Contrato</span>
          <strong>${escapeHtml(contractLabel)}</strong>
        </div>
        <span class="badge ${statusBadgeClass(item.statusCalculado)}">${escapeHtml(item.statusCalculado)}</span>
      </div>

      <div class="contract-mobile-card__body">
        <p class="contract-mobile-card__company">${escapeHtml(item.empresa || "Empresa não informada")}</p>
        <p class="contract-mobile-card__object">${escapeHtml(item.objeto || "Objeto não informado")}</p>
      </div>

      <dl class="contract-mobile-card__meta">
        <div>
          <dt>Vencimento</dt>
          <dd>${escapeHtml(formatDateISO(item.dataVencimento))}</dd>
        </div>
        <div>
          <dt>Dias</dt>
          <dd>${escapeHtml(daysText)}</dd>
        </div>
        <div>
          <dt>Valor</dt>
          <dd>${escapeHtml(formatValueText(item))}</dd>
        </div>
        ${responsibleRows}
      </dl>

      <div class="contract-mobile-card__footer">
        <span>${escapeHtml([item.modalidade, item.numeroModalidade].filter(Boolean).join(" · ") || "Modalidade não informada")}</span>
        <button class="button button--ghost button--compact" type="button" data-contract-id="${escapeAttribute(item.id)}" aria-label="Ver detalhes do contrato ${escapeAttribute(contractLabel)}">Ver detalhes</button>
      </div>
    </article>
  `;
}

function renderMobileResponsibleRows(item) {
  const rows = [];
  if (item.gestor) {
    rows.push(["Gestor", item.gestor]);
  }
  if (item.fiscal) {
    rows.push(["Fiscal", item.fiscal]);
  }
  return rows.map(([label, value]) => `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>
  `).join("");
}

function renderTableCell(item, column) {
  const cellLabel = `data-label="${escapeAttribute(column.label)}"`;

  if (column.key === "statusCalculado") {
    const statusNote = item.statusOriginal && item.statusOriginal !== item.statusCalculado
      ? `<small class="status-note">Original: ${escapeHtml(item.statusOriginal)}</small>`
      : "";
    return `
      <td ${cellLabel} class="status-cell">
        <span class="badge ${statusBadgeClass(item.statusCalculado)}">${escapeHtml(item.statusCalculado)}</span>
        ${statusNote}
      </td>
    `;
  }

  if (column.key === "dataVencimento") {
    return `<td ${cellLabel}>${formatDateISO(item.dataVencimento)}</td>`;
  }

  if (column.key === "contrato") {
    return `<td ${cellLabel}><strong>${escapeHtml(item.contrato || "Não informado")}</strong></td>`;
  }

  if (column.key === "processo") {
    return `<td ${cellLabel}>${escapeHtml(item.processo || "Não informado")}</td>`;
  }

  if (column.key === "modalidade") {
    return `
      <td ${cellLabel}>
        ${escapeHtml(item.modalidade || "Não informado")}
        <small class="muted-cell">${escapeHtml(item.numeroModalidade || "")}</small>
      </td>
    `;
  }

  if (column.key === "objeto") {
    return `<td ${cellLabel} class="object-cell">${escapeHtml(item.objeto || "Objeto não informado")}</td>`;
  }

  if (column.key === "empresa") {
    return `<td ${cellLabel} class="wrap-cell">${escapeHtml(item.empresa || "Não informado")}</td>`;
  }

  if (column.key === "valor") {
    return `<td ${cellLabel} class="numeric-cell">${formatValue(item)}</td>`;
  }

  if (column.key === "pendencias") {
    return `<td ${cellLabel}>${formatPendencias(item)}</td>`;
  }

  return `<td ${cellLabel}>${escapeHtml(item[column.key] || "Não informado")}</td>`;
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

function syncSortControl() {
  if (!elements.tableSort) {
    return;
  }
  const value = `${sortState.key}:${sortState.direction}`;
  const option = [...elements.tableSort.options].find((item) => item.value === value);
  if (option) {
    elements.tableSort.value = value;
  }
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

function openContractDetail(contractId, trigger = document.activeElement) {
  const contract = contracts.find((item) => String(item.id) === String(contractId));
  if (!contract) {
    return;
  }

  lastDetailTrigger = trigger instanceof HTMLElement ? trigger : null;
  elements.detailTitle.textContent = contract.contrato || `Registro ${contract.id}`;
  elements.detailBody.innerHTML = renderContractDetail(contract);
  elements.detailBackdrop.hidden = false;
  elements.detailDrawer.hidden = false;
  elements.detailDrawer.setAttribute("aria-hidden", "false");
  elements.detailDrawer.classList.add("is-open");
  document.body.classList.add("detail-open");
  window.requestAnimationFrame(() => {
    elements.closeDetail.focus({ preventScroll: true });
  });
}

function closeContractDetail() {
  const trigger = lastDetailTrigger;
  elements.detailDrawer.classList.remove("is-open");
  elements.detailDrawer.setAttribute("aria-hidden", "true");
  elements.detailDrawer.hidden = true;
  elements.detailBackdrop.hidden = true;
  document.body.classList.remove("detail-open");
  lastDetailTrigger = null;

  if (trigger && trigger.isConnected) {
    trigger.focus({ preventScroll: true });
  }
}

function renderContractDetail(item) {
  const rawRows = Object.entries(item._raw || {})
    .filter(([key]) => !key.startsWith("_"))
    .map(([key, value]) => [key, escapeHtml(formatRawValue(value))]);
  const modality = [item.modalidade, item.numeroModalidade].filter(Boolean).join(" · ") || "Não informado";
  const daysLabel = item.diasParaVencimento === null ? "Sem prazo informado" : formatDays(item.diasParaVencimento);

  return `
    <section class="detail-overview ${tableRowClass(item)}" aria-label="Resumo do contrato">
      <div class="detail-overview__status">
        <span class="badge ${statusBadgeClass(item.statusCalculado)}">${escapeHtml(item.statusCalculado)}</span>
        <strong>${escapeHtml(daysLabel)}</strong>
        <small>Status original: ${escapeHtml(item.statusOriginal || "Não informado")}</small>
      </div>
      <div class="detail-overview__facts">
        <div>
          <span>Contrato</span>
          <strong>${escapeHtml(item.contrato || `Registro ${item.id}`)}</strong>
        </div>
        <div>
          <span>Vencimento</span>
          <strong>${escapeHtml(formatDateISO(item.dataVencimento))}</strong>
        </div>
      </div>
    </section>

    <section class="detail-section">
      <h3>Identificação</h3>
      ${renderDetailFields([
        { label: "Contrato", value: escapeHtml(item.contrato || "Não informado") },
        { label: "Processo", value: escapeHtml(item.processo || "Não informado") },
        { label: "Modalidade", value: escapeHtml(modality) },
        { label: "Categoria", value: escapeHtml(item.categoria || "Outros/Pendente") },
      ])}
    </section>

    <section class="detail-section">
      <h3>Empresa</h3>
      ${renderDetailFields([
        { label: "Empresa contratada", value: escapeHtml(item.empresa || "Não informado"), wide: true },
      ])}
    </section>

    <section class="detail-section detail-section--wide">
      <h3>Objeto</h3>
      <p class="detail-long-text">${escapeHtml(item.objeto || "Objeto não informado")}</p>
    </section>

    <section class="detail-section">
      <h3>Valor</h3>
      ${renderDetailFields([
        { label: "Valor contratado", value: escapeHtml(formatValueText(item)) },
        { label: "Valor numérico", value: typeof item.valor === "number" ? escapeHtml(formatCurrency.format(item.valor)) : "Não informado" },
        { label: "Descrição do valor", value: escapeHtml(item.valorDescricao || "Não informado"), wide: true },
      ])}
    </section>

    <section class="detail-section">
      <h3>Vigência</h3>
      ${renderDetailFields([
        { label: "Data de início", value: escapeHtml(formatDateISO(item.dataInicio)) },
        { label: "Data de vencimento", value: escapeHtml(formatDateISO(item.dataVencimento)) },
        { label: "Dias para vencimento", value: escapeHtml(daysLabel), highlight: item.statusCalculado !== "Vigente" },
      ])}
    </section>

    <section class="detail-section">
      <h3>Status</h3>
      ${renderDetailFields([
        { label: "Status calculado", value: `<span class="badge ${statusBadgeClass(item.statusCalculado)}">${escapeHtml(item.statusCalculado)}</span>`, highlight: true },
        { label: "Status original", value: escapeHtml(item.statusOriginal || "Não informado") },
        { label: "Referência", value: "O painel usa o status calculado como referência principal.", wide: true },
      ])}
    </section>

    <section class="detail-section">
      <h3>Gestor e fiscal</h3>
      ${renderDetailFields([
        { label: "Gestor", value: escapeHtml(item.gestor || "Não informado"), highlight: !item.gestor },
        { label: "Fiscal", value: escapeHtml(item.fiscal || "Não informado"), highlight: !item.fiscal },
      ])}
    </section>

    <section class="detail-section">
      <h3>Pendências</h3>
      ${renderPendenciasDetail(item)}
    </section>

    <section class="detail-section detail-section--wide">
      <h3>Observações</h3>
      <p class="detail-long-text">${escapeHtml(item.observacoes || "Sem observações")}</p>
    </section>

    <details class="detail-section detail-section--raw">
      <summary>Campos originais da planilha</summary>
      ${renderDefinitionList(rawRows)}
    </details>
  `;
}

function renderDetailFields(rows) {
  return `
    <dl class="detail-grid">
      ${rows.map((row) => `
        <div class="detail-field ${row.wide ? "detail-field--wide" : ""} ${row.highlight ? "detail-field--highlight" : ""}">
          <dt>${escapeHtml(row.label)}</dt>
          <dd>${row.value || "Não informado"}</dd>
        </div>
      `).join("")}
    </dl>
  `;
}

function renderPendenciasDetail(item) {
  if (!item.possuiPendencias) {
    return `
      <div class="detail-pendencies detail-pendencies--ok">
        <span class="badge badge--success">Sem pendências cadastrais</span>
        <p>Os campos críticos deste contrato estão preenchidos.</p>
      </div>
    `;
  }

  return `
    <div class="detail-pendencies">
      <span class="badge badge--warning">${item.pendencias.length} ${item.pendencias.length === 1 ? "pendência" : "pendências"}</span>
      <ul>
        ${item.pendencias.map((pendencia) => `<li>${escapeHtml(pendencia)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function trapDetailFocus(event) {
  if (event.key !== "Tab" || !elements.detailDrawer.classList.contains("is-open")) {
    return;
  }

  const focusable = [...elements.detailDrawer.querySelectorAll(
    'a[href], button:not([disabled]), details summary, input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter((item) => item.offsetParent !== null || item === elements.detailDrawer);

  if (!focusable.length) {
    event.preventDefault();
    elements.detailDrawer.focus({ preventScroll: true });
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus({ preventScroll: true });
    return;
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
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

function buildActiveContractsSummary(activeContracts, totalValue) {
  const today = activeContracts.filter((item) => item.diasParaVencimento === 0).length;
  const dueIn5Days = countActiveContractsByDays(activeContracts, 1, 5);
  const dueIn15Days = countActiveContractsByDays(activeContracts, 6, 15);

  return [
    `${formatContractCount(activeContracts.length)} vigentes`,
    formatCurrency.format(totalValue),
    formatDueCount(today, "hoje"),
    formatDueCount(dueIn5Days, "em até 5 dias"),
    formatDueCount(dueIn15Days, "entre 6 e 15 dias"),
    "ordenados por vencimento",
  ].join(" · ");
}

function countActiveContractsByDays(items, minDays, maxDays) {
  return items.filter((item) => item.diasParaVencimento >= minDays && item.diasParaVencimento <= maxDays).length;
}

function formatDueCount(value, rangeLabel) {
  const verb = value === 1 ? "vence" : "vencem";
  return `${value} ${verb} ${rangeLabel}`;
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

function activeDueNotice(item) {
  const days = item.diasParaVencimento;
  if (days >= 1 && days <= 5) {
    return {
      label: "Vence em até 5 dias",
      badgeClass: "badge--danger",
    };
  }
  if (days >= 6 && days <= 15) {
    return {
      label: "Vence em até 15 dias",
      badgeClass: "badge--warning",
    };
  }
  return null;
}

function activeContractBadge(item) {
  return activeDueNotice(item) || {
    label: item.statusCalculado,
    badgeClass: statusBadgeClass(item.statusCalculado),
  };
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

function countCurrentContracts(items) {
  return items.filter(isActiveContract).length;
}

function formatContractCount(value) {
  return value === 1 ? "1 contrato" : `${value} contratos`;
}

function formatChartCount(value) {
  return value === 1 ? "1 contrato" : `${value} contratos`;
}

function formatMonthYear(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
  }).format(date).replace(".", "");
}

function sortByValueDesc(a, b) {
  if (b.value !== a.value) {
    return b.value - a.value;
  }
  return String(a.label).localeCompare(String(b.label), "pt-BR", { sensitivity: "base" });
}

function sortByCountDesc(a, b) {
  if (b.count !== a.count) {
    return b.count - a.count;
  }
  return String(a.label).localeCompare(String(b.label), "pt-BR", { sensitivity: "base" });
}

function chartPaletteColor(index) {
  return CHART_PALETTE[index % CHART_PALETTE.length];
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
