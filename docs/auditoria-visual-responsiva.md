# Auditoria visual e responsiva

Projeto auditado: `painel-contratos-iguape-dashboard`

Data da auditoria: 01/05/2026

Página publicada: https://matheuhenriqu.github.io/painel-contratos-iguape-dashboard/

## Resumo executivo

O painel atual está em uma base técnica saudável para GitHub Pages: usa HTML, CSS e JavaScript puros, tem dados derivados em `data/contratos.json` e `data/contratos.js`, não depende de build, preserva a planilha original e recalcula vencimentos no navegador. A camada de normalização está bem separada da renderização, e o script de validação cobre cálculos, status, ordenação, robustez de campos e performance.

O principal problema agora é de experiência visual e responsiva. A página funciona, mas ainda parece uma sequência de blocos administrativos com muita informação antes da tabela. Em iPhone, o usuário recebe cabeçalho, atalhos, 10 indicadores, alertas, saúde da base e uma lista grande de contratos vigentes antes de chegar ao miolo operacional. A estrutura é correta, mas precisa de uma hierarquia mais clara, espaçamento mais econômico, cartões mais consistentes e uma identidade institucional mais refinada.

A próxima etapa deve redesenhar a camada visual sem mexer nas regras de negócio. O foco deve ser melhorar leitura, alinhamento, ritmo vertical, cores, cabeçalho, cards, tabela em formato mobile, detalhes do contrato e comportamento em telas entre 390px e 430px.

## Escopo analisado

- `index.html`: template estático, estrutura das seções, SVG sprite, cabeçalho, indicadores, contratos vigentes, tabela, vencidos, rodapé e drawer de detalhe.
- `css/styles.css`: design tokens, grid, cards, responsividade, tabela, badges, drawer, rodapé e impressão.
- `js/app.js`: carregamento de dados, renderização de indicadores, contratos vigentes, vencidos, tabela, paginação, ordenação, modal lateral e botões de ocultar/mostrar.
- `js/data-normalizer.js`: normalização de datas, valores, status calculado, pendências, nomes, empresas, busca interna e categorias.
- `data/contratos.json`: base derivada em JSON com 158 registros e metadados da planilha.
- `data/contratos.js`: fallback local que injeta `window.CONTRATOS_DATA` para abrir o painel sem servidor.
- `scripts/validate-dashboard.mjs`: testes de dados, filtros lógicos, status, totais, rankings, robustez e performance.

## Estrutura atual

O projeto está organizado como painel estático:

```text
.
├── index.html
├── css/styles.css
├── js/app.js
├── js/data-normalizer.js
├── data/contratos.json
├── data/contratos.js
├── assets/
├── scripts/convert-contratos.py
└── scripts/validate-dashboard.mjs
```

Arquivos de dados:

- `data/contratos.json`: 158 contratos.
- `data/contratos.js`: mesma base, exposta como `window.CONTRATOS_DATA`.
- Metadados indicam origem `contratos.xlsx`, aba `CONTRATOS`, geração em `2026-05-01T18:20:22.175887+00:00`.
- Colunas esperadas presentes: `ID`, `Modalidade`, `Nº Modalidade`, `Objeto`, `Processo`, `Contrato`, `Empresa Contratada`, `Valor (R$)`, `Valor (Descrição)`, `Data Início`, `Data Vencimento`, `Dias p/ Vencimento`, `Status`, `Gestor`, `Fiscal`, `Observações`.

Preenchimento observado na base derivada:

- 158 registros totais.
- 147 com contrato preenchido.
- 151 com empresa preenchida.
- 139 com valor numérico.
- 136 com data de início.
- 143 com data de vencimento.
- 137 com gestor.
- 127 com fiscal.
- 76 com observações.

## Pontos fortes atuais

- Arquitetura simples e compatível com GitHub Pages.
- Sem dependências externas obrigatórias e sem etapa de build.
- Regras de negócio separadas em `js/data-normalizer.js`.
- Dados originais preservados em `_raw` para o modal de detalhe.
- Status calculado é recalculado pela data atual do navegador.
- `data/contratos.js` permite abrir via arquivo local, enquanto `data/contratos.json` funciona bem em servidor e GitHub Pages.
- Tabela já possui ordenação, paginação e abertura de detalhe.
- Drawer de detalhe mostra campos principais, calculados e originais.
- Existem estados de carregamento, erro e vazio.
- Há preocupação real com acessibilidade: `aria-label`, `aria-live`, foco visível, skip link, botões de ocultar e labels.
- CSS já tem tokens de cor, espaçamento, sombras e media queries.
- Responsividade da tabela muda para cards abaixo de `1180px`, reduzindo dependência de rolagem lateral.
- Script de validação cobre os principais cálculos e cenários de dados problemáticos.

## Problemas identificados

### 1. Hierarquia visual

- O topo concentra muitas camadas antes do conteúdo operacional: cabeçalho, atalhos, indicadores, alertas, saúde da base e contratos vigentes.
- Os indicadores competem entre si, porque 10 cards aparecem com peso visual semelhante.
- Alertas prioritários e saúde da base têm utilidade, mas entram logo após os KPIs e aumentam muito a altura inicial da página.
- A tabela, que é a área de consulta diária, fica distante no fluxo, especialmente no celular.
- A seção de contratos vigentes renderiza 113 cards, o que cria muita rolagem antes da tabela quando a seção está aberta.

### 2. Cabeçalho e topo

- O cabeçalho está funcional, mas ainda pode ficar mais institucional e menos pesado.
- A logo/brasão aparece, mas a identidade da Prefeitura pode ser reforçada com uma barra superior mais limpa e menos dependente de gradiente.
- Os atalhos do topo repetem números já presentes nos indicadores e podem virar chips ou resumo compacto.
- Em celular, os três botões do topo ocupam bastante espaço vertical.

### 3. Responsividade e experiência no iPhone

- A largura de container em `390px` e `430px` é controlada, mas a página fica muito longa e densa.
- Cards de contrato vigentes com objeto, metadados e badges tendem a criar blocos altos.
- A tabela vira cards abaixo de `1180px`, o que é bom para evitar rolagem horizontal, mas faz tablets e notebooks pequenos perderem a leitura tabular cedo demais.
- `overflow-x: hidden` no `body` evita barra lateral, mas também pode esconder sintomas de elementos que extrapolam.
- A regra global `overflow-wrap: break-word` protege contra estouro, mas pode cortar palavras longas. Como o usuário pediu para não cortar palavras, é melhor resolver com largura, hierarquia e labels mais curtos, usando quebra controlada apenas para identificadores muito longos.
- Botões "Ocultar/Mostrar" aparecem em várias seções e precisam de alinhamento e estilo mais consistente para não parecerem elementos soltos.

### 4. Tabela e consulta diária

- A tabela possui apenas as colunas iniciais exigidas pelo usuário mais recentemente, o que ajuda a leitura.
- Em modo card, cada linha vira um bloco completo; isso evita arrastar para o lado, mas aumenta a altura e pode cansar em 25 registros por página.
- O toolbar da tabela tem paginação e linhas por página, mas falta uma área visualmente clara de consulta/filtro na versão atual.
- O script de validação ainda possui lógica auxiliar para filtros, mas a interface atual não exibe busca/filtros. Como o requisito atual diz para não remover filtros, qualquer próxima etapa deve confirmar se os filtros devem ser preservados/reintroduzidos visualmente.

### 5. Cores e acabamento

- A paleta azul/verde/vermelho/amarelo está coerente com um painel público, mas ainda parece genérica em alguns blocos.
- O gradiente escuro do topo e do rodapé dá presença, mas pode pesar no iPhone.
- Há muitas bordas e sombras semelhantes; falta diferenciar melhor níveis de informação: métrica, alerta, lista operacional, tabela e detalhe.
- Os cards usam borda esquerda colorida de forma útil, mas poderiam ganhar uma composição mais leve e institucional.

### 6. Componentização CSS

- `css/styles.css` tem 1879 linhas e mistura tokens, layout, componentes, estados, tabela, drawer, rodapé e impressão.
- Há padrões repetidos de cards, grids, headings e badges que poderiam ser organizados em blocos mais previsíveis.
- Breakpoints existem em `1180px`, `880px`, `640px` e `430px`, mas faltam ajustes específicos para `390px`, que é uma largura crítica para iPhone.
- Algumas decisões são globais demais, como quebra de texto em todos os elementos, e deveriam ser mais direcionadas por componente.

### 7. Acessibilidade e interação

- A base está boa, mas ainda há pontos para lapidar.
- Linhas de tabela clicáveis com `tabindex="0"` funcionam, mas precisam manter foco claro no modo card.
- O drawer tem `aria-modal`, mas a auditoria futura deve verificar aprisionamento de foco e retorno de foco ao elemento que abriu o detalhe.
- Botões de ocultar/mostrar devem manter área de toque confortável e rótulo claro em mobile.
- O uso de cores para status está acompanhado de texto, o que deve ser preservado.

## Componentes que devem ser preservados

- Normalização de dados em `js/data-normalizer.js`.
- Regras de status calculado.
- Regras de categoria por palavras-chave.
- Cálculo de pendências cadastrais.
- `data/contratos.json` e `data/contratos.js` como camada derivada.
- Indicadores administrativos.
- Alertas prioritários e saúde da base.
- Contratos vigentes ordenados por data de vencimento.
- Contratos vencidos no final da página.
- Tabela com ordenação e paginação.
- Modal/drawer de detalhe com campos originais e calculados.
- Estados de carregamento, erro e vazio.
- Script de validação.
- Compatibilidade com GitHub Pages sem build.

## Componentes que devem ser redesenhados

- Cabeçalho institucional.
- Atalhos do topo.
- Grid de indicadores.
- Blocos de alertas e saúde da base.
- Cards de contratos vigentes.
- Toolbar e cards mobile da tabela.
- Botões de ocultar/mostrar.
- Rodapé.
- Sistema de cores, sombras, espaçamento e bordas.
- Tratamento de textos longos sem cortes indesejados.

## Prioridades de correção

### Prioridade 1: iPhone e topo

- Reduzir altura do cabeçalho em telas pequenas.
- Transformar atalhos do topo em chips/resumo mais compacto.
- Evitar que o primeiro viewport seja ocupado quase inteiro por navegação e indicadores.
- Ajustar tamanhos de fonte e espaçamentos para `390px` e `430px`.
- Garantir que logo, título, badges e botões nunca fiquem cortados.

### Prioridade 2: hierarquia administrativa

- Separar indicadores principais dos indicadores secundários.
- Dar mais destaque a vencidos, próximos vencimentos, pendências e valor total.
- Reposicionar alertas e saúde da base como painéis compactos.
- Fazer a tabela parecer a área principal de consulta, sem perder os contratos vigentes.

### Prioridade 3: contratos vigentes e vencidos

- Melhorar os cards de vigentes para leitura rápida: vencimento, status/aviso, contrato, empresa, valor e pendências.
- Evitar cards altos demais no celular.
- Considerar exibir resumo + primeiros itens com controle claro de expansão, preservando a seção e o botão de ocultar.
- Deixar os contratos vencidos com visual de alerta, mas sem poluir o final da página.

### Prioridade 4: tabela e detalhe

- Melhorar modo card da tabela para celular, com labels menores e valores mais fortes.
- Preservar ordenação e paginação.
- Garantir que não haja rolagem horizontal.
- Refinar o drawer de detalhe para leitura por grupos, com melhor espaçamento no iPhone.

### Prioridade 5: acabamento visual

- Reorganizar tokens de design.
- Reduzir sombras repetidas.
- Usar superfícies mais limpas e bordas mais sutis.
- Reforçar a identidade municipal com azul institucional, verde/petróleo e dourado apenas como acento.
- Melhorar consistência dos botões e badges.

## Proposta de novo layout

### Desktop e notebook

1. Cabeçalho institucional compacto:
   - brasão/logo;
   - nome do painel;
   - pequena linha institucional;
   - chips de status principais no lado direito.

2. Faixa de indicadores prioritários:
   - Total de contratos;
   - Valor total;
   - Vigentes;
   - Vencidos;
   - Até 30 dias;
   - Pendências.

3. Painel administrativo secundário:
   - Alertas prioritários compactos;
   - Saúde da base em barras menores.

4. Contratos vigentes:
   - lista/card grid com leitura rápida;
   - ordenação por vencimento preservada;
   - botão de ocultar/mostrar preservado.

5. Contratos:
   - tabela/paginação como área principal de consulta;
   - toolbar mais alinhada;
   - manter ordenação e detalhe.

6. Contratos vencidos:
   - seção final;
   - cards compactos de alerta.

7. Rodapé institucional:
   - texto público;
   - data/hora de atualização;
   - aviso de dependência da planilha.

### Celular e iPhone

1. Cabeçalho de duas linhas no máximo:
   - logo + "Painel de Contratos";
   - chips compactos abaixo.

2. Indicadores em cards de uma coluna ou dois cards quando couber:
   - menos texto auxiliar;
   - números grandes, rótulos curtos.

3. Seções com botões de ocultar/mostrar alinhados à direita ou abaixo do título.

4. Contratos vigentes em cards compactos:
   - status;
   - vencimento;
   - contrato;
   - empresa;
   - valor;
   - pendências.

5. Tabela como cards:
   - labels em uma coluna pequena apenas quando couber;
   - em `390px`, labels acima dos valores para evitar aperto;
   - sem rolagem horizontal.

6. Drawer de detalhe ocupando 100% da tela:
   - cabeçalho fixo;
   - grupos com espaçamento confortável;
   - botão "Fechar" sempre visível.

## Proposta de nova paleta de cores

Paleta base sugerida:

- Azul institucional escuro: `#05365f`
- Azul principal: `#0a5d8f`
- Azul claro de superfície: `#eaf4fb`
- Verde/azul petróleo: `#087276`
- Verde positivo: `#207b49`
- Fundo geral: `#f4f8fb`
- Superfície: `#ffffff`
- Linha/borda: `#dce7ef`
- Texto principal: `#172235`
- Texto secundário: `#526176`
- Dourado institucional/acento: `#d9ae3d`
- Alerta laranja: `#b75c00`
- Atenção amarela: `#8c6c00`
- Erro/vencido: `#b3261e`

Diretrizes:

- Azul e branco como base dominante.
- Verde/petróleo como apoio institucional.
- Dourado apenas para detalhe de identidade, não como cor dominante.
- Laranja/amarelo/vermelho somente para status e alertas.
- Fundos claros para reduzir peso no iPhone.
- Status sempre com texto, não apenas cor.

## Plano de execução para as próximas etapas

1. Congelar a regra de negócio:
   - não alterar `calculateStatus`, normalização de datas, valores, categorias e pendências;
   - manter testes existentes passando.

2. Criar uma revisão visual controlada:
   - reorganizar tokens no início do CSS;
   - definir padrões de seção, card, botão, badge e grid;
   - evitar refatoração funcional no mesmo passo.

3. Redesenhar cabeçalho:
   - compactar topo;
   - reforçar identidade institucional;
   - reduzir repetição de informações;
   - validar `390px`, `430px`, `768px`, `1024px` e desktop.

4. Reorganizar indicadores e alertas:
   - separar KPIs principais e secundários;
   - reduzir texto auxiliar em mobile;
   - manter todos os indicadores existentes.

5. Refinar contratos vigentes e vencidos:
   - cards mais compactos;
   - badges alinhados;
   - avisos de 5 e 15 dias preservados;
   - seção de vencidos mantida no final.

6. Refinar tabela e drawer:
   - manter ordenação, paginação e detalhe;
   - melhorar cards mobile;
   - garantir ausência de rolagem lateral;
   - revisar foco e fechamento do modal.

7. Verificação visual e técnica:
   - testar em larguras próximas de `1440px`, `1024px`, `768px`, `430px` e `390px`;
   - rodar `node --check js/app.js`;
   - rodar `node --check js/data-normalizer.js`;
   - rodar `node scripts/validate-dashboard.mjs --reference-date=2026-05-01`;
   - validar a página publicada no GitHub Pages sem erros de console.

## Validação realizada nesta auditoria

Comandos executados:

```bash
node --check js/app.js
node --check js/data-normalizer.js
node scripts/validate-dashboard.mjs --reference-date=2026-05-01
```

Resultado:

- `js/app.js`: sem erro de sintaxe.
- `js/data-normalizer.js`: sem erro de sintaxe.
- `scripts/validate-dashboard.mjs`: todos os testes passaram.
- Página publicada validada no navegador interno sem erros de console.

Resumo de dados validado com referência em `2026-05-01`:

- Total de contratos: 158.
- Valor total: R$ 193.313.544,47.
- Vencidos: 30.
- Vencendo em até 30 dias: 16.
- Sem vencimento: 15.
- Sem fiscal: 31.
- Sem gestor: 21.
- Contratos vigentes renderizados na página publicada: 113.
- Linhas exibidas na primeira página da tabela publicada: 25.

## Atualização: design system institucional

Etapa implementada em 01/05/2026.

Mudanças feitas:

- Reorganização dos tokens em `:root`, separando cores de marca, apoio institucional, feedback, neutros, bordas, sombras, raios, espaçamentos, largura do container e altura mínima de controles.
- Inclusão de aliases para preservar compatibilidade com as classes existentes, sem alterar a lógica do JavaScript.
- Adoção de uma paleta mais sóbria, com azul escuro como base, azul médio para ações, teal como apoio institucional e cores de alerta restritas a status.
- Redução do peso visual dos gradientes do cabeçalho e rodapé.
- Padronização de botões com altura mínima de `44px`, foco visível, hover mais discreto e estado secundário mais limpo.
- Padronização de campos e selects com borda, raio, altura mínima e contraste adequados.
- Refinamento de cards, painéis, toolbar, tabela, drawer e badges com bordas mais consistentes, sombras mais leves e superfícies brancas.
- Preservação da estrutura atual: indicadores, alertas, saúde da base, contratos vigentes, tabela, paginação, ordenação, modal de detalhe e contratos vencidos.

Validações desta etapa:

```bash
node --check js/app.js
node --check js/data-normalizer.js
node scripts/validate-dashboard.mjs --reference-date=2026-05-01
```

## Observações finais

Esta auditoria não recomenda refazer o projeto do zero. A base atual é aproveitável e o caminho mais seguro é uma melhoria incremental de template e CSS, preservando a camada de dados, os cálculos e a publicação estática. A próxima etapa deve focar em desenho responsivo e acabamento visual, com validação constante no GitHub Pages.
