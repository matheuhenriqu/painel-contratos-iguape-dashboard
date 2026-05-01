# Painel de Contratos - Prefeitura Municipal de Iguape/SP

Dashboard web estático para consulta, análise e acompanhamento administrativo dos contratos municipais da Prefeitura Municipal de Iguape/SP.

O painel foi pensado para publicação simples no GitHub Pages, sem etapa de build, sem banco de dados e sem dependências JavaScript externas. Os dados exibidos são derivados da planilha de origem e tratados no navegador.

## Como rodar localmente no macOS

Opção recomendada:

```bash
cd "Painel Prefeitura"
python3 -m http.server 8000
```

Depois abra:

```text
http://localhost:8000/
```

Também é possível abrir o `index.html` diretamente no navegador, porque o projeto inclui `data/contratos.js` como camada compatível com arquivo local. Para testes mais fiéis ao GitHub Pages, prefira o servidor local simples.

## Como validar

Execute:

```bash
node scripts/validate-dashboard.mjs --reference-date=2026-05-01
```

O script valida carregamento dos dados, normalização, status calculado, busca sem acento, filtros, combinações de filtros, ordenação, totais, rankings, estados vazios, dados sem valor, dados sem vencimento, pendências e cenários de robustez com campos inválidos ou ausentes.

Para testar com a data atual da máquina:

```bash
node scripts/validate-dashboard.mjs
```

## Como atualizar a planilha

1. Não altere os arquivos originais dentro do painel manualmente.
2. Atualize a planilha `contratos.xlsx` na origem administrativa.
3. Gere novamente a camada derivada:

```bash
python3 scripts/convert-contratos.py --source /caminho/para/contratos.xlsx
```

O conversor atualiza:

- `data/contratos.json`
- `data/contratos.js`

Se o Python informar ausência de `openpyxl`, instale com:

```bash
python3 -m pip install openpyxl
```

## Como publicar no GitHub Pages

1. Envie estes arquivos para um repositório GitHub.
2. Mantenha o `index.html` na raiz do repositório.
3. No GitHub, abra `Settings > Pages`.
4. Em `Build and deployment`, escolha publicação a partir de branch.
5. Selecione a branch principal, geralmente `main`, e a pasta `/ (root)`.
6. Salve e aguarde a publicação.

O projeto já usa caminhos relativos e inclui `.nojekyll` para publicação direta como HTML/CSS/JS estático. A documentação oficial do GitHub Pages explica a configuração da fonte de publicação em: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Estrutura dos arquivos

```text
.
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   └── data-normalizer.js
├── data/
│   ├── contratos.json
│   └── contratos.js
├── assets/
│   └── favicon.svg
├── scripts/
│   ├── convert-contratos.py
│   └── validate-dashboard.mjs
├── .nojekyll
├── .gitignore
└── README.md
```

## Campos esperados da planilha

A aba principal deve conter, preferencialmente, estas colunas:

- `ID`
- `Modalidade`
- `Nº Modalidade`
- `Objeto`
- `Processo`
- `Contrato`
- `Empresa Contratada`
- `Valor (R$)`
- `Valor (Descrição)`
- `Data Início`
- `Data Vencimento`
- `Dias p/ Vencimento`
- `Status`
- `Gestor`
- `Fiscal`
- `Observações`

Colunas extras são preservadas apenas no registro bruto de origem e não quebram o painel. Colunas faltando geram valores vazios e pendências quando forem campos críticos.

## Regra importante sobre vencimentos

A coluna `Dias p/ Vencimento` da planilha não deve ser usada como verdade absoluta.

O painel recalcula `diasParaVencimento` automaticamente no navegador, sempre com base na data atual de quem está acessando. Isso evita que o painel fique desatualizado quando a planilha foi calculada em uma data anterior.

## Status calculado

O painel mantém o `Status` original da planilha, mas usa o status calculado como referência principal:

- `Sem vencimento`: sem `Data Vencimento`
- `Vencido`: menos de 0 dias
- `Vence hoje`: 0 dias
- `Vence em até 30 dias`: 1 a 30 dias
- `Atenção 31 a 60 dias`: 31 a 60 dias
- `Monitorar 61 a 90 dias`: 61 a 90 dias
- `Vigente`: acima de 90 dias

## Categorias calculadas

A categoria é inferida por palavras-chave no objeto, modalidade e observações. As regras ficam em `js/data-normalizer.js`, no bloco `CATEGORY_RULES`, para facilitar manutenção.

Categorias usadas:

- Saúde
- Educação
- Infraestrutura e Obras
- Eventos, Cultura, Turismo e Esporte
- Locação/Imóveis
- Transporte e Veículos
- Tecnologia/Sistemas
- Limpeza/Serviços Urbanos
- Agricultura
- Assistência Social
- Aquisições e Materiais
- Administração/Convênios
- Outros/Pendente

## Funcionalidades principais

- Busca geral sem diferenciar acentos ou maiúsculas/minúsculas.
- Filtros combináveis por status, modalidade, categoria, empresa, gestor, fiscal, vencimento, pendências e valor.
- Indicadores recalculados conforme filtros.
- Gráficos recalculados conforme filtros.
- Tabela ordenável e paginada.
- Detalhe completo do contrato ao clicar em uma linha.
- Estados de carregamento, erro e vazio.
- CSS responsivo para desktop, notebook, tablet e celular.
- CSS básico de impressão.

## Limitações conhecidas

- O painel depende da atualização da planilha de origem e da regeneração dos arquivos em `data/`.
- A categorização por palavra-chave é uma regra administrativa aproximada e pode precisar de ajustes conforme a Prefeitura padronizar novos objetos.
- O dashboard não grava alterações e não substitui sistema oficial de gestão contratual.
- O cálculo usa a data local do navegador; computadores com data do sistema incorreta podem exibir vencimentos incorretos.
- Valores textuais sem número em `Valor (R$)` são preservados em `Valor (Descrição)`, mas não entram no total monetário.

## Checklist antes de publicar

```bash
node --check js/app.js
node --check js/data-normalizer.js
node scripts/validate-dashboard.mjs --reference-date=2026-05-01
python3 -m http.server 8000
```

Com o servidor ativo, abra `http://localhost:8000/` e confira:

- indicadores no topo;
- filtros e busca;
- gráficos;
- tabela;
- modal lateral de detalhes;
- layout em tela grande e celular;
- rodapé com última atualização dos dados.
