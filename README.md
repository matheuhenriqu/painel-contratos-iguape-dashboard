# Painel de Contratos - Prefeitura Municipal de Iguape/SP

Painel web estatico para consulta, analise e acompanhamento administrativo dos contratos municipais da Prefeitura Municipal de Iguape/SP.

O projeto foi preparado para GitHub Pages: nao exige build, banco de dados, servidor de aplicacao ou framework pesado. A base de contratos vem de uma camada derivada em `data/contratos.json` e `data/contratos.js`, preservando a planilha original fora do fluxo de exibicao.

## Resumo do Painel

O painel entrega uma experiencia institucional e responsiva para uso administrativo diario:

- cabecalho institucional com brasao, titulo, ultima atualizacao e atalhos;
- indicadores de contratos, valores, vigencia, vencidos e pendencias;
- alertas prioritarios e saude cadastral da base;
- contratos vigentes ordenados por vencimento;
- consulta avancada com busca, filtros combinaveis e chips ativos;
- graficos gerenciais leves em HTML/CSS/JS;
- tabela paginada e ordenavel no desktop;
- cards de contratos no iPhone e telas pequenas;
- ficha administrativa completa no detalhe do contrato;
- estados de carregamento, erro e vazio;
- CSS de impressao e compatibilidade com GitHub Pages.

## Como Rodar Localmente no macOS

Na pasta do projeto:

```bash
cd "/Users/matheuscosta/Documents/Painel Prefeitura"
python3 -m http.server 8000
```

Abra no navegador:

```text
http://localhost:8000/
```

Tambem e possivel abrir `index.html` diretamente, porque `data/contratos.js` fornece os dados em `window.CONTRATOS_DATA`. Para testar comportamento igual ao GitHub Pages, use o servidor local simples.

## Como Validar

Execute sempre antes de publicar:

```bash
node --check js/app.js
node --check js/data-normalizer.js
node scripts/validate-dashboard.mjs --reference-date=2026-05-01
```

Para validar usando a data atual da maquina:

```bash
node scripts/validate-dashboard.mjs
```

O validador cobre:

- carregamento da base derivada;
- recalculo dinamico de vencimentos;
- busca sem diferenciar acentos e caixa;
- filtros combinados;
- totais, status calculados e valor total;
- rankings de empresas e gestores;
- agrupamentos por modalidade, categoria e mes;
- contratos sem valor, sem vencimento e com pendencias;
- robustez com campo vazio, valor invalido, data invalida, coluna extra e coluna faltando;
- performance local da normalizacao.

## Checklist de Responsividade

Antes de publicar, conferir visualmente:

- `1440px`: layout largo, hero compacto, graficos em grid e tabela legivel.
- `1366px`: notebook comum sem cortes laterais.
- `1024px`: tablet horizontal/notebook pequeno com grids ajustados.
- `768px`: tablet vertical com tabela ainda legivel.
- `430px`: iPhone grande com cards, filtros em painel e sem overflow horizontal.
- `390px`: iPhone comum com header compacto e cards confortaveis.
- `375px`: iPhone SE/mini com botoes tocaveis e labels legiveis.
- `360px`: limite estreito sem texto importante cortado.

Itens obrigatorios na revisao manual:

- nenhum overflow horizontal no `body`;
- cards sem corte;
- botoes com area minima confortavel;
- filtros abrindo e fechando no iPhone;
- busca funcionando;
- tabela no desktop e cards no mobile;
- modal/drawer de detalhe com rolagem interna e safe area;
- graficos sem labels cortados;
- estados vazio, carregamento e erro visualmente consistentes;
- rodape limpo e institucional.

## Principais Melhorias Visuais

- Design system com tokens de cores, bordas, raios, sombras, espacamentos e altura minima de controles.
- Paleta institucional com azul escuro, azul medio, teal, dourado pontual, verde de sucesso, laranja/amarelo de atencao e vermelho apenas para criticidade.
- Header mais compacto, com brasao e hierarquia clara entre Prefeitura, transparencia e painel.
- KPIs agrupados por visao geral, risco de vencimento e qualidade cadastral.
- Consulta avancada reorganizada, com filtros por grupos e bottom sheet no iPhone.
- Tabela responsiva: tabela no desktop e cards administrativos no celular.
- Drawer de detalhe redesenhado como ficha administrativa, com blocos de identificacao, empresa, objeto, valor, vigencia, status, responsaveis, pendencias e observacoes.
- Sombras suavizadas e bordas mais uniformes para reduzir aparencia de prototipo.
- Regra global de `[hidden]` para evitar componentes ocultos participando visualmente do layout.
- Refinamento global de cores e responsividade em 02/05/2026, com topo mais institucional, fundos alternados suaves, cards mais limpos, controles mais consistentes e ajustes adicionais para iPhone 430px, 390px, 375px e 360px.

## Como Atualizar a Planilha

1. Atualize a planilha administrativa de origem.
2. Gere novamente a camada derivada:

```bash
python3 scripts/convert-contratos.py --source /caminho/para/contratos.xlsx
```

O conversor atualiza:

- `data/contratos.json`
- `data/contratos.js`

Se faltar `openpyxl`:

```bash
python3 -m pip install openpyxl
```

## Campos Esperados da Planilha

A planilha deve conter, preferencialmente:

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

Colunas extras nao quebram o painel. Colunas ausentes geram valores vazios e, quando forem campos criticos, entram como pendencias cadastrais.

## Regra Importante Sobre Vencimentos

A coluna `Dias p/ Vencimento` da planilha nao deve ser usada como verdade absoluta.

O painel recalcula `diasParaVencimento` no navegador, com base na data atual de quem acessa. Isso evita que o painel fique desatualizado quando a planilha foi calculada em data anterior.

## Status Calculado

O painel preserva o `Status` original da planilha, mas usa o status calculado como referencia principal:

- `Sem vencimento`: sem `Data Vencimento`
- `Vencido`: menos de 0 dias
- `Vence hoje`: 0 dias
- `Vence em até 30 dias`: 1 a 30 dias
- `Atenção 31 a 60 dias`: 31 a 60 dias
- `Monitorar 61 a 90 dias`: 61 a 90 dias
- `Vigente`: acima de 90 dias

## Categorias Calculadas

A categoria e inferida por palavras-chave no objeto, modalidade e observacoes. As regras ficam em `js/data-normalizer.js`, no bloco `CATEGORY_RULES`.

Categorias usadas:

- Saude
- Educacao
- Infraestrutura e Obras
- Eventos, Cultura, Turismo e Esporte
- Locacao/Imoveis
- Transporte e Veiculos
- Tecnologia/Sistemas
- Limpeza/Servicos Urbanos
- Agricultura
- Assistencia Social
- Aquisicoes e Materiais
- Administracao/Convenios
- Outros/Pendente

## Estrutura dos Arquivos

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
│   ├── brasao-iguape.png
│   ├── favicon-iguape.png
│   ├── apple-touch-icon.png
│   └── logo-iguape-og.png
├── docs/
│   ├── auditoria-visual-responsiva.md
│   └── changelog-visual.md
├── scripts/
│   ├── convert-contratos.py
│   └── validate-dashboard.mjs
├── .nojekyll
└── README.md
```

## Como Publicar no GitHub Pages

1. Confirme que `index.html` esta na raiz do repositorio.
2. Confirme que os caminhos sao relativos, como `css/styles.css`, `js/app.js` e `data/contratos.js`.
3. Rode as validacoes.
4. Commit e push na branch publicada, atualmente `main`.
5. No GitHub, acesse `Settings > Pages`.
6. Em `Build and deployment`, use `Deploy from a branch`.
7. Selecione `main` e pasta `/ (root)`.
8. Aguarde a publicacao e acesse:

```text
https://matheuhenriqu.github.io/painel-contratos-iguape-dashboard/
```

Para forcar atualizacao de cache depois de publicar, use um parametro com o hash do commit:

```text
https://matheuhenriqu.github.io/painel-contratos-iguape-dashboard/?v=<hash-do-commit>
```

## Limitacoes Conhecidas

- O painel depende da atualizacao da planilha de origem e da regeneracao dos arquivos em `data/`.
- A categorizacao por palavras-chave e aproximada e pode precisar de ajustes administrativos.
- O painel nao grava alteracoes e nao substitui um sistema oficial de gestao contratual.
- O calculo de vencimento usa a data local do navegador; computadores com data incorreta podem exibir prazos incorretos.
- Valores textuais sem numero em `Valor (R$)` sao preservados em `Valor (Descrição)`, mas nao entram no total monetario.
