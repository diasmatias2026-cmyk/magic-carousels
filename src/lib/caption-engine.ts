import { capitalize } from "./sample";

export interface CaptionGenerationOptions {
  niche: string;
  topic: string;
  handle: string;
  slidesCount?: number;
  slideTitles?: string[];
}

export interface GeneratedCaption {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  fullCaption: string;
  characterCount: number;
  hashtagCount: number;
}

// Banco de Hashtags Estratégicas Nichadas (10 a 14 por nicho, sem shadowban)
export const NICHE_HASHTAGS: Record<string, { nicheTags: string[]; topicTags: string[]; formatTags: string[] }> = {
  marketing: {
    nicheTags: ["#marketingdigital", "#marketingdeconteudo", "#copywritingbrasil", "#socialmediabrasil", "#estrategiadigital"],
    topicTags: ["#conteudoviral", "#engajamentonoinstagram", "#vendasnoinsta", "#growthmarketing"],
    formatTags: ["#carrosselinstagram", "#carrosselestrategico", "#dicasdeconteudo"],
  },
  medicina: {
    nicheTags: ["#medicinabrasil", "#saudeequalidadedevida", "#medicosnobrasil", "#medicinapreventiva", "#clinicamedica"],
    topicTags: ["#cuidadoscomasaude", "#bemestaresaude", "#vidasaudavel", "#orientacaomedica"],
    formatTags: ["#conteudomedico", "#carrosseldesaude", "#informacaomedica"],
  },
  saude: {
    nicheTags: ["#saudebemestar", "#vidasaudavel", "#longevidadesaudavel", "#habitosprosperos"],
    topicTags: ["#qualidadedevida", "#prevencaoesaude", "#corpoemente", "#saudeintegral"],
    formatTags: ["#dicasdesaude", "#carrosselinstagram", "#saudeebemestar"],
  },
  direito: {
    nicheTags: ["#advocaciabrasil", "#direitocivil", "#direitodotrabalho", "#advogadosiniciantes", "#advocaciapratica"],
    topicTags: ["#seusdireitos", "#consultoriajuridica", "#dicasjuridicas", "#informacaojuridica"],
    formatTags: ["#carrosseljuridico", "#direitoemfoco", "#conteudojuridico"],
  },
  nutricao: {
    nicheTags: ["#nutricaosemneura", "#alimentacaosaudavel", "#nutricionistabrasil", "#emagrecimentosaudavel", "#dietasustentavel"],
    topicTags: ["#comidadeverdade", "#reeducacaoalimentar", "#pratocolorido", "#metabolismoativo"],
    formatTags: ["#carrosselnutricao", "#dicasdanutri", "#carrosselinstagram"],
  },
  fitness: {
    nicheTags: ["#treinointeligente", "#hipertrofiamuscular", "#personalbrasil", "#musculacaobr", "#treinodeforca"],
    topicTags: ["#vidafit", "#constancianotreino", "#foconadieta", "#evolucaofitness"],
    formatTags: ["#carrosselfitness", "#dicasdetreino", "#rotinafitness"],
  },
  odontologia: {
    nicheTags: ["#odontologiaporamor", "#dentistasbrasil", "#sorrisoperfeito", "#esteticadental", "#odontologiapreventiva"],
    topicTags: ["#saudebucal", "#clareamentodental", "#cuidadoscomosorriso", "#harmonizacaofacial"],
    formatTags: ["#carrosselodontologia", "#dicasdodentista", "#odontodicas"],
  },
  psicologia: {
    nicheTags: ["#psicologiabrasil", "#saudementalimporta", "#terapiafazbem", "#psicologiaonline", "#autoconhecimento"],
    topicTags: ["#ansiedadetemcura", "#equilibrioemocional", "#inteligenciaemocional", "#bemestarpsicologico"],
    formatTags: ["#carrosselpsicologia", "#reflexoes", "#psicodicas"],
  },
  contabilidade: {
    nicheTags: ["#contabilidadeconsultiva", "#gestaofinanceira", "#contadoresdobrasil", "#planejamentotributario", "#financasparaempresas"],
    topicTags: ["#economiafiscal", "#empreendedorismo", "#fluxodecaixa", "#lucratividade"],
    formatTags: ["#carrosselfinanceiro", "#dicascontabeis", "#negociosinteligentes"],
  },
  financas: {
    nicheTags: ["#educacaofinanceira", "#investimentosparainiciantes", "#independenciafinanceira", "#financasinteligentes"],
    topicTags: ["#rendapassiva", "#planejamentofinanceiro", "#multiplicardinheiro", "#acoesefiis"],
    formatTags: ["#carrosselfinancas", "#dicasdeinvestimento", "#dicasfinanceiras"],
  },
  imobiliario: {
    nicheTags: ["#corretordeimoveis", "#imoveisdeluxo", "#mercadoimobiliario", "#altopadrao", "#corretoresbrasil"],
    topicTags: ["#comprarcasa", "#investimentoimobiliario", "#morarbem", "#arquiteturamoderna"],
    formatTags: ["#carrosselimobiliario", "#imoveisdossonhos", "#tourimobiliario"],
  },
  estetica: {
    nicheTags: ["#esteticabrasil", "#biomedicinaestetica", "#harmonizacaoorofacial", "#esteticaavancada", "#skincarebrasil"],
    topicTags: ["#autoestimarenovada", "#cuidadoscomapele", "#rejuvenescimento", "#peleglow"],
    formatTags: ["#carrosselestetica", "#dicasdeskincare", "#antesedepoisestetica"],
  },
  negocios: {
    nicheTags: ["#empreendedorismobrasil", "#liderancaestrategica", "#negociosdigitais", "#gestaoempresarial", "#vendasb2b"],
    topicTags: ["#mentalidadeempreendedora", "#escalarnegocio", "#culturaorganizacional", "#produtividade"],
    formatTags: ["#carrosselbusiness", "#dicasdenegocios", "#insightsestrategicos"],
  },
  tecnologia: {
    nicheTags: ["#programadoresbrasil", "#desenvolvimentoweb", "#tecnologiadainformacao", "#devbrasil", "#techcommunity"],
    topicTags: ["#frontenddev", "#carreiratech", "#dicasdeprogramacao", "#codigolimpo"],
    formatTags: ["#carrosseltech", "#devtips", "#techcarrossel"],
  },
  gastronomia: {
    nicheTags: ["#gastronomiabrasil", "#cozinharcomamor", "#receitaspraticas", "#culinariabrasileira", "#chefemcasa"],
    topicTags: ["#comidadeverdade", "#dicasculinarias", "#sabordodia", "#gastronomiaemcasa"],
    formatTags: ["#carrosselgastronomico", "#receitanocarrossel", "#dicasdechef"],
  },
  arquitetura: {
    nicheTags: ["#arquiteturadeinteriores", "#arquitetosbrasil", "#designdeambientes", "#decoracaocriativa", "#projetosmodernos"],
    topicTags: ["#iluminacaocenica", "#reformatotal", "#ambienteselegantes", "#decoracaocasa"],
    formatTags: ["#carrosselarquitetura", "#dicasdedecor", "#ideiasdearquitetura"],
  },
  educacao: {
    nicheTags: ["#educacaobrasil", "#professorescriativos", "#metodologiasativas", "#pedagogiaporamor", "#ensinoaprendizagem"],
    topicTags: ["#estudosfoco", "#dicasdeestudo", "#aprendizadoeficiente", "#preparacaoenem"],
    formatTags: ["#carrosseleducativo", "#dicaspedagogicas", "#aprendendojuntos"],
  },
};

/**
 * Gera legenda de alta conversão para o Instagram & LinkedIn
 * Seguindo as regras de ouro:
 * 1. Hook curto (< 125 chars) para não ser cortado antes do 'ver mais'
 * 2. Espaçamento visual limpo
 * 3. Resumo dos pontos-chave
 * 4. CTA com palavra-chave de engajamento
 * 5. Bloco de 10-14 hashtags divididas em nicho, dor e formato
 */
export function generatePostCaption(options: CaptionGenerationOptions): GeneratedCaption {
  const nicheKey = options.niche.toLowerCase();
  const tagData = NICHE_HASHTAGS[nicheKey] || NICHE_HASHTAGS.marketing;
  const allTags = [...tagData.nicheTags, ...tagData.topicTags, ...tagData.formatTags];

  const titleClean = capitalize(options.topic || "Estratégia prática para acelerar seus resultados");
  const handleClean = options.handle ? `@${options.handle.replace("@", "")}` : "nosso perfil";

  // 1. Hook magnético (menos de 120 caracteres, antes da quebra)
  const hook = `🔥 A maioria erra feio nisso: ${titleClean}.`;

  // 2. Resumo dos slides (se informados)
  let slideBulletsText = "";
  if (options.slideTitles && options.slideTitles.length > 2) {
    const highlights = options.slideTitles.slice(1, -1).slice(0, 4);
    slideBulletsText = highlights.map((t, idx) => `▫️ Ponto ${idx + 1}: ${t}`).join("\n");
  } else {
    slideBulletsText = `▫️ O diagnóstico do erro que drena seu tempo\n▫️ O método validado para aplicar imediatamente\n▫️ O passo a passo sem atalhos perigosos`;
  }

  // 3. CTA forte
  const cta = `📌 Salve este carrossel agora para consultar antes do seu próximo post.\n\n💬 Qual dessas etapas você já aplica na prática? Me conta aqui embaixo 👇`;

  // 4. Corpo e junção
  const fullCaption = `${hook}\n\nVocê já sentiu que está se esforçando sem ver o retorno que merece? Neste carrossel, resumi o plano de ação definitivo para você destravar isso de vez:\n\n${slideBulletsText}\n\n${cta}\n\n---\nSiga ${handleClean} para mais estratégias diárias.\n\n.\n.\n.\n${allTags.join(" ")}`;

  return {
    hook,
    body: slideBulletsText,
    cta,
    hashtags: allTags,
    fullCaption,
    characterCount: fullCaption.length,
    hashtagCount: allTags.length,
  };
}
