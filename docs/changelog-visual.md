# Changelog Visual e Responsivo

Data: 01/05/2026

Projeto: `painel-contratos-iguape-dashboard`

Pagina publicada: https://matheuhenriqu.github.io/painel-contratos-iguape-dashboard/

## Resumo

O painel passou por uma revisao visual completa para parecer mais institucional, limpo e pronto para uso pela Prefeitura Municipal de Iguape/SP. A regra de negocio dos contratos foi preservada: status calculado, categorias, pendencias, filtros, tabela, graficos, paginacao e detalhe continuam usando a mesma base e os mesmos criterios.

## O Que Foi Melhorado

- Design system com tokens centralizados de cor, sombra, borda, raio, espacamento e altura minima de controles.
- Cabecalho institucional com brasao, selo de transparencia, titulo, ultima atualizacao e atalhos principais.
- Indicadores reorganizados em grupos administrativos:
  - visao geral;
  - risco de vencimento;
  - qualidade cadastral.
- Consulta avancada com busca destacada, filtros por grupos, chips ativos e painel mobile.
- Cards de contratos vigentes e vencidos com leitura mais clara.
- Tabela preservada no desktop, com ordenacao e paginacao.
- Visualizacao em cards no mobile para evitar zoom e rolagem lateral.
- Graficos reorganizados em cards, com estados vazios e paleta coerente.
- Drawer de detalhe redesenhado como ficha administrativa.
- Rodape institucional com brasao, endereco, ultima atualizacao e aviso sobre a planilha de origem.
- Sombras suavizadas para reduzir aparencia de template generico.
- Correcao global de `[hidden]` para evitar que componentes fechados participem do layout.
- Ajustes de breakpoints para iPhone e telas estreitas.
- Consulta avancada recebeu botao de mostrar/ocultar como as demais secoes.
- Secoes colapsaveis passam a iniciar ocultas por padrao, deixando a primeira visualizacao mais limpa.
- Secao de contratos vigentes alinhada ao mesmo padrao visual da secao de contratos, com tabela no desktop e cards no celular.
- Ordem da pagina reorganizada para priorizar leitura administrativa: indicadores, consulta, contratos, vigentes, vencidos e graficos.

## Arquivos Alterados

- `index.html`
  - Estrutura do cabecalho, secoes, drawer, rodape e versoes de cache dos assets.
- `css/styles.css`
  - Design system, responsividade, cards, filtros, tabela, graficos, drawer, estados e impressao.
- `js/app.js`
  - Renderizacao visual das secoes, filtros, cards mobile, detalhe, foco e interacoes.
- `README.md`
  - Instrucoes de uso, validacao, responsividade e publicacao.
- `docs/auditoria-visual-responsiva.md`
  - Auditoria tecnica inicial e plano de redesign.
- `docs/changelog-visual.md`
  - Registro desta etapa de acabamento visual.

## Decisoes de Design

- Manter HTML/CSS/JS puro para compatibilidade direta com GitHub Pages.
- Usar azul escuro como base institucional e teal como apoio.
- Reservar vermelho para vencidos/erros, laranja e amarelo para atencao, verde para vigentes/sucesso.
- Evitar gradientes fortes fora do topo e rodape.
- Priorizar bordas discretas e sombras leves, com cards de raio moderado.
- Usar texto junto das cores de status para nao depender apenas de cor.
- Transformar a tabela em cards no mobile para eliminar leitura lateral.
- Manter os filtros completos, mas organizar a experiencia mobile em painel tipo bottom sheet.
- Fazer o detalhe do contrato funcionar como ficha administrativa, nao apenas lista de campos.

## Observacoes Sobre Mobile e iPhone

Foram considerados os pontos criticos:

- header compacto para nao dominar o primeiro viewport;
- botoes com area de toque confortavel;
- filtros em painel com rolagem interna;
- tabela substituida por cards abaixo de telas pequenas;
- cards sem largura fixa;
- textos com quebra controlada, sem exigir arrastar para o lado;
- drawer de detalhe em tela cheia no iPhone;
- uso de `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)` no detalhe;
- footer empilhado e legivel.

Breakpoints revisados:

- `1440px`
- `1366px`
- `1024px`
- `768px`
- `430px`
- `390px`
- `375px`
- `360px`

## Validacoes Executadas

Comandos:

```bash
node --check js/app.js
node --check js/data-normalizer.js
node scripts/validate-dashboard.mjs --reference-date=2026-05-01
```

Resultado esperado:

- sintaxe JavaScript valida;
- base carregada;
- vencimentos recalculados;
- busca normalizada;
- filtros combinados;
- totais e status calculados corretos;
- rankings ordenados;
- robustez com campos vazios, invalidos, extras ou ausentes;
- performance local confortavel.

## Revisao Manual Simulada

Itens revisados:

- desktop largo;
- notebook;
- tablet;
- iPhone;
- filtros e chips ativos;
- busca geral;
- tabela desktop;
- cards mobile;
- graficos;
- modal/drawer de detalhe;
- estados vazios;
- ausencia de overflow horizontal;
- carregamento da pagina publicada no GitHub Pages.

## Observacoes Finais

As melhorias foram feitas sem alterar a regra de negocio dos contratos. A publicacao continua estatica, com dados locais e caminhos relativos. O painel permanece pronto para GitHub Pages e pode ser atualizado apenas regenerando `data/contratos.json` e `data/contratos.js` a partir da planilha de origem.
