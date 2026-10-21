export type NicheId =
  | "nutricao"
  | "fitness"
  | "odontologia"
  | "direito"
  | "marketing"
  | "saude"
  | "educacao"
  | "estetica"
  | "contabilidade"
  | "viagem"
  | "beleza"
  | "financas"
  | "imobiliario"
  | "religiao"
  | "autoestima";

export interface NicheContent {
  id: NicheId;
  name: string;
  emoji: string;
  ring: [string, string];
  sampleTopic: string;
  cover: { kicker: string; title: string; subtitle: string };
  tips: { title: string; body: string }[];
  list: { title: string; bullets: string[] };
  stat: { value: string; title: string; body: string };
  quote: { text: string; author: string };
  cta: { title: string; body: string; cta: string };
  hashtags: string[];
}

export const NICHES: NicheContent[] = [
  {
    id: "nutricao",
    name: "Nutrição",
    emoji: "🥗",
    ring: ["#22c55e", "#a3e635"],
    sampleTopic: "5 erros que sabotam sua dieta sem você perceber",
    cover: {
      kicker: "Nutrição sem neura",
      title: "5 erros que sabotam sua dieta sem você perceber",
      subtitle: "O número 3 quase todo mundo comete no café da manhã.",
    },
    tips: [
      {
        title: "Pular refeições para “compensar”",
        body: "Ficar horas sem comer aumenta a fome e leva a exageros no fim do dia. Constância vence restrição.",
      },
      {
        title: "Beber pouca água",
        body: "Desidratação leve é confundida com fome. Mire em 35 ml por kg de peso ao longo do dia.",
      },
      {
        title: "Café da manhã só de carboidrato",
        body: "Pão + café puro dá energia rápida e fome rápida. Inclua proteína: ovos, iogurte ou queijo.",
      },
      {
        title: "Confiar em produtos “fit”",
        body: "Rótulo bonito não é sinônimo de saudável. Leia a lista de ingredientes: menos é mais.",
      },
      {
        title: "Dormir mal",
        body: "Menos de 6h de sono desregula grelina e leptina, os hormônios da fome e da saciedade.",
      },
    ],
    list: {
      title: "Monte um prato equilibrado",
      bullets: [
        "½ prato de vegetais coloridos",
        "¼ de proteína magra",
        "¼ de carboidrato integral",
        "1 fonte de gordura boa",
      ],
    },
    stat: {
      value: "73%",
      title: "das pessoas confundem sede com fome",
      body: "Antes de beliscar, beba um copo d’água e espere 10 minutos.",
    },
    quote: {
      text: "Não existe alimento proibido. Existe excesso e falta de estratégia.",
      author: "Nutri. Ana Ribeiro",
    },
    cta: {
      title: "Salve para lembrar na próxima refeição",
      body: "E mande para aquela amiga que vive começando a dieta na segunda.",
      cta: "Salvar e compartilhar",
    },
    hashtags: ["#nutricao", "#alimentacaosaudavel", "#dieta", "#saude"],
  },
  {
    id: "fitness",
    name: "Treino",
    emoji: "💪",
    ring: ["#f97316", "#ef4444"],
    sampleTopic: "Como ganhar massa muscular treinando só 3x por semana",
    cover: {
      kicker: "Treino inteligente",
      title: "Ganhe massa treinando só 3x por semana",
      subtitle: "Menos tempo na academia, mais resultado no espelho.",
    },
    tips: [
      {
        title: "Priorize exercícios compostos",
        body: "Agachamento, supino, remada e terra recrutam vários músculos de uma vez. Mais estímulo por minuto.",
      },
      {
        title: "Progrida a carga toda semana",
        body: "Sem sobrecarga progressiva não há adaptação. Anote seus treinos e tente superar a última sessão.",
      },
      {
        title: "Treine perto da falha",
        body: "Pare a 1–2 repetições da falha. É ali que o estímulo para hipertrofia acontece.",
      },
      {
        title: "Coma proteína suficiente",
        body: "Entre 1,6 e 2,2 g por kg de peso por dia, distribuída em 3–5 refeições.",
      },
      {
        title: "Descanso também é treino",
        body: "O músculo cresce na recuperação. 7–9h de sono valem tanto quanto a série extra.",
      },
    ],
    list: {
      title: "Treino Full Body A",
      bullets: [
        "Agachamento livre 4x8",
        "Supino reto 4x8",
        "Remada curvada 4x10",
        "Desenvolvimento 3x10",
        "Prancha 3x40s",
      ],
    },
    stat: {
      value: "3x",
      title: "por semana é suficiente para hipertrofia",
      body: "Desde que o volume semanal por grupo muscular seja de 10 a 20 séries.",
    },
    quote: {
      text: "Disciplina é fazer o treino mesmo quando a motivação foi embora.",
      author: "Coach Rafa Lima",
    },
    cta: {
      title: "Salve esse treino e comece hoje",
      body: "Marque o parceiro de academia que precisa ver isso.",
      cta: "Salvar treino",
    },
    hashtags: ["#treino", "#hipertrofia", "#academia", "#fitness"],
  },
  {
    id: "odontologia",
    name: "Odonto",
    emoji: "🦷",
    ring: ["#06b6d4", "#3b82f6"],
    sampleTopic: "Hábitos que estão manchando seus dentes",
    cover: {
      kicker: "Sorriso saudável",
      title: "7 hábitos que estão manchando seus dentes",
      subtitle: "E como manter o clareamento por muito mais tempo.",
    },
    tips: [
      {
        title: "Escovar logo após o café",
        body: "O ácido amolece o esmalte. Espere 30 minutos e enxágue com água antes de escovar.",
      },
      {
        title: "Esquecer o fio dental",
        body: "A escova não alcança 40% da superfície dos dentes. O fio faz o resto.",
      },
      {
        title: "Usar canudo? Use!",
        body: "Para café, refrigerante e sucos escuros, o canudo reduz o contato com os dentes da frente.",
      },
      {
        title: "Escova velha demais",
        body: "Cerdas abertas não limpam. Troque a cada 3 meses ou após gripes.",
      },
      {
        title: "Pular a consulta semestral",
        body: "Tártaro só sai com profissional. A limpeza preventiva evita tratamentos caros.",
      },
    ],
    list: {
      title: "Kit do sorriso perfeito",
      bullets: [
        "Escova de cerdas macias",
        "Creme dental com flúor",
        "Fio ou fita dental",
        "Limpador de língua",
      ],
    },
    stat: {
      value: "40%",
      title: "da superfície dental a escova não alcança",
      body: "Por isso o fio dental não é opcional.",
    },
    quote: {
      text: "Prevenir custa uma consulta. Tratar pode custar um dente.",
      author: "Dra. Camila Souza",
    },
    cta: {
      title: "Agende sua avaliação",
      body: "Link na bio. Primeira consulta com avaliação completa do sorriso.",
      cta: "Agendar agora",
    },
    hashtags: ["#odontologia", "#dentista", "#sorriso", "#saudebucal"],
  },
  {
    id: "direito",
    name: "Direito",
    emoji: "⚖️",
    ring: ["#a16207", "#1e3a8a"],
    sampleTopic: "Direitos do consumidor que quase ninguém conhece",
    cover: {
      kicker: "Direito descomplicado",
      title: "6 direitos do consumidor que ninguém te conta",
      subtitle: "Guarde este post antes da próxima compra.",
    },
    tips: [
      {
        title: "7 dias para desistir",
        body: "Comprou online ou por telefone? Você pode desistir em até 7 dias sem justificar (art. 49 do CDC).",
      },
      {
        title: "Preço na gôndola vale",
        body: "Se o preço do caixa for maior que o da prateleira, você paga o menor.",
      },
      {
        title: "Cobrança indevida em dobro",
        body: "Pagou algo que não devia? Tem direito à devolução em dobro, com correção.",
      },
      {
        title: "Fila de banco tem limite",
        body: "Muitos municípios têm leis com tempo máximo de espera, geralmente de 15 a 30 minutos.",
      },
      {
        title: "Produto com defeito",
        body: "A loja tem 30 dias para consertar. Se não resolver, você escolhe: troca, abatimento ou dinheiro de volta.",
      },
    ],
    list: {
      title: "Antes de assinar qualquer contrato",
      bullets: [
        "Leia multas e prazos de fidelidade",
        "Peça cópia assinada",
        "Desconfie de cláusulas em letra miúda",
        "Guarde todos os comprovantes",
      ],
    },
    stat: {
      value: "7 dias",
      title: "é o prazo de arrependimento em compras online",
      body: "Garantido pelo artigo 49 do Código de Defesa do Consumidor.",
    },
    quote: {
      text: "Quem conhece seus direitos não é enganado duas vezes.",
      author: "Dr. Paulo Mendes, OAB/SP",
    },
    cta: {
      title: "Compartilhe com quem precisa saber",
      body: "Informação jurídica de qualidade, toda semana aqui no perfil.",
      cta: "Seguir o perfil",
    },
    hashtags: ["#direito", "#direitodoconsumidor", "#advogado", "#cdc"],
  },
  {
    id: "marketing",
    name: "Marketing",
    emoji: "📈",
    ring: ["#8b5cf6", "#ec4899"],
    sampleTopic:
      "5 lições práticas para pequenos negócios melhorarem o conteúdo",
    cover: {
      kicker: "Marketing que vende",
      title: "5 lições para seu conteúdo parar de flopar",
      subtitle: "Aplicáveis hoje, mesmo sem equipe ou orçamento.",
    },
    tips: [
      {
        title: "O gancho é 80% do post",
        body: "Se a primeira linha não prende, o resto não existe. Prometa um benefício claro ou provoque curiosidade.",
      },
      {
        title: "Fale com uma pessoa só",
        body: "Conteúdo para todo mundo não conecta com ninguém. Escreva para o seu cliente ideal.",
      },
      {
        title: "Carrossel gera salvamento",
        body: "Salvamentos e compartilhamentos pesam mais no algoritmo que curtidas. Entregue valor guardável.",
      },
      {
        title: "Consistência > perfeição",
        body: "3 posts bons por semana, todas as semanas, vencem 1 post perfeito por mês.",
      },
      {
        title: "Todo post precisa de um CTA",
        body: "Diga o que fazer: salvar, comentar, mandar para alguém ou clicar no link.",
      },
    ],
    list: {
      title: "Estrutura de um carrossel viral",
      bullets: [
        "Slide 1: gancho forte",
        "Slides 2–8: uma ideia por slide",
        "Slide 9: resumo",
        "Slide 10: CTA claro",
      ],
    },
    stat: {
      value: "3,1x",
      title: "mais alcance médio dos carrosséis",
      body: "Comparado a posts de imagem única no Instagram.",
    },
    quote: {
      text: "As pessoas não compram produtos. Compram versões melhores de si mesmas.",
      author: "Lição de marketing",
    },
    cta: {
      title: "Quer mais estratégias assim?",
      body: "Siga o perfil e ative as notificações. Conteúdo novo toda semana.",
      cta: "Seguir agora",
    },
    hashtags: [
      "#marketingdigital",
      "#conteudo",
      "#empreendedorismo",
      "#socialmedia",
    ],
  },
  {
    id: "saude",
    name: "Saúde",
    emoji: "🩺",
    ring: ["#0ea5e9", "#14b8a6"],
    sampleTopic: "Sinais de que você precisa cuidar mais do seu coração",
    cover: {
      kicker: "Saúde em dia",
      title: "6 sinais de que seu coração pede atenção",
      subtitle: "Não ignore o número 4.",
    },
    tips: [
      {
        title: "Cansaço desproporcional",
        body: "Subir um lance de escada virou desafio? Fadiga fora do normal merece investigação.",
      },
      {
        title: "Inchaço nos tornozelos",
        body: "Retenção de líquido pode indicar que o coração não está bombeando com eficiência.",
      },
      {
        title: "Falta de ar ao deitar",
        body: "Precisar de mais travesseiros para respirar bem é um alerta importante.",
      },
      {
        title: "Pressão acima de 14 por 9",
        body: "Hipertensão é silenciosa. Meça a pressão regularmente, mesmo sem sintomas.",
      },
      {
        title: "Palpitações frequentes",
        body: "Coração disparado sem motivo aparente deve ser avaliado por um cardiologista.",
      },
    ],
    list: {
      title: "Check-up anual essencial",
      bullets: [
        "Hemograma completo",
        "Glicemia e colesterol",
        "Pressão arterial",
        "Eletrocardiograma",
      ],
    },
    stat: {
      value: "1 em 3",
      title: "adultos brasileiros tem pressão alta",
      body: "E metade deles não sabe disso.",
    },
    quote: {
      text: "O melhor tratamento continua sendo a prevenção.",
      author: "Dr. Marcos Tavares, CRM",
    },
    cta: {
      title: "Cuide de quem você ama",
      body: "Compartilhe este post com sua família.",
      cta: "Compartilhar",
    },
    hashtags: ["#saude", "#cardiologia", "#prevencao", "#bemestar"],
  },
  {
    id: "educacao",
    name: "Educação",
    emoji: "📚",
    ring: ["#eab308", "#f97316"],
    sampleTopic: "Técnicas de estudo comprovadas pela ciência",
    cover: {
      kicker: "Estude melhor",
      title: "5 técnicas de estudo comprovadas pela ciência",
      subtitle: "Pare de reler o resumo. Comece a aprender de verdade.",
    },
    tips: [
      {
        title: "Recordação ativa",
        body: "Feche o livro e tente explicar o conteúdo. Puxar da memória fixa muito mais que reler.",
      },
      {
        title: "Repetição espaçada",
        body: "Revise em 1, 3, 7 e 15 dias. O esquecimento planejado fortalece a memória.",
      },
      {
        title: "Técnica Pomodoro",
        body: "25 minutos de foco total, 5 de pausa. A cada 4 ciclos, uma pausa longa.",
      },
      {
        title: "Intercale assuntos",
        body: "Misturar tipos de problema treina o cérebro a escolher a estratégia certa.",
      },
      {
        title: "Ensine alguém",
        body: "Se você não consegue explicar de forma simples, ainda não entendeu bem.",
      },
    ],
    list: {
      title: "Rotina de estudo ideal",
      bullets: [
        "Defina a meta do dia",
        "Celular em outro cômodo",
        "Blocos de 25 min",
        "Revisão antes de dormir",
      ],
    },
    stat: {
      value: "50%",
      title: "a mais de retenção com recordação ativa",
      body: "Comparado à simples releitura do material.",
    },
    quote: {
      text: "Aprender é a única coisa que a mente nunca se cansa.",
      author: "Leonardo da Vinci",
    },
    cta: {
      title: "Salve e use na próxima sessão de estudos",
      body: "Marque um colega de estudos.",
      cta: "Salvar",
    },
    hashtags: ["#estudos", "#concurso", "#vestibular", "#educacao"],
  },
  {
    id: "estetica",
    name: "Estética",
    emoji: "✨",
    ring: ["#f472b6", "#c084fc"],
    sampleTopic: "Cuidados com a pele antes e depois de procedimentos",
    cover: {
      kicker: "Estética consciente",
      title: "O que fazer antes e depois do seu procedimento",
      subtitle: "Resultados melhores começam em casa.",
    },
    tips: [
      {
        title: "Suspenda ácidos 5 dias antes",
        body: "Retinoides e ácidos deixam a pele sensível e aumentam o risco de irritação.",
      },
      {
        title: "Hidrate de dentro para fora",
        body: "Pele hidratada responde melhor e se recupera mais rápido.",
      },
      {
        title: "Protetor solar é obrigatório",
        body: "Depois de qualquer procedimento, FPS 50 reaplicado a cada 3 horas.",
      },
      {
        title: "Evite calor intenso",
        body: "Sauna, academia pesada e sol forte nas primeiras 48h podem prejudicar o resultado.",
      },
      {
        title: "Siga o protocolo à risca",
        body: "Os cuidados pós são tão importantes quanto o procedimento em si.",
      },
    ],
    list: {
      title: "Skincare básico que funciona",
      bullets: [
        "Limpeza suave",
        "Vitamina C pela manhã",
        "Hidratante",
        "Protetor solar FPS 50",
      ],
    },
    stat: {
      value: "80%",
      title: "do envelhecimento da pele vem do sol",
      body: "Protetor solar é o melhor anti-idade que existe.",
    },
    quote: {
      text: "Beleza é cuidar de si com constância, não com pressa.",
      author: "Dra. Juliana Prado",
    },
    cta: {
      title: "Agende sua avaliação facial",
      body: "Vagas limitadas este mês. Link na bio.",
      cta: "Quero agendar",
    },
    hashtags: ["#estetica", "#skincare", "#harmonizacao", "#pele"],
  },
  {
    id: "contabilidade",
    name: "Contábil",
    emoji: "🧾",
    ring: ["#10b981", "#0f766e"],
    sampleTopic: "Erros fiscais que podem quebrar seu pequeno negócio",
    cover: {
      kicker: "Contabilidade sem mistério",
      title: "5 erros fiscais que quebram pequenos negócios",
      subtitle: "Evite multas e durma tranquilo.",
    },
    tips: [
      {
        title: "Misturar contas PF e PJ",
        body: "Pagar contas pessoais com o CNPJ bagunça o caixa e chama atenção do fisco.",
      },
      {
        title: "Regime tributário errado",
        body: "Simples nem sempre é o mais barato. Uma análise pode reduzir muito seus impostos.",
      },
      {
        title: "Não emitir nota fiscal",
        body: "Além de ilegal, você perde credibilidade e acesso a crédito.",
      },
      {
        title: "Esquecer o pró-labore",
        body: "Retirar lucro sem pró-labore definido gera problemas com INSS e IR.",
      },
      {
        title: "Atrasar obrigações",
        body: "Multas por atraso de declarações se acumulam rápido. Tenha um calendário fiscal.",
      },
    ],
    list: {
      title: "Checklist mensal do MEI",
      bullets: [
        "Pagar o DAS até dia 20",
        "Emitir notas fiscais",
        "Controlar o faturamento",
        "Guardar comprovantes",
      ],
    },
    stat: {
      value: "R$ 81 mil",
      title: "é o limite anual de faturamento do MEI",
      body: "Ultrapassou? Planeje a migração antes de ser desenquadrado.",
    },
    quote: {
      text: "Empresa organizada não paga imposto a mais nem multa a toa.",
      author: "Contadora Renata Alves, CRC",
    },
    cta: {
      title: "Fale com um contador",
      body: "Diagnóstico gratuito para sua empresa. Chama no direct!",
      cta: "Chamar no direct",
    },
    hashtags: ["#contabilidade", "#mei", "#impostos", "#empreendedor"],
  },
  {
    id: "viagem",
    name: "Viagem",
    emoji: "✈️",
    ring: ["#38bdf8", "#6366f1"],
    sampleTopic: "Como economizar até 40% na sua próxima viagem",
    cover: {
      kicker: "Viaje mais, gaste menos",
      title: "Como economizar até 40% na próxima viagem",
      subtitle: "Truques que as agências não contam.",
    },
    tips: [
      {
        title: "Compre com antecedência certa",
        body: "Voos nacionais: 6 a 8 semanas antes. Internacionais: 3 a 5 meses.",
      },
      {
        title: "Seja flexível nas datas",
        body: "Voar terça ou quarta pode custar até 30% menos que sexta ou domingo.",
      },
      {
        title: "Use alertas de preço",
        body: "Configure alertas e compre quando a tarifa cair abaixo da média.",
      },
      {
        title: "Fuja da alta temporada",
        body: "Viajar uma semana antes ou depois do pico muda tudo no preço da hospedagem.",
      },
      {
        title: "Acumule e use milhas",
        body: "Concentre gastos em um cartão que pontua e transfira em promoções bonificadas.",
      },
    ],
    list: {
      title: "Checklist antes de embarcar",
      bullets: [
        "Documentos e passaporte",
        "Seguro viagem",
        "Cópias digitais",
        "Adaptador de tomada",
      ],
    },
    stat: {
      value: "40%",
      title: "de economia média com datas flexíveis",
      body: "Comparando os dias mais caros e mais baratos do mês.",
    },
    quote: {
      text: "Viajar é a única coisa que você compra e te deixa mais rico.",
      author: "Provérbio viajante",
    },
    cta: {
      title: "Salve para planejar sua próxima viagem",
      body: "E marque quem vai com você!",
      cta: "Salvar dicas",
    },
    hashtags: ["#viagem", "#dicasdeviagem", "#milhas", "#turismo"],
  },
  {
    id: "beleza",
    name: "Beleza",
    emoji: "💄",
    ring: ["#fb7185", "#f59e0b"],
    sampleTopic: "Erros de maquiagem que envelhecem",
    cover: {
      kicker: "Make sem erro",
      title: "6 erros de maquiagem que envelhecem",
      subtitle: "Pequenos ajustes, rosto muito mais iluminado.",
    },
    tips: [
      {
        title: "Base em excesso",
        body: "Camadas grossas marcam linhas de expressão. Menos produto, mais preparação da pele.",
      },
      {
        title: "Pó em todo o rosto",
        body: "Use pó apenas na zona T. O resto do rosto precisa de viço.",
      },
      {
        title: "Corretivo muito claro",
        body: "Escolha no máximo 1 tom acima da base para não destacar olheiras.",
      },
      {
        title: "Sobrancelha muito marcada",
        body: "Traços duros pesam o olhar. Preencha com fios e esfume.",
      },
      {
        title: "Esquecer o blush",
        body: "Um toque nas maçãs traz frescor e rejuvenesce na hora.",
      },
    ],
    list: {
      title: "Make leve em 5 minutos",
      bullets: [
        "Hidratante com cor",
        "Corretivo pontual",
        "Blush cremoso",
        "Máscara de cílios",
        "Gloss",
      ],
    },
    stat: {
      value: "5 min",
      title: "é tudo que você precisa para uma make leve",
      body: "Com os produtos certos e a ordem certa.",
    },
    quote: {
      text: "Maquiagem é para realçar quem você é, não esconder.",
      author: "Make artist Bia Costa",
    },
    cta: {
      title: "Qual erro você cometia?",
      body: "Conta nos comentários e salva para não esquecer!",
      cta: "Comentar",
    },
    hashtags: ["#maquiagem", "#make", "#beleza", "#dicasdemake"],
  },
  {
    id: "financas",
    name: "Finanças",
    emoji: "💰",
    ring: ["#16a34a", "#ca8a04"],
    sampleTopic: "Como montar sua reserva de emergência do zero",
    cover: {
      kicker: "Dinheiro no bolso",
      title: "Reserva de emergência do zero em 5 passos",
      subtitle: "Mesmo ganhando pouco. Sem fórmula mágica.",
    },
    tips: [
      {
        title: "Descubra seu custo de vida",
        body: "Some todos os gastos fixos do mês. Esse é o número base da sua reserva.",
      },
      {
        title: "Defina a meta",
        body: "6 meses de custo de vida para CLT. 12 meses para autônomos e empresários.",
      },
      {
        title: "Pague-se primeiro",
        body: "Assim que o salário cair, separe um valor fixo antes de gastar com qualquer coisa.",
      },
      {
        title: "Escolha o lugar certo",
        body: "Liquidez diária e baixo risco: Tesouro Selic ou CDB com 100% do CDI.",
      },
      {
        title: "Não use para desejos",
        body: "Reserva é para emergência real. Viagem e celular novo têm metas próprias.",
      },
    ],
    list: {
      title: "Regra 50-30-20",
      bullets: [
        "50% necessidades",
        "30% desejos",
        "20% investimentos e reserva",
      ],
    },
    stat: {
      value: "6 meses",
      title: "de custo de vida é a reserva ideal",
      body: "Para quem tem carteira assinada. Autônomos: 12 meses.",
    },
    quote: {
      text: "Não é quanto você ganha, é quanto você guarda.",
      author: "Educação financeira",
    },
    cta: {
      title: "Comece hoje, mesmo com R$ 50",
      body: "Salve este post e acompanhe o perfil para mais dicas.",
      cta: "Salvar e seguir",
    },
    hashtags: [
      "#financaspessoais",
      "#investimentos",
      "#dinheiro",
      "#educacaofinanceira",
    ],
  },
  {
    id: "imobiliario",
    name: "Imobiliário & Corretores",
    emoji: "🏢",
    ring: ["#0284c7", "#38bdf8"],
    sampleTopic: "5 detalhes que valorizam seu imóvel em até 30% antes de vender",
    cover: {
      kicker: "Mercado Imobiliário de Alto Padrão",
      title: "5 detalhes que valorizam seu imóvel em até 30% antes de vender",
      subtitle: "Pequenos ajustes estratégicos atraem compradores qualificados em menos de 15 dias.",
    },
    tips: [
      {
        title: "Iluminação quente e estratégica",
        body: "Lâmpadas amareladas (2700K) criam sensação imediata de aconchego e amplitude nos ambientes principais.",
      },
      {
        title: "Pintura neutra e impecável",
        body: "Paredes em tons claros (off-white) transmitem sofisticação, limpeza e facilitam a visualização do comprador.",
      },
      {
        title: "Despersonalização dos cômodos",
        body: "Retire porta-retratos e excesso de objetos. O comprador precisa se imaginar morando no espaço.",
      },
      {
        title: "Reparos invisíveis que incomodam",
        body: "Torneiras pingando, rodapés lascados e portas rangendo geram desconfiança imediata sobre a manutenção geral.",
      },
      {
        title: "Aromaterapia no momento da visita",
        body: "Um aroma sutil de café fresco ou essência de baunilha ativa gatilhos olfativos de acolhimento e bem-estar.",
      },
    ],
    list: {
      title: "Checklist Rápido Pré-Visita",
      bullets: [
        "Janelas abertas para ventilar o ar",
        "Cortinas alinhadas aproveitando luz natural",
        "Camas feitas no padrão hotelaria de luxo",
        "Banheiros com toalhas novas e bancadas secas",
      ],
    },
    stat: {
      value: "15 dias",
      title: "é a média de fechamento com home staging",
      body: "Imóveis bem preparados e fotografados profissionalmente vendem até 3x mais rápido.",
    },
    quote: {
      text: "As pessoas não compram metros quadrados: compram a sensação de estar em casa.",
      author: "Especialista em Negócios Imobiliários",
    },
    cta: {
      title: "Quer avaliar seu imóvel com precisão de mercado?",
      body: "Toque no link da bio para agendar uma consultoria exclusiva ou envie uma mensagem direta.",
      cta: "Falar com um Especialista",
    },
    hashtags: [
      "#mercadoimobiliario",
      "#imoveisdeluxo",
      "#corretordeimoveis",
      "#arquitetura",
      "#decoracao",
      "#investimentoimobiliario",
    ],
  },
  {
    id: "religiao",
    name: "Fé & Espiritualidade",
    emoji: "✝️",
    ring: ["#eab308", "#fde047"],
    sampleTopic: "4 orações para blindar sua mente contra a ansiedade e o medo",
    cover: {
      kicker: "Mensagem de Fé & Esperança",
      title: "4 orações para blindar sua mente contra a ansiedade e o medo",
      subtitle: "Quando o coração aperta, a Palavra é o único refúgio seguro para a alma.",
    },
    tips: [
      {
        title: "Entregue o controle nas primeiras horas",
        body: "Não comece o dia nas redes sociais. Comece no secreto, agradecendo pelo fôlego de vida e renovo diário.",
      },
      {
        title: "Substitua a preocupação por louvor",
        body: "A ansiedade antecipa o sofrimento, mas a adoração antecipa a vitória e traz uma paz inexplicável.",
      },
      {
        title: "Filtre com zelo o que você consome",
        body: "O que entra pelos seus olhos e ouvidos alimenta a sua fé ou alimenta as suas dúvidas. Escolha edificar.",
      },
      {
        title: "Descanse na promessa, não no vento",
        body: "O barco pode balançar, mas Aquele que acalma a tempestade jamais perdeu o controle da sua história.",
      },
    ],
    list: {
      title: "Versículos de Paz para Guardar no Coração",
      bullets: [
        "Filipenses 4:6-7 (A paz que excede todo entendimento)",
        "Salmo 91 (Aquele que habita no esconderijo do Altíssimo)",
        "Isaías 41:10 (Não temas, porque Eu sou contigo)",
        "Mateus 11:28 (Vinde a mim todos os cansados e oprimidos)",
      ],
    },
    stat: {
      value: "365 vezes",
      title: "a Bíblia diz “Não Temas”",
      body: "Uma dose diária de coragem divina para cada dia do seu ano.",
    },
    quote: {
      text: "A fé não torna as coisas mais fáceis: ela torna as coisas possíveis.",
      author: "Mensagem de Esperança",
    },
    cta: {
      title: "Gostou desta reflexão que edifica o espírito?",
      body: "Compartilhe agora com alguém que precisa dessa palavra hoje e salve para reler quando o coração apertar.",
      cta: "Compartilhar com quem Precisa",
    },
    hashtags: [
      "#fe",
      "#oracao",
      "#deusnocontrole",
      "#espiritualidade",
      "#versiculododia",
      "#pazinterior",
      "#mensagembiblica",
    ],
  },
  {
    id: "autoestima",
    name: "Autoestima & Autocuidado",
    emoji: "✨",
    ring: ["#ec4899", "#f43f5e"],
    sampleTopic: "5 hábitos silenciosos que destroem sua autoestima sem você notar",
    cover: {
      kicker: "Amor-Próprio & Mentalidade",
      title: "5 hábitos silenciosos que destroem sua autoestima sem você notar",
      subtitle: "Aprenda a dizer 'não' para o mundo e 'sim' para a sua própria paz interior.",
    },
    tips: [
      {
        title: "Comparar seu bastidor com o palco alheio",
        body: "Ninguém posta os dias difíceis, as inseguranças e o cansaço. Não meça seu valor pela régua editada dos outros.",
      },
      {
        title: "Dizer “sim” querendo dizer “não”",
        body: "Toda vez que você aceita algo apenas para agradar e ser aceita, quebra um acordo de respeito consigo mesma.",
      },
      {
        title: "Pedir desculpas por existir ou ocupar espaço",
        body: "Pare de se desculpar por emitir sua opinião, por ter limites saudáveis ou por exigir o respeito básico que merece.",
      },
      {
        title: "Negligenciar o seu autocuidado essencial",
        body: "Autocuidado não é luxo: é dormir na hora certa, beber água, se alimentar bem e se afastar de pessoas drenantes.",
      },
      {
        title: "Depender de validação externa para se sentir suficiente",
        body: "O aplauso do outro é um bônus: ele jamais deve ser o combustível da sua autoconfiança e do seu amor-próprio.",
      },
    ],
    list: {
      title: "Afirmações Diárias de Poder Pessoal",
      bullets: [
        "Eu sou suficiente exatamente como sou hoje",
        "Meus limites são inegociáveis e protegem minha paz",
        "Eu me trato com compaixão, respeito e paciência",
        "Eu mereço viver uma vida próspera e em plenitude",
      ],
    },
    stat: {
      value: "21 dias",
      title: "de limites saudáveis transformam sua postura",
      body: "A autoconfiança é um músculo emocional que se fortalece com a prática da autoafirmação.",
    },
    quote: {
      text: "Você não precisa ser perfeita para ser digna de amor, respeito e admiração.",
      author: "Psicologia & Autocuidado",
    },
    cta: {
      title: "Qual dessas verdades você mais precisava ouvir hoje?",
      body: "Comente aqui embaixo e salve este carrossel para reler sempre que a sua mente tentar te sabotar.",
      cta: "Salvar para se Lembrar",
    },
    hashtags: [
      "#autoestima",
      "#amorproprio",
      "#desenvolvimentopessoal",
      "#autoconhecimento",
      "#saudemental",
      "#mulheresempoderadas",
    ],
  },
];

export const NICHE_MAP = Object.fromEntries(
  NICHES.map((n) => [n.id, n]),
) as Record<NicheId, NicheContent>;

export function getNiche(id: string): NicheContent {
  return NICHE_MAP[id as NicheId] ?? NICHE_MAP.marketing;
}
