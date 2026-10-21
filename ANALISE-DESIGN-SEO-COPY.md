# Magic Carousels — análise e planos de ação

Data: 21/10/2026. Atualização integrada: menus, testes funcionais, melhorias por funcionalidade, contato, retirada da Stone/Pagar.me, páginas institucionais e segurança. Escopo: SaaS acessado pelo navegador. Trabalho de análise e planejamento; nenhuma implementação funcional foi alterada.

## Diretrizes confirmadas pelo responsável

- Ecossistema confirmado: **GitHub → deploy na Vercel → Supabase (banco PostgreSQL)**; **Mercado Pago** como gateway de pagamento.
- Haverá **um único administrador**, entrando pelo mesmo login dos usuários. O painel administrativo terá acesso restrito e acompanhará presença/atividade, vendas, cadastros e indicadores operacionais.
- Contato oficial a adotar: **comercial@splinkapp.com.br**. Substituir o endereço antigo nas superfícies de contato; campos de autenticação devem iniciar vazios, não preenchidos com o e-mail comercial.
- Retirar **Stone/Pagar.me** da experiência e das integrações ativas. Mercado Pago é o provedor remanescente no plano, sujeito à validação funcional e de segurança.
- Criar **Política de Privacidade** e **Termos de Uso** com páginas públicas próprias.
- Incluir menus e navegação no escopo. Primeiro verificar todas as funcionalidades; depois priorizar as melhorias com evidência.
- Este documento é um plano. Testes completos, correções, retirada de provedor e publicação das páginas **ainda não foram executados**.
- “Download” nas evidências anteriores significa exportação de arquivos produzidos pelo usuário. O sistema é um SaaS; não há proposta de baixar ou instalar o aplicativo. Existência de um botão no código não comprova funcionamento.

As referências históricas à Stone abaixo descrevem o estado observado. Elas não recomendam manter esse provedor. A sequência consolidada da seção 5 substitui o cronograma preliminar da seção 4.

Método: revisão independente de design e de evidências técnicas, leitura do fluxo principal e APIs relacionadas, consulta às documentações locais do Next.js 16.4.2 e referências oficiais de SEO. A inspeção visual e suas limitações são registradas ao final. Não foram feitas compras, cadastros ou envios de leads.

## Diagnóstico executivo

O produto tem recursos concretos para sustentar uma oferta: biblioteca por nicho, personalização visual, kit de marca, prévia e exportações PNG/ZIP/PDF. O maior problema é a distância entre o que a página promete e o que a jornada entrega. A comunicação enfatiza viralização, urgência e suposta atividade em tempo real antes de demonstrar a qualidade do resultado.

A prioridade é corrigir confiança e conclusão da tarefa, organizar a experiência e então ampliar aquisição orgânica. Aumentar tráfego antes disso pode apenas ampliar abandono.

Prioridades: P0 = exposição ou bloqueio crítico; P1 = prejuízo importante à jornada/confiança; P2 = melhoria estrutural; P3 = otimização após medição. Os efeitos sobre conversão são hipóteses, não resultados medidos.

## 1. Design e experiência

### O que preservar

- Identidade escura com acento rosa e ligação visual com criação para redes sociais.
- Templates por profissão e filtros por categoria.
- Personalização de avatar, cores, fontes, alinhamento e formato.
- Navegação deslizável entre slides.
- Kit de marca persistido por conta.
- Exportações com destinos reconhecíveis: imagem, pacote de imagens e documento.

### Achados e evidências

| Prioridade | Achado | Evidência | Consequência / ação |
|---|---|---|---|
| P0 | Login inicia com e-mail e senha literais no cliente | `src/app/page.tsx:55–57` | Remover preenchimento; investigar e revogar a senha se real. O segredo não é reproduzido neste documento. |
| P1 | Editor pode ficar sem controles em tablets | `page.tsx:92,2851,3207`; `globals.css:301,340` | Alternador some a partir de 769 px; duas colunas só são asseguradas a partir de 1024. Usar CSS com breakpoints consistentes. |
| P1 | Popup automático interrompe a descoberta | `page.tsx:289–298` | Abre após 2,2 s. Trocar por convite voluntário/contextual depois de demonstrar valor. |
| P1 | Urgência reinicia ao zerar | `page.tsx:182–195` | Usar prazo real persistido, com comportamento de expiração, ou retirar contador. |
| P1 | Prova social não é alimentada por eventos reais no código | `pricing-tiers.ts`; `social-proof-profiles.ts`; `api/stats/scarcity/route.ts` | Arrays estáticos, fotos Unsplash, base fixa de testadores e offset de usuários. Retirar linguagem “ao vivo/verificado” até haver comprovação. |
| P1 | Teste e download entram em conflito | `page.tsx:381–389,674–679` | Geração consome o teste; PNG bloqueia usuário FREE com teste consumido. Definir se o teste inclui baixar e implementar a mesma regra na promessa e no produto. |
| P1 | Experiência de IA não corresponde à integração disponível | `page.tsx:351–410`; `lib/sample.ts`; `api/generate/route.ts` | Caminho principal monta conteúdo local; API de IA existe separadamente. Integrar ou nomear os modos com precisão. |
| P1 | Diálogos sem infraestrutura acessível | `page.tsx:1423+,1640+,2088+` | Implementar nome acessível, foco inicial, contenção e retorno do foco, Escape e rolagem interna. |
| P1 | Cadastro social apresentado como OAuth não realiza esse fluxo no handler | `page.tsx:502–528`; `api/auth/social/route.ts` | Cliente fabrica identidade de exemplo. Não apresentar como autenticação real; implementar verificação do provedor antes de publicar a opção. |
| P1 | Cartão mostra formulário sem transmitir seus campos no handler | `page.tsx:815–838,4168+` | Integrar checkout/tokenização do provedor; só mostrar métodos operacionais. |
| P1 | Preços fixos coexistem com lotes dinâmicos | `page.tsx:2134+`; `api/usage/use-trial/route.ts` | Centralizar oferta, condições, limite e preço em fonte única consumida por todas as superfícies. |
| P1 | Edição pode sobrescrever legenda manual | `page.tsx:261–269` | Mudanças nos slides recalculam legenda. Preservar texto editado; regenerar apenas por ação explícita. |
| P2 | Primeira dobra disputa atenção entre muitos estímulos | `page.tsx:2149–2310` | Hero longo, badges, estrelas, urgência, lote e CTAs antecedem demonstração. Reduzir concorrência e antecipar produto real. |
| P2 | Layout móvel tem risco de corte | `page.tsx:2418,2437`; `globals.css:51` | Coluna mínima de 320 px dentro de paddings pode exceder a área disponível; overflow oculto pode mascarar o problema. Validar em 320/360/390 px. |
| P2 | Navegação não representa áreas em URLs | `page.tsx:89` | Abas por estado não oferecem links diretos, histórico ou retorno previsível. Criar rotas e preservar rascunho. |
| P2 | Feedback usa alertas bloqueantes | `page.tsx:463,490,713,748,807` | Trocar por mensagens no contexto, progresso e erro recuperável. |
| P2 | Labels, paginação e cartões não têm suporte consistente a teclado | `page.tsx:1506+,1848+,2598,3412,3690` | Associar campos; trocar divs interativas por botões/links; foco visível e nomes acessíveis. |
| P2 | Checkout expõe escolhas de arquitetura | `page.tsx:3998–4115` | Comprador escolhe gateway e vê “API v5”. Priorizar Pix/cartão; provedor como informação secundária. |
| P2 | Simulação aparece na área de pagamento | `page.tsx:4133–4154` | Restringir a testes; diferenciar aguardando, aprovado, expirado e falhou. |
| P2 | Fontes e animações têm custo e acessibilidade a verificar | `globals.css:1,371–412` | Sete famílias via import global, movimentos contínuos sem regra de redução. Separar fontes do produto e dos templates; carregar sob demanda. |
| P2 | Rodapé não oferece navegação de confiança | `page.tsx:4303–4333` | Adicionar suporte clicável, termos, privacidade e instruções de reembolso verificadas. |

### Direção visual recomendada

Conceito: transformar o próprio carrossel no protagonista. A primeira tela deve mostrar o resultado que a pessoa pode produzir, em vez de depender de sinais de urgência.

Manter a base escura e o rosa como acento. Reservar verde para sucesso e amarelo para avisos; reduzir brilhos, gradientes e selos simultâneos. Estabelecer tokens de superfície, texto, estados, espaçamento e raio. Usar uma família principal na interface e reservar as fontes decorativas à biblioteca/exportação.

Na área de trabalho, priorizar precisão: controles legíveis, canvas desobstruído e ações previsíveis. Moldura de celular pode ser uma opção de simulação; não precisa consumir a área útil de edição.

### Arquitetura da experiência proposta

**Comercial:** benefício → carrossel demonstrável → como funciona → exemplos por nicho → condições e limites → prova verificável → dúvidas → ação.

**Workspace:** criar → editar conteúdo → ajustar aparência → revisar/exportar. No desktop, controles agrupados, canvas central e miniaturas. No celular, alternância clara entre editar e visualizar, com ação principal acessível e sem colisão com a barra inferior.

**Biblioteca:** busca, filtros, quantidade real, prévia e ação “Usar template”. Diferenciar template, carrossel e kit de marca.

**Checkout:** resumo da licença, preço total, condições, método de pagamento e estados claros. Não solicitar dados de cartão em um formulário sem integração efetiva.

### Plano de ação de design

| Etapa | Entregas | Responsável sugerido | Critério de aceite |
|---|---|---|---|
| D1 — corrigir jornada | Tablets, teste/download, preservação da legenda, erros, preenchimento do login e opções simuladas | Frontend + backend | Usuário conclui criar → editar → exportar; condições correspondem à oferta |
| D2 — organizar | Mapa de rotas, rascunho, recuperação de trabalho, estados vazio/carregando/erro/sucesso | Produto + frontend | Voltar e atualizar não descartam trabalho sem aviso; URL identifica área |
| D3 — desenhar | Tokens, componentes, nova composição do hero, editor e biblioteca | Design + frontend | Hierarquia consistente e demonstração próxima da promessa |
| D4 — incluir | Teclado, diálogos, labels, foco, contraste e movimento reduzido | Frontend + QA | Jornada completa por teclado; sem conteúdo cortado nas larguras previstas |
| D5 — validar | Sessões com 5 pessoas do público e medição do funil | Produto | Registrar tempo até primeiro resultado, falhas, dúvidas e conclusão da exportação |

Cobertura mínima: 360, 390, 768, 769, 820, 1023, 1024 e 1440 px; retrato/paisagem; teclado; zoom; rede lenta. Medir contraste renderizado em vez de presumir aprovação pelas cores do código.

## 2. SEO

### Estado atual

Existe título, descrição, idioma pt-BR e ícones em `src/app/layout.tsx`. Isso é um começo útil. No repositório inspecionado não foram encontrados sitemap, robots próprio, canonical configurado, Open Graph, Twitter Cards, JSON-LD, conteúdo editorial ou integração explícita de analytics/Search Console.

Só há uma página de interface pública no App Router; criador, templates e checkout são estados dela. Isso limita páginas de entrada específicas e links internos rastreáveis. **“use client” não significa que a homepage seja automaticamente invisível ao Google:** Next.js pode pré-renderizar Client Components. O problema concreto é não haver URLs e conteúdo independente para intenções diferentes, além da carga de interação concentrada.

Não foi fornecido domínio de produção nem acesso ao Search Console. Portanto, indexação efetiva, tráfego, backlinks, consultas, canonical de produção, headers e Core Web Vitals de usuários reais permanecem não verificados. Ausência no código local não prova ausência de configuração externa.

### Plano técnico

1. Definir domínio canônico e regras de redirecionamento HTTPS/host; verificar variantes e status de páginas inexistentes.
2. Separar páginas públicas de aquisição do workspace interativo. Usar Server Components para conteúdo comercial e componentes cliente para ações necessárias, conforme documentação local da versão instalada.
3. Criar URLs públicas com conteúdo próprio e navegação por links reais: `/`, `/templates`, `/precos`, `/carrossel-instagram`, `/carrossel-linkedin` e, após pesquisa, páginas selecionadas por nicho.
4. Reservar rotas de aplicação, conta e checkout para a jornada. Aplicar autenticação onde necessário e política de indexação apropriada; robots.txt não protege dados privados.
5. Configurar metadata por rota, canonical próprio quando aplicável, Open Graph e imagem de compartilhamento. Não canonicalizar todas as páginas para a home.
6. Criar sitemap apenas com URLs canônicas, públicas e indexáveis; robots coerente; submeter ao Search Console.
7. Usar headings descritivos, links internos contextuais, textos alternativos úteis e exemplos que também façam sentido como conteúdo textual. Evitar depender só de imagem ou interação para explicar o produto.
8. Avaliar JSON-LD `Organization`, `SoftwareApplication` e `BreadcrumbList`, apenas com atributos verdadeiros e compatíveis com a página. Não marcar reviews ou notas sem base verificável. Dados estruturados não garantem destaque na busca.
9. Medir uma build de produção: fontes, JS inicial, hidratação, imagens, estabilidade e latência. Não usar tempos do servidor de desenvolvimento como diagnóstico de produção.
10. Monitorar erros, URLs excluídas, sitemap, inspeção de URL e métricas por tipo de página.

### Arquitetura de conteúdo e intenção

| Intenção | Página proposta | Conteúdo que precisa existir |
|---|---|---|
| Criar carrossel | Home / página do gerador | Demonstração real, personalização, formatos, limites e início claro |
| Criar para Instagram | `/carrossel-instagram` | Exemplos, fluxo de imagens, revisão e uso real do exportador |
| Criar para LinkedIn | `/carrossel-linkedin` | Exemplo de documento, exportação PDF e passos de publicação verificados |
| Encontrar modelos | `/templates` | Prévias públicas, categorias úteis, links para detalhes relevantes |
| Modelos por profissão | `/templates/[nicho]` | Exemplos específicos e orientações editoriais; não apenas trocar o nome do nicho |
| Comparar oferta | `/precos` | Licença, cobrança, limites, gratuito versus pago, suporte e reembolso |
| Aprender a produzir | `/guias/[slug]` | Tutorial completo com exemplos originais e ligação contextual ao produto |

Termos iniciais a pesquisar: “criador de carrossel”, “gerador de carrossel”, “carrossel Instagram”, “carrossel LinkedIn”, “templates de carrossel” e combinações por profissão. São hipóteses de intenção, sem volume ou dificuldade medidos. Validar antes de produzir em escala.

Começar com poucas páginas fortes. Evitar dezenas de páginas quase idênticas por nicho, cidades irrelevantes ou artigos genéricos produzidos apenas para preencher calendário.

### Execução de SEO

| Fase | Ações | Aceite |
|---|---|---|
| S1 — base | Domínio, inventário, medição inicial, rotas e política de indexação | Conteúdo público acessível por URL e links; privado protegido |
| S2 — técnica | Metadata, canonical, OG, sitemap, robots, status e redirects | Tags e URLs verificadas na versão publicada |
| S3 — conteúdo | Home, preços, Instagram, LinkedIn, biblioteca e primeiros guias | Cada página responde uma intenção e entrega exemplos próprios |
| S4 — desempenho | Reduzir fontes globais, JS comercial e imagens desnecessárias | Medir LCP ≤2,5 s, INP ≤200 ms e CLS ≤0,1 no percentil 75, quando houver dados suficientes |
| S5 — crescimento | Search Console, atualização de páginas, links e casos reais | Acompanhar consultas, cliques qualificados, cadastros e exportações orgânicas |

Avaliar em 30/60/90 dias. Não prometer prazo de posicionamento. Comparar tráfego de marca e não marca, dispositivo, página de entrada e conversão; visitas isoladas não demonstram retorno.

Referências: [JavaScript SEO — Google](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [SEO para desenvolvedores — Google](https://developers.google.com/search/docs/fundamentals/get-started-developers), [Web Vitals](https://web.dev/articles/vitals).

## 3. Copy

### Diagnóstico

A copy mistura benefício, instruções de interface, linguagem técnica e pressão comercial. “Virais que vendem” e “menos de 60 segundos” elevam a promessa acima da evidência disponível. A demonstração valoriza o gesto de deslizar mais do que a qualidade e utilidade do conteúdo criado.

Antes de reescrever, fechar uma ficha de verdade do produto: o que cada modo faz; onde há IA externa; o que o teste inclui; quantos templates estão disponíveis; quais exportações estão liberadas; limites de uso; o que significa vitalício; preço; suporte e reembolso.

### Correções de mensagem prioritárias

| Atual | Problema | Direção |
|---|---|---|
| “Virais que vendem” | Resultado não garantido pelo editor | Prometer criação, personalização e exportação |
| “AO VIVO” / “verificados” | Dados estáticos no fluxo atual | Mostrar prova real com origem ou remover |
| “+5.200 criadores”, “4.9/5” | Sem fonte identificada na implementação | Confirmar base e autorização antes de usar |
| “IA inteligente” / “IA Local” | Caminho principal usa banco local de conteúdo | Explicar precisamente geração por modelos locais e modo com IA externa |
| “Ilimitado” | API tem limite diário configurável; gratuito tem regras divergentes | Descrever limites e diferenciar criação local de geração externa |
| “De [próximo preço]” | Próximo preço não comprova preço anterior | Usar preço atual e informar futuro reajuste apenas se definido |
| “Reembolso instantâneo” / garantia atribuída à Stone | Operação e atribuição não demonstradas | Descrever política e canal reais, com prazos confirmados |
| “Canva Studio” | Pode sugerir vínculo ou integração não demonstrada | Preferir “Estúdio de templates” |
| “Stone / Pagar.me API v5” | Detalhe técnico sem utilidade para comprar | Mostrar método e processamento, com linguagem simples |

### Proposta de posicionamento

Hipótese de público principal: profissionais e pequenos negócios que produzem o próprio conteúdo. Agências podem ser um segundo segmento, mas exigem validar múltiplas marcas, organização de projetos e uso recorrente antes de prometer uma solução completa para equipes.

Proposta: “Transforme suas ideias em carrosséis com a sua marca.” Diferencial a demonstrar: templates por profissão, ajuste visual e formatos de exportação dentro do mesmo fluxo.

### Exemplo de hero

**Título:** Sua ideia em carrossel.

**Apoio:** Escolha um modelo para sua profissão, personalize o conteúdo e ajuste o visual para Instagram ou LinkedIn.

**Ação principal:** Criar meu carrossel.

**Ação secundária:** Ver exemplos.

**Microcopy condicional:** “Crie uma conta para testar 1 carrossel. Veja o que está incluído.” Só publicar depois de resolver teste e download. Não acrescentar “sem cartão” sem verificar a jornada completa.

O termo “criador de carrosséis” pode aparecer em texto de apoio ou título conforme a pesquisa de intenção; evitar sacrificar clareza para repetir palavras-chave.

### Conteúdo por superfície

- **Landing:** explicar o que produz, mostrar exemplo, descrever etapas, permitir avaliar estética e explicitar condições.
- **Biblioteca:** nomes objetivos, nicho, formato, conteúdo demonstrativo e ação “Usar este modelo”.
- **Editor:** “Sobre o que será o carrossel?”, “Tom do texto”, “Quantidade de slides”, “Aplicar minha marca”. Separar configurações avançadas.
- **Geração:** explicar se o conteúdo é local ou criado por serviço externo. Não mascarar atraso artificial como trabalho de IA.
- **Exportação:** apresentar formato, quantidade e destino. Mostrar progresso não bloqueante e mensagem de conclusão.
- **Paywall:** explicar o recurso que exige compra, o que o plano inclui e como voltar à edição. Não culpar o usuário.
- **Checkout:** preço total, cobrança única se verdadeira, licença, limites, pagamento e suporte. Status “Aguardando confirmação” antes de confirmação real.
- **Suporte:** respostas concretas para falha de exportação, conteúdo inadequado, limite atingido, perda de trabalho e pagamento pendente.

### Microcopy proposta

| Situação | Texto proposto |
|---|---|
| Tema vazio | “Digite o tema do seu carrossel para continuar.” |
| Geração falhou | “Não foi possível criar o carrossel. Seu conteúdo foi mantido. Tente novamente.” — apenas se o conteúdo realmente for preservado |
| Exportação em andamento | “Preparando os arquivos…” |
| Exportação falhou | “Não foi possível exportar. Tente novamente ou escolha outro formato.” |
| Limite gratuito | “Você concluiu seu teste gratuito. Veja as opções para continuar criando.” |
| Pix pendente | “Aguardando confirmação do pagamento. Seu acesso será liberado após a confirmação.” |
| Legenda manual existente | “Gerar uma nova legenda vai substituir o texto atual. Deseja continuar?” |

### Perguntas que a página deve responder

O teste permite baixar? Preciso de outra ferramenta de IA? Quais arquivos recebo? O PDF funciona no fluxo proposto para LinkedIn? Posso editar tudo? O que fica salvo? Posso usar minha marca? O que o vitalício inclui e quais limites existem? Como solicitar suporte ou reembolso?

### Plano de copy

1. Produto/backend validam ficha de verdade e resolvem divergências.
2. Redação define vocabulário, público prioritário, promessa e provas autorizadas.
3. Reescrever home, preços, cadastro, paywall, checkout e ajuda.
4. Aplicar microcopy a carregamento, erro, sucesso, vazio e recuperação.
5. Fazer teste de compreensão com 5 pessoas: o que é, o que recebo, como começo e quanto custa?
6. Instrumentar funil; testar uma mudança relevante por vez quando houver volume. Evitar declarar vencedor de teste sem amostra suficiente.

## 4. Sequência integrada e medição

Estimativa de organização, não compromisso de prazo; depende de equipe e das integrações reais.

| Período | Foco | Saída |
|---|---|---|
| Semana 1 | Confiança e funcionamento | Resolver exposição no login, fluxos simulados, oferta, teste/download e tablet; definir verdade do produto |
| Semana 2 | Jornada e direção | Rotas, rascunho, sistema visual, hierarquia da home e editor; copy principal aprovada contra funcionalidades |
| Semana 3 | Implementação e base SEO | Aplicar interface, acessibilidade, metadata, páginas públicas, sitemap e compartilhamento |
| Semana 4 | Validação e publicação | QA responsivo, teclado, pagamentos em teste, produção medida e Search Console |
| Dias 30–90 | Aprendizado e crescimento | Conteúdo validado, exemplos reais, melhorias por funil e consultas orgânicas |

Eventos sugeridos: visualização de exemplo, início de cadastro, cadastro concluído, geração iniciada/concluída/falha, edição, exportação iniciada/concluída/falha, visualização de plano, checkout iniciado e compra confirmada no servidor. Não registrar senha, dados de cartão ou conteúdo sensível nos eventos.

Indicadores: visitante → primeiro resultado; resultado → primeira exportação; teste → compra; tempo até primeiro resultado; falhas por etapa/dispositivo; retorno ao produto; cliques orgânicos não relacionados à marca → ativação. Levantar linha de base antes de definir metas percentuais.

## 5. Plano integrado de menus, testes, melhorias, contato e segurança

### 5.1 Ordem de execução revisada

1. Inventariar telas, menus, rotas, APIs, dados e integrações. Registrar o que é real, demonstrativo, indisponível ou ainda desconectado.
2. Preparar homologação isolada com contas de teste, dados fictícios e pagamentos sandbox. Fazer triagem dos riscos críticos antes de testes que alterem dados.
3. Executar a matriz funcional e de segurança, registrar resultados e reproduções. Não tratar revisão de código como teste aprovado.
4. Consolidar melhorias por funcionalidade: corrigir defeitos; reduzir esforço; melhorar clareza e acessibilidade; só então propor recursos adicionais.
5. Executar as mudanças aprovadas, incluindo contato, retirada da Stone e páginas institucionais; repetir regressão de fluxos afetados.
6. Aplicar o plano de design e copy com base nas regras reais; concluir SEO técnico e conteúdo público.
7. Validar em homologação, publicar e monitorar. Riscos críticos podem exigir contenção antes de concluir o restante da bateria.

### 5.2 Menus e navegação

Proposta a validar com os recursos efetivamente existentes:

| Contexto | Navegação proposta | Verificações |
|---|---|---|
| Público | Como funciona, exemplos/templates, preços, entrar e criar conta | URLs reais, menu mobile, foco, ordem de leitura, CTA e retorno |
| Autenticado | Criar carrossel, templates, estúdio de templates, marca/perfil, plano e sair | Visibilidade por plano, área ativa, estado persistido e histórico |
| Projetos | “Meus carrosséis”, caso a persistência seja conectada à interface | Listar, abrir, salvar, duplicar e excluir apenas itens próprios; não exibir menu sem destino operacional |
| Ajuda | Contato e instruções de uso | Destino clicável e canal comercial correto |
| Rodapé | Privacidade, termos de uso e contato | Acesso público sem login, sem links vazios ou destinos simulados |

Testar acesso direto à URL, recarregamento, voltar/avançar, sessão expirada, teclado, leitores de tela, toque e diferentes larguras. Nenhum menu deve ocultar uma função indispensável entre breakpoints. Renomear “Canva Studio” para “Estúdio de templates”, salvo existência comprovada de integração que justifique outra nomenclatura.

### 5.3 Matriz de verificação de todas as funcionalidades

Todos os pontos abaixo estão **planejados / não executados nesta atualização**. Os IDs identificam conjuntos de comportamento; não são nomes de testes automatizados já existentes. Na execução, cada um deverá receber casos positivos, negativos e de limite, comando/roteiro, ambiente, evidência e resultado.

| ID | Funcionalidade / escopo | Verificações obrigatórias | Melhoria a avaliar depois |
|---|---|---|---|
| TEST-NAV-001 | Menus, rotas, abas e modais | Links, histórico, deep links, responsividade, fechamento, foco e estado | Reduzir passos e separar comercial de workspace |
| TEST-AUTH-001 | Cadastro, login, sessão e logout | Campos inválidos, duplicidade, credenciais incorretas, expiração, retorno e logout | Recuperação de senha e confirmação de e-mail: inventariar lacunas antes de prometer |
| TEST-AUTH-002 | Google, Apple e Facebook | Identidade verificada pelo provedor, cancelamento, erro, vínculo seguro e sessão | Exibir somente provedores implementados |
| TEST-GEN-001 | Criação local e geração externa | Tema, nicho, tom, quantidade, formatos, falha, timeout e coerência entre tema e slides | Distinguir modos e permitir tentativa sem perda de conteúdo |
| TEST-GEN-002 | Prompt e importação de resposta | Copiar, colar, JSON inválido, conteúdo incompleto, excesso de texto e estrutura inesperada | Feedback orientado à correção e revisão antes de aplicar |
| TEST-EDIT-001 | Editor de slides | Editar título/corpo, adicionar/remover, limites, slide ativo e navegação | Desfazer/refazer, confirmação de substituição e autosave a especificar |
| TEST-STYLE-001 | Aparência e formatos | Fonte, tamanho, alinhamento, caixa alta, cores, avatar, proporções e cortes | Ajuste de texto, contraste e prévia fiel ao resultado |
| TEST-CAP-001 | Legenda e hashtags | Geração, edição manual, cópia, manutenção após alterar slides e falhas da área de transferência | Regenerar só por ação explícita e preservar edição |
| TEST-TPL-001 | Biblioteca | Filtros, categorias, preview, seleção por teclado, acesso por plano e quantidade real | Busca, favoritos e organização conforme evidência de uso |
| TEST-STUDIO-001 | Estúdio de templates | Criar, salvar, aplicar, recarregar, nomes, limites e armazenamento local | Sincronização por conta; diferenciar salvo no navegador de salvo no servidor |
| TEST-BRAND-001 | Perfil e kit de marca | Salvar, recarregar, avatar válido/inválido, tamanho e isolamento por conta | Aplicação consistente da marca e estado de salvamento visível |
| TEST-PROJ-001 | Persistência de carrosséis | APIs de criar/abrir/editar/duplicar/excluir e ligação com UI; duas sessões e falha de gravação | Recuperar rascunho e organizar projetos, se hoje desconectados |
| TEST-EXPORT-001 | Exportação PNG/ZIP/PDF existente no código | Arquivo íntegro, resolução real, proporção, fontes, número/ordem de slides, memória, falha e permissões | Progresso, retry e nomenclatura clara; não envolve instalação do SaaS |
| TEST-LIMIT-001 | Gratuito, pago e limites | Trial, consumo após sucesso, concorrência, cotas, troca de plano, igualdade entre UI e API | Uma regra única e previsível para criação e exportação |
| TEST-PAY-001 | Oferta e checkout | Preço do servidor, método suportado, pedido duplicado, QR válido, cancelamento, expiração, erro e retorno | Simplificar compra e remover escolha de gateway |
| TEST-PAY-002 | Confirmação e liberação | Webhook autêntico, consulta ao provedor correto, evento duplicado/fora de ordem, reembolso e revogação conforme regra | Reconciliação, suporte e liberação consistente da licença |
| TEST-LEAD-001 | Leads e comunidade | Validação, duplicidade, falha, link real, dados necessários e opção de comunicação | Convite voluntário, formulário menor e finalidade clara |
| TEST-PROOF-001 | Lotes, cronômetro e prova social | Origem do dado, cálculo, expiração verdadeira, indisponibilidade e consistência | Retirar sinais simulados e usar evidência verificável |
| TEST-NOTIF-001 | Notificações | Origem real, estado lido/não lido, fechar, navegação e persistência | Remover notificações decorativas; comunicar eventos úteis |
| TEST-LEGAL-001 | Contato, privacidade e termos | Links públicos, e-mail correto, versões, leitura mobile e registro de aceite quando aplicável | Informação acessível no ponto de coleta e cadastro |
| TEST-A11Y-001 | Transversal | Teclado, diálogos, labels, zoom, contraste, redução de movimento e breakpoints | Eliminar barreiras de uso e cortes |
| TEST-RESIL-001 | Transversal | Offline, rede lenta, timeout, sessão expirada, recarga, falha de API e armazenamento cheio | Recuperação sem perda e mensagens acionáveis |

Perfis mínimos: visitante, usuário gratuito novo, gratuito com teste consumido, pago, sessão expirada, duas contas distintas e a única conta administrativa definida na seção 6. Inventariar a implementação atual do painel e planejar as lacunas. Usar unitários para regras, integração para API/banco, contrato para frontend/backend/provedor e E2E para a jornada crítica. Não substituir regras sensíveis por mocks permissivos.

Registro de execução por caso: ID, precondição, entrada, passos, esperado, observado, aprovado/reprovado/bloqueado, severidade, evidência, responsável e reteste. Funcionalidade inacessível ou dependência sem credencial fica bloqueada com motivo, nunca aprovada por suposição.

### 5.4 Contato oficial

Planejar substituição por **comercial@splinkapp.com.br** no rodapé, ajuda, política, termos, cobrança, mensagens de suporte e eventuais templates de e-mail. Criar links `mailto:` acessíveis. Inventariar ocorrências em código, configuração, conteúdo e mensagens transacionais; verificar remetente e caixa de destino separadamente.

Aceite: nenhum contato antigo permanece nas superfícies publicadas; cadastro/login não usam esse endereço como valor inicial; mensagens e links apontam para o canal correto. Confirmar que a caixa recebe mensagens; não considerar um link funcionando como prova de entrega de e-mail.

### 5.5 Retirada completa da Stone/Pagar.me

1. Mapear dependências em `src/app/page.tsx`, `src/app/api/payments/create/route.ts`, `src/app/api/payments/status/route.ts`, `src/lib/billing.ts`, `src/lib/pagarme.ts`, `src/app/api/webhooks/pagarme/route.ts`, `prisma/schema.prisma` e configuração de ambiente/hosting.
2. Retirar textos, badges, escolha de gateway, botões, garantias atribuídas à Stone e referências indevidas em categorias de templates.
3. Eliminar criação de novos pedidos Stone/Pagar.me, fallback e simulações que possam ativar plano. Rejeitar explicitamente provedores/métodos não suportados; não deixar cartão Mercado Pago cair no ramo Pagar.me.
4. Fazer status e reconciliação consultarem o provedor correspondente. Hoje `refreshPayment` está acoplado a Pagar.me; remover só o seletor visual não resolve isso.
5. Levantar pedidos existentes e pendentes antes de desativar webhooks/chaves. Preservar histórico contábil e de pagamentos; definir tratamento de reembolsos e confirmações tardias, com prazo de transição se necessário.
6. Após a transição, desativar callbacks e credenciais da integração, retirar configurações obsoletas e mudar defaults de novos registros. Não reescrever o provedor de pagamentos históricos como Mercado Pago.
7. Repetir TEST-PAY-001/002, TEST-LIMIT-001 e busca de referências. Só disponibilizar Pix/cartão que tenham integração real aprovada; cartão no provedor remanescente é implementação a verificar, não capacidade presumida.

Aceite: nenhuma nova cobrança ou requisição ativa vai à Stone/Pagar.me; checkout e textos usam apenas o provedor remanescente; histórico permanece íntegro; compra, confirmação, erro e reembolso têm comportamento definido e testado.

### 5.6 Política de Privacidade e Termos de Uso

Criar rotas públicas `/politica-de-privacidade` e `/termos-de-uso`, com título, conteúdo legível, versão, vigência e links no rodapé e nos pontos pertinentes de cadastro/coleta. Preparar conteúdo com base no tratamento efetivo de dados, evitando publicar texto genérico que descreva serviços inexistentes.

**Política:** identificar responsável e contato comercial; inventariar nome, e-mail, telefone, IP, avatar, conteúdo criado, identificadores de pagamento e uso; documentar finalidade, fundamento aplicável, fornecedores, compartilhamento, retenção, exclusão, direitos e canal de atendimento. Verificar uso real de cookies, armazenamento local, analytics, marketing, IA e transferências de dados. Não afirmar que dados não saem do sistema sem confirmar integrações.

**Termos:** natureza do SaaS, cadastro, credenciais, uso permitido, responsabilidade pelo conteúdo, direitos sobre uploads e resultados, fornecedores externos, disponibilidade, suporte, limites, plano/licença, preço e cobrança, cancelamento/reembolso, suspensão, encerramento e alterações. Explicar que resultados de alcance/vendas não são garantidos. Condições devem coincidir com produto, checkout e oferta.

**Implementação associada:** separar aceite dos termos de eventual opção de marketing; registrar versão e momento do aceite quando adotado; apresentar informação contextual nos formulários; definir processo operacional para solicitações de privacidade. Solicitar revisão jurídica antes da publicação final, depois de preencher os fatos do negócio. Uma página publicada não comprova conformidade operacional.

Referência de planejamento: [orientações de segurança da informação da ANPD](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-publica-guia-de-seguranca-para-agentes-de-tratamento-de-pequeno-porte).

### 5.7 Verificação completa de segurança — escopo planejado

Usar o [OWASP ASVS](https://owasp.org/projects/asvs?tab=main) como referência de requisitos verificáveis, com critérios aplicáveis identificados e evidências. Não declarar certificação ou “100% seguro”. Esta atualização contém triagem estática e plano; não é um pentest concluído nem valida a configuração de produção.

#### Triagem inicial do código para orientar a prioridade

| ID / prioridade | Evidência observada | Verificação/correção planejada |
|---|---|---|
| SEC-001 / P0 | `/api/auth/social` localiza conta pelo e-mail recebido e emite sessão sem verificar token do provedor | Testar rejeição de identidade não comprovada; implementar fluxo verificável e vínculo seguro. Risco de tomada de conta por caminho de código, sem exploração executada |
| SEC-002 / P0 | `/api/payments/simulate` chama `markPaymentPaid` sem checagem de sessão, proprietário ou ambiente no handler | Proibir em produção e isolar testes; comprovar que pedido nenhum ativa plano sem confirmação confiável |
| SEC-003 / P0 | Credencial literal no componente cliente | Retirar, verificar alcance da exposição e rotacionar se real, sem reproduzir valores em relatórios |
| SEC-004 / P1 | `session.ts` aceita segredo padrão se variável não existir | Produção deve recusar iniciar sem segredo adequado; verificar expiração, algoritmo, revogação e invalidação após evento de segurança |
| SEC-005 / P1 | `/api/payments/status` consulta por identificador sem checagem de usuário/propriedade no handler | Validar autenticação e titularidade; impedir consulta ou atualização de pagamentos de outra conta |
| SEC-006 / P1 | Criação de pagamento aceita `simulate`; falha Mercado Pago pode cair em mock; ramo Pagar.me permanece | Rejeitar simulação em produção; erro explícito do provedor; roteamento estrito e retirada da Stone |
| SEC-007 / P1 | Webhook Mercado Pago consulta a API do provedor, mas não verifica assinatura no handler; concessão não confere todos os atributos do pedido | Verificar assinatura, conta recebedora, ambiente, moeda, valor, vínculo, replay e transição idempotente; tratar retentativa sem perda de eventos |
| SEC-008 / P1 | Trial e limites são consultados/alterados em operações separadas | Testar requisições concorrentes, atomicidade, repetição, consumo após sucesso e resistência a bypass por API |
| SEC-009 / a verificar | Carrosséis têm checagem de propriedade em `owned`; atualizações de template não repetem explicitamente checagem do plano | Testes cruzados com contas A/B para todos os recursos e rejeição de recursos pagos em endpoints de atualização |

Esses achados descrevem o repositório, não comprovam exposição pública atual. A configuração de infraestrutura pode adicionar controles e precisa ser examinada. Cookies HttpOnly/Secure em produção e checagem de propriedade de carrosséis são controles existentes a preservar e testar.

#### Cobertura da auditoria

| Área | Ações e evidência exigida |
|---|---|
| Autenticação | Cadastro, senha/hash, recuperação, verificação de e-mail, provedores, força bruta, enumeração e tomada de conta |
| Sessões | Assinatura, segredo, validade, cookies, logout efetivo, revogação, roubo/fixação e cache de conteúdo privado |
| Autorização SaaS | Duas contas independentes; leitura/escrita/exclusão de carrosséis, kit de marca, pagamentos, leads e recursos por plano |
| APIs e entradas | Tipos, tamanhos antes do parse, campos inesperados, JSON inválido, limites, validação server-side, injeção, XSS e erro sem detalhes internos |
| Uploads e conteúdo | MIME real, tamanho, dimensões, SVG, data URLs, URLs externas, persistência e uso no exportador; SSRF somente onde houver busca no servidor |
| Abuso e concorrência | Rate limit distribuído por ação/conta/IP, proxy confiável, cadastros automatizados, spam de leads, cota de IA, retries e duplo clique |
| Pagamentos | Preço definido pelo servidor, vínculo de pedido, idempotência, webhook, simulação, QR, expiração, estorno, revogação e dados de cartão fora de logs |
| Navegador e transporte | HTTPS, headers, CSP compatível com exportador/fontes, proteção contra enquadramento, CSRF, CORS e origens permitidas |
| Dados e banco | Acesso mínimo, segregação de ambientes, backups, restauração comprovada, retenção, exclusão e acesso a arquivos do banco |
| Segredos e dependências | Segredos no cliente/build/histórico, chaves por ambiente, rotação, lockfile, advisories e análise de alcançabilidade; sem `audit fix` indiscriminado |
| Infraestrutura | Acesso ao hosting, permissões de deploy, variáveis, banco, logs, domínios, alertas, tarefas agendadas e integrações ativas |
| IA e terceiros | Trânsito de prompts/dados, limites de custo, timeouts, tratamento de resposta externa não confiável e fallback transparente |
| Operação e privacidade | Redação de logs, acesso de suporte, incidentes, preservação de evidência, exclusão e atendimento às solicitações |

O banco informado pelo responsável é Supabase. Incluir RLS, permissões e isolamento de chaves públicas/privilegiadas; o schema Prisma local ainda indica SQLite. Tratar essa divergência como item de alinhamento técnico, sem substituir a arquitetura confirmada pelo estado do arquivo local.

Executar testes de abuso, concorrência, acesso entre contas, reembolso e exclusão em homologação com dados sintéticos. Em produção, iniciar por verificações não destrutivas e configuração, com controles de impacto definidos. Não gerar cobrança real nem apagar dados de clientes para demonstrar uma falha.

Entregas: inventário de superfícies, matriz ASVS aplicável, registro de riscos com severidade e evidência, plano de correção, testes de regressão, reteste independente por critério e riscos residuais. Itens não testáveis ficam explicitamente pendentes.

### 5.8 Critérios para encerrar a futura execução

- Todos os itens funcionais inventariados têm resultado e evidência; funções bloqueadas estão identificadas e não anunciadas como concluídas.
- Nenhum P0/P1 de segurança fica sem correção verificada ou decisão documentada sobre contenção e risco residual; exposição crítica exige contenção antes de ampliar uso.
- Fluxos de cadastro, criação, edição, persistência, limites e compra passam em cenários normais e de falha com perfis distintos.
- Nenhuma integração ativa ou nova cobrança usa Stone/Pagar.me; histórico e transição foram tratados.
- Contato correto, Política de Privacidade e Termos de Uso estão acessíveis e correspondem à operação.
- Regressão confirma menus, mobile/tablet/desktop, teclado, exportações existentes e confirmação de pagamento.
- Melhorias de design, SEO e copy são priorizadas com base nos resultados, mantendo os planos anteriores como parte do mesmo backlog.

**Status desta atualização:** documentação integrada. Nenhuma retirada, mudança de e-mail no aplicativo, publicação jurídica, teste funcional completo ou correção de segurança foi executada.

## 6. Ecossistema confirmado e painel administrativo

Esta seção incorpora a definição do responsável e complementa os testes e a auditoria anteriores. Tudo segue como planejamento: não foram criados painel, conta administrativa, tabelas, políticas ou deploys.

### 6.1 Arquitetura de referência

| Componente | Responsabilidade | Ações planejadas |
|---|---|---|
| GitHub | Código, revisão e histórico | Branch de trabalho, revisão, verificações automatizadas e proteção da branch de produção |
| Vercel | Build, hospedagem Next.js e deploy | Conectar repositório, separar preview/produção, variáveis por ambiente, logs, domínio e rollback |
| Supabase PostgreSQL | Dados persistentes do SaaS | Modelo versionado, migrações, acesso mínimo, RLS aplicável, backups e restauração |
| Mercado Pago | Processamento e confirmação financeira | Integração real, webhook validado, reconciliação e estados confiáveis |
| Aplicação Next.js | Interface, sessão e regras | Autorização no servidor, integração com banco e separação entre uso comum e administração |

Supabase como banco não implica automaticamente migração para Supabase Auth. O código atual tem sessão própria com JWT; na implementação, escolher e documentar uma única fonte de identidade. Se mantiver sessão própria com Prisma, não presumir que `auth.uid()` do Supabase reconhecerá essa sessão. Conexões privilegiadas podem contornar RLS e precisam de autorização explícita no servidor.

### 6.2 Alinhamento com o repositório

- `prisma/schema.prisma` declara SQLite e `src/lib/db.ts` instancia Prisma; existe também `src/lib/supabase.ts`. Verificar o caminho realmente usado no deploy e consolidar a persistência no Supabase PostgreSQL.
- Prisma pode continuar como camada de acesso ao PostgreSQL; não é necessário trocar o ORM apenas por usar Supabase. Validar conexão, pooling compatível com Vercel, migrações e transações.
- Inventariar usuários, projetos, marca, pagamentos, uso, leads e futuros eventos administrativos. Caso existam dados a transferir, planejar backup, validação de contagens/vínculos, corte e reversão.
- Chaves secretas/privilegiadas e conexão de banco permanecem no servidor. Chaves públicas no navegador só com permissões e políticas adequadas. Inspecionar build e importações para evitar vazamento.
- Preview não deve gravar no banco de produção, usar pagamentos reais nem processar o webhook de produção. Separar credenciais, URLs e dados; documentar o ambiente quando não houver projeto isolado disponível.
- Deploy não deve executar mudança destrutiva de schema implicitamente. Separar migração, verificação de compatibilidade e liberação da aplicação; rollback de código não reverte automaticamente o banco.

### 6.3 Conta única de administrador e login normal

Fluxo proposto: pessoa entra no login existente → servidor valida identidade e sessão → consulta permissão protegida → administrador recebe acesso ao painel; usuário comum segue para o workspace. Não criar um segundo formulário de login. Permitir ao administrador abrir o workspace normal sem perder acesso ao painel.

Definir uma rota administrativa, por exemplo `/admin`, com item de menu visível somente para essa conta. Ocultar o menu é conveniência; página, APIs, consultas e canais de tempo real também exigem autorização no servidor.

Regras obrigatórias:

1. Vincular o administrador a um identificador imutável de conta, provisionado de forma controlada. O e-mail da conta administrativa ainda não foi informado; **comercial@splinkapp.com.br é o contato confirmado, não uma autorização automática de administração**.
2. Garantir no banco/regra de provisionamento que exista no máximo um administrador ativo. Não implementar como “primeiro cadastro vira admin”.
3. Nenhuma entrada pública de cadastro, edição de perfil, parâmetro de URL ou metadata editável pelo usuário pode conceder ou alterar esse privilégio.
4. Identidade precisa estar comprovada antes de conceder privilégios. Corrigir o login social inseguro identificado antes de permitir administração pela mesma sessão.
5. Validar permissão em cada operação sensível; sessão antiga não pode manter acesso após revogação. Definir expiração, reautenticação e proteção adicional para a conta privilegiada, mantendo o login de entrada comum.
6. Registrar ações administrativas sem senhas, tokens ou dados de cartão. Não adicionar impersonação, alteração manual de plano, reembolso ou exclusão de clientes apenas por existir um painel de acompanhamento; essas capacidades exigem escopo e controles próprios.
7. Documentar recuperação e transferência da única conta administrativa, revogando a anterior antes de ativar outra. Não criar administrador reserva silenciosamente.

### 6.4 Escopo funcional do painel

| Área | Informação planejada | Regras de qualidade |
|---|---|---|
| Visão geral | Cadastros, usuários ativos, contas pagas, vendas aprovadas e falhas importantes | Filtros de período, fuso explícito e definição de cada indicador |
| Acessos em tempo real | Pessoas/sessões online, última atividade e área em uso quando necessária | Presença autenticada, deduplicação, expiração e sinal de conexão interrompida |
| Cadastros | Usuário, data, plano, estado da conta e última atividade | Busca, paginação, acesso mínimo e separação entre lead e conta cadastrada |
| Vendas | Pedido, usuário, valor, método, status e horários | Distinguir pendente/aprovado/recusado/cancelado/reembolsado; evitar duplicação por webhook |
| Uso do produto | Criações, gerações e exportações efetivamente registradas | Contar eventos concluídos; não inferir uso de mera abertura de tela |
| Operação | Falhas de pagamento/geração, sincronização e integrações | Dados seguros e acionáveis; não reproduzir payloads sensíveis completos |

Começar com acompanhamento em leitura. Valores financeiros vêm de registros conciliados com Mercado Pago; presença online não prova cadastro, pagamento ou engajamento. Receita aprovada, reembolso e valor líquido devem ter definições distintas; não chamar total aprovado de lucro.

### 6.5 O que significa “tempo real”

Definir previamente presença online, última atividade e janela de expiração. Proposta inicial: heartbeat periódico com expiração após algumas janelas perdidas, a calibrar em homologação. Deduplicar usuário com múltiplas abas e identificar visitante anônimo separadamente de conta autenticada.

Avaliar Supabase Realtime Presence ou registro de sessões/heartbeat no servidor. A escolha depende da autenticação definida, volume e privacidade. O navegador pode indicar presença, mas não pode afirmar que é administrador ou alterar a presença de outra conta. Canais de observação administrativa devem ser privados/autorizados; listas de usuários e e-mails não podem ser transmitidas a clientes comuns.

Persistir eventos necessários ao histórico separadamente da presença efêmera. Após queda da conexão, reconectar, refazer snapshot e indicar dados desatualizados; não apresentar contador congelado como atual. Definir meta de atualização observável e validar na Vercel, sem depender de memória ou processo local permanente de uma função serverless.

Registrar eventos e metadados mínimos para acompanhamento. Definir retenção e refletir finalidades na Política de Privacidade. Não registrar indiscriminadamente texto digitado, conteúdo dos carrosséis ou atividade externa ao SaaS.

Referências técnicas para a futura implementação: [Supabase Presence](https://supabase.com/docs/guides/realtime/presence) e [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

### 6.6 Testes adicionados ao plano

Todos **planejados / não executados**:

| ID | Evidência exigida |
|---|---|
| TEST-ADMIN-001 | Mesmo login reconhece a conta autorizada; usuário comum e visitante não acessam página, APIs ou canais administrativos nem por URL direta |
| TEST-ADMIN-002 | Alterar perfil, request, metadata ou plano não promove usuário; segunda atribuição concorrente de admin é rejeitada |
| TEST-ADMIN-003 | Revogação e expiração retiram acesso; recuperação mantém somente um admin ativo; ações ficam auditáveis |
| TEST-LIVE-001 | Duas abas contam conforme definição; fechar, perder rede, suspender dispositivo e sair expiram presença; reconexão atualiza snapshot |
| TEST-REPORT-001 | Filtros, paginação, limites de data/fuso e cadastros conferem com fixtures; leads não inflam número de usuários |
| TEST-REPORT-002 | Eventos duplicados/fora de ordem, reembolso e pagamento pendente não inflam vendas/receita; registros conferem com sandbox Mercado Pago |
| TEST-DB-001 | Persistência real no Supabase após novo deploy; contas A/B isoladas; anon/usuário não consultam dados administrativos via Data API, RPC ou Realtime |
| TEST-DB-002 | Conexões concorrentes e transações funcionam na Vercel; backup restaura vínculos e dados em ambiente separado |
| TEST-DEPLOY-001 | GitHub → preview → produção reproduz build; segredos isolados; webhook usa ambiente correto; falha de migração tem contenção e recuperação documentadas |

### 6.7 Ajuste de prioridades

Antes de construir relatórios administrativos: conter riscos de autenticação/pagamento, consolidar banco e fonte de identidade, definir a conta privilegiada e as métricas. Depois instrumentar eventos reais, montar painel e presença, validar isolamento e reconciliar vendas. Então incorporar o painel ao design, navegação, política e regressão do SaaS.

Aceite adicional: um único administrador, login compartilhado com o fluxo normal, autorização completa no servidor, dados confiáveis no Supabase, indicadores rastreáveis e tempo real com estado de conexão explícito. Nenhum número fictício é usado para preencher a visão administrativa.

### 6.8 Criação das tabelas e primeiro deploy

O responsável informou que ainda não criou as tabelas no Supabase. Essa preparação não depende de a Vercel estar online. Ordem: configurar conexão PostgreSQL → alinhar schema e acesso → preparar/revisar migração inicial e permissões → aplicar no banco correto → gerar cliente → configurar variáveis na Vercel → publicar e testar persistência.

No momento da verificação não existem migrações em `prisma/migrations` nem `supabase/migrations`; o schema ainda declara SQLite. Portanto, executar `prisma migrate deploy` agora não criaria o modelo pretendido no Supabase. Depois de preparar migrações Prisma para PostgreSQL, esse comando pode aplicá-las no ambiente de destino. `prisma generate` gera o cliente e não cria tabelas. Não usar `db pull` para tentar criar tabelas: ele lê a estrutura existente.

Escolher uma fonte de migrações para as tabelas da aplicação e coordenar SQL de segurança/Realtime, evitando alterações concorrentes sem histórico entre Prisma e SQL Editor. Criar tabelas não transfere automaticamente os dados locais e não configura autorização por si só. Referência: [Prisma com Supabase](https://supabase.com/docs/guides/database/prisma).

**Build informado da Vercel:** commit `565fc51`, erro de exportação de `FREE_TEMPLATE_IDS`. A cópia local consultada já está no commit `9b3be6d`, que contém a exportação. `npm run build` local terminou com código 0; houve mensagem de prerender de `cookies()` em `/api/auth/me`, ainda a revisar separadamente. Nenhuma correção de código foi necessária nesta verificação. Conferir repositório/branch/commit ligados à Vercel, pois o repositório citado no log não corresponde ao origin local. Não foi feito push ou redeploy.

## Limites e registro da análise

Avaliações independentes: A `/root/design_review` e B `/root/browser_evidence`. Detector Impeccable tentado e indisponível: engine ausente, cache sem permissão. Nenhuma contagem automática, nota Lighthouse ou aprovação de contraste foi inventada. Não houve overlay do detector.

Alvo: `src/app/page.tsx`; slug automático indisponível com o engine. Sem lista de exclusões aplicada. O servidor temporário anunciou localhost:3001, mas encerrou por detectar outro Next.js existente. A tentativa inicial de navegador nessa porta falhou. Em seguida, a revisão principal abriu o servidor já existente em localhost:3000 e inspecionou a primeira dobra renderizada, sem cadastro ou envio. O servidor preexistente foi preservado.

Na captura desktop de aproximadamente 1264 × 710 px, a headline ocupa três linhas; o produto demonstrado não aparece na primeira dobra; cronômetro, badge, destaque verde, CTA com gradiente e toast comercial disputam atenção. Isso confirma a prioridade de reduzir ruído e antecipar o resultado. O popup de comunidade também foi observado e fechado. A árvore de acessibilidade mostrou o exemplo de tema low carb acompanhado de conteúdo de treino/hipertrofia: revisar coerência temática do gerador local.

Não houve validação renderizada de todas as áreas, mobile ou tablet; seus achados permanecem fundamentados no código. Não houve overlay nem arquivos temporários de detector a limpar. Nenhuma alteração de interface, integração ou regra de negócio realizada.

Questões de fechamento dispensadas: o pedido atual é uma análise com planos; decisões pendentes de oferta e integrações foram registradas como dependências da execução.
