(function initContractDataLayer(global) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);

  const STATUS_LABELS = [
    "Vencido",
    "Vence hoje",
    "Vence em até 30 dias",
    "Atenção 31 a 60 dias",
    "Monitorar 61 a 90 dias",
    "Vigente",
    "Sem vencimento",
  ];

  const CATEGORY_RULES = [
    {
      categoria: "Saúde",
      palavras: ["SAUDE", "UBS", "ESF", "CAPS", "MEDIC", "ULTRASON", "ODONTO", "HOSPITALAR", "AMBULANCIA", "ESPECIALIDADES MEDICAS"],
    },
    {
      categoria: "Educação",
      palavras: ["EDUCACAO", "ESCOLA", "CRECHE", "ALUNO", "TADASHI", "CASA DA CRIANCA", "MERENDA"],
    },
    {
      categoria: "Infraestrutura e Obras",
      palavras: ["OBRA", "REFORMA", "PAVIMENT", "DRENAGEM", "INTERTRAVAD", "ELETRICA", "ORLA", "ESTABILIZACAO", "CAMPO DE FUTEBOL"],
    },
    {
      categoria: "Eventos, Cultura, Turismo e Esporte",
      palavras: ["EVENTO", "CULTURA", "TURISMO", "ESPORTE", "FESTA", "OFICINEIROS", "SOM", "PROFISSIONAIS ESPORTIVOS"],
    },
    {
      categoria: "Locação/Imóveis",
      palavras: ["LOCACAO", "ALUGUEL", "IMOVEL", "PREDIO", "CEJUSC", "DEP. CULT", "DEPOSITO"],
    },
    {
      categoria: "Transporte e Veículos",
      palavras: ["TRANSPORTE", "VEICULO", "VAN", "COMBUSTIVEL", "RETROESCAVADEIRA", "PATRULHA MECANIZADA"],
    },
    {
      categoria: "Tecnologia/Sistemas",
      palavras: ["SISTEMA", "SOFTWARE", "INFORMATIZADO", "1DOC", "TONNER", "INFORMATICA"],
    },
    {
      categoria: "Limpeza/Serviços Urbanos",
      palavras: ["LIMPEZA", "ROÇADA", "ROCADA", "PODA", "LIXO", "RESIDUO", "COLETA", "SERVICOS URBANOS"],
    },
    {
      categoria: "Agricultura",
      palavras: ["AGRICULTURA", "AGRICOLA", "RURAL", "PATRULHA AGRICOLA"],
    },
    {
      categoria: "Assistência Social",
      palavras: ["ASSISTENCIA", "SMADS", "CREAS", "CRAS", "CASA DA JUVENTUDE", "DESENVOLVIMENTO SOCIAL"],
    },
    {
      categoria: "Aquisições e Materiais",
      palavras: ["AQUISICAO", "MOB.", "MOBILIARIO", "MATERIAL", "MATERIAIS", "EQUIPAMENTO", "EQUIPAMENTOS", "GELO"],
    },
    {
      categoria: "Administração/Convênios",
      palavras: ["CONVENIO", "BANCO", "INSTITUICAO FINANCEIRA", "ADMINISTRACAO", "ITESP", "CONTROLADOR DE ACESSO", "SERVICO FUNERARIO"],
    },
  ];

  const PERSON_ALIASES = {
    "CELIO PAULO": "CELIO PAULO",
    "CELIO PAULO DE L JUNIOR": "Célio Paulo de L. Junior",
    "CELIO PAULO DE L. JUNIOR": "Célio Paulo de L. Junior",
    "FERNANDO EIJI": "FERNANDO EIJI",
    "FERNANDO EIJI YNAGUIZAWA": "FERNANDO EIJI YANAGUIZAWA",
    "FERNANDO EIJI YANAGUIZAWA": "FERNANDO EIJI YANAGUIZAWA",
    "IBANES SOUZA VIEIRA": "ÍBANES SOUZA VIEIRA",
    "IBANES VIEIRA": "ÍBANES SOUZA VIEIRA",
    "RICARDO RAGNI": "RICARDO RAGNI",
    "TAYNA BRENA ALVES FAUSTO": "THAYNA BRENA ALVES FAUSTO",
    "THAYNA BRENA ALVES FAUSTO": "THAYNA BRENA ALVES FAUSTO",
    "HELDER ERISSO MORAES": "HELDER HERISSO MORAES",
    "HELDER HERISSO": "HELDER HERISSO MORAES",
    "HELDER HERISSO MORAES": "HELDER HERISSO MORAES",
    "ODA GOMES": "Odail Gomes",
    "ODAIL GOMES": "Odail Gomes",
    "ANISIA LOURENCO": "ANISIA LOURENÇO",
    "ANISIA LOURENCO MENDES": "ANISIA LOURENÇO MENDES",
    "VICTOR PEREIRA DE MATOS": "VICTOR PEREIRA DE MATOS",
  };

  const COMPANY_ALIASES = {
    "CONTEBOX": "CONTEBOX",
    "CONTEMBOX": "CONTEBOX",
    "IB FERREIRA INGRID": "IB FERREIRA INGRID",
    "IB FERREIRA (INGRID)": "IB FERREIRA INGRID",
    "BANCO BRADESCO": "BANCO BRADESCO",
    "BRADESCO": "BANCO BRADESCO",
    "SICREDI": "SICREDI",
  };

  function normalizeContracts(records, options = {}) {
    const referenceDate = startOfDay(options.referenceDate || new Date());
    return toArray(records).map((record, index) => normalizeContract(record, {
      index,
      referenceDate,
    }));
  }

  function normalizeContract(record, context = {}) {
    const raw = record || {};
    const referenceDate = startOfDay(context.referenceDate || new Date());

    const dataInicio = normalizeDateValue(read(raw, ["dataInicio", "Data Início", "Data Inicio", "inicio"]));
    const dataVencimento = normalizeDateValue(read(raw, ["dataVencimento", "Data Vencimento", "vencimento"]));
    const diasParaVencimento = dataVencimento
      ? calculateDaysToDueDate(dataVencimento, referenceDate)
      : null;

    const valor = normalizeMoney(read(raw, ["valor", "Valor (R$)", "valorNumerico"]));
    const valorDescricao = cleanText(read(raw, ["valorDescricao", "Valor (Descrição)", "Valor (Descricao)"]));

    const contrato = cleanText(read(raw, ["contrato", "Contrato"]));
    const empresa = normalizeCompany(read(raw, ["empresa", "empresaContratada", "Empresa Contratada"]));
    const gestor = normalizePersonName(read(raw, ["gestor", "Gestor"]));
    const fiscal = normalizePersonName(read(raw, ["fiscal", "Fiscal"]));
    const objeto = cleanText(read(raw, ["objeto", "Objeto"]));

    const normalized = {
      id: normalizeId(read(raw, ["id", "ID"]), context.index),
      modalidade: cleanText(read(raw, ["modalidade", "Modalidade"])),
      numeroModalidade: cleanText(read(raw, ["numeroModalidade", "Nº Modalidade", "No Modalidade", "Numero Modalidade"])),
      objeto,
      processo: cleanText(read(raw, ["processo", "Processo"])),
      contrato,
      empresa,
      valor,
      valorDescricao,
      dataInicio,
      dataVencimento,
      diasParaVencimento,
      statusOriginal: cleanText(read(raw, ["statusOriginal", "Status"])),
      statusCalculado: calculateStatus(diasParaVencimento),
      gestor,
      fiscal,
      observacoes: cleanText(read(raw, ["observacoes", "Observações", "Observacoes"])),
      categoria: categorizeContract(raw, objeto),
      possuiPendencias: false,
      pendencias: [],
    };

    normalized.pendencias = getPendencias(normalized);
    normalized.possuiPendencias = normalized.pendencias.length > 0;
    normalized._normalizado = buildInternalIndex(normalized);
    normalized._linhaOrigem = read(raw, ["linhaOrigem", "linha", "__rownum"]) || null;
    normalized._raw = raw;

    return normalized;
  }

  function normalizeDateValue(value) {
    const date = parseDateValue(value);
    return date ? toISODate(date) : null;
  }

  function parseDateValue(value) {
    if (isBlank(value)) {
      return null;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return startOfDay(value);
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return parseExcelSerialDate(value);
    }

    const raw = cleanText(value);
    if (!raw) {
      return null;
    }

    if (/^\d+(\.\d+)?$/.test(raw)) {
      return parseExcelSerialDate(Number(raw));
    }

    const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
    if (isoMatch) {
      return buildValidatedDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    }

    const brMatch = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
    if (brMatch) {
      const year = Number(brMatch[3].length === 2 ? `20${brMatch[3]}` : brMatch[3]);
      return buildValidatedDate(year, Number(brMatch[2]), Number(brMatch[1]));
    }

    return null;
  }

  function parseExcelSerialDate(serial) {
    if (!Number.isFinite(serial) || serial < 1 || serial > 100000) {
      return null;
    }

    const utcDate = new Date(EXCEL_EPOCH_UTC + Math.floor(serial) * MS_PER_DAY);
    return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
  }

  function calculateDaysToDueDate(dateValue, referenceDate = new Date()) {
    const dueDate = parseDateValue(dateValue);
    if (!dueDate) {
      return null;
    }
    return Math.round((startOfDay(dueDate).getTime() - startOfDay(referenceDate).getTime()) / MS_PER_DAY);
  }

  function calculateStatus(days) {
    if (days === null || days === undefined) {
      return "Sem vencimento";
    }
    if (days < 0) {
      return "Vencido";
    }
    if (days === 0) {
      return "Vence hoje";
    }
    if (days <= 30) {
      return "Vence em até 30 dias";
    }
    if (days <= 60) {
      return "Atenção 31 a 60 dias";
    }
    if (days <= 90) {
      return "Monitorar 61 a 90 dias";
    }
    return "Vigente";
  }

  function normalizeMoney(value) {
    if (isBlank(value)) {
      return null;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    let text = cleanText(value)
      .replace(/[^\d,.-]/g, "")
      .replace(/(?!^)-/g, "");

    if (!text || text === "-" || /-\s*.*-/.test(text)) {
      return null;
    }

    const hasComma = text.includes(",");
    const hasDot = text.includes(".");

    if (hasComma) {
      const lastComma = text.lastIndexOf(",");
      text = `${text.slice(0, lastComma).replace(/[.,]/g, "")}.${text.slice(lastComma + 1).replace(/[^\d]/g, "")}`;
    } else if (hasDot) {
      const parts = text.split(".");
      if (parts.length > 2) {
        const decimal = parts.pop();
        text = `${parts.join("")}.${decimal}`;
      }
    }

    const number = Number(text);
    return Number.isFinite(number) ? number : null;
  }

  function getPendencias(contract) {
    const pendencias = [];
    const requiredFields = [
      ["contrato", "Contrato não informado"],
      ["empresa", "Empresa contratada não informada"],
      ["valor", "Valor numérico não informado"],
      ["dataInicio", "Data de início não informada"],
      ["dataVencimento", "Data de vencimento não informada"],
      ["gestor", "Gestor não informado"],
      ["fiscal", "Fiscal não informado"],
    ];

    requiredFields.forEach(([field, label]) => {
      if (field === "valor" ? contract[field] === null : isBlank(contract[field])) {
        pendencias.push(label);
      }
    });

    const start = parseDateValue(contract.dataInicio);
    const due = parseDateValue(contract.dataVencimento);
    if (start && due && start > due) {
      pendencias.push("Data de início posterior à data de vencimento");
    }

    return pendencias;
  }

  function categorizeContract(raw, objeto) {
    const source = normalizeKey([
      objeto,
      read(raw, ["modalidade", "Modalidade"]),
      read(raw, ["observacoes", "Observações", "Observacoes"]),
    ].join(" "));

    const match = CATEGORY_RULES.find((rule) => rule.palavras.some((keyword) => source.includes(normalizeKey(keyword))));
    return match ? match.categoria : "Outros/Pendente";
  }

  function normalizePersonName(value) {
    const text = stripDepartmentPrefixes(cleanText(value));
    if (!text) {
      return "";
    }
    return PERSON_ALIASES[normalizeKey(text)] || text;
  }

  function normalizeCompany(value) {
    const text = stripDepartmentPrefixes(cleanText(value));
    if (!text) {
      return "";
    }
    return COMPANY_ALIASES[normalizeKey(text)] || text;
  }

  function stripDepartmentPrefixes(value) {
    return cleanText(value)
      .replace(/\b(SMADS|SA[ÚU]DE|EDUCA[CÇ][AÃ]O|ADMINISTRA[CÇ][AÃ]O|SMA|SEMAS|OBRAS|CULTURA|TURISMO)\s*:\s*/gi, "")
      .replace(/\s+\/\s+/g, " / ")
      .trim();
  }

  function buildInternalIndex(contract) {
    return {
      busca: normalizeSearchText([
        contract.id,
        contract.modalidade,
        contract.numeroModalidade,
        contract.objeto,
        contract.processo,
        contract.contrato,
        contract.empresa,
        contract.valorDescricao,
        contract.statusOriginal,
        contract.statusCalculado,
        contract.gestor,
        contract.fiscal,
        contract.observacoes,
        contract.categoria,
        contract.pendencias.join(" "),
      ].join(" ")),
      modalidade: normalizeKey(contract.modalidade),
      empresa: normalizeKey(contract.empresa),
      gestor: normalizeKey(contract.gestor),
      fiscal: normalizeKey(contract.fiscal),
      categoria: normalizeKey(contract.categoria),
      statusCalculado: normalizeKey(contract.statusCalculado),
      statusOriginal: normalizeKey(contract.statusOriginal),
    };
  }

  function buildSummary(contracts) {
    return contracts.reduce((summary, contract) => {
      summary.totalContratos += 1;
      if (contract.valor === null) {
        summary.totalSemValor += 1;
      } else {
        summary.totalComValor += 1;
      }
      if (!contract.dataVencimento) {
        summary.totalSemVencimento += 1;
      }
      if (contract.possuiPendencias) {
        summary.totalComPendencias += 1;
      }
      increment(summary.statusCalculados, contract.statusCalculado);
      increment(summary.categoriasEncontradas, contract.categoria);
      return summary;
    }, {
      totalContratos: 0,
      totalComValor: 0,
      totalSemValor: 0,
      totalSemVencimento: 0,
      totalComPendencias: 0,
      statusCalculados: {},
      categoriasEncontradas: {},
    });
  }

  function logNormalizationSummary(contracts) {
    const summary = buildSummary(contracts);
    console.groupCollapsed("Resumo da normalização dos contratos");
    console.log("Total de contratos:", summary.totalContratos);
    console.log("Total com valor:", summary.totalComValor);
    console.log("Total sem valor:", summary.totalSemValor);
    console.log("Total sem vencimento:", summary.totalSemVencimento);
    console.log("Total com pendências:", summary.totalComPendencias);
    console.table(toCountRows(summary.statusCalculados, "statusCalculado"));
    console.table(toCountRows(summary.categoriasEncontradas, "categoria"));
    console.groupEnd();
    return summary;
  }

  function read(object, keys) {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        return object[key];
      }
    }
    return null;
  }

  function cleanText(value) {
    if (isBlank(value)) {
      return "";
    }
    return String(value).replace(/\s+/g, " ").trim();
  }

  function normalizeSearchText(value) {
    return normalizeKey(value).toLowerCase();
  }

  function normalizeKey(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[ºª]/g, "")
      .replace(/[().,;:]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  function normalizeId(value, index) {
    const numeric = Number(value);
    if (Number.isInteger(numeric)) {
      return numeric;
    }
    return cleanText(value) || index + 1;
  }

  function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function buildValidatedDate(year, month, day) {
    if (!year || !month || !day) {
      return null;
    }
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }
    return startOfDay(date);
  }

  function startOfDay(value) {
    const date = value instanceof Date ? new Date(value) : new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function isBlank(value) {
    return value === null || value === undefined || String(value).trim() === "";
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function increment(counter, key) {
    const label = key || "Não informado";
    counter[label] = (counter[label] || 0) + 1;
  }

  function toCountRows(counter, labelName) {
    return Object.entries(counter)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
      .map(([label, total]) => ({ [labelName]: label, total }));
  }

  global.ContractData = {
    CATEGORY_RULES,
    STATUS_LABELS,
    buildSummary,
    calculateDaysToDueDate,
    calculateStatus,
    cleanText,
    logNormalizationSummary,
    normalizeContracts,
    normalizeDateValue,
    normalizeKey,
    normalizeMoney,
    normalizeSearchText,
    parseDateValue,
  };
})(globalThis);
