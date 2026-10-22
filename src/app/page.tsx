"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { FORMAT_SIZES, uid } from "@/lib/types";
import { NICHES, getNiche, type NicheId } from "@/data/niches";
import { buildNicheCarousel } from "@/lib/sample";
import { buildPrompt, parseAIResponse } from "@/lib/ai/prompt";
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  FREE_TEMPLATE_IDS,
  defaultTemplateForNiche,
  FONTS,
  type Template,
  type FontKey,
  type TemplateStyle,
  type Decoration,
} from "@/templates";
import type { Slide, CarouselFormat } from "@/lib/types";
import { getTierForUserCount, LIVE_SOCIAL_PROOF, type TierInfo } from "@/lib/pricing-tiers";
import { generatePostCaption, type GeneratedCaption } from "@/lib/caption-engine";
import { SOCIAL_PROOF_PROFILES } from "@/data/social-proof-profiles";
import {
  INSPIRATION_CAROUSELS,
  INSPIRATION_CATEGORIES,
  type InspirationItem,
} from "@/data/inspiration-carousels";
import { AI_PROVIDERS, getProviderConfig, type AIModelOption } from "@/data/ai-providers";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: string; // FREE | LIFETIME
  freeTrialsUsed: number;
  isAdmin?: boolean;
  createdAt?: string;
  brandKit?: {
    id: string;
    displayName: string;
    handle: string;
    avatarUrl?: string | null;
  } | null;
}

const TONE_OPTIONS = [
  { id: "profissional", label: "Profissional" },
  { id: "descontraido", label: "Descontraído" },
  { id: "provocador", label: "Provocador" },
  { id: "educativo", label: "Educativo" },
  { id: "didatico", label: "Didático" },
];

const NICHE_SUGGESTIONS: Record<string, string[]> = {
  fitness: [
    "5 erros clássicos que impedem o ganho de massa",
    "Mitos perigosos sobre alimentação pré-treino",
    "Como manter a constância nos treinos sem desanimar",
  ],
  nutricao: [
    "3 mitos sobre o jejum intermitente que ninguém te conta",
    "Como montar um prato anti-inflamatório sem gastar muito",
    "O que comer para acabar com o inchaço matinal",
  ],
  marketing: [
    "Como transformar seguidores em clientes no direct",
    "O roteiro de Reels que retém a atenção até o final",
    "3 erros comuns que matam o alcance do seu perfil",
  ],
  financas: [
    "Como começar a investir com R$ 100 de forma segura",
    "Os 4 hábitos financeiros que sabotam sua riqueza",
    "O passo a passo para montar sua reserva de emergência",
  ],
  negocios: [
    "Como cobrar mais caro pelos seus serviços sem perder clientes",
    "3 estratégias de vendas que funcionam em qualquer nicho",
    "O segredo para organizar a rotina do seu negócio",
  ],
  psicologia: [
    "Como controlar a ansiedade antes de reuniões ou decisões",
    "Sinais silenciosos de que você está no limite do cansaço",
    "Como dizer NÃO com elegância e sem culpa",
  ],
  beleza: [
    "A ordem exata do skincare para quem tem pressa",
    "5 cuidados simples para salvar cabelos ressecados",
    "Como cuidar da pele no dia a dia sem gastar fortunas",
  ],
  educacao: [
    "Como aprender qualquer matéria na metade do tempo",
    "3 técnicas de memorização ativa comprovadas pela ciência",
    "O método prático para eliminar a procrastinação nos estudos",
  ],
  espiritualidade: [
    "3 minutos de presença matinal para blindar seu dia",
    "Como acalmar pensamentos acelerados antes de dormir",
    "O poder do desapego para destravar novas oportunidades",
  ],
};

export default function MagicCarouselsApp({ initialTab = "landing" }: { initialTab?: "landing" | "creator" | "templates" | "canva-studio" | "projects" | "inspiration" | "tutorials" | "checkout" }) {
  // Usuário autenticado e sessão
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Modais do sistema
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState("");
  const [authPending, setAuthPending] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [carouselId, setCarouselId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Modal de Perfil do Cliente (Brand Kit permanente)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Modal de Notificações
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  // Modal de Paywall (Limite de 1 uso gratuito atingido)
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState("");

  // Modal de Boas-Vindas / Captura VIP para Comunidade no WhatsApp
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadStep, setLeadStep] = useState<"form" | "success">("form");
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState("https://whatsapp.com/channel/0029Vb95NoEKwqSYdC0K860H");
  const [registeredLeadId, setRegisteredLeadId] = useState<string | null>(null);

  // Chaves de IA salvas pelo usuário no navegador
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("mc_user_ai_key") || "";
  });
  const [userAiProvider, setUserAiProvider] = useState<"openrouter" | "gemini" | "openai" | "anthropic">(() => {
    if (typeof window === "undefined") return "openrouter";
    const saved = localStorage.getItem("mc_user_ai_provider");
    return (saved as any) || "openrouter";
  });
  const [userAiModel, setUserAiModel] = useState<string>(() => {
    if (typeof window === "undefined") return "meta-llama/llama-3.3-70b-instruct:free";
    const saved = localStorage.getItem("mc_user_ai_model");
    return saved || "meta-llama/llama-3.3-70b-instruct:free";
  });
  const [aiKeyStatus, setAiKeyStatus] = useState<string>("");
  const [showCaptionSection, setShowCaptionSection] = useState(false);

  // Cronômetro Regressivo de Escassez (Oferta de Lançamento)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 14,
    seconds: 52,
  });

  // Navegação principal: Landing, Criador, Meus Projetos, Inspiração Viral, Templates, Canva Studio, Tutoriais, Checkout
  const [activeTab, setActiveTab] = useState<"landing" | "creator" | "templates" | "canva-studio" | "projects" | "inspiration" | "tutorials" | "checkout">(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get("tab");
      if (tabParam === "projects") return "projects";
      if (tabParam === "studio" || tabParam === "canva-studio") return "canva-studio";
      if (tabParam === "templates") return "templates";
      if (tabParam === "inspiration") return "inspiration";
      if (tabParam === "tutorials") return "tutorials";
      if (tabParam === "checkout") return "checkout";
      if (window.location.pathname.startsWith("/app")) return "creator";
    }
    return initialTab;
  });

  // Estado da Área de Projetos do Usuário (Sincronizado via localStorage e /api/carousels)
  const [savedProjects, setSavedProjects] = useState<Array<{
    id: string;
    title: string;
    niche: string;
    format: CarouselFormat;
    template_id?: string;
    slides: Slide[];
    caption?: string;
    updated_at?: string;
  }>>(() => {
    if (typeof window === "undefined") return [];
    try {
      const local = localStorage.getItem("mc_saved_carousels");
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Filtro da Galeria de Inspiração
  const [selectedInspirationCat, setSelectedInspirationCat] = useState<string>("Todos");

  // Modal de Finalização de Post (Legenda Magnética + Hashtags prontas para Instagram)
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);

  // Visualização mobile no criador (Alternar entre edição e prévia no celular)
  const [mobileViewMode, setMobileViewMode] = useState<"edit" | "preview">("preview");

  // Dados do formulário base
  const [topic, setTopic] = useState("alimentação low carb para secar");
  const [selectedNiche, setSelectedNiche] = useState("fitness");
  const [selectedTone, setSelectedTone] = useState("profissional");
  const [slideCount, setSlideCount] = useState(7);
  const [handle, setHandle] = useState("magiccarousels");

  // Template ativo no carrossel
  const [currentTemplateId, setCurrentTemplateId] = useState<string>("fit-beast-neon");
  const [customTemplates, setCustomTemplates] = useState<Template[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("mc_custom_templates");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Edição visual do Carrossel (Maior poder de edição)
  const [avatarImage, setAvatarImage] = useState<string | null>("/favicon.png");
  const [titleFontSize, setTitleFontSize] = useState<number>(22);
  const [textAlign, setTextAlign] = useState<"left" | "center">("left");
  const [isUppercase, setIsUppercase] = useState<boolean>(false);
  const [customBgColor, setCustomBgColor] = useState<string>("");
  const [customTextColor, setCustomTextColor] = useState<string>("");
  const [customAccentColor, setCustomAccentColor] = useState<string>("");

  // Formato do carrossel
  const [format, setFormat] = useState<CarouselFormat>("4:5");

  // Carrossel de slides gerado
  const [slides, setSlides] = useState<Slide[]>(() => {
    try {
      return buildNicheCarousel("fitness", 7, "alimentação low carb para secar").slides;
    } catch {
      return [];
    }
  });
  const [carouselTitle, setCarouselTitle] = useState(() => {
    try {
      return buildNicheCarousel("fitness", 7, "alimentação low carb para secar").title;
    } catch {
      return "";
    }
  });
  const [carouselCaption, setCarouselCaption] = useState(() => {
    try {
      return buildNicheCarousel("fitness", 7, "alimentação low carb para secar").caption;
    } catch {
      return "";
    }
  });
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modo de Criação (Passo 3): Modelos Prontos | Super Prompt | Chave de IA Direta
  const [mode, setMode] = useState<"direct" | "magic-prompt" | "api-key">("direct");
  const [wizardTemplateCategory, setWizardTemplateCategory] = useState<string>("Todos");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [aiPastedText, setAiPastedText] = useState("");
  const [parseError, setParseError] = useState("");

  // Escassez Dinâmica por Lotes e Prova Social (+100 usuários teste em < 24h)
  const [scarcityTier, setScarcityTier] = useState<TierInfo>(getTierForUserCount(0));
  const [activeTesters24h, setActiveTesters24h] = useState<number>(147);
  const [socialProofIdx, setSocialProofIdx] = useState<number>(0);
  const [showSocialToast, setShowSocialToast] = useState<boolean>(false);

  // Gerador de Legenda Magnética & Hashtags Estratégicas para o Post
  const [captionCopied, setCaptionCopied] = useState<boolean>(false);
  const [tagsCopied, setTagsCopied] = useState<boolean>(false);
  const [editedCaptionText, setEditedCaptionText] = useState<string>("");

  // Filtro da Galeria de Templates
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  // Refs dos sliders estilo Instagram para Touch Swipe e Mouse Drag fluido
  const landingSliderRef = useRef<HTMLDivElement>(null);
  const creatorSliderRef = useRef<HTMLDivElement>(null);
  const isDraggingLanding = useRef(false);
  const isDraggingCreator = useRef(false);
  const startXLanding = useRef(0);
  const startXCreator = useRef(0);
  const scrollLeftLanding = useRef(0);
  const scrollLeftCreator = useRef(0);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // ESTADO DO ESTÚDIO DE TEMPLATES (CRIADOR DO ZERO COM TODAS FERRAMENTAS)
  // ============================================================
  const [studioName, setStudioName] = useState("Meu Template Pro");
  const [studioHeadingFont, setStudioHeadingFont] = useState<FontKey>("montserrat");
  const [studioBodyFont, setStudioBodyFont] = useState<FontKey>("inter");
  const [studioBgType, setStudioBgType] = useState<"gradient" | "solid" | "radial">("gradient");
  const [studioBg1, setStudioBg1] = useState("#0f172a");
  const [studioBg2, setStudioBg2] = useState("#1e293b");
  const [studioGradientAngle, setStudioGradientAngle] = useState(135);
  const [studioPattern, setStudioPattern] = useState<"blueprint" | "grain" | "dots" | "geometric" | "lines" | "none">("blueprint");
  const [studioTextColor, setStudioTextColor] = useState("#ffffff");
  const [studioMutedColor, setStudioMutedColor] = useState("#94a3b8");
  const [studioAccentColor, setStudioAccentColor] = useState("#f97316");
  const [studioSurfaceColor, setStudioSurfaceColor] = useState("#1e293b");
  const [studioCardOpacity, setStudioCardOpacity] = useState<number>(85);
  const [studioStyle, setStudioStyle] = useState<TemplateStyle>("vector-business");
  const [studioDecoration, setStudioDecoration] = useState<Decoration>("geometric-vector");
  const [studioUppercase, setStudioUppercase] = useState(false);
  const [studioBorderRadius, setStudioBorderRadius] = useState<number>(24);
  const [studioBorderWidth, setStudioBorderWidth] = useState<number>(1);
  const [studioBorderStyle, setStudioBorderStyle] = useState<"solid" | "glow" | "dashed" | "none">("solid");
  const [studioShadow, setStudioShadow] = useState<"deep" | "glow" | "soft" | "none">("deep");
  const [studioTitleSize, setStudioTitleSize] = useState<number>(24);
  const [studioLetterSpacing, setStudioLetterSpacing] = useState<"normal" | "tight" | "wide">("normal");
  const [studioTextAlign, setStudioTextAlign] = useState<"left" | "center">("left");
  const [studioNumberingStyle, setStudioNumberingStyle] = useState<"pill" | "bar" | "dots" | "minimal" | "none">("pill");
  const [studioSwipeStyle, setStudioSwipeStyle] = useState<"arrow" | "pill" | "hand" | "none">("arrow");
  const [studioBrandPosition, setStudioBrandPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">("top-left");
  const [studioPreviewSlide, setStudioPreviewSlide] = useState<0 | 1 | 2>(0);
  const [studioPreviewFormat, setStudioPreviewFormat] = useState<CarouselFormat>("4:5");

  // Checkout hospedado no Mercado Pago.
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "paid" | "error">("idle");
  const [isPaidLifetime, setIsPaidLifetime] = useState(false);

  // Cronômetro Regressivo de Escassez
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 0, minutes: 14, seconds: 59 };
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Carregar usuário autenticado e BrandKit salvo ao iniciar
  useEffect(() => {
    async function loadUserSession() {
      try {
        setAuthLoading(true);
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          if (data.user.plan === "LIFETIME") {
            setIsPaidLifetime(true);
          }
          if (data.user.brandKit) {
            if (data.user.brandKit.handle) {
              setHandle(data.user.brandKit.handle.replace("@", ""));
            }
            if (data.user.brandKit.avatarUrl) {
              setAvatarImage(data.user.brandKit.avatarUrl);
            }
          }
          // Se o usuário já está autenticado e abriu a rota raiz ("/"), direcionar para o app oficial ("/app")
          if (typeof window !== "undefined" && window.location.pathname === "/" && !window.location.search) {
            setActiveTab("creator");
            window.history.replaceState({ tab: "creator" }, "", "/app");
          }
        }
      } catch (err) {
        console.error("Session load error:", err);
      } finally {
        setAuthLoading(false);
      }
    }
    loadUserSession();

    // Buscar dados de escassez em tempo real do banco de dados
    async function loadScarcity() {
      try {
        const res = await fetch("/api/stats/scarcity");
        const data = await res.json();
        if (data.tier) setScarcityTier(data.tier);
        if (data.activeTesters24h) setActiveTesters24h(data.activeTesters24h);
      } catch (e) {
        console.error("Erro escassez:", e);
      }
    }
    loadScarcity();
  }, []);

  // Sincronizar URL da barra de endereços com a aba ativa
  useEffect(() => {
    if (typeof window === "undefined" || authLoading) return;
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;

    let targetPath = "/";
    let targetSearch = "";

    if (activeTab === "creator") {
      targetPath = "/app";
    } else if (activeTab === "projects") {
      targetPath = "/app";
      targetSearch = "?tab=projects";
    } else if (activeTab === "canva-studio") {
      targetPath = "/app";
      targetSearch = "?tab=studio";
    } else if (activeTab === "templates") {
      targetPath = user ? "/app" : "/";
      targetSearch = user ? "?tab=templates" : "";
    } else if (activeTab === "inspiration") {
      targetPath = user ? "/app" : "/";
      targetSearch = user ? "?tab=inspiration" : "";
    } else if (activeTab === "tutorials") {
      targetPath = "/app";
      targetSearch = "?tab=tutorials";
    } else if (activeTab === "checkout") {
      targetPath = "/app";
      targetSearch = "?tab=checkout";
    } else if (activeTab === "landing") {
      targetPath = "/";
      targetSearch = "";
    }

    const targetUrl = `${targetPath}${targetSearch}`;
    if (`${currentPath}${currentSearch}` !== targetUrl) {
      window.history.replaceState({ tab: activeTab }, "", targetUrl);
    }
  }, [activeTab, user, authLoading]);

  // Permitir voltar/avançar no histórico do navegador entre abas
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.tab) {
        setActiveTab(e.state.tab);
      } else if (typeof window !== "undefined") {
        if (window.location.pathname.startsWith("/app")) {
          const tabParam = new URLSearchParams(window.location.search).get("tab");
          if (tabParam === "projects") setActiveTab("projects");
          else if (tabParam === "studio") setActiveTab("canva-studio");
          else if (tabParam === "templates") setActiveTab("templates");
          else if (tabParam === "inspiration") setActiveTab("inspiration");
          else if (tabParam === "tutorials") setActiveTab("tutorials");
          else setActiveTab("creator");
        } else {
          setActiveTab("landing");
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const id = new URLSearchParams(window.location.search).get("project");
    if (id) fetch("/api/carousels/" + encodeURIComponent(id)).then(async res => {
      const item = await res.json(); if (!res.ok) throw new Error(item.error);
      setCarouselId(item.id); setSlides(item.slides); setCarouselTitle(item.title); setCarouselCaption(item.caption); setEditedCaptionText(item.caption);
      setFormat(item.format); setSelectedNiche(item.niche); setTopic(item.title);
      const a = item.appearance || {};
      if(a.customTemplate) { setCustomTemplates(prev => [...prev.filter(t=>t.id!==a.customTemplate.id),a.customTemplate]); setCurrentTemplateId(a.customTemplate.id); }
      else setCurrentTemplateId(item.template_id);
      setCustomBgColor(a.bgColor || ""); setCustomTextColor(a.textColor || ""); setCustomAccentColor(a.accent || "");
      setTitleFontSize(a.titleSize || 22); setIsUppercase(Boolean(a.uppercase)); setHandle(a.handle || ""); setAvatarImage(a.avatarUrl || null);
      setTextAlign(item.slides[0]?.align || "left"); setActiveTab("creator");
    }).catch(e => setSaveMessage(e.message));
  }, [user?.id]);
  useEffect(() => {
    if (!user?.id) return;
    const ping = () => { if(document.visibilityState === "visible") fetch("/api/presence",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({page:"/" + activeTab})}).catch(()=>{}); };
    ping(); const timer = setInterval(ping,30000); return () => clearInterval(timer);
  }, [user?.id, activeTab]);

  // Carregamento de Projetos do Usuário (Nuvem + LocalStorage)
  const loadUserProjects = async () => {
    try {
      setProjectsLoading(true);
      if (user?.id) {
        const res = await fetch("/api/carousels");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSavedProjects(data);
            try { localStorage.setItem("mc_saved_carousels", JSON.stringify(data)); } catch {}
            return;
          }
        }
      }
      const local = localStorage.getItem("mc_saved_carousels");
      if (local) {
        setSavedProjects(JSON.parse(local));
      }
    } catch (e) {
      console.error("Erro ao carregar projetos:", e);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    loadUserProjects();
  }, [user?.id]);

  // Ações nos Projetos do Usuário
  const handleLoadProject = (proj: {
    id: string;
    title: string;
    niche: string;
    format: CarouselFormat;
    template_id?: string;
    slides: Slide[];
    caption?: string;
    appearance?: Record<string, unknown>;
  }) => {
    setCarouselId(proj.id);
    setSlides(proj.slides || []);
    setCarouselTitle(proj.title);
    setTopic(proj.title);
    setFormat(proj.format || "4:5");
    if (proj.niche) setSelectedNiche(proj.niche);
    if (proj.template_id) setCurrentTemplateId(proj.template_id);
    if (proj.caption) {
      setCarouselCaption(proj.caption);
      setEditedCaptionText(proj.caption);
    }
    setActiveSlideIndex(0);
    setActiveTab("creator");
    scrollToSlide(0, "creator");
  };

  const handleDuplicateProject = async (proj: {
    id: string;
    title: string;
    niche: string;
    format: CarouselFormat;
    template_id?: string;
    slides: Slide[];
    caption?: string;
  }) => {
    const duplicatedSlides = JSON.parse(JSON.stringify(proj.slides || []));
    const duplicatedTitle = `${proj.title} (Cópia)`;
    const newId = `proj_${Date.now()}`;
    const duplicatedProj = {
      ...proj,
      id: newId,
      title: duplicatedTitle,
      updated_at: new Date().toISOString(),
      slides: duplicatedSlides,
    };
    setSavedProjects((prev) => {
      const updated = [duplicatedProj, ...prev];
      try { localStorage.setItem("mc_saved_carousels", JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (user?.id) {
      try {
        await fetch("/api/carousels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: duplicatedTitle,
            niche: proj.niche || selectedNiche,
            templateId: proj.template_id || currentTemplateId,
            slides: duplicatedSlides,
            caption: proj.caption || "",
            format: proj.format || "4:5",
          }),
        });
        loadUserProjects();
      } catch {}
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este carrossel?")) return;
    setSavedProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try { localStorage.setItem("mc_saved_carousels", JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (user?.id && !id.startsWith("local_") && !id.startsWith("proj_")) {
      try {
        await fetch(`/api/carousels/${id}`, { method: "DELETE" });
      } catch (err) {
        console.error("Erro ao excluir carrossel:", err);
      }
    }
    if (carouselId === id) {
      setCarouselId(null);
    }
  };

  // Carregar modelo de Inspiração direto no Criador
  const handleApplyInspiration = (item: InspirationItem) => {
    setCarouselId(null);
    setSlides(JSON.parse(JSON.stringify(item.slides)));
    setCarouselTitle(item.title);
    setTopic(item.title);
    setFormat(item.format);
    if (item.templateId) setCurrentTemplateId(item.templateId);
    if (item.niche) setSelectedNiche(item.niche);
    setCarouselCaption(item.suggestedCaption);
    setEditedCaptionText(item.suggestedCaption);
    setActiveSlideIndex(0);
    setActiveTab("creator");
    scrollToSlide(0, "creator");
  };

  // Controle de Notificações de Prova Social (Apenas para visitantes na landing, NUNCA para clientes logados ou Vitalícios)
  useEffect(() => {
    if (user?.plan === "LIFETIME" || isPaidLifetime || (user && activeTab !== "landing")) {
      setShowSocialToast(false);
      return;
    }

    let hideTimer: NodeJS.Timeout;

    // 1ª aparição suave após 3.5 segundos da abertura do site
    const initialTimer = setTimeout(() => {
      setSocialProofIdx(Math.floor(Math.random() * LIVE_SOCIAL_PROOF.length));
      setShowSocialToast(true);
      hideTimer = setTimeout(() => {
        setShowSocialToast(false);
      }, 6500);
    }, 3500);

    // Ciclo a cada 30 segundos
    const cycleInterval = setInterval(() => {
      setSocialProofIdx(Math.floor(Math.random() * LIVE_SOCIAL_PROOF.length));
      setShowSocialToast(true);
      hideTimer = setTimeout(() => {
        setShowSocialToast(false);
      }, 6500);
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(hideTimer);
      clearInterval(cycleInterval);
    };
  }, [user?.plan, isPaidLifetime, user?.id, activeTab]);

  // Legenda magnética e hashtags estratégicas calculadas de forma reativa
  const postCaptionData = useMemo(() => {
    return generatePostCaption({
      niche: selectedNiche,
      topic,
      handle,
      slidesCount: slides.length,
      slideTitles: slides.map((s) => s.title),
    });
  }, [selectedNiche, topic, handle, slides]);

  const activeCaptionText = editedCaptionText !== "" ? editedCaptionText : (carouselCaption || postCaptionData?.fullCaption || "");

  // Funções de copiar legenda e tags em 1 clique
  const handleCopyFullCaption = () => {
    if (!activeCaptionText) return;
    navigator.clipboard.writeText(activeCaptionText);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 3000);
  };

  const handleCopyHashtagsOnly = () => {
    if (!postCaptionData?.hashtags) return;
    navigator.clipboard.writeText(postCaptionData.hashtags.join(" "));
    setTagsCopied(true);
    setTimeout(() => setTagsCopied(false), 3000);
  };

  // Disparar popup de boas-vindas / Comunidade WhatsApp ao entrar no site (delay suave)
  useEffect(() => {
    try {
      const alreadyJoined = localStorage.getItem("mc_lead_joined");
      const alreadyShown = sessionStorage.getItem("mc_lead_shown");
      if (!alreadyJoined && !alreadyShown) {
        const timer = setTimeout(() => {
          setIsLeadModalOpen(true);
          sessionStorage.setItem("mc_lead_shown", "true");
        }, 2200);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignora
    }
  }, []);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail || !leadEmail.includes("@")) {
      setLeadError("Por favor, digite um e-mail válido.");
      return;
    }
    setLeadLoading(true);
    setLeadError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: leadName, email: leadEmail, phone: leadPhone, source: "popup_comunidade" }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.leadId) setRegisteredLeadId(data.leadId);
      if (data.whatsappUrl) {
        setWhatsappGroupUrl(data.whatsappUrl);
      } else {
        setWhatsappGroupUrl("https://whatsapp.com/channel/0029Vb95NoEKwqSYdC0K860H");
      }
      setLeadStep("success");
      localStorage.setItem("mc_lead_joined", "true");
    } catch (err) {
      console.error(err);
      setWhatsappGroupUrl("https://whatsapp.com/channel/0029Vb95NoEKwqSYdC0K860H");
      setLeadStep("success");
      localStorage.setItem("mc_lead_joined", "true");
    } finally {
      setLeadLoading(false);
    }
  };

  const handleRecordWhatsappClick = (source: string) => {
    if (registeredLeadId) {
      fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: registeredLeadId }),
      }).catch(() => {});
    }
    try {
      const sessId = typeof window !== "undefined" ? (sessionStorage.getItem("mc_analytics_sess") || "anon") : "anon";
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessId, eventType: "cta_click", section: "whatsapp_channel", details: { source } }),
      }).catch(() => {});
    } catch {}
  };

  // Rastreamento de Comportamento na Página (Onde as pessoas param)
  useEffect(() => {
    try {
      let sessId = sessionStorage.getItem("mc_analytics_sess");
      if (!sessId) {
        sessId = "sess_" + Math.random().toString(36).slice(2, 11);
        sessionStorage.setItem("mc_analytics_sess", sessId);
      }

      let lastVisible = "section-hero";
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
              const id = entry.target.id;
              if (id) {
                lastVisible = id;
                fetch("/api/analytics", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sessionId: sessId, eventType: "section_view", section: id }),
                }).catch(() => {});
              }
            }
          }
        },
        { threshold: 0.25 }
      );

      const sectionIds = ["section-hero", "section-recursos", "section-preview", "section-garantia"];
      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });

      const handleBeforeUnload = () => {
        navigator.sendBeacon?.(
          "/api/analytics",
          JSON.stringify({ sessionId: sessId, eventType: "exit_section", section: lastVisible })
        );
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => {
        observer.disconnect();
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    } catch {}
  }, []);

  // Prompt mágico reativo
  const generatedPrompt = useMemo(() => {
    return buildPrompt({
      topic,
      niche: selectedNiche,
      slideCount,
      tone: selectedTone,
      handle,
    });
  }, [topic, selectedNiche, slideCount, selectedTone, handle]);

  // Obter o template atual mesclando com os customs
  const allTemplates = [...TEMPLATES, ...customTemplates];
  const activeTemplate = allTemplates.find((t) => t.id === currentTemplateId) ?? TEMPLATES[0];

  // Geração direta com controle do 1 uso gratuito por IP/Usuário
  const generateDirect = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      try {
        const sample = buildNicheCarousel(selectedNiche, slideCount, topic);
        setSlides(sample.slides);
        setCarouselTitle(sample.title);
        setCarouselCaption(sample.caption);
        setActiveSlideIndex(0);
      } catch (e) {
        console.error(e);
      }
      return;
    }

    if (!user) {
      setAuthError("Você precisa criar uma conta ou fazer login para gerar seu carrossel.");
      setIsAuthModalOpen(true);
      return;
    }

    if (user.plan === "FREE" && user.freeTrialsUsed >= 1 && !isPaidLifetime) {
      setPaywallMessage(`Você já utilizou seu 1 carrossel de teste gratuito! Para continuar criando carrosséis virais ilimitados, ative o Plano Vitalício (${scarcityTier.name}) por apenas ${scarcityTier.priceFormatted}.`);
      setIsPaywallOpen(true);
      return;
    }

    setIsGenerating(true);
    try {
      // 1. Se o usuário conectou sua chave de IA e escolheu modo API
      if (userApiKey && mode === "api-key") {
        try {
          const genRes = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topic,
              niche: selectedNiche,
              slideCount,
              tone: selectedTone,
              templateId: currentTemplateId,
              format,
              apiKey: userApiKey,
              provider: userAiProvider,
              model: userAiModel,
            }),
          });
          const genData = await genRes.json();
          if (genRes.ok && genData.slides && genData.slides.length > 0) {
            setSlides(genData.slides);
            setCarouselTitle(genData.title || topic);
            setCarouselCaption(genData.caption || "");
            setEditedCaptionText("");
            if (genData.id) setCarouselId(genData.id);
            setActiveSlideIndex(0);
            scrollToSlide(0, "both");
            return;
          } else {
            console.warn("Falha na geração via /api/generate:", genData.error);
            alert(`Aviso da IA (${userAiProvider.toUpperCase()}): ${genData.error || "Não foi possível gerar com esta chave/modelo. Gerando versão estruturada de alta conversão..."}`);
          }
        } catch (apiErr) {
          console.warn("Erro ao consultar /api/generate:", apiErr);
        }
      }

      // 2. Geração estruturada baseada no nicho e assunto (Zero falhas, instantâneo)
      const sample = buildNicheCarousel(selectedNiche, slideCount, topic);
      setSlides(sample.slides);
      setCarouselTitle(sample.title);
      setCarouselCaption(sample.caption);
      setEditedCaptionText("");
      setActiveSlideIndex(0);
      scrollToSlide(0, "both");

      // Salva em segundo plano sem travar a experiência do usuário
      persistCarousel(sample.slides, sample.title, sample.caption, null).catch((err) => {
        console.warn("Salvamento em segundo plano:", err);
      });
    } catch (err) {
      console.error("Erro na geração do carrossel:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  async function persistCarousel(nextSlides = slides, title = carouselTitle, caption = activeCaptionText || carouselCaption, id = carouselId) {
    if (!user) { setIsAuthModalOpen(true); return false; }
    if (saving) return false;
    setSaving(true);
    setSaveMessage("Salvando…");
    try {
      const payload = JSON.stringify({
        title: (title || topic).slice(0, 140), niche: selectedNiche,
        templateId: currentTemplateId.startsWith("custom_") ? "fit-beast-neon" : currentTemplateId,
        slides: nextSlides.map(slide => ({...slide, align: textAlign})), caption, format,
        appearance: {
          ...(customBgColor ? {bgColor: customBgColor} : {}),
          ...(customTextColor ? {textColor: customTextColor} : {}),
          ...(customAccentColor ? {accent: customAccentColor} : {}),
          handle, displayName: user.brandKit?.displayName || user.name, avatarUrl: avatarImage,
          titleSize: titleFontSize, uppercase: isUppercase,
          ...(currentTemplateId.startsWith("custom_") ? {customTemplate: activeTemplate} : {}),
        },
      });
      if (new Blob([payload]).size > 4000000) throw new Error("As imagens juntas excedem 4 MB. Reduza as imagens antes de salvar.");
      const res = await fetch(id ? "/api/carousels/" + id : "/api/carousels", {method:id ? "PUT" : "POST",headers:{"Content-Type":"application/json"},body:payload});
      const data = await res.json();
      if (!res.ok) { if(res.status===402){setPaywallMessage(data.error);setIsPaywallOpen(true);} throw new Error(data.error || "Não foi possível salvar."); }
      if (!id) { setCarouselId(data.id); setUser(prev => prev ? {...prev,freeTrialsUsed:prev.freeTrialsUsed + 1} : prev); window.history.replaceState(null,"","/app?project=" + data.id); }
      const currentSaved = {
        id: data.id || id || `proj_${Date.now()}`,
        title: (title || topic).slice(0, 140),
        niche: selectedNiche,
        format,
        template_id: currentTemplateId,
        slides: nextSlides,
        caption,
        updated_at: new Date().toISOString(),
      };
      setSavedProjects((prev) => {
        const idx = prev.findIndex((p) => p.id === currentSaved.id);
        const updated = idx >= 0 ? prev.map((p, i) => (i === idx ? currentSaved : p)) : [currentSaved, ...prev];
        try { localStorage.setItem("mc_saved_carousels", JSON.stringify(updated)); } catch {}
        return updated;
      });
      setSaveMessage("Projeto salvo na sua conta com sucesso!");
      return true;
    } catch(error) { setSaveMessage(error instanceof Error ? error.message : "Erro ao salvar."); return false; }
    finally { setSaving(false); }
  }

  // Funções de deslizar  // Funções de deslizar estilo Instagram (Touch Swipe & Mouse Drag)
  const scrollToSlide = (index: number, target: "landing" | "creator" | "both" = "creator") => {
    setActiveSlideIndex(index);
    if ((target === "creator" || target === "both") && creatorSliderRef.current) {
      const width = creatorSliderRef.current.offsetWidth;
      creatorSliderRef.current.scrollTo({ left: index * width, behavior: "smooth" });
    }
    if ((target === "landing" || target === "both") && landingSliderRef.current) {
      const width = landingSliderRef.current.offsetWidth;
      landingSliderRef.current.scrollTo({ left: index * width, behavior: "smooth" });
    }
  };

  const handleSliderScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const width = el.offsetWidth;
    if (width > 0) {
      const idx = Math.round(el.scrollLeft / width);
      if (idx !== activeSlideIndex && idx >= 0 && idx < slides.length) {
        setActiveSlideIndex(idx);
      }
    }
  };

  // Mouse Drag para o slider do Criador
  const handleCreatorMouseDown = (e: React.MouseEvent) => {
    if (!creatorSliderRef.current) return;
    isDraggingCreator.current = true;
    startXCreator.current = e.pageX - creatorSliderRef.current.offsetLeft;
    scrollLeftCreator.current = creatorSliderRef.current.scrollLeft;
  };
  const handleCreatorMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCreator.current || !creatorSliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - creatorSliderRef.current.offsetLeft;
    const walk = (x - startXCreator.current) * 1.5;
    creatorSliderRef.current.scrollLeft = scrollLeftCreator.current - walk;
  };
  const handleCreatorMouseUp = () => {
    if (!isDraggingCreator.current || !creatorSliderRef.current) return;
    isDraggingCreator.current = false;
    const width = creatorSliderRef.current.offsetWidth;
    const idx = Math.round(creatorSliderRef.current.scrollLeft / width);
    scrollToSlide(idx, "creator");
  };

  // Upload manual de avatar
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        alert("Use uma imagem PNG, JPG ou WebP de até 1 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setAvatarImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Salvar Perfil do Cliente Oficial (Brand Kit permanente)
  const handleSaveProfileKit = async () => {
    if (!user) return;
    setProfileSaving(true);
    try {
      const res = await fetch("/api/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: user.name,
          handle,
          avatarUrl: avatarImage,
        }),
      });
      if (res.ok) {
        const updatedKit = await res.json();
        setUser((prev) => prev ? { ...prev, brandKit: updatedKit } : null);
        setIsProfileModalOpen(false);
        alert("🎉 Perfil e Foto salvos com sucesso! Agora eles serão carregados automaticamente em todos os seus carrosséis.");
      } else {
        alert("Erro ao salvar perfil.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Troca interativa de nicho na landing page com demonstração no celular
  const handleSelectLandingNiche = (nicheId: NicheId) => {
    const n = getNiche(nicheId);
    setSelectedNiche(nicheId);
    setTopic(n.sampleTopic);
    const tId = defaultTemplateForNiche(nicheId);
    setCurrentTemplateId(tId);
    const sample = buildNicheCarousel(nicheId, slideCount, n.sampleTopic);
    setSlides(sample.slides);
    setCarouselTitle(sample.title);
    setCarouselCaption(sample.caption);
    setEditedCaptionText("");
    setActiveSlideIndex(0);
    scrollToSlide(0, "landing");
  };

  // Google Identity Services (Login com Google)
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !isAuthModalOpen) return;

    const setupGoogle = () => {
      const g = (window as unknown as { google?: { accounts?: { id?: { initialize: (config: object) => void; renderButton: (el: HTMLElement, opts: object) => void; prompt: () => void } } } }).google;
      if (g?.accounts?.id) {
        g.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            if (!response?.credential) return;
            setAuthPending(true);
            setAuthError("");
            try {
              const res = await fetch("/api/auth/social", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential, provider: "google" }),
              });
              const data = await res.json();
              if (res.ok && data.ok) {
                const session = await fetch("/api/auth/me").then((r) => r.json());
                if (!session.user) throw new Error("Sessão não encontrada.");
                setUser(session.user);
                if (session.user.brandKit?.handle) setHandle(session.user.brandKit.handle);
                if (session.user.brandKit?.avatarUrl) setAvatarImage(session.user.brandKit.avatarUrl);
                if (session.user.plan === "LIFETIME") setIsPaidLifetime(true);
                setIsAuthModalOpen(false);
                setActiveTab("creator");
              } else {
                setAuthError(data.message || data.error || "Erro ao autenticar com o Google.");
              }
            } catch (err) {
              console.error(err);
              setAuthError("Erro de comunicação ao validar conta Google.");
            } finally {
              setAuthPending(false);
            }
          },
        });

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = "";
          g.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            text: authModalMode === "login" ? "signin_with" : "signup_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 320,
          });
        }
      }
    };

    if (typeof window !== "undefined") {
      const existing = document.getElementById("google-gsi-script");
      if (!existing) {
        const s = document.createElement("script");
        s.id = "google-gsi-script";
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true;
        s.defer = true;
        s.onload = setupGoogle;
        document.head.appendChild(s);
      } else {
        setupGoogle();
      }
    }
  }, [isAuthModalOpen, authModalMode]);

  const handleSocialLogin = (provider: "google" | "apple" | "facebook") => {
    if (provider === "google") {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        setAuthError("Para ativar o Login com Google, adicione a variável NEXT_PUBLIC_GOOGLE_CLIENT_ID na Vercel ou no .env.local.");
        return;
      }
      const g = (window as unknown as { google?: { accounts?: { id?: { prompt: () => void } } } }).google;
      if (g?.accounts?.id) {
        g.accounts.id.prompt();
      }
      return;
    }
    setAuthError(`Login com ${provider === "apple" ? "Apple" : "Facebook"} estará disponível em breve. Utilize o Google ou crie sua conta com e-mail e senha.`);
  };

  // Login / Cadastro com e-mail e senha
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthPending(true);
    setAuthError("");
    try {
      const endpoint = authModalMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = authModalMode === "login"
        ? { email: authEmail, password: authPassword }
        : { name: authName, email: authEmail, password: authPassword, acceptTerms };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        const session = await fetch("/api/auth/me").then(r => r.json());
        if (!session.user) throw new Error("Sessão não encontrada.");
        data.user = session.user;
        setUser(data.user);
        if (data.user.brandKit?.handle) setHandle(data.user.brandKit.handle);
        if (data.user.brandKit?.avatarUrl) setAvatarImage(data.user.brandKit.avatarUrl);
        if (data.user.plan === "LIFETIME") setIsPaidLifetime(true);
        setIsAuthModalOpen(false);
        setActiveTab("creator");
      } else {
        setAuthError(data.message || data.error || "Erro ao processar credenciais.");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Erro ao comunicar com o servidor.");
    } finally {
      setAuthPending(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setIsPaidLifetime(false);
      setActiveTab("landing");
    } catch (err) {
      console.error(err);
    }
  };

  // Upload de imagem para o slide atual
  const handleSlideImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && slides[activeSlideIndex]) {
      if (file.size > 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) { alert("Use PNG, JPG ou WebP de até 1 MB."); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const updated = [...slides];
        updated[activeSlideIndex].image = reader.result as string;
        setSlides(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  // Adicionar novo slide
  const handleAddSlide = () => {
    if (slides.length >= 15) {
      alert("Limite de 15 slides por carrossel.");
      return;
    }
    const newSlide: Slide = {
      id: uid(),
      type: "content",
      kicker: `0${slides.length}`,
      title: "Nova Dica Estratégica",
      body: "Insira aqui a explicação prática deste slide para reter o leitor até o final.",
    };
    const updated = [...slides];
    updated.splice(updated.length - 1, 0, newSlide);
    setSlides(updated);
    setActiveSlideIndex(updated.length - 2);
    scrollToSlide(updated.length - 2, "creator");
  };

  // Remover slide atual
  const handleRemoveSlide = (idx: number) => {
    if (slides.length <= 3) {
      alert("O carrossel precisa ter pelo menos 3 slides.");
      return;
    }
    const updated = slides.filter((_, i) => i !== idx);
    setSlides(updated);
    const nextIdx = Math.max(0, idx - 1);
    setActiveSlideIndex(nextIdx);
    scrollToSlide(nextIdx, "creator");
  };

  // Copiar prompt
  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  // Processar texto de IA
  const handleProcessAiText = () => {
    setParseError("");
    if (!aiPastedText.trim()) {
      setParseError("Cole a resposta da IA antes de continuar.");
      return;
    }
    try {
      const parsed = parseAIResponse(aiPastedText, topic);
      setCarouselId(null);
      setSlides(parsed.slides);
      setCarouselTitle(parsed.title);
      setCarouselCaption(parsed.caption);
      setEditedCaptionText("");
      setActiveSlideIndex(0);
      setSlideCount(parsed.slides.length);
      setMode("direct");
      setAiPastedText("");
      setActiveTab("creator");
      scrollToSlide(0, "creator");
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : "Erro ao interpretar resposta.");
    }
  };

  // Exportações com proteção de Paywall
  const handleDownloadSlide = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (typeof window !== "undefined" && window.innerWidth < 1024 && mobileViewMode !== "preview") {
      setMobileViewMode("preview");
      await new Promise(r => setTimeout(r, 120));
    }
    if (!(await persistCarousel())) return;
    await document.fonts.ready;
    const { toPng } = await import("html-to-image");
    const node = document.getElementById(`live-slide-render-${activeSlideIndex}`);
    if (!node) return;
    try {
      const ratio = node.offsetWidth > 0 ? 1080 / node.offsetWidth : 2;
      const dataUrl = await toPng(node, { pixelRatio: ratio });
      const link = document.createElement("a");
      link.download = `carrossel-slide-${activeSlideIndex + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Erro ao exportar imagem.");
    }
  };

  const handleDownloadAllZip = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (typeof window !== "undefined" && window.innerWidth < 1024 && mobileViewMode !== "preview") {
      setMobileViewMode("preview");
      await new Promise(r => setTimeout(r, 120));
    }
    if (!(await persistCarousel())) return;
    await document.fonts.ready;
    const { toPng } = await import("html-to-image");
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    try {
      setSaveMessage("Gerando todas as lâminas em alta definição…");
      for (let i = 0; i < slides.length; i++) {
        const node = document.getElementById(`live-slide-render-${i}`);
        if (node) {
          const ratio = node.offsetWidth > 0 ? 1080 / node.offsetWidth : 2;
          const dataUrl = await toPng(node, { pixelRatio: ratio });
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
          zip.file(`slide-${i + 1}.png`, base64Data, { base64: true });
        }
      }
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `carrossel-${topic.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.zip`;
      link.click();
      setSaveMessage("Download do ZIP concluído!");
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar pacote ZIP.");
    }
  };

  const handleDownloadPdf = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (typeof window !== "undefined" && window.innerWidth < 1024 && mobileViewMode !== "preview") {
      setMobileViewMode("preview");
      await new Promise(r => setTimeout(r, 120));
    }
    if (!(await persistCarousel())) return;
    await document.fonts.ready;
    const { toPng } = await import("html-to-image");
    const { jsPDF } = await import("jspdf");

    try {
      setSaveMessage("Criando documento carrossel em PDF…");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [FORMAT_SIZES[format].w, FORMAT_SIZES[format].h],
      });

      for (let i = 0; i < slides.length; i++) {
        const node = document.getElementById(`live-slide-render-${i}`);
        if (node) {
          const ratio = node.offsetWidth > 0 ? 1080 / node.offsetWidth : 2;
          const dataUrl = await toPng(node, { pixelRatio: ratio });
          if (i > 0) pdf.addPage([FORMAT_SIZES[format].w, FORMAT_SIZES[format].h], "portrait");
          pdf.addImage(dataUrl, "PNG", 0, 0, FORMAT_SIZES[format].w, FORMAT_SIZES[format].h);
        }
      }
      pdf.save(`carrossel-linkedin-${topic.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.pdf`);
      setSaveMessage("Download do PDF concluído!");
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar PDF.");
    }
  };

  // Salvar Template Personalizado no Estúdio
  const handleSaveCustomTemplate = () => {
    const newId = `custom_${Date.now()}`;
    const newTpl: Template = {
      id: newId,
      name: studioName || "Template Personalizado",
      category: "Criativo & Agência",
      niche: "geral",
      style: studioStyle,
      decoration: studioDecoration,
      colors: {
        bg: studioBg1,
        bg2: studioBg2,
        text: studioTextColor,
        muted: studioMutedColor,
        accent: studioAccentColor,
        accent2: studioBg1,
        surface: studioSurfaceColor,
        surfaceText: studioTextColor,
        borderColor: studioAccentColor + "40",
      },
      fonts: {
        heading: studioHeadingFont,
        body: studioBodyFont,
      },
      uppercase: studioUppercase,
      badge: "CRIADO POR VOCÊ",
    };

    const updated = [newTpl, ...customTemplates];
    setCustomTemplates(updated);
    try {
      localStorage.setItem("mc_custom_templates", JSON.stringify(updated));
    } catch {}
    if (user?.id) {
      fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTpl.name, appearance: newTpl }),
      }).catch(() => {});
    }
    setCurrentTemplateId(newId);
    setCustomBgColor(studioBgType === "solid" ? studioBg1 : "");
    setCustomTextColor(studioTextColor);
    setCustomAccentColor(studioAccentColor);
    setIsUppercase(studioUppercase);
    setTitleFontSize(studioTitleSize);
    setTextAlign(studioTextAlign);
    alert(`🎉 Template "${studioName}" salvo com sucesso e aplicado no seu carrossel!`);
    setActiveTab("creator");
  };

  // A licença só é concedida pelo servidor após confirmação do Mercado Pago.
  const handleStartCheckout = async () => {
    if (!user) { setIsAuthModalOpen(true); return; }
    setPaymentStatus("pending");
    try {
      const res = await fetch("/api/payments/create", {method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout indisponível.");
      window.location.assign(data.url);
    } catch(error) { setPaymentStatus("error"); alert(error instanceof Error ? error.message : "Erro ao abrir pagamento."); }
  };

  // Cores dinâmicas do slide ativo
  const activeBg = customBgColor
    ? customBgColor
    : activeTemplate.style === "gradient" || activeTemplate.style === "vector-business"
    ? `linear-gradient(135deg, ${activeTemplate.colors.bg} 0%, ${activeTemplate.colors.bg2} 100%)`
    : activeTemplate.colors.bg;

  const activeTextColor = customTextColor || activeTemplate.colors.text;
  const activeAccentColor = customAccentColor || activeTemplate.colors.accent;
  const headingFontCss = FONTS[activeTemplate.fonts.heading]?.css || "sans-serif";
  const bodyFontCss = FONTS[activeTemplate.fonts.body]?.css || "sans-serif";

  // Lista de templates filtrados na galeria
  const filteredTemplates =
    selectedCategory === "Todos"
      ? allTemplates
      : allTemplates.filter((t) => t.category === selectedCategory);

  // Renderizador do Slide dentro do Carrossel Deslizável do Instagram
  const renderSlideContent = (s: Slide, idx: number, isCurrent = false) => {
    const isCover = idx === 0;
    const isCta = idx === slides.length - 1;

    return (
      <div
        id={`live-slide-render-${idx}`}
        style={{
          width: "100%",
          height: "100%",
          background: activeBg,
          color: activeTextColor,
          padding: "20px 18px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        {s.image && s.imageMode === "background" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <img src={s.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(2px)" }} />
          </div>
        )}

        {/* Decoração vetorial */}
        {activeTemplate.decoration === "geometric-vector" && (
          <>
            <div
              style={{
                position: "absolute",
                top: "-30px",
                right: "-30px",
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                background: activeAccentColor,
                opacity: 0.16,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-25px",
                left: "-25px",
                width: "80px",
                height: "80px",
                borderRadius: "16px",
                background: activeAccentColor,
                opacity: 0.12,
                transform: "rotate(45deg)",
                pointerEvents: "none",
              }}
            />
          </>
        )}

        {/* Topo do Slide: Avatar e Handle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {avatarImage ? (
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.8)" }}>
                <img src={avatarImage} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : (
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>
                {handle.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: bodyFontCss }}>
              @{handle}
            </span>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, opacity: 0.85, fontFamily: bodyFontCss }}>
            {idx + 1}/{slides.length || 7}
          </span>
        </div>

        {/* Miolo do Slide */}
        <div style={{ margin: "auto 0", textAlign, zIndex: 2 }}>
          {s.kicker && !isCover && (
            <span
              style={{
                display: "inline-block",
                fontSize: "10.5px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                color: activeAccentColor,
                marginBottom: "6px",
                fontFamily: headingFontCss,
              }}
            >
              {s.kicker}
            </span>
          )}

          <h3
            style={{
              fontSize: `${isCover ? titleFontSize + 3 : titleFontSize}px`,
              fontWeight: 900,
              lineHeight: 1.25,
              letterSpacing: "-0.5px",
              marginBottom: s.body || s.bullets || s.image ? "8px" : "0",
              textTransform: isUppercase ? "uppercase" : "none",
              fontFamily: headingFontCss,
            }}
          >
            {s.title}
          </h3>

          {s.body && (
            <p style={{ fontSize: "13px", lineHeight: 1.5, opacity: 0.9, fontWeight: 500, fontFamily: bodyFontCss }}>
              {s.body}
            </p>
          )}

          {s.image && s.imageMode === "avatar" && (
            <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
              <div style={{ width: "74px", height: "74px", borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${activeAccentColor}`, boxShadow: "0 6px 18px rgba(0,0,0,0.45)" }}>
                <img src={s.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>
          )}

          {s.image && (!s.imageMode || s.imageMode === "card") && (
            <div style={{ margin: "8px 0", borderRadius: "10px", overflow: "hidden", maxHeight: "125px", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 4px 14px rgba(0,0,0,0.3)" }}>
              <img src={s.image} alt="Ilustração" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          {s.bullets && s.bullets.length > 0 && (
            <ul style={{ listStyle: "none", marginTop: "8px", display: "flex", flexDirection: "column", gap: "5px", textAlign: "left" }}>
              {s.bullets.map((b, bi) => (
                <li key={bi} style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", opacity: 0.95, fontFamily: bodyFontCss }}>
                  <span style={{ color: activeAccentColor, fontWeight: 900 }}>✓</span> {b}
                </li>
              ))}
            </ul>
          )}

          {isCta && (
            <div style={{ marginTop: "12px" }}>
              <div
                style={{
                  display: "inline-block",
                  background: activeAccentColor,
                  color: "#ffffff",
                  padding: "8px 20px",
                  borderRadius: "9999px",
                  fontWeight: 800,
                  fontSize: "12.5px",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
                }}
              >
                {s.cta || "Salvar para Ler Depois 💾"}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Slide */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", zIndex: 2 }}>
          <span style={{ fontSize: "9.5px", opacity: 0.65, fontWeight: 700 }}>Magic Carousels Pro</span>
          <span style={{ fontSize: "10.5px", fontWeight: 700, opacity: 0.85, fontFamily: bodyFontCss }}>
            {isCover ? "Deslize para o lado →" : idx === slides.length - 1 ? "Salvar 💾" : "deslize →"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-dark)", color: "#f8fafc" }}>
      {/* ============================================================ */}
      {/* HEADER PRINCIPAL LIMPO, ELEGANTE E PROFISSIONAL              */}
      {/* ============================================================ */}
      <header
        style={{
          background: "rgba(10, 10, 14, 0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 90,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            onClick={() => setActiveTab(user ? "creator" : "landing")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <img
              src="/favicon.png"
              alt="Magic Carousels Logo"
              style={{
                width: "42px",
                height: "42px",
                objectFit: "contain",
                filter: "drop-shadow(0 4px 14px rgba(225, 48, 108, 0.5))",
                flexShrink: 0,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "21px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Magic
                </span>
                <span
                  style={{
                    fontSize: "21px",
                    fontWeight: 900,
                    letterSpacing: "-0.5px",
                    background: "var(--ig-sunset)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Carousels
                </span>
              </div>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#94a3b8", letterSpacing: "1.2px", textTransform: "uppercase", marginTop: "3px" }}>
                PRO STUDIO
              </span>
            </div>
          </div>

          {user && (
            <span
              className="desktop-only"
              style={{
                fontSize: "11px",
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: "9999px",
                background: isPaidLifetime ? "rgba(34, 197, 94, 0.15)" : "rgba(225, 48, 108, 0.15)",
                color: isPaidLifetime ? "#4ade80" : "#f472b6",
                border: `1px solid ${isPaidLifetime ? "rgba(34, 197, 94, 0.3)" : "rgba(225, 48, 108, 0.3)"}`,
              }}
            >
              {isPaidLifetime ? "👑 ACESSO VITALÍCIO" : user.freeTrialsUsed === 0 ? "⚡ TESTE GRÁTIS DISPONÍVEL (1/1)" : "⚠️ TESTE ESGOTADO (0/1)"}
            </span>
          )}
        </div>

        {/* CENTRO DO MENU: CRONÔMETRO DE ESCASSEZ GRANDE E IMPONENTE NO PC */}
        {!user || activeTab === "landing" ? (
          <div
            className="desktop-only"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              background: "linear-gradient(135deg, rgba(225, 48, 108, 0.14) 0%, rgba(18, 18, 24, 0.95) 100%)",
              border: "1.5px solid rgba(225, 48, 108, 0.45)",
              padding: "8px 20px",
              borderRadius: "9999px",
              boxShadow: "0 0 25px rgba(225, 48, 108, 0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>⏳</span>
              <span style={{ fontSize: "12.5px", fontWeight: 900, color: "#f472b6", letterSpacing: "0.8px" }}>
                OFERTA DE LANÇAMENTO EXPIRA EM:
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "monospace", fontSize: "16px", fontWeight: 900, color: "#ffffff" }}>
              <span
                style={{
                  background: "#000000",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.18)",
                  boxShadow: "inset 0 2px 6px rgba(0,0,0,0.8)",
                  minWidth: "40px",
                  textAlign: "center",
                }}
              >
                {String(timeLeft.hours).padStart(2, "0")}h
              </span>
              <span style={{ color: "#f472b6", fontSize: "16px" }}>:</span>
              <span
                style={{
                  background: "#000000",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(250, 204, 21, 0.4)",
                  color: "#facc15",
                  boxShadow: "inset 0 2px 6px rgba(0,0,0,0.8)",
                  minWidth: "40px",
                  textAlign: "center",
                }}
              >
                {String(timeLeft.minutes).padStart(2, "0")}m
              </span>
              <span style={{ color: "#f472b6", fontSize: "16px" }}>:</span>
              <span
                style={{
                  background: "#000000",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(239, 68, 68, 0.5)",
                  color: "#f87171",
                  boxShadow: "inset 0 2px 6px rgba(0,0,0,0.8)",
                  minWidth: "40px",
                  textAlign: "center",
                }}
              >
                {String(timeLeft.seconds).padStart(2, "0")}s
              </span>
            </div>
          </div>
        ) : (
          <nav className="desktop-only" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={() => setActiveTab("creator")}
              style={{
                padding: "8px 14px",
                borderRadius: "9999px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                border: "none",
                background: activeTab === "creator" ? "rgba(225, 48, 108, 0.2)" : "transparent",
                color: activeTab === "creator" ? "#f472b6" : "#94a3b8",
              }}
            >
              🎨 Criar
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              style={{
                padding: "8px 14px",
                borderRadius: "9999px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                border: "none",
                background: activeTab === "projects" ? "rgba(225, 48, 108, 0.2)" : "transparent",
                color: activeTab === "projects" ? "#f472b6" : "#94a3b8",
              }}
            >
              📁 Meus Projetos {savedProjects.length > 0 ? `(${savedProjects.length})` : ""}
            </button>
            <button
              onClick={() => setActiveTab("inspiration")}
              style={{
                padding: "8px 14px",
                borderRadius: "9999px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                border: "none",
                background: activeTab === "inspiration" ? "rgba(225, 48, 108, 0.2)" : "transparent",
                color: activeTab === "inspiration" ? "#f472b6" : "#94a3b8",
              }}
            >
              💡 Inspiração Viral
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              style={{
                padding: "8px 14px",
                borderRadius: "9999px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                border: "none",
                background: activeTab === "templates" ? "rgba(255, 255, 255, 0.12)" : "transparent",
                color: activeTab === "templates" ? "#ffffff" : "#94a3b8",
              }}
            >
              📂 120+ Modelos
            </button>
            <button
              onClick={() => setActiveTab("canva-studio")}
              style={{
                padding: "8px 14px",
                borderRadius: "9999px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                border: "none",
                background: activeTab === "canva-studio" ? "var(--ig-sunset)" : "rgba(255, 255, 255, 0.04)",
                color: "#ffffff",
              }}
            >
              🛠️ Criar do Zero
            </button>
            <button
              onClick={() => setActiveTab("tutorials")}
              style={{
                padding: "8px 14px",
                borderRadius: "9999px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                border: "none",
                background: activeTab === "tutorials" ? "var(--ig-sunset)" : "rgba(255, 255, 255, 0.04)",
                color: "#ffffff",
              }}
            >
              🎓 Tutoriais & IA
            </button>
          </nav>
        )}

        {/* LADO DIREITO: AUTENTICAÇÃO, NOTIFICAÇÕES E PERFIL DO CLIENTE */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {!user ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode("login");
                  setIsAuthModalOpen(true);
                }}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: "9999px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                👤 Entrar
              </button>
            </>
          ) : (
            <>
              {/* SINO DE NOTIFICAÇÕES */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen(!isNotificationsOpen);
                    setHasUnreadNotifications(false);
                  }}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    position: "relative",
                    color: "#ffffff",
                    fontSize: "16px",
                  }}
                >
                  🔔
                  {hasUnreadNotifications && (
                    <span
                      style={{
                        position: "absolute",
                        top: "2px",
                        right: "2px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#ef4444",
                        border: "1.5px solid #000000",
                      }}
                    />
                  )}
                </button>

                {isNotificationsOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "48px",
                      right: 0,
                      width: "320px",
                      background: "#121218",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "16px",
                      padding: "16px",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.7)",
                      zIndex: 100,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff" }}>🔔 Notificações</span>
                      <button
                        type="button"
                        onClick={() => setIsNotificationsOpen(false)}
                        style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "14px" }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "10px", borderLeft: "3px solid #22c55e" }}>
                        <strong style={{ display: "block", color: "#ffffff" }}>🎉 Biblioteca com 120+ Templates!</strong>
                        <span style={{ color: "#94a3b8" }}>
                          Agora você tem mais de 100 templates profissionais categorizados para cada profissão (Marketing, Medicina, Direito, Odonto...).
                        </span>
                      </div>

                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "10px", borderLeft: "3px solid #f472b6" }}>
                        <strong style={{ display: "block", color: "#ffffff" }}>👆 Deslize Igual ao Instagram!</strong>
                        <span style={{ color: "#94a3b8" }}>
                          Basta arrastar para o lado com o dedo no celular ou mouse no PC para navegar suavemente pelos slides.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PERFIL DO CLIENTE */}
              <div
                onClick={() => setIsProfileModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: "4px 12px 4px 6px",
                  borderRadius: "9999px",
                  cursor: "pointer",
                }}
                title="Abrir Meu Perfil / Informações da Marca"
              >
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", overflow: "hidden", background: "var(--ig-sunset)", padding: "1.5px" }}>
                  {avatarImage ? (
                    <img src={avatarImage} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                  <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#ffffff" }}>{user.name.split(" ")[0]}</span>
                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>@{handle}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "12px",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
                title="Sair da Conta"
              >
                Sair
              </button>
            </>
          )}
        </div>
      </header>

      {/* MODAL POPUP DE ENTRADA: CAPTURA DE LEAD + COMUNIDADE VIP NO WHATSAPP */}
      {isLeadModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(180deg, #161622 0%, #0d0d14 100%)",
              border: "1px solid rgba(225, 48, 108, 0.35)",
              borderRadius: "28px",
              padding: "36px 30px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 25px 70px rgba(0,0,0,0.9), 0 0 40px rgba(225, 48, 108, 0.15)",
              position: "relative",
              textAlign: "center",
            }}
          >
            <button
              type="button"
              onClick={() => setIsLeadModalOpen(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "rgba(255,255,255,0.06)",
                border: "none",
                color: "#94a3b8",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ✕
            </button>

            {leadStep === "form" ? (
              <>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(34, 197, 94, 0.15)",
                    border: "1px solid rgba(34, 197, 94, 0.35)",
                    padding: "4px 14px",
                    borderRadius: "9999px",
                    color: "#86efac",
                    fontSize: "11px",
                    fontWeight: 800,
                    marginBottom: "14px",
                  }}
                >
                  <span>🎁 CONVITE EXCLUSIVO • ACESSO VIP</span>
                </div>

                <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px", marginBottom: "8px" }}>
                  Entre na Comunidade VIP no WhatsApp
                </h3>
                <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.5, marginBottom: "22px" }}>
                  Cadastre seu contato para garantir sua vaga no <strong>Lote Fundador ({scarcityTier.priceFormatted})</strong> e receber prompts virais e templates semanais direto no WhatsApp!
                </p>

                {leadError && (
                  <div style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", padding: "10px", borderRadius: "12px", fontSize: "12px", marginBottom: "14px" }}>
                    {leadError}
                  </div>
                )}

                <form onSubmit={handleLeadSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>
                      Seu Nome ou @ do Instagram
                    </label>
                    <input
                      type="text"
                      className="studio-input"
                      placeholder="Ex: Marco Matias ou @marcomatias"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>
                      Seu Melhor E-mail *
                    </label>
                    <input
                      type="email"
                      required
                      className="studio-input"
                      placeholder="seuemail@exemplo.com"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>
                      Seu WhatsApp com DDD *
                    </label>
                    <input
                      type="tel"
                      required
                      className="studio-input"
                      placeholder="(11) 99999-9999"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={leadLoading}
                    style={{
                      background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                      color: "#ffffff",
                      border: "none",
                      padding: "14px",
                      borderRadius: "14px",
                      fontSize: "14.5px",
                      fontWeight: 800,
                      cursor: "pointer",
                      marginTop: "6px",
                      boxShadow: "0 10px 25px rgba(37, 211, 102, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <span>{leadLoading ? "Cadastrando..." : "Entrar na Comunidade VIP no WhatsApp 📲"}</span>
                  </button>
                </form>

                <div style={{ marginTop: "14px", display: "flex", justifyContent: "center", gap: "12px", fontSize: "11px", color: "#64748b" }}>
                  <span>🛡️ Seus dados 100% seguros</span>
                  <span>•</span>
                  <span>Zero Spam</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(37, 211, 102, 0.15)", border: "2px solid #25D366", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px" }}>
                  📲
                </div>

                <h3 style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff", marginBottom: "8px" }}>
                  🎉 Acesso Liberado!
                </h3>
                <p style={{ color: "#94a3b8", fontSize: "13.5px", lineHeight: 1.5, marginBottom: "24px" }}>
                  Agora é só clicar no botão abaixo para ingressar no <strong>Canal VIP no WhatsApp</strong> e receber prompts virais e novidades em primeira mão:
                </p>

                <a
                  href={whatsappGroupUrl || "https://whatsapp.com/channel/0029Vb95NoEKwqSYdC0K860H"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleRecordWhatsappClick("popup_success")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                    color: "#ffffff",
                    padding: "16px 24px",
                    borderRadius: "14px",
                    textDecoration: "none",
                    fontWeight: 900,
                    fontSize: "16px",
                    boxShadow: "0 10px 30px rgba(37, 211, 102, 0.4)",
                    marginBottom: "14px",
                  }}
                >
                  <span>Abrir Canal VIP no WhatsApp 🚀</span>
                </a>

                <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "18px" }}>
                  (Canal oficial: novidades, templates da semana e dicas exclusivas)
                </p>

                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(false)}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#ffffff",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    fontSize: "12.5px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Continuar para o Criador de Carrosséis →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE AUTENTICAÇÃO */}
      {isAuthModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#121218",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "20px",
              padding: "24px 22px 18px",
              maxWidth: "390px",
              width: "100%",
              maxHeight: "calc(100vh - 32px)",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.85)",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                background: "rgba(255,255,255,0.06)",
                border: "none",
                color: "#94a3b8",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "var(--ig-sunset)", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                ✨
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.3px" }}>
                {authModalMode === "login" ? "Acesse sua Conta" : "Crie sua Conta no Magic Carousels"}
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "2px" }}>
                {authModalMode === "login"
                  ? "Entre para acessar seus carrosséis salvos e estúdio."
                  : "Cadastre-se para liberar seu teste gratuito de 1 carrossel."}
              </p>
            </div>

            {/* SELETOR DE ABAS PRINCIPAL: ENTRAR VS CRIAR CONTA */}
            <div
              style={{
                display: "flex",
                gap: "4px",
                background: "rgba(255,255,255,0.05)",
                padding: "3px",
                borderRadius: "12px",
                marginBottom: "12px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode("login");
                  setAuthError("");
                }}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "9px",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  background: authModalMode === "login" ? "var(--ig-sunset)" : "transparent",
                  color: "#ffffff",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: authModalMode === "login" ? "0 4px 12px rgba(225, 48, 108, 0.3)" : "none",
                }}
              >
                🔑 Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode("register");
                  setAuthError("");
                }}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "9px",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  background: authModalMode === "register" ? "var(--ig-sunset)" : "transparent",
                  color: "#ffffff",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: authModalMode === "register" ? "0 4px 12px rgba(225, 48, 108, 0.3)" : "none",
                }}
              >
                ✨ Criar Conta
              </button>
            </div>

            {/* BOTÕES SOCIAIS COMPACTOS EM LINHA (ECONOMIZA ESPAÇO VERTICAL) */}
            <div
              ref={googleBtnContainerRef}
              style={{ display: "none" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "10px" }}>
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                disabled={authPending}
                title="Google"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  background: "#ffffff",
                  color: "#0f172a",
                  border: "none",
                  borderRadius: "10px",
                  padding: "9px 8px",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "transform 0.15s ease",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin("apple")}
                disabled={authPending}
                title="Apple"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  background: "#000000",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "10px",
                  padding: "9px 8px",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "transform 0.15s ease",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.92 2.74 1.01.08 2.01-.5 2.62-1.24z" />
                </svg>
                <span>Apple</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin("facebook")}
                disabled={authPending}
                title="Facebook"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  background: "#1877F2",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "9px 8px",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "transform 0.15s ease",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "10px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>ou com seu e-mail</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
            </div>

            <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              {authModalMode === "register" && (
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "3px" }}>
                    Seu Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    className="studio-input"
                    style={{ padding: "8px 12px", fontSize: "13px", borderRadius: "10px" }}
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Ex: Marco Matias"
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "3px" }}>
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  className="studio-input"
                  style={{ padding: "8px 12px", fontSize: "13px", borderRadius: "10px" }}
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "3px" }}>
                  Senha
                </label>
                <input
                  type="password"
                  required
                  className="studio-input"
                  style={{ padding: "8px 12px", fontSize: "13px", borderRadius: "10px" }}
                  minLength={authModalMode === "register" ? 6 : undefined}
                  autoComplete={authModalMode === "register" ? "new-password" : "current-password"}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              {authModalMode === "register" && (
                <label style={{ display: "flex", gap: "6px", fontSize: "11px", alignItems: "center", color: "#94a3b8", marginTop: "1px" }}>
                  <input
                    type="checkbox"
                    required
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    style={{ accentColor: "#e1306c", cursor: "pointer" }}
                  />
                  <span>
                    Li e aceito os <Link href="/termos" target="_blank" style={{ color: "#f472b6" }}>Termos</Link> e <Link href="/privacidade" target="_blank" style={{ color: "#f472b6" }}>Privacidade</Link>.
                  </span>
                </label>
              )}

              {authError && (
                <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "8px 10px", borderRadius: "8px", color: "#f87171", fontSize: "11.5px", fontWeight: 700 }}>
                  ⚠️ {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authPending}
                className="btn-primary-ig"
                style={{ width: "100%", padding: "10px", borderRadius: "10px", marginTop: "4px", fontSize: "13px", fontWeight: 800 }}
              >
                {authPending ? "Processando..." : authModalMode === "login" ? "Entrar na Minha Conta 🔑" : "Criar Conta e Liberar Teste Grátis ✨"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => {
                  setAuthError("");
                  setAuthModalMode(authModalMode === "login" ? "register" : "login");
                }}
                style={{ background: "none", border: "none", color: "#f472b6", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
              >
                {authModalMode === "login"
                  ? "Ainda não tem conta? Clique aqui para Criar"
                  : "Já possui conta cadastrada? Clique aqui para Fazer Login"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DO PERFIL DO CLIENTE */}
      {isProfileModalOpen && user && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#121218",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "28px",
              padding: "32px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 25px 60px rgba(0,0,0,0.9)",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              style={{
                position: "absolute",
                top: "18px",
                right: "18px",
                background: "rgba(255,255,255,0.06)",
                border: "none",
                color: "#94a3b8",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ✕
            </button>

            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#f472b6", letterSpacing: "1px" }}>
                SUA CONTA & IDENTIDADE
              </span>
              <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                Perfil & Assinatura
              </h3>
            </div>

            {/* INFORMAÇÕES DA CONTA DO CLIENTE */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>E-mail cadastrado</span>
                  <strong style={{ fontSize: "13.5px", color: "#ffffff" }}>{user.email}</strong>
                </div>
                <div
                  style={{
                    background: user.plan === "LIFETIME" || isPaidLifetime ? "rgba(34, 197, 94, 0.15)" : "rgba(225, 48, 108, 0.15)",
                    border: `1px solid ${user.plan === "LIFETIME" || isPaidLifetime ? "rgba(34, 197, 94, 0.4)" : "rgba(225, 48, 108, 0.4)"}`,
                    color: user.plan === "LIFETIME" || isPaidLifetime ? "#4ade80" : "#f472b6",
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: 800,
                  }}
                >
                  {user.plan === "LIFETIME" || isPaidLifetime ? "⭐ Plano Vitalício PRO" : user.freeTrialsUsed === 0 ? "⏳ Teste Grátis (1/1)" : "⚠️ Teste Esgotado"}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px", fontSize: "12px", color: "#94a3b8" }}>
                <span>Membro desde:</span>
                <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "22 de Outubro de 2026"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", background: "var(--ig-sunset)", padding: "2px", flexShrink: 0 }}>
                  {avatarImage ? (
                    <img src={avatarImage} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800 }}>
                      📷
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#ffffff", marginBottom: "4px" }}>
                    Foto de Perfil nos Carrosséis
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input type="file" accept="image/png,image/jpeg,image/webp" id="modal-avatar" onChange={handleAvatarUpload} style={{ display: "none" }} />
                    <label
                      htmlFor="modal-avatar"
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "#ffffff",
                        padding: "5px 12px",
                        borderRadius: "8px",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {avatarImage ? "Trocar Foto" : "Subir Foto"}
                    </label>
                    {avatarImage && (
                      <button
                        type="button"
                        onClick={() => setAvatarImage(null)}
                        style={{ background: "none", border: "none", color: "#ef4444", fontSize: "11.5px", cursor: "pointer", fontWeight: 700 }}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#94a3b8", marginBottom: "4px" }}>
                  Seu @ do Instagram (Aparecerá nos Slides)
                </label>
                <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.04)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", padding: "0 12px" }}>
                  <span style={{ color: "#f472b6", fontWeight: 800 }}>@</span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.replace("@", ""))}
                    style={{ background: "transparent", border: "none", color: "#ffffff", padding: "12px 6px", fontSize: "14px", width: "100%", outline: "none" }}
                    placeholder="seunome"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#94a3b8", marginBottom: "4px" }}>
                  Nome do Autor / Especialista
                </label>
                <input
                  type="text"
                  className="studio-input"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                />
              </div>

              <button
                type="button"
                onClick={handleSaveProfileKit}
                disabled={profileSaving}
                className="btn-primary-ig"
                style={{ width: "100%", padding: "14px", borderRadius: "12px", marginTop: "8px" }}
              >
                {profileSaving ? "Salvando..." : "💾 Salvar Informações"}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "10px",
                  background: "transparent",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🚪 Sair da Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAYWALL */}
      {isPaywallOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#121218",
              border: "2px solid #e1306c",
              borderRadius: "32px",
              padding: "40px 32px",
              maxWidth: "480px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 25px 70px rgba(225, 48, 108, 0.4)",
              position: "relative",
            }}
          >
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(225, 48, 108, 0.15)", border: "1px solid rgba(225, 48, 108, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 16px" }}>
              🔒
            </div>

            <h3 style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff", marginBottom: "8px" }}>
              Limite do Teste Grátis Atingido
            </h3>

            <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
              {paywallMessage || "Você já utilizou sua cota de 1 carrossel de teste gratuito! Para continuar criando carrosséis virais ilimitados, ative sua licença vitalícia."}
            </p>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "18px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "24px" }}>
              <span style={{ fontSize: "13px", textDecoration: "line-through", color: "#94a3b8" }}>De R$ 197,90</span>
              <div style={{ fontSize: "36px", fontWeight: 900, color: "#ffffff", lineHeight: 1, margin: "6px 0" }}>
                R$ 47<span style={{ fontSize: "22px", color: "#f472b6" }}>,90</span>
              </div>
              <span style={{ fontSize: "12px", color: "#22c55e", fontWeight: 800 }}>
                ✓ Pagamento Único Vitalício • Sem Mensalidades
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsPaywallOpen(false);
                setActiveTab("checkout");
              }}
              className="btn-primary-ig"
              style={{ width: "100%", padding: "16px", fontSize: "16px", borderRadius: "14px", marginBottom: "12px" }}
            >
              💳 Liberar Acesso Vitalício Imediato
            </button>

            <button
              type="button"
              onClick={() => setIsPaywallOpen(false)}
              style={{ background: "none", border: "none", color: "#64748b", fontSize: "12.5px", cursor: "pointer", fontWeight: 700 }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE FINALIZAÇÃO DE POST: LEGENDA MAGNÉTICA & HASHTAGS ESTRATÉGICAS */}
      {isFinalizeModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(180deg, #161622 0%, #0d0d14 100%)",
              border: "1px solid rgba(225, 48, 108, 0.4)",
              borderRadius: "32px",
              padding: "36px 30px",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "0 25px 70px rgba(0,0,0,0.95), 0 0 50px rgba(225, 48, 108, 0.2)",
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <button
              type="button"
              onClick={() => setIsFinalizeModalOpen(false)}
              style={{
                position: "absolute",
                top: "18px",
                right: "18px",
                background: "rgba(255,255,255,0.06)",
                border: "none",
                color: "#94a3b8",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ✕
            </button>

            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.35)", padding: "4px 14px", borderRadius: "9999px", color: "#86efac", fontSize: "11px", fontWeight: 800, marginBottom: "12px" }}>
              <span>🎉 CARROSSEL PRONTO PARA POSTAR</span>
            </div>

            <h3 style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px", marginBottom: "6px" }}>
              Legenda Magnética & Hashtags
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.5, marginBottom: "20px" }}>
              Geramos uma legenda otimizada para o algoritmo do Instagram: gancho antes do &quot;... mais&quot;, estrutura em tópicos respiráveis e 15 hashtags nichadas de alta relevância.
            </p>

            {/* CAIXA DE TEXTO DA LEGENDA */}
            <div style={{ marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#cbd5e1" }}>
                  ✍️ Texto Formatado da Legenda (você pode editar antes de copiar):
                </span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  {activeCaptionText.length} caracteres
                </span>
              </div>

              <textarea
                rows={9}
                className="studio-input"
                value={activeCaptionText}
                onChange={(e) => setEditedCaptionText(e.target.value)}
                style={{ width: "100%", fontSize: "12.5px", lineHeight: 1.6, resize: "vertical", fontFamily: "inherit", borderRadius: "14px" }}
              />
            </div>

            {/* HASHTAGS INDIVIDUAIS */}
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#ffffff" }}>
                  #️⃣ Hashtags Estratégicas ({postCaptionData?.hashtags.length || 0}):
                </span>
                <button
                  type="button"
                  onClick={handleCopyHashtagsOnly}
                  style={{
                    background: tagsCopied ? "#22c55e" : "rgba(255,255,255,0.08)",
                    border: "none",
                    color: "#ffffff",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {tagsCopied ? "✓ Tags Copiadas!" : "Copiar Apenas Tags"}
                </button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {postCaptionData?.hashtags.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "rgba(225, 48, 108, 0.12)",
                      border: "1px solid rgba(225, 48, 108, 0.25)",
                      color: "#f472b6",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={handleCopyFullCaption}
                className="btn-primary-ig"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "14px",
                  fontSize: "14px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <span>{captionCopied ? "✅ Legenda Completa Copiada!" : "📋 Copiar Legenda Completa com Hashtags"}</span>
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={async () => {
                    await persistCarousel();
                    alert("💾 Post e Legenda salvos com sucesso na sua Área de Projetos!");
                  }}
                  style={{
                    flex: 1,
                    background: "rgba(34, 197, 94, 0.15)",
                    border: "1px solid rgba(34, 197, 94, 0.35)",
                    color: "#86efac",
                    padding: "11px",
                    borderRadius: "12px",
                    fontSize: "12.5px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <span>💾</span>
                  <span>Salvar nos Meus Projetos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFinalizeModalOpen(false)}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#cbd5e1",
                    padding: "11px",
                    borderRadius: "12px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Continuar Editando
                </button>
              </div>
            </div>

            {/* DICA DE ENGAJAMENTO */}
            <div style={{ marginTop: "18px", background: "rgba(255,255,255,0.02)", padding: "10px 14px", borderRadius: "10px", fontSize: "11.5px", color: "#64748b", lineHeight: 1.5 }}>
              💡 <strong>Dica do Algoritmo:</strong> Ao postar no Instagram, responda aos 3 primeiros comentários nos primeiros 15 minutos para sinalizar pico de retenção e ativar o motor de distribuição no feed explorar!
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main id="conteudo" style={{ flex: 1, padding: "16px 12px 90px 12px", maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
        {user && <nav aria-label="Sua conta" className="account-tools"><Link href="/app">Meus projetos{user.isAdmin ? " e administração" : ""}</Link>{activeTab === "creator" && <button type="button" onClick={() => persistCarousel()} disabled={saving || isGenerating}>{saving ? "Salvando…" : "Salvar projeto"}</button>}<span role="status">{saveMessage}</span></nav>}
        {/* ============================================================ */}
        {/* ABA 1: PÁGINA DE VENDAS DE ALTA CONVERSÃO                    */}
        {/* ============================================================ */}
        {activeTab === "landing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "60px", padding: "20px 0" }}>
            <section id="section-hero" style={{ textAlign: "center", maxWidth: "1080px", margin: "0 auto", padding: "10px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 18px",
                  borderRadius: "9999px",
                  background: "rgba(225, 48, 108, 0.12)",
                  border: "1px solid rgba(225, 48, 108, 0.35)",
                  color: "#f472b6",
                  fontSize: "12.5px",
                  fontWeight: 800,
                  marginBottom: "20px",
                }}
              >
                <span>🔥 TECNOLOGIA HÍBRIDA • DESLIZE IGUAL AO INSTAGRAM NO CELULAR & PC</span>
              </div>

              <h1
                style={{
                  fontSize: "clamp(32px, 5.5vw, 56px)",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: "-1.5px",
                  marginBottom: "20px",
                  color: "#ffffff",
                }}
              >
                Crie Carrosséis Virais que Vendem{" "}
                <span className="text-gradient-ig">no Celular ou no PC</span> em Menos de 60 Segundos.
              </h1>

              <p
                style={{
                  fontSize: "clamp(16px, 2.2vw, 20px)",
                  color: "#94a3b8",
                  lineHeight: 1.6,
                  maxWidth: "840px",
                  margin: "0 auto 32px",
                  fontWeight: 500,
                }}
              >
                Chega de travar no Canva. Mais de 120 templates nichados por profissão.
                Basta arrastar para o lado com o dedo para navegar, exatamente igual ao feed do Instagram!
              </p>

              {/* BADGE DE PROVA SOCIAL AO VIVO (+100 USUÁRIOS TESTE EM MENOS DE 24 HORAS) */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "rgba(34, 197, 94, 0.12)",
                  border: "1px solid rgba(34, 197, 94, 0.35)",
                  padding: "6px 18px",
                  borderRadius: "9999px",
                  marginBottom: "20px",
                  boxShadow: "0 0 20px rgba(34, 197, 94, 0.2)",
                }}
              >
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 10px #22c55e", display: "inline-block" }} />
                <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#86efac" }}>
                  AO VIVO: Mais de {activeTesters24h} criadores testando nas últimas 24 horas
                </span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "14px", marginBottom: "28px" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("checkout")}
                  className="btn-primary-ig"
                  style={{ padding: "16px 36px", fontSize: "16px", borderRadius: "9999px" }}
                >
                  ⚡ QUERO ACESSO VITALÍCIO ({scarcityTier.priceFormatted})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      setAuthModalMode("register");
                      setIsAuthModalOpen(true);
                    } else {
                      setActiveTab("creator");
                    }
                  }}
                  className="btn-ghost-dark"
                  style={{ padding: "16px 32px", fontSize: "15px" }}
                >
                  🎨 Testar 1 Carrossel Grátis
                </button>
              </div>

              {/* BADGES DE CONFIANÇA E DEVOLUÇÃO DE 7 DIAS */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "18px",
                  fontSize: "12.5px",
                  color: "#cbd5e1",
                  marginBottom: "28px",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#86efac" }}>
                  🛡️ <strong>7 dias</strong> de garantia incondicional
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  🔒 Pagamento seguro via <strong>Mercado Pago</strong>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  📱 <strong>iOS, Android, Mac & Windows</strong>
                </span>
              </div>

              {/* CARD DE ESCASSEZ EXCLUSIVA POR LOTES (1.000 E 10.000 USUÁRIOS) */}
              <div
                style={{
                  maxWidth: "680px",
                  margin: "0 auto 36px",
                  background: "rgba(18, 18, 24, 0.85)",
                  border: "1px solid rgba(225, 48, 108, 0.3)",
                  borderRadius: "20px",
                  padding: "20px 24px",
                  textAlign: "left",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px" }}>🔥</span>
                    <strong style={{ fontSize: "13.5px", color: "#ffffff", letterSpacing: "0.5px" }}>
                      {scarcityTier.name.toUpperCase()} • {scarcityTier.priceFormatted}
                    </strong>
                  </div>
                  <span style={{ fontSize: "12px", color: "#f472b6", fontWeight: 800 }}>
                    Restam apenas {scarcityTier.remainingSlots} vagas deste lote
                  </span>
                </div>

                {/* BARRA DE PROGRESSO VISUAL DAS VAGAS */}
                <div style={{ width: "100%", height: "10px", background: "rgba(255,255,255,0.08)", borderRadius: "9999px", overflow: "hidden", marginBottom: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div
                    style={{
                      width: `${scarcityTier.progressPercent}%`,
                      height: "100%",
                      background: "var(--ig-sunset)",
                      borderRadius: "9999px",
                      transition: "width 1s ease-in-out",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "10px" }}>
                  <span>{scarcityTier.currentUsers} vagas preenchidas ({scarcityTier.progressPercent}%)</span>
                  <span>Limite do Lote: {scarcityTier.maxUsers} usuários</span>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: "10px", borderLeft: "3px solid #f472b6", fontSize: "11.5px", color: "#cbd5e1", lineHeight: 1.5 }}>
                  <strong style={{ color: "#ffffff", display: "block", marginBottom: "2px" }}>
                    ⚠️ Subida Automática de Preço:
                  </strong>
                  Ao completar <strong>1.000 usuários</strong>, o sistema muda automaticamente para <strong>R$ 197,90</strong>. Ao completar <strong>10.000 usuários</strong>, fecha o acesso público e muda para <strong>R$ 497,90</strong>. Queremos um sistema único e enxuto para poucos no mercado dominarem com exclusividade.
                </div>
              </div>
            </section>

            {/* SLIDE / MARQUEE DE FOTOS DE PERFIL E EMPRESAS REAIS COMPRANDO */}
            <section id="section-recursos" style={{ margin: "0 0 20px 0", overflow: "hidden" }}>
              <div style={{ textAlign: "center", marginBottom: "18px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.25)", padding: "4px 14px", borderRadius: "9999px", marginBottom: "6px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                  <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#86efac", textTransform: "uppercase" }}>
                    Compradores e Criadores Verificados
                  </span>
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#ffffff" }}>
                  Quem já está criando e escalando nas redes:
                </h3>
              </div>

              <div className="marquee-container">
                <div className="marquee-content">
                  {[...SOCIAL_PROOF_PROFILES, ...SOCIAL_PROOF_PROFILES].map((prof, idx) => (
                    <div
                      key={`${prof.id}-${idx}`}
                      style={{
                        background: "rgba(18, 18, 24, 0.88)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "18px",
                        padding: "14px 18px",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        minWidth: "295px",
                        flexShrink: 0,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                      }}
                    >
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <img
                          src={prof.avatar}
                          alt={prof.name}
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid #e1306c",
                            display: "block",
                          }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            bottom: "-2px",
                            right: "-2px",
                            background: "#22c55e",
                            color: "#ffffff",
                            fontSize: "10px",
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1.5px solid #121218",
                            fontWeight: 900,
                          }}
                        >
                          ✓
                        </span>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {prof.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {prof.role} • {prof.city}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                          <span style={{ fontSize: "10.5px", color: "#f472b6", fontWeight: 700 }}>
                            {prof.recentPurchase}
                          </span>
                          <span style={{ fontSize: "10px", color: "#facc15" }}>★★★★★</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* SHOWCASE DUPLO COM CARROSSEL DESLIZÁVEL IGUAL AO INSTAGRAM */}
            <section
              id="section-preview"
              style={{
                background: "linear-gradient(180deg, rgba(18, 18, 24, 0.7) 0%, rgba(10, 10, 14, 0.95) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "36px",
                padding: "48px 24px",
                position: "relative",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "36px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "1px", background: "rgba(255,255,255,0.08)", padding: "4px 14px", borderRadius: "9999px", color: "#facc15" }}>
                  INTERATIVO • DESLIZE PARA O LADO
                </span>
                <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, marginTop: "12px", color: "#ffffff" }}>
                  Passe o dedo para o lado igualzinho ao Instagram
                </h2>
                <p style={{ color: "#94a3b8", fontSize: "15px", maxWidth: "680px", margin: "8px auto 0" }}>
                  Toque na tela do smartphone abaixo e deslize para conferir a transição suave de lâminas.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "36px",
                  alignItems: "center",
                  maxWidth: "1160px",
                  margin: "0 auto",
                }}
              >
                {/* IPHONE 16 PRO COM SWIPE NATIVO IGUAL AO INSTAGRAM */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "16px",
                      background: "rgba(225, 48, 108, 0.15)",
                      padding: "6px 14px",
                      borderRadius: "9999px",
                      border: "1px solid rgba(225, 48, 108, 0.3)",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>📱</span>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#f472b6" }}>
                      Modo Mobile: Deslize com o polegar
                    </span>
                  </div>

                  <div className="iphone-frame">
                    <div className="iphone-island">
                      <div className="iphone-island-cam" />
                    </div>

                    <div className="iphone-screen">
                      <div style={{ padding: "12px 18px 4px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", fontWeight: 800, color: "#000000" }}>
                        <span>09:41</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>5G</span>
                          <span>🔋 100%</span>
                        </div>
                      </div>

                      <div style={{ padding: "6px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "var(--ig-sunset)", padding: "1.5px" }}>
                            {avatarImage ? (
                              <img src={avatarImage} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "12px", fontWeight: 800 }}>
                                {handle.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>{handle}</span>
                            <span style={{ display: "block", fontSize: "9px", color: "#64748b" }}>Áudio original</span>
                          </div>
                        </div>
                        <span style={{ fontSize: "18px", color: "#64748b", fontWeight: 900 }}>···</span>
                      </div>

                      {/* CONTAINER DESLIZÁVEL DE VERDADE (SWIPE HORIZONTAL) */}
                      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                        {/* SETA FLUTUANTE ESQUERDA */}
                        {activeSlideIndex > 0 && (
                          <button
                            type="button"
                            onClick={() => scrollToSlide(activeSlideIndex - 1, "landing")}
                            style={{
                              position: "absolute",
                              left: "8px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              zIndex: 10,
                              background: "rgba(0,0,0,0.55)",
                              color: "#ffffff",
                              border: "none",
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                          >
                            ‹
                          </button>
                        )}

                        {/* SETA FLUTUANTE DIREITA */}
                        {activeSlideIndex < slides.length - 1 && (
                          <button
                            type="button"
                            onClick={() => scrollToSlide(activeSlideIndex + 1, "landing")}
                            style={{
                              position: "absolute",
                              right: "8px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              zIndex: 10,
                              background: "rgba(0,0,0,0.55)",
                              color: "#ffffff",
                              border: "none",
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                          >
                            ›
                          </button>
                        )}

                        <div
                          ref={landingSliderRef}
                          onScroll={handleSliderScroll}
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            overflowX: "auto",
                            scrollSnapType: "x mandatory",
                            WebkitOverflowScrolling: "touch",
                            scrollbarWidth: "none",
                            touchAction: "pan-x pan-y",
                            cursor: "grab",
                          }}
                        >
                          {slides.map((s, idx) => (
                            <div
                              key={s.id || idx}
                              style={{
                                flex: "0 0 100%",
                                width: "100%",
                                height: "100%",
                                scrollSnapAlign: "start",
                                scrollSnapStop: "always",
                              }}
                            >
                              {renderSlideContent(s, idx, idx === activeSlideIndex)}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* BARRA DE AÇÕES DO INSTAGRAM COM BOLINHAS DE PAGINAÇÃO */}
                      <div style={{ padding: "8px 14px", background: "#ffffff", borderTop: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "16px" }}>
                            <span>❤️</span>
                            <span>💬</span>
                            <span>🚀</span>
                          </div>
                          {/* BOLINHAS DE PAGINAÇÃO DO INSTAGRAM */}
                          <div style={{ display: "flex", gap: "4px" }}>
                            {slides.map((_, i) => (
                              <div
                                key={i}
                                onClick={() => scrollToSlide(i, "landing")}
                                style={{
                                  width: activeSlideIndex === i ? "16px" : "6px",
                                  height: "6px",
                                  borderRadius: "3px",
                                  background: activeSlideIndex === i ? "#e1306c" : "#cbd5e1",
                                  cursor: "pointer",
                                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                                }}
                              />
                            ))}
                          </div>
                          <span style={{ fontSize: "16px" }}>🔖</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MACBOOK PRO WINDOW */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "16px",
                      background: "rgba(56, 189, 248, 0.15)",
                      padding: "6px 14px",
                      borderRadius: "9999px",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      width: "fit-content",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>💻</span>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#38bdf8" }}>
                      Mais de 120 Templates Nichados por Profissão
                    </span>
                  </div>

                  <div className="macbook-frame">
                    <div className="macbook-header">
                      <div className="macbook-dot macbook-dot-red" />
                      <div className="macbook-dot macbook-dot-yellow" />
                      <div className="macbook-dot macbook-dot-green" />
                      <div className="macbook-title">
                        <span>⚡ Magic Carousels Pro — 120+ Templates por Nicho</span>
                      </div>
                    </div>

                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff" }}>
                            Biblioteca Nichada para Especialistas
                          </div>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Toque em uma profissão para testar o modelo e texto no celular:</span>
                        </div>
                        <span style={{ fontSize: "11px", color: "#f472b6", fontWeight: 800, background: "rgba(244,114,182,0.12)", padding: "3px 8px", borderRadius: "9999px" }}>
                          ⚡ Demonstração Ao Vivo
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11.5px", color: "#cbd5e1" }}>
                        {[
                          { id: "imobiliario" as NicheId, label: "🏢 Imobiliário & Corretores", count: 8 },
                          { id: "religiao" as NicheId, label: "✝️ Fé & Espiritualidade", count: 8 },
                          { id: "autoestima" as NicheId, label: "✨ Autoestima & Autocuidado", count: 8 },
                          { id: "marketing" as NicheId, label: "🚀 Marketing & Vendas", count: 8 },
                          { id: "saude" as NicheId, label: "🩺 Medicina & Saúde", count: 8 },
                          { id: "direito" as NicheId, label: "⚖️ Direito & Advocacia", count: 8 },
                          { id: "nutricao" as NicheId, label: "🥗 Nutrição & Dieta", count: 8 },
                          { id: "fitness" as NicheId, label: "🏋️‍♂️ Fitness & Treino", count: 8 },
                          { id: "odontologia" as NicheId, label: "🦷 Odontologia", count: 8 },
                          { id: "estetica" as NicheId, label: "💄 Estética & Beleza", count: 8 },
                          { id: "contabilidade" as NicheId, label: "📊 Contabilidade & Finanças", count: 8 },
                          { id: "viagem" as NicheId, label: "✈️ Viagem & Turismo", count: 8 },
                        ].map((item) => {
                          const isSelected = selectedNiche === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelectLandingNiche(item.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                background: isSelected
                                  ? "linear-gradient(135deg, rgba(225, 48, 108, 0.28) 0%, rgba(131, 58, 180, 0.28) 100%)"
                                  : "rgba(255,255,255,0.04)",
                                border: isSelected
                                  ? "1px solid #f472b6"
                                  : "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "10px",
                                padding: "9px 12px",
                                color: isSelected ? "#ffffff" : "#cbd5e1",
                                fontSize: "11.5px",
                                fontWeight: isSelected ? 800 : 600,
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                                boxShadow: isSelected ? "0 4px 16px rgba(225, 48, 108, 0.3)" : "none",
                                transform: isSelected ? "scale(1.02)" : "scale(1)",
                              }}
                            >
                              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                <strong>{item.label}</strong>
                              </span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  background: isSelected ? "var(--ig-sunset)" : "rgba(255,255,255,0.08)",
                                  color: "#ffffff",
                                  padding: "2px 6px",
                                  borderRadius: "9999px",
                                  fontWeight: 800,
                                  flexShrink: 0,
                                  marginLeft: "4px",
                                }}
                              >
                                {isSelected ? "✓ Na tela" : `(${item.count})`}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#94a3b8", background: "rgba(255,255,255,0.02)", padding: "6px 10px", borderRadius: "8px" }}>
                        <span>💡</span>
                        <span>
                          Exibindo agora: <strong style={{ color: "#ffffff" }}>{getNiche(selectedNiche).name}</strong>. Deslize os slides no celular ao lado para ver todo o conteúdo.
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!user) {
                            setAuthModalMode("register");
                            setIsAuthModalOpen(true);
                          } else {
                            setActiveTab("creator");
                          }
                        }}
                        className="btn-primary-ig"
                        style={{ width: "100%", padding: "12px", fontSize: "14px" }}
                      >
                        ⚡ Criar Carrossel de {getNiche(selectedNiche).name}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SEÇÃO DEDICADA: GARANTIA INCONDICIONAL DE 7 DIAS (RISCO ZERO) */}
            <section
              id="section-garantia"
              style={{
                background: "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(18, 18, 24, 0.95) 50%, rgba(225, 48, 108, 0.08) 100%)",
                border: "1px solid rgba(34, 197, 94, 0.35)",
                borderRadius: "32px",
                padding: "48px 32px",
                textAlign: "center",
                maxWidth: "960px",
                margin: "0 auto",
                boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "rgba(34, 197, 94, 0.15)",
                  border: "2px solid #22c55e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "40px",
                  margin: "0 auto 20px",
                  boxShadow: "0 0 30px rgba(34, 197, 94, 0.3)",
                }}
              >
                🛡️
              </div>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", padding: "4px 16px", borderRadius: "9999px", color: "#86efac", fontSize: "12px", fontWeight: 800, marginBottom: "14px" }}>
                <span>GARANTIA BLINDADA STONE • RISCO 100% ZERO</span>
              </div>

              <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 900, color: "#ffffff", letterSpacing: "-1px", marginBottom: "14px" }}>
                Teste por 7 Dias Completos. Se não Amar, Devolvemos 100% do seu Dinheiro.
              </h2>

              <p style={{ fontSize: "16px", color: "#cbd5e1", maxWidth: "760px", margin: "0 auto 28px", lineHeight: 1.6 }}>
                Queremos que você tome sua decisão com total tranquilidade. Entre agora, crie seus carrosséis, teste os mais de 120 templates nichados, use a IA e poste nas suas redes. Se dentro de <strong>7 dias</strong> você achar que a ferramenta não economizou horas da sua semana ou não elevou o padrão visual do seu perfil, basta nos enviar um único e-mail ou WhatsApp. <strong>Devolvemos 100% do valor pago imediatamente, sem letras miúdas e sem perguntas.</strong>
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px", marginBottom: "24px" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("checkout")}
                  className="btn-primary-ig"
                  style={{ padding: "16px 36px", fontSize: "16px", borderRadius: "9999px" }}
                >
                  ⚡ QUERO APROVEITAR O LOTE 1 COM GARANTIA ({scarcityTier.priceFormatted})
                </button>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px", fontSize: "12px", color: "#94a3b8" }}>
                <span>🔒 Pagamento Blindado via Mercado Pago</span>
                <span>•</span>
                <span>⚡ Reembolso Instantâneo no PIX ou Cartão</span>
                <span>•</span>
                <span>📄 Código de Defesa do Consumidor Art. 49</span>
              </div>
            </section>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 2: CRIADOR COM CARROSSEL DESLIZÁVEL IGUAL AO INSTAGRAM   */}
        {/* ============================================================ */}
        {activeTab === "creator" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="mobile-only" style={{ display: "flex", gap: "8px", background: "rgba(255,255,255,0.05)", padding: "4px", borderRadius: "12px" }}>
              <button
                type="button"
                onClick={() => setMobileViewMode("edit")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "13px",
                  cursor: "pointer",
                  background: mobileViewMode === "edit" ? "var(--ig-sunset)" : "transparent",
                  color: "#ffffff",
                }}
              >
                ✏️ Editar Conteúdo
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode("preview")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "13px",
                  cursor: "pointer",
                  background: mobileViewMode === "preview" ? "var(--ig-sunset)" : "transparent",
                  color: "#ffffff",
                }}
              >
                📱 Ver Post Deslizável
              </button>
            </div>

            {authLoading ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>⏳</div>
                <p style={{ fontSize: "15px" }}>Carregando estúdio de criação...</p>
              </div>
            ) : !user ? (
              <div
                style={{
                  maxWidth: "680px",
                  margin: "30px auto",
                  background: "linear-gradient(180deg, rgba(24, 24, 34, 0.95) 0%, rgba(18, 18, 24, 0.95) 100%)",
                  border: "1px solid rgba(225, 48, 108, 0.35)",
                  borderRadius: "24px",
                  padding: "44px 28px",
                  textAlign: "center",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 40px rgba(225, 48, 108, 0.15)",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "var(--ig-sunset)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    margin: "0 auto 16px auto",
                    boxShadow: "0 8px 24px rgba(225, 48, 108, 0.4)",
                  }}
                >
                  🔒
                </div>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#f472b6", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Acesso Restrito ao Estúdio
                </span>
                <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", marginTop: "8px", lineHeight: 1.3 }}>
                  Entre na sua conta para criar seu carrossel
                </h2>
                <p style={{ color: "#94a3b8", fontSize: "14.5px", maxWidth: "520px", margin: "12px auto 26px auto", lineHeight: 1.6 }}>
                  O Magic Carousels Pro Studio é um ambiente de produção exclusivo. Crie sua conta gratuita em 10 segundos para testar seu primeiro carrossel ou entre na sua conta se já for cadastrado.
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode("login");
                      setIsAuthModalOpen(true);
                    }}
                    className="btn-primary-ig"
                    style={{ padding: "14px 28px", fontSize: "14px" }}
                  >
                    🔑 Entrar na Minha Conta
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode("register");
                      setIsAuthModalOpen(true);
                    }}
                    className="btn-ghost-dark"
                    style={{ padding: "14px 28px", fontSize: "14px" }}
                  >
                    ✨ Criar Conta Gratuita
                  </button>
                </div>
                <div style={{ marginTop: "20px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("landing")}
                    style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}
                  >
                    ← Voltar para a página inicial
                  </button>
                </div>
              </div>
            ) : user.plan === "FREE" && user.freeTrialsUsed >= 1 && !isPaidLifetime ? (
              <div
                style={{
                  maxWidth: "760px",
                  margin: "10px auto 30px auto",
                  background: "linear-gradient(180deg, rgba(24, 24, 34, 0.95) 0%, rgba(18, 18, 24, 0.95) 100%)",
                  border: "1px solid rgba(225, 48, 108, 0.35)",
                  borderRadius: "24px",
                  padding: "40px 28px",
                  textAlign: "center",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 40px rgba(225, 48, 108, 0.15)",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "var(--ig-sunset)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    margin: "0 auto 16px auto",
                    boxShadow: "0 8px 24px rgba(225, 48, 108, 0.4)",
                  }}
                >
                  🚀
                </div>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#f472b6", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Teste Gratuito Utilizado com Sucesso
                </span>
                <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", marginTop: "8px", lineHeight: 1.3 }}>
                  Desbloqueie o Magic Carousels Pro com Acesso Vitalício
                </h2>
                <p style={{ color: "#94a3b8", fontSize: "14.5px", maxWidth: "560px", margin: "12px auto 24px auto", lineHeight: 1.6 }}>
                  Você já criou seu 1º carrossel de teste gratuito! Para continuar criando carrosséis virais ilimitados, usar fotos estilo Canva, exportar em Ultra HD (PNG, ZIP, PDF) e acessar os 120+ modelos, ative seu plano vitalício sem mensalidades:
                </p>

                {/* BENEFÍCIOS */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px", textAlign: "left", margin: "0 auto 28px auto", maxWidth: "620px" }}>
                  {[
                    "Criação e edição de carrosséis ILIMITADOS",
                    "Mais de 120 templates prontos de alta conversão",
                    "Editor estilo Canva com upload de fotos nos slides",
                    "Exportação Ultra HD em PNG, ZIP e PDF LinkedIn",
                    "Gerador de Legendas Magnéticas & Hashtags virais",
                    "Acesso Vitalício: Sem mensalidades (Pagamento Único)",
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.04)", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", color: "#e2e8f0" }}>
                      <span style={{ color: "#22c55e", fontWeight: 900 }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* PREÇO E CTA */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "18px", maxWidth: "420px", margin: "0 auto 24px auto" }}>
                  <div style={{ fontSize: "12px", color: "#94a3b8", textDecoration: "line-through" }}>De R$ 197,00 por apenas</div>
                  <div style={{ fontSize: "36px", fontWeight: 900, color: "#ffffff", margin: "4px 0" }}>
                    {scarcityTier.priceFormatted}
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#22c55e", marginLeft: "8px" }}>Pagamento Único</span>
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#f472b6", fontWeight: 700 }}>
                    ⚡ Oferta Promocional ({scarcityTier.name})
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartCheckout}
                  className="btn-primary-ig"
                  style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "16px 36px", fontSize: "16px", borderRadius: "14px", fontWeight: 900, cursor: "pointer", border: "none", boxShadow: "0 10px 30px rgba(225, 48, 108, 0.4)" }}
                >
                  <span>DESBLOQUEAR ACESSO VITALÍCIO AGORA ⚡</span>
                </button>

                <div style={{ marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", fontSize: "12px", color: "#64748b" }}>
                  <span>🔒 Pagamento 100% Seguro</span>
                  <span>•</span>
                  <span>🛡️ 7 Dias de Garantia Incondicional</span>
                  <span>•</span>
                  <span>⚡ Acesso Imediato</span>
                </div>

                <div style={{ marginTop: "24px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("projects")}
                    style={{ background: "none", border: "none", color: "#38bdf8", fontSize: "13px", cursor: "pointer", textDecoration: "underline", fontWeight: 700 }}
                  >
                    Ver meu carrossel anterior salvo na aba Meus Projetos →
                  </button>
                </div>
              </div>
            ) : null}

            {Boolean(user && !(user.plan === "FREE" && user.freeTrialsUsed >= 1 && !isPaidLifetime)) && (
              <>
              <div className="creator-split-grid">
              {/* COLUNA ESQUERDA: ESTÚDIO GUIADO DE 3 PASSOS E EDIÇÃO */}
              <div
                style={{
                  display: mobileViewMode === "edit" || typeof window !== "undefined" && window.innerWidth >= 1024 ? "flex" : "none",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div
                  style={{
                    background: "rgba(18, 18, 24, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "24px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {/* CABEÇALHO DO ESTÚDIO */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "14px" }}>
                    <div>
                      <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff" }}>
                        ⚡ Estúdio Guiado de Conteúdo
                      </h2>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Siga os 3 passos simples para gerar seu post viral
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#f472b6", fontWeight: 700, background: "rgba(225,48,108,0.12)", padding: "4px 10px", borderRadius: "9999px" }}>
                      {activeTemplate.name}
                    </span>
                  </div>

                  {/* ======================================================== */}
                  {/* PASSO 1: ESCOLHA O ESTILO VISUAL DO CARROSSEL            */}
                  {/* ======================================================== */}
                  <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--ig-sunset)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 900 }}>1</span>
                        <label style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff" }}>
                          Escolha o Estilo Visual
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("templates")}
                        style={{ background: "none", border: "none", color: "#38bdf8", fontSize: "11.5px", cursor: "pointer", fontWeight: 700 }}
                      >
                        Ver todos ({allTemplates.length}) →
                      </button>
                    </div>

                    {/* FILTROS POR CATEGORIA EM CHIPS */}
                    <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "8px", marginBottom: "12px" }}>
                      {TEMPLATE_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setWizardTemplateCategory(cat)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "9999px",
                            border: "none",
                            fontSize: "11px",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            background: wizardTemplateCategory === cat ? "var(--ig-sunset)" : "rgba(255,255,255,0.06)",
                            color: "#ffffff",
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* CARDS VISUAIS DOS TEMPLATES (MINIATURAS REAIS COM CORES E TIPOGRAFIA) */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                        gap: "10px",
                        maxHeight: "180px",
                        overflowY: "auto",
                        padding: "4px",
                        borderRadius: "12px",
                      }}
                    >
                      {allTemplates
                        .filter((t) => wizardTemplateCategory === "Todos" || t.category === wizardTemplateCategory)
                        .slice(0, 18)
                        .map((tpl) => {
                          const isSelected = currentTemplateId === tpl.id;
                          const isFree = FREE_TEMPLATE_IDS.has(tpl.id);
                          return (
                            <div
                              key={tpl.id}
                              onClick={() => {
                                if (user && user.plan !== "LIFETIME" && !isFree) {
                                  alert("Este template é exclusivo do Plano Vitalício PRO. Escolha um template gratuito de teste ou faça upgrade para o Vitalício!");
                                  return;
                                }
                                setCurrentTemplateId(tpl.id);
                                setCustomBgColor("");
                                setCustomTextColor("");
                                setCustomAccentColor("");
                              }}
                              style={{
                                background: tpl.colors.bg,
                                color: tpl.colors.text,
                                border: isSelected ? "2px solid #e1306c" : "1px solid rgba(255,255,255,0.12)",
                                boxShadow: isSelected ? "0 0 16px rgba(225, 48, 108, 0.45)" : "none",
                                borderRadius: "10px",
                                padding: "8px 10px",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                height: "82px",
                                position: "relative",
                              }}
                            >
                              <div style={{ position: "absolute", top: "4px", right: "6px", display: "flex", gap: "4px", alignItems: "center" }}>
                                {!isFree && (
                                  <span style={{ fontSize: "8px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", borderRadius: "9999px", padding: "1px 5px", fontWeight: 900 }}>
                                    PRO
                                  </span>
                                )}
                                {isSelected && (
                                  <span style={{ fontSize: "10px", background: "#e1306c", color: "#fff", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                                    ✓
                                  </span>
                                )}
                              </div>
                              <div style={{ height: "3px", width: "24px", background: tpl.colors.accent, borderRadius: "2px", marginBottom: "4px" }} />
                              <div style={{ fontSize: "11px", fontWeight: 900, lineHeight: 1.2, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                {tpl.name}
                              </div>
                              <div style={{ fontSize: "9px", opacity: 0.7, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                {tpl.category}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* SELECT COMPACTO PARA ESCOLHER QUALQUER UM DIRETO */}
                    <div style={{ marginTop: "10px" }}>
                      <select
                        className="studio-input"
                        value={currentTemplateId}
                        onChange={(e) => {
                          const chosenId = e.target.value;
                          const isFree = FREE_TEMPLATE_IDS.has(chosenId);
                          if (user && user.plan !== "LIFETIME" && !isFree) {
                            alert("Este template faz parte do Plano Vitalício PRO. Escolha um dos 6 templates gratuitos de teste ou desbloqueie o Vitalício!");
                            return;
                          }
                          setCurrentTemplateId(chosenId);
                          setCustomBgColor("");
                          setCustomTextColor("");
                          setCustomAccentColor("");
                        }}
                        style={{ fontSize: "12px", padding: "6px 10px" }}
                      >
                        {TEMPLATE_CATEGORIES.filter((c) => c !== "Todos").map((cat) => (
                          <optgroup key={cat} label={`── ${cat} ──`} style={{ background: "#121218", color: "#f472b6" }}>
                            {allTemplates.filter((t) => t.category === cat).map((t) => (
                              <option key={t.id} value={t.id} style={{ background: "#181824", color: "#ffffff" }}>
                                {t.name} {!FREE_TEMPLATE_IDS.has(t.id) ? " (PRO 👑)" : " (Grátis 🆓)"}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* PASSO 2: ASSUNTO & NICHO DO POST                         */}
                  {/* ======================================================== */}
                  <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--ig-sunset)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 900 }}>2</span>
                      <label style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff" }}>
                        Defina o Assunto & Nicho
                      </label>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "4px" }}>
                            Profissão / Nicho
                          </label>
                          <select
                            className="studio-input"
                            value={selectedNiche}
                            onChange={(e) => setSelectedNiche(e.target.value)}
                          >
                            {NICHES.map((n) => (
                              <option key={n.id} value={n.id} style={{ background: "#181824", color: "#ffffff" }}>
                                {n.emoji} {n.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "4px" }}>
                            Tom de Voz
                          </label>
                          <select
                            className="studio-input"
                            value={selectedTone}
                            onChange={(e) => setSelectedTone(e.target.value)}
                          >
                            {TONE_OPTIONS.map((t) => (
                              <option key={t.id} value={t.id} style={{ background: "#181824", color: "#ffffff" }}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "4px" }}>
                          Tema ou Ideia do Post
                        </label>
                        <input
                          type="text"
                          className="studio-input"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="Ex: Como negociar salário, 5 alimentos anti-inflamatórios..."
                        />
                      </div>

                      {/* SUGESTÕES RÁPIDAS CLICÁVEIS */}
                      {NICHE_SUGGESTIONS[selectedNiche] && (
                        <div>
                          <span style={{ fontSize: "10.5px", color: "#64748b", display: "block", marginBottom: "6px" }}>
                            💡 Ideias virais prontas para {selectedNiche} (clique para usar):
                          </span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {NICHE_SUGGESTIONS[selectedNiche].map((sug, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => setTopic(sug)}
                                style={{
                                  background: topic === sug ? "rgba(225,48,108,0.15)" : "rgba(255,255,255,0.03)",
                                  border: topic === sug ? "1px solid rgba(225,48,108,0.4)" : "1px solid rgba(255,255,255,0.06)",
                                  color: topic === sug ? "#f472b6" : "#cbd5e1",
                                  padding: "5px 10px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  textAlign: "left",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                ⚡ {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "4px" }}>
                            Seu @ no Instagram
                          </label>
                          <input
                            type="text"
                            className="studio-input"
                            value={handle}
                            onChange={(e) => setHandle(e.target.value.replace("@", ""))}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "4px" }}>
                            Lâminas ({slideCount} slides)
                          </label>
                          <input
                            type="range"
                            min={5}
                            max={10}
                            value={slideCount}
                            onChange={(e) => setSlideCount(Number(e.target.value))}
                            style={{ marginTop: "10px" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* PASSO 3: MODO DE CRIAÇÃO (MODELOS PRONTOS | PROMPT | IA) */}
                  {/* ======================================================== */}
                  <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--ig-sunset)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 900 }}>3</span>
                      <label style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff" }}>
                        Modo de Criação
                      </label>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "10px", marginBottom: "14px" }}>
                      <button
                        type="button"
                        onClick={() => setMode("direct")}
                        style={{
                          padding: "8px 4px",
                          borderRadius: "8px",
                          border: "none",
                          fontWeight: 700,
                          fontSize: "11px",
                          cursor: "pointer",
                          background: mode === "direct" ? "rgba(255,255,255,0.12)" : "transparent",
                          color: mode === "direct" ? "#ffffff" : "#94a3b8",
                          textAlign: "center",
                        }}
                      >
                        ⚡ 1 Clique
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("magic-prompt")}
                        style={{
                          padding: "8px 4px",
                          borderRadius: "8px",
                          border: "none",
                          fontWeight: 700,
                          fontSize: "11px",
                          cursor: "pointer",
                          background: mode === "magic-prompt" ? "rgba(255,255,255,0.12)" : "transparent",
                          color: mode === "magic-prompt" ? "#ffffff" : "#94a3b8",
                          textAlign: "center",
                        }}
                      >
                        🤖 Prompt
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("api-key")}
                        style={{
                          padding: "8px 4px",
                          borderRadius: "8px",
                          border: "none",
                          fontWeight: 700,
                          fontSize: "11px",
                          cursor: "pointer",
                          background: mode === "api-key" ? "rgba(255,255,255,0.12)" : "transparent",
                          color: mode === "api-key" ? "#ffffff" : "#94a3b8",
                          textAlign: "center",
                        }}
                      >
                        🔑 IA Direta
                      </button>
                    </div>

                    {/* MODO 1: MODELO ESTRUTURADO RÁPIDO */}
                    {mode === "direct" && (
                      <div>
                        <button
                          type="button"
                          onClick={() => generateDirect(false)}
                          disabled={isGenerating}
                          className="btn-primary-ig"
                          style={{ width: "100%", padding: "14px", fontSize: "14px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                        >
                          <span>{isGenerating ? "⏳" : "✨"}</span>
                          <span>{isGenerating ? "Gerando Carrossel..." : "Criar Carrossel em 1 Clique"}</span>
                        </button>
                        <span style={{ display: "block", textAlign: "center", fontSize: "11px", color: "#86efac", marginTop: "8px" }}>
                          ✓ Sem custo de tokens • Conteúdo estruturado para {selectedNiche}
                        </span>
                      </div>
                    )}

                    {/* MODO 2: SUPER PROMPT CHATGPT / CLAUDE */}
                    {mode === "magic-prompt" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", fontWeight: 800, color: "#38bdf8" }}>
                            1. Copie o prompt pronto:
                          </span>
                          <button
                            type="button"
                            onClick={copyPromptToClipboard}
                            style={{
                              background: copiedPrompt ? "#22c55e" : "rgba(255,255,255,0.1)",
                              border: "none",
                              color: "#ffffff",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {copiedPrompt ? "✓ Copiado!" : "📋 Copiar"}
                          </button>
                        </div>
                        <pre
                          style={{
                            background: "rgba(0,0,0,0.4)",
                            padding: "8px",
                            borderRadius: "8px",
                            fontSize: "11px",
                            color: "#94a3b8",
                            maxHeight: "85px",
                            overflowY: "auto",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {generatedPrompt}
                        </pre>

                        <span style={{ fontSize: "12px", fontWeight: 800, color: "#38bdf8" }}>
                          2. Cole a resposta do ChatGPT ou Claude:
                        </span>
                        <textarea
                          rows={3}
                          className="studio-input"
                          value={aiPastedText}
                          onChange={(e) => setAiPastedText(e.target.value)}
                          placeholder="Cole aqui o texto retornado pelo ChatGPT ou Claude..."
                        />
                        {parseError && <div style={{ color: "#ef4444", fontSize: "11.5px", fontWeight: 700 }}>⚠️ {parseError}</div>}
                        <button
                          type="button"
                          onClick={handleProcessAiText}
                          className="btn-primary-ig"
                          style={{ width: "100%", padding: "12px", fontSize: "13px" }}
                        >
                          🚀 Transformar em Carrossel
                        </button>
                      </div>
                    )}

                    {/* MODO 3: IA DIRETA VIA CHAVE DO USUÁRIO (COM SELEÇÃO DE MODELO & OPENROUTER GRÁTIS) */}
                    {mode === "api-key" && (() => {
                      const currentProvider = getProviderConfig(userAiProvider);
                      const currentModel = currentProvider.models.find((m) => m.id === userAiModel) || currentProvider.models[0];

                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(0,0,0,0.25)", padding: "14px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                          {/* SELETOR DE PROVEDOR */}
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                              <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Provedor de IA
                              </label>
                              <span style={{ fontSize: "10.5px", color: "#38bdf8", fontWeight: 700 }}>
                                {currentProvider.badge || ""}
                              </span>
                            </div>
                            <select
                              className="studio-input"
                              value={userAiProvider}
                              onChange={(e) => {
                                const newP = e.target.value as any;
                                setUserAiProvider(newP);
                                const newConfig = getProviderConfig(newP);
                                setUserAiModel(newConfig.defaultModel);
                                if (typeof window !== "undefined") {
                                  localStorage.setItem("mc_user_ai_provider", newP);
                                  localStorage.setItem("mc_user_ai_model", newConfig.defaultModel);
                                }
                              }}
                              style={{ width: "100%", padding: "10px", fontSize: "13px" }}
                            >
                              {AI_PROVIDERS.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* SELETOR DE MODELO */}
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                              <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Modelo / LLM Selecionado
                              </label>
                              {currentModel?.isFree ? (
                                <span style={{ fontSize: "10px", background: "rgba(34, 197, 94, 0.2)", color: "#86efac", padding: "2px 6px", borderRadius: "4px", fontWeight: 800 }}>
                                  100% GRÁTIS
                                </span>
                              ) : (
                                <span style={{ fontSize: "10px", background: "rgba(168, 85, 247, 0.2)", color: "#d8b4fe", padding: "2px 6px", borderRadius: "4px", fontWeight: 800 }}>
                                  PRO
                                </span>
                              )}
                            </div>
                            <select
                              className="studio-input"
                              value={userAiModel}
                              onChange={(e) => {
                                const newM = e.target.value;
                                setUserAiModel(newM);
                                if (typeof window !== "undefined") {
                                  localStorage.setItem("mc_user_ai_model", newM);
                                }
                              }}
                              style={{ width: "100%", padding: "10px", fontSize: "13px" }}
                            >
                              {currentProvider.models.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.badge ? `[${m.badge}] ` : ""}{m.name} {m.isFree ? "— Grátis" : ""}
                                </option>
                              ))}
                            </select>
                            {currentModel?.description && (
                              <p style={{ margin: "5px 0 0 0", fontSize: "11.5px", color: "#94a3b8", lineHeight: 1.4 }}>
                                💡 {currentModel.description}
                              </p>
                            )}
                          </div>

                          {/* CAMPO DE CHAVE DE API COM LINK RÁPIDO */}
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                              <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Sua Chave de API ({currentProvider.shortLabel})
                              </label>
                              <a
                                href={currentProvider.keyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: "11px", color: "#38bdf8", textDecoration: "none", fontWeight: 700 }}
                              >
                                🔗 Pegar Chave Grátis ↗
                              </a>
                            </div>
                            <input
                              type="password"
                              className="studio-input"
                              value={userApiKey}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUserApiKey(val);
                                if (typeof window !== "undefined") {
                                  localStorage.setItem("mc_user_ai_key", val.trim());
                                }
                              }}
                              placeholder={`Cole sua chave ${currentProvider.keyPrefix}`}
                              style={{ width: "100%", padding: "10px", fontSize: "12.5px" }}
                            />
                            {!userApiKey && (
                              <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#f59e0b" }}>
                                ⚠️ Cole sua chave acima para gerar diretamente com o modelo escolhido.
                              </p>
                            )}
                          </div>

                          {/* BOTÃO DE GERAÇÃO COM O MODELO */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!userApiKey.trim()) {
                                alert(`Por favor, cole sua chave do ${currentProvider.shortLabel} no campo acima para gerar com este modelo.`);
                                return;
                              }
                              generateDirect(false);
                            }}
                            disabled={isGenerating}
                            className="btn-primary-ig"
                            style={{ width: "100%", padding: "14px", fontSize: "13.5px", borderRadius: "12px", marginTop: "4px" }}
                          >
                            {isGenerating
                              ? "✨ Gerando Carrossel com IA..."
                              : `✨ Gerar Carrossel com ${currentModel.name}`}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* EDITOR DA LÂMINA ATIVA */}
                {slides[activeSlideIndex] && (
                  <div
                    style={{
                      background: "rgba(18, 18, 24, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "20px",
                      padding: "20px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff" }}>
                        ✏️ Editando Lâmina {activeSlideIndex + 1} de {slides.length}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlide(activeSlideIndex)}
                        style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer", fontWeight: 700 }}
                      >
                        🗑️ Excluir lâmina
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "4px" }}>
                          Título da Lâmina
                        </label>
                        <input
                          type="text"
                          className="studio-input"
                          value={slides[activeSlideIndex].title}
                          onChange={(e) => {
                            const updated = [...slides];
                            updated[activeSlideIndex].title = e.target.value;
                            setSlides(updated);
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "4px" }}>
                          Texto Explicativo
                        </label>
                        <textarea
                          rows={2}
                          className="studio-input"
                          value={slides[activeSlideIndex].body || ""}
                          onChange={(e) => {
                            const updated = [...slides];
                            updated[activeSlideIndex].body = e.target.value;
                            setSlides(updated);
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "4px" }}>
                          🖼️ Foto / Imagem Nesta Lâmina (Estilo Canva)
                        </label>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input type="file" accept="image/png,image/jpeg,image/webp" id={`slide-img-${activeSlideIndex}`} onChange={handleSlideImageUpload} style={{ display: "none" }} />
                            <label
                              htmlFor={`slide-img-${activeSlideIndex}`}
                              style={{
                                background: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                color: "#ffffff",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              {slides[activeSlideIndex].image ? "📷 Trocar Foto" : "📷 Subir Foto"}
                            </label>
                            {slides[activeSlideIndex].image && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...slides];
                                  updated[activeSlideIndex].image = undefined;
                                  updated[activeSlideIndex].imageMode = undefined;
                                  setSlides(updated);
                                }}
                                style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer", fontWeight: 700 }}
                              >
                                ✕ Remover Foto
                              </button>
                            )}
                          </div>

                          {slides[activeSlideIndex].image && (
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Posição:</span>
                              {(["card", "background", "avatar"] as const).map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => {
                                    const updated = [...slides];
                                    updated[activeSlideIndex].imageMode = m;
                                    setSlides(updated);
                                  }}
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    border: "none",
                                    background: (slides[activeSlideIndex].imageMode || "card") === m ? "var(--ig-sunset)" : "rgba(255,255,255,0.06)",
                                    color: "#ffffff",
                                  }}
                                >
                                  {m === "card" ? "🖼️ Card" : m === "background" ? "🌌 Fundo" : "👤 Avatar"}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* COLUNA DIREITA: PREVIEW DO MOCKUP COM SWIPE NATIVO IGUAL AO INSTAGRAM */}
              <div
                className="creator-sticky-preview"
                style={{
                  display: mobileViewMode === "preview" || typeof window !== "undefined" && window.innerWidth >= 1024 ? "flex" : "none",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                {/* SELETOR DE FORMATO DO CARROSSEL */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {(["4:5", "3:4", "1:1", "9:16"] as CarouselFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormat(fmt)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "11.5px",
                        fontWeight: 800,
                        cursor: "pointer",
                        background: format === fmt ? "var(--ig-sunset)" : "transparent",
                        color: format === fmt ? "#ffffff" : "#94a3b8",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {fmt === "4:5" ? "4:5 Feed" : fmt === "3:4" ? "3:4 Alto 🔥" : fmt === "1:1" ? "1:1 Quadrado" : "9:16 Stories"}
                    </button>
                  ))}
                </div>

                {/* BARRA DE AÇÕES RÁPIDAS DE EXPORTAÇÃO E FINALIZAÇÃO */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
                  <button
                    type="button"
                    onClick={() => persistCarousel()}
                    disabled={saving}
                    style={{
                      background: "rgba(34, 197, 94, 0.15)",
                      border: "1px solid rgba(34, 197, 94, 0.4)",
                      color: "#86efac",
                      padding: "8px 14px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>💾</span>
                    <span>{saving ? "Salvando..." : "Salvar Projeto"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFinalizeModalOpen(true)}
                    style={{
                      background: "linear-gradient(135deg, #e1306c 0%, #f77737 100%)",
                      border: "none",
                      color: "#ffffff",
                      padding: "8px 16px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 14px rgba(225, 48, 108, 0.35)",
                    }}
                  >
                    <span>🎉</span>
                    <span>Finalizar & Legenda</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddSlide}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "#ffffff",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ➕ Nova Lâmina
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSlide}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "#ffffff",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ⬇️ PNG Slide
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadAllZip}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "#ffffff",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    📦 Baixar ZIP
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="btn-primary-ig"
                    style={{ padding: "8px 14px", fontSize: "12px" }}
                  >
                    📄 PDF LinkedIn
                  </button>
                </div>

                <div className={`iphone-frame fmt-${format.replace(":", "-")}`}>
                  <div className="iphone-island">
                    <div className="iphone-island-cam" />
                  </div>

                  <div className="iphone-screen">
                    <div style={{ padding: "12px 18px 4px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", fontWeight: 800, color: "#000000" }}>
                      <span>09:41</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>5G</span>
                        <span>🔋 100%</span>
                      </div>
                    </div>

                    <div style={{ padding: "6px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "var(--ig-sunset)", padding: "1.5px" }}>
                          {avatarImage ? (
                            <img src={avatarImage} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "12px", fontWeight: 800 }}>
                              {handle.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>{handle}</span>
                          <span style={{ display: "block", fontSize: "9px", color: "#64748b" }}>{activeTemplate.name} • {format}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "18px", color: "#64748b", fontWeight: 900 }}>···</span>
                    </div>

                    {/* CONTAINER DO CARROSSEL 100% DESLIZÁVEL ADAPTÁVEL AO FORMATO */}
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: format === "1:1" ? "1 / 1" : format === "9:16" ? "9 / 16" : format === "3:4" ? "3 / 4" : "4 / 5",
                        maxHeight: format === "9:16" ? "540px" : format === "3:4" ? "480px" : format === "1:1" ? "360px" : "450px",
                        position: "relative",
                        overflow: "hidden",
                        transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    >
                      {/* SETAS FLUTUANTES ESTILO INSTAGRAM WEB */}
                      {activeSlideIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => scrollToSlide(activeSlideIndex - 1, "creator")}
                          style={{
                            position: "absolute",
                            left: "8px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 10,
                            background: "rgba(0,0,0,0.55)",
                            color: "#ffffff",
                            border: "none",
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                        >
                          ‹
                        </button>
                      )}

                      {activeSlideIndex < slides.length - 1 && (
                        <button
                          type="button"
                          onClick={() => scrollToSlide(activeSlideIndex + 1, "creator")}
                          style={{
                            position: "absolute",
                            right: "8px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 10,
                            background: "rgba(0,0,0,0.55)",
                            color: "#ffffff",
                            border: "none",
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                        >
                          ›
                        </button>
                      )}

                      <div
                        ref={creatorSliderRef}
                        onScroll={handleSliderScroll}
                        onMouseDown={handleCreatorMouseDown}
                        onMouseMove={handleCreatorMouseMove}
                        onMouseUp={handleCreatorMouseUp}
                        onMouseLeave={handleCreatorMouseUp}
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          overflowX: "auto",
                          scrollSnapType: "x mandatory",
                          WebkitOverflowScrolling: "touch",
                          scrollbarWidth: "none",
                          touchAction: "pan-x pan-y",
                          cursor: "grab",
                        }}
                      >
                        {slides.map((s, idx) => (
                          <div
                            key={s.id || idx}
                            style={{
                              flex: "0 0 100%",
                              width: "100%",
                              height: "100%",
                              scrollSnapAlign: "start",
                              scrollSnapStop: "always",
                            }}
                          >
                            {renderSlideContent(s, idx, idx === activeSlideIndex)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* BARRA DE AÇÕES DO INSTAGRAM COM BOLINHAS */}
                    <div style={{ padding: "8px 14px", background: "#ffffff", borderTop: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "16px" }}>
                          <span>❤️</span>
                          <span>💬</span>
                          <span>🚀</span>
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {slides.map((_, i) => (
                            <div
                              key={i}
                              onClick={() => scrollToSlide(i, "creator")}
                              style={{
                                width: activeSlideIndex === i ? "16px" : "6px",
                                height: "6px",
                                borderRadius: "3px",
                                background: activeSlideIndex === i ? "#e1306c" : "#cbd5e1",
                                cursor: "pointer",
                                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                              }}
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: "16px" }}>🔖</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(18, 18, 24, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    padding: "16px",
                    width: "100%",
                    maxWidth: "380px",
                  }}
                >
                  <span style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#ffffff", marginBottom: "10px" }}>
                    🎨 Personalizar Cores Deste Post:
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>Fundo</span>
                      <input
                        type="color"
                        value={customBgColor || activeTemplate.colors.bg}
                        onChange={(e) => setCustomBgColor(e.target.value)}
                        style={{ width: "100%", height: "30px", border: "none", borderRadius: "6px", cursor: "pointer", background: "none" }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>Texto</span>
                      <input
                        type="color"
                        value={customTextColor || activeTemplate.colors.text}
                        onChange={(e) => setCustomTextColor(e.target.value)}
                        style={{ width: "100%", height: "30px", border: "none", borderRadius: "6px", cursor: "pointer", background: "none" }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>Destaque</span>
                      <input
                        type="color"
                        value={customAccentColor || activeTemplate.colors.accent}
                        onChange={(e) => setCustomAccentColor(e.target.value)}
                        style={{ width: "100%", height: "30px", border: "none", borderRadius: "6px", cursor: "pointer", background: "none" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO: LEGENDA & HASHTAGS ESTRATÉGICAS PRONTAS (EXIBIDA EM TODOS OS MODOS: 1 CLIQUE, PROMPT E IA DIRETA) */}
            <div
              style={{
                background: "linear-gradient(180deg, rgba(18, 18, 24, 0.95) 0%, rgba(10, 10, 14, 0.98) 100%)",
                border: "1px solid rgba(225, 48, 108, 0.25)",
                borderRadius: "28px",
                padding: "32px 28px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(225, 48, 108, 0.15)", padding: "4px 14px", borderRadius: "9999px", color: "#f472b6", fontSize: "11px", fontWeight: 800, marginBottom: "8px" }}>
                    <span>🚀 ECONOMIA DE TEMPO • ZERO TRABALHO MANUAL</span>
                  </div>
                  <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px" }}>
                    📝 Legenda Magnética & Hashtags Prontas (Copiar & Colar)
                  </h3>
                  <p style={{ fontSize: "13px", color: "#94a3b8", maxWidth: "680px", marginTop: "4px", lineHeight: 1.5 }}>
                    O algoritmo do Instagram exige 3 coisas para viralizar: <strong>gancho antes do &quot;... mais&quot;</strong>, <strong>estrutura respirável com CTA</strong> e <strong>entre 8 a 15 hashtags nichadas</strong>. Já formatamos tudo para você só copiar e colar!
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleCopyFullCaption}
                    className="btn-primary-ig"
                    style={{
                      padding: "12px 24px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: captionCopied ? "#22c55e" : undefined,
                    }}
                  >
                    <span>{captionCopied ? "✅" : "📋"}</span>
                    <span>{captionCopied ? "Copiado com Sucesso!" : "Copiar Legenda Completa + Tags"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyHashtagsOnly}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#ffffff",
                      padding: "12px 18px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {tagsCopied ? "✅ Tags Copiadas!" : "🏷️ Copiar Só as Tags"}
                  </button>
                </div>
              </div>

              {/* GRID: PRÉVIA DO FEED DO INSTAGRAM + EDITOR DA LEGENDA */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                {/* CARD 1: DIAGNÓSTICO DO GANCHO (REGRA DOS 125 CARACTERES) */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#facc15" }}>
                      👁️ Como Aparece no Feed do Instagram:
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      {postCaptionData?.hook.length || 0}/125 caracteres
                    </span>
                  </div>

                  <div style={{ background: "#000000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "14px", fontSize: "13px", lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 800, color: "#ffffff", marginRight: "6px" }}>{handle}</span>
                    <span style={{ color: "#e2e8f0" }}>{postCaptionData?.hook}</span>
                    <span style={{ color: "#94a3b8", fontWeight: 600, marginLeft: "6px", cursor: "pointer" }}>... mais</span>
                  </div>

                  <div style={{ marginTop: "16px" }}>
                    <span style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#ffffff", marginBottom: "8px" }}>
                      🏷️ Hashtags Estratégicas do Nicho ({postCaptionData?.hashtagCount || 0} tags sem shadowban):
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {postCaptionData?.hashtags.map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: "rgba(225, 48, 108, 0.12)",
                            border: "1px solid rgba(225, 48, 108, 0.25)",
                            color: "#f472b6",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CARD 2: EDITOR E COPIADOR EM TEXTO COMPLETO */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "20px", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#ffffff" }}>
                      ✍️ Legenda Completa Formatada:
                    </span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {activeCaptionText.length} caracteres
                    </span>
                  </div>

                  <textarea
                    rows={9}
                    className="studio-input"
                    value={activeCaptionText}
                    onChange={(e) => setEditedCaptionText(e.target.value)}
                    style={{ flex: 1, fontSize: "12.5px", lineHeight: 1.6, resize: "vertical", fontFamily: "inherit" }}
                  />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      💡 Dica: Você pode editar o texto acima antes de copiar.
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyFullCaption}
                      style={{
                        background: captionCopied ? "#22c55e" : "var(--ig-sunset)",
                        color: "#ffffff",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {captionCopied ? "✅ Copiado!" : "Copiar Agora"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA: MEUS PROJETOS & HISTÓRICO DE CARROSSÉIS               */}
        {/* ============================================================ */}
        {activeTab === "projects" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {authLoading ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>⏳</div>
                <p style={{ fontSize: "15px" }}>Carregando seus projetos...</p>
              </div>
            ) : !user ? (
              <div
                style={{
                  maxWidth: "680px",
                  margin: "30px auto",
                  background: "linear-gradient(180deg, rgba(24, 24, 34, 0.95) 0%, rgba(18, 18, 24, 0.95) 100%)",
                  border: "1px solid rgba(225, 48, 108, 0.35)",
                  borderRadius: "24px",
                  padding: "44px 28px",
                  textAlign: "center",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 40px rgba(225, 48, 108, 0.15)",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "var(--ig-sunset)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    margin: "0 auto 16px auto",
                    boxShadow: "0 8px 24px rgba(225, 48, 108, 0.4)",
                  }}
                >
                  🔒
                </div>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#f472b6", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Acesso Restrito
                </span>
                <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", marginTop: "8px", lineHeight: 1.3 }}>
                  Entre na sua conta para ver seus projetos
                </h2>
                <p style={{ color: "#94a3b8", fontSize: "14.5px", maxWidth: "520px", margin: "12px auto 26px auto", lineHeight: 1.6 }}>
                  Seus carrosséis salvos, downloads e históricos de produção ficam vinculados com segurança ao seu perfil. Faça login para continuar.
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode("login");
                      setIsAuthModalOpen(true);
                    }}
                    className="btn-primary-ig"
                    style={{ padding: "14px 28px", fontSize: "14px" }}
                  >
                    🔑 Entrar na Minha Conta
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode("register");
                      setIsAuthModalOpen(true);
                    }}
                    className="btn-ghost-dark"
                    style={{ padding: "14px 28px", fontSize: "14px" }}
                  >
                    ✨ Criar Conta Gratuita
                  </button>
                </div>
                <div style={{ marginTop: "20px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("landing")}
                    style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}
                  >
                    ← Voltar para a página inicial
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#f472b6", letterSpacing: "1px" }}>
                      HISTÓRICO DE CRIAÇÕES & PRODUÇÃO
                    </span>
                    <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                      Meus Projetos & Carrosséis ({savedProjects.length})
                    </h2>
                    <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                      Retome a edição, duplique ou faça o download dos seus carrosséis a qualquer momento.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCarouselId(null);
                        setTopic("Novo carrossel estratégico");
                        setCarouselTitle("Novo carrossel estratégico");
                        setSlides(buildNicheCarousel(selectedNiche, 7, "Novo carrossel estratégico").slides);
                        setActiveTab("creator");
                      }}
                      className="btn-primary-ig"
                      style={{ padding: "10px 22px", fontSize: "13px" }}
                    >
                      ➕ Criar Novo Carrossel
                    </button>
                  </div>
                </div>

                {projectsLoading && (
                  <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div>
                    <span>Carregando seus projetos...</span>
                  </div>
                )}

            {!projectsLoading && savedProjects.length === 0 ? (
              <div
                style={{
                  background: "rgba(18, 18, 24, 0.6)",
                  border: "2px dashed rgba(255, 255, 255, 0.12)",
                  borderRadius: "28px",
                  padding: "60px 24px",
                  textAlign: "center",
                  maxWidth: "600px",
                  margin: "20px auto",
                }}
              >
                <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "rgba(225, 48, 108, 0.15)", border: "1px solid rgba(225, 48, 108, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", margin: "0 auto 18px" }}>
                  📁
                </div>
                <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", marginBottom: "8px" }}>
                  Você ainda não possui projetos salvos
                </h3>
                <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
                  Comece gerando um carrossel no Criador com inteligência artificial ou escolha um dos nossos 120+ templates por profissão!
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("creator")}
                    className="btn-primary-ig"
                    style={{ padding: "12px 24px", fontSize: "13.5px" }}
                  >
                    🎨 Criar Meu Primeiro Carrossel
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("inspiration")}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "#ffffff",
                      padding: "12px 20px",
                      borderRadius: "9999px",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    💡 Ver Ideias de Inspiração
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "24px" }}>
                {savedProjects.map((proj) => {
                  const firstSlide = proj.slides?.[0];
                  const projTpl = allTemplates.find((t) => t.id === proj.template_id) || activeTemplate;
                  const bgCard = projTpl.style === "gradient" || projTpl.style === "vector-business"
                    ? `linear-gradient(135deg, ${projTpl.colors.bg} 0%, ${projTpl.colors.bg2} 100%)`
                    : projTpl.colors.bg;

                  return (
                    <div
                      key={proj.id}
                      style={{
                        background: "rgba(18, 18, 24, 0.85)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "22px",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        transition: "transform 0.2s ease, border-color 0.2s ease",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                      }}
                    >
                      {/* Miniatura do Carrossel */}
                      <div
                        onClick={() => handleLoadProject(proj)}
                        style={{
                          height: "190px",
                          background: bgCard,
                          color: projTpl.colors.text,
                          padding: "18px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          position: "relative",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "10px", fontWeight: 900, background: "rgba(0,0,0,0.45)", color: "#ffffff", padding: "3px 8px", borderRadius: "9999px" }}>
                            {proj.format || "4:5"}
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: projTpl.colors.accent }}>
                            {proj.slides?.length || 7} lâminas
                          </span>
                        </div>

                        <div>
                          <span style={{ fontSize: "9.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: projTpl.colors.accent }}>
                            {proj.niche || "geral"}
                          </span>
                          <h4 style={{ fontSize: "16px", fontWeight: 900, lineHeight: 1.25, marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {firstSlide?.title || proj.title}
                          </h4>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", opacity: 0.8 }}>
                          <span>@{handle}</span>
                          <span>clique para editar →</span>
                        </div>
                      </div>

                      {/* Informações e Ações do Projeto */}
                      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px", flex: 1, justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {proj.title}
                          </div>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            {proj.updated_at ? new Date(proj.updated_at).toLocaleDateString("pt-BR") : "Projeto Recente"}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleLoadProject(proj)}
                            style={{
                              flex: 1,
                              background: "var(--ig-sunset)",
                              border: "none",
                              color: "#ffffff",
                              padding: "8px 12px",
                              borderRadius: "10px",
                              fontSize: "12px",
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                          >
                            <span>✏️</span>
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicateProject(proj)}
                            title="Duplicar este carrossel"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              color: "#cbd5e1",
                              padding: "8px 10px",
                              borderRadius: "10px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            📋
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj.id)}
                            title="Excluir este carrossel"
                            style={{
                              background: "rgba(239, 68, 68, 0.12)",
                              border: "1px solid rgba(239, 68, 68, 0.25)",
                              color: "#f87171",
                              padding: "8px 10px",
                              borderRadius: "10px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
              </>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA: GALERIA DE INSPIRAÇÃO VIRAL & GANCHOS COMPROVADOS       */}
        {/* ============================================================ */}
        {activeTab === "inspiration" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#f472b6", letterSpacing: "1px" }}>
                  FRAMEWORKS DE ALTO ENGAJAMENTO VALIDADOS
                </span>
                <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                  Inspiração & Ganchos Virais ({INSPIRATION_CAROUSELS.length})
                </h2>
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                  Estruturas psicológicas prontas para modelar. Clique em &quot;Usar Esta Estrutura&quot; para carregar direto no seu editor.
                </p>
              </div>
            </div>

            {/* SELETOR DE CATEGORIAS DE INSPIRAÇÃO EM PILLS */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px" }}>
              {INSPIRATION_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedInspirationCat(cat)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: selectedInspirationCat === cat ? "var(--ig-sunset)" : "rgba(255,255,255,0.04)",
                    color: "#ffffff",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat} {cat === "Todos" ? `(${INSPIRATION_CAROUSELS.length})` : `(${INSPIRATION_CAROUSELS.filter((i) => i.category === cat).length})`}
                </button>
              ))}
            </div>

            {/* GRID DE CARDS DE INSPIRAÇÃO */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
              {INSPIRATION_CAROUSELS.filter(
                (item) => selectedInspirationCat === "Todos" || item.category === selectedInspirationCat
              ).map((item) => {
                const itemTpl = allTemplates.find((t) => t.id === item.templateId) || activeTemplate;
                const bgItem = itemTpl.style === "gradient" || itemTpl.style === "vector-business"
                  ? `linear-gradient(135deg, ${itemTpl.colors.bg} 0%, ${itemTpl.colors.bg2} 100%)`
                  : itemTpl.colors.bg;

                return (
                  <div
                    key={item.id}
                    style={{
                      background: "rgba(18, 18, 24, 0.85)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "24px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    }}
                  >
                    {/* Miniatura do Gancho */}
                    <div
                      style={{
                        height: "210px",
                        background: bgItem,
                        color: itemTpl.colors.text,
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, background: "rgba(0,0,0,0.5)", color: "#ffffff", padding: "3px 10px", borderRadius: "9999px" }}>
                          {item.format} • {item.slides.length} lâminas
                        </span>
                        <span style={{ fontSize: "10.5px", fontWeight: 900, background: "rgba(34, 197, 94, 0.2)", border: "1px solid rgba(34, 197, 94, 0.4)", color: "#86efac", padding: "3px 9px", borderRadius: "9999px" }}>
                          {item.metricBadge}
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", color: itemTpl.colors.accent }}>
                          {item.slides[0]?.kicker || "GANCHO MATADOR"}
                        </span>
                        <h4 style={{ fontSize: "17px", fontWeight: 900, lineHeight: 1.25, marginTop: "6px" }}>
                          {item.title}
                        </h4>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", opacity: 0.85 }}>
                        <span>@{handle}</span>
                        <span>deslize para ver →</span>
                      </div>
                    </div>

                    {/* Explicação de Por que Funciona & Botão */}
                    <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px", flex: 1, justifyContent: "space-between" }}>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "12px", borderLeft: "3px solid #f472b6" }}>
                        <strong style={{ fontSize: "11px", color: "#f472b6", display: "block", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>
                          🧠 Por que esse modelo viraliza:
                        </strong>
                        <p style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.45, margin: 0 }}>
                          {item.whyItWorks}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyInspiration(item)}
                        className="btn-primary-ig"
                        style={{
                          width: "100%",
                          padding: "11px",
                          borderRadius: "12px",
                          fontSize: "13px",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <span>✨</span>
                        <span>Usar Esta Estrutura no Editor</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ABA 3: GALERIA COM MAIS DE 120 TEMPLATES NICHADOS POR PROFISSÃO */}
        {/* ============================================================ */}
        {activeTab === "templates" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#f472b6", letterSpacing: "1px" }}>
                  BIBLIOTECA COM MAIS DE 100 MODELOS NICHADOS
                </span>
                <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                  Modelos & Templates por Profissão ({allTemplates.length})
                </h2>
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                  Selecione sua profissão para ver designs criados especificamente para seu público.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("canva-studio")}
                className="btn-primary-ig"
                style={{ padding: "10px 22px", fontSize: "13px" }}
              >
                ✨ Criar Meu Próprio Template (Canva Studio)
              </button>
            </div>

            {/* SELETOR DE PROFISSÕES EM PILLS ROLÁVEIS */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px" }}>
              {["Todos", ...TEMPLATE_CATEGORIES.filter((c) => c !== "Todos")].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: selectedCategory === cat ? "var(--ig-sunset)" : "rgba(255,255,255,0.04)",
                    color: "#ffffff",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat} {cat === "Todos" ? `(${allTemplates.length})` : `(${allTemplates.filter((t) => t.category === cat).length})`}
                </button>
              ))}
            </div>

            {/* GRID DOS TEMPLATES */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
              {filteredTemplates.map((t) => {
                const isActive = t.id === currentTemplateId;
                const bgPreview =
                  t.style === "gradient" || t.style === "vector-business"
                    ? `linear-gradient(135deg, ${t.colors.bg} 0%, ${t.colors.bg2} 100%)`
                    : t.colors.bg;

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (!user) {
                        setAuthModalMode("login");
                        setIsAuthModalOpen(true);
                        return;
                      }
                      const isFree = FREE_TEMPLATE_IDS.has(t.id);
                      if (user.plan !== "LIFETIME" && !isFree) {
                        if (user.freeTrialsUsed >= 1 && !isPaidLifetime) {
                          setActiveTab("creator");
                          return;
                        }
                        alert("Este template faz parte do Plano Vitalício PRO. Escolha um dos 6 templates gratuitos de teste ou desbloqueie o Vitalício!");
                        return;
                      }
                      setCurrentTemplateId(t.id);
                      setCustomBgColor("");
                      setCustomTextColor("");
                      setCustomAccentColor("");
                      setActiveTab("creator");
                    }}
                    style={{
                      background: "rgba(18, 18, 24, 0.8)",
                      border: isActive ? "2px solid #e1306c" : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "20px",
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: isActive ? "0 10px 30px rgba(225, 48, 108, 0.25)" : "none",
                    }}
                  >
                    <div
                      style={{
                        height: "220px",
                        background: bgPreview,
                        color: t.colors.text,
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: t.colors.accent }}>
                          01 / 07
                        </span>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          {!FREE_TEMPLATE_IDS.has(t.id) ? (
                            <span style={{ fontSize: "9px", fontWeight: 900, background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#ffffff", padding: "2px 8px", borderRadius: "9999px", boxShadow: "0 2px 8px rgba(245, 158, 11, 0.4)" }}>
                              👑 PRO
                            </span>
                          ) : (
                            <span style={{ fontSize: "9px", fontWeight: 900, background: "rgba(34, 197, 94, 0.2)", color: "#4ade80", border: "1px solid rgba(74, 222, 128, 0.4)", padding: "2px 8px", borderRadius: "9999px" }}>
                              GRÁTIS
                            </span>
                          )}
                          {t.badge && (
                            <span style={{ fontSize: "9px", fontWeight: 900, background: t.colors.accent, color: "#ffffff", padding: "2px 8px", borderRadius: "9999px" }}>
                              {t.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: t.colors.accent }}>
                          {t.category}
                        </span>
                        <h4 style={{ fontSize: "17px", fontWeight: 900, lineHeight: 1.2, marginTop: "4px" }}>
                          {t.name}
                        </h4>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", opacity: 0.8 }}>
                        <span>@{handle}</span>
                        <span>deslize →</span>
                      </div>
                    </div>

                    <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#ffffff" }}>{t.name}</div>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{t.category}</span>
                      </div>
                      <button
                        type="button"
                        style={{
                          background: isActive ? "var(--ig-sunset)" : "rgba(255,255,255,0.08)",
                          border: "none",
                          color: "#ffffff",
                          padding: "6px 14px",
                          borderRadius: "9999px",
                          fontSize: "11.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {isActive ? "✓ Ativo" : "Usar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA 4: CRIAR TEMPLATE DO ZERO COM TODAS FERRAMENTAS POSSÍVEIS */}
        {activeTab === "canva-studio" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {authLoading ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>⏳</div>
                <p style={{ fontSize: "15px" }}>Carregando estúdio...</p>
              </div>
            ) : !user ? (
              <div
                style={{
                  maxWidth: "680px",
                  margin: "30px auto",
                  background: "linear-gradient(180deg, rgba(24, 24, 34, 0.95) 0%, rgba(18, 18, 24, 0.95) 100%)",
                  border: "1px solid rgba(225, 48, 108, 0.35)",
                  borderRadius: "24px",
                  padding: "44px 28px",
                  textAlign: "center",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 40px rgba(225, 48, 108, 0.15)",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "var(--ig-sunset)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    margin: "0 auto 16px auto",
                    boxShadow: "0 8px 24px rgba(225, 48, 108, 0.4)",
                  }}
                >
                  🔒
                </div>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#f472b6", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Acesso Restrito
                </span>
                <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", marginTop: "8px", lineHeight: 1.3 }}>
                  Entre na sua conta para acessar o Estúdio
                </h2>
                <p style={{ color: "#94a3b8", fontSize: "14.5px", maxWidth: "520px", margin: "12px auto 26px auto", lineHeight: 1.6 }}>
                  O Estúdio de Design do Zero é uma ferramenta profissional de criação de temas e estilos. Faça login ou crie sua conta para continuar.
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode("login");
                      setIsAuthModalOpen(true);
                    }}
                    className="btn-primary-ig"
                    style={{ padding: "14px 28px", fontSize: "14px" }}
                  >
                    🔑 Entrar na Minha Conta
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode("register");
                      setIsAuthModalOpen(true);
                    }}
                    className="btn-ghost-dark"
                    style={{ padding: "14px 28px", fontSize: "14px" }}
                  >
                    ✨ Criar Conta Gratuita
                  </button>
                </div>
                <div style={{ marginTop: "20px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("landing")}
                    style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}
                  >
                    ← Voltar para a página inicial
                  </button>
                </div>
              </div>
            ) : user.plan !== "LIFETIME" && !isPaidLifetime ? (
              <div
                style={{
                  maxWidth: "740px",
                  margin: "30px auto",
                  background: "linear-gradient(180deg, rgba(24, 24, 34, 0.95) 0%, rgba(18, 18, 24, 0.95) 100%)",
                  border: "1px solid rgba(225, 48, 108, 0.35)",
                  borderRadius: "24px",
                  padding: "44px 28px",
                  textAlign: "center",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 40px rgba(225, 48, 108, 0.15)",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "var(--ig-sunset)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    margin: "0 auto 16px auto",
                    boxShadow: "0 8px 24px rgba(225, 48, 108, 0.4)",
                  }}
                >
                  👑
                </div>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#f472b6", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Recurso Exclusivo Vitalício PRO
                </span>
                <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", marginTop: "8px", lineHeight: 1.3 }}>
                  Estúdio de Design do Zero (Canva Studio)
                </h2>
                <p style={{ color: "#94a3b8", fontSize: "14.5px", maxWidth: "560px", margin: "12px auto 26px auto", lineHeight: 1.6 }}>
                  O criador de templates do zero com texturas granulares, blueprint, paletas personalizadas e tipografia editorial é uma funcionalidade exclusiva para membros com Acesso Vitalício PRO.
                </p>
                <button
                  type="button"
                  onClick={handleStartCheckout}
                  className="btn-primary-ig"
                  style={{ padding: "16px 36px", fontSize: "15px", borderRadius: "14px", fontWeight: 900, cursor: "pointer", border: "none" }}
                >
                  DESBLOQUEAR PLANO VITALÍCIO AGORA ⚡
                </button>
                <div style={{ marginTop: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab("creator")}
                    style={{ background: "none", border: "none", color: "#38bdf8", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Voltar para o Criador de Carrosséis →
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#f472b6", letterSpacing: "1px" }}>
                      ESTÚDIO DE DESIGN DO ZERO
                    </span>
                    <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                      Criar Template do Zero com Todas Ferramentas
                    </h2>
                    <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                      Personalize cada pixel: gradientes, texturas blueprint/grain, tipografia editorial, sombras 3D, badges e indicadores.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCustomTemplate}
                    className="btn-primary-ig"
                    style={{ padding: "12px 28px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <span>💾</span>
                    <span>Salvar & Usar no Meu Carrossel</span>
                  </button>
                </div>

            {/* PRESETS RÁPIDOS DE INSPIRAÇÃO VISUAL */}
            <div style={{ background: "rgba(18, 18, 24, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "20px", padding: "16px 20px" }}>
              <span style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#ffffff", marginBottom: "10px" }}>
                ⚡ Presets de Base Recomendados (Clique para carregar e personalizar):
              </span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { name: "Warm Paper 📜", bg1: "#fdfbf7", bg2: "#f4efe6", text: "#1c1917", muted: "#78716c", accent: "#ea580c", surface: "#ffffff", heading: "playfair", body: "inter", style: "editorial", pattern: "grain", decoration: "none" },
                  { name: "Midnight Signal ⚡", bg1: "#09090b", bg2: "#18181b", text: "#ffffff", muted: "#a1a1aa", accent: "#06b6d4", surface: "#18181b", heading: "syne", body: "inter", style: "bold", pattern: "blueprint", decoration: "geometric-vector" },
                  { name: "Blueprint Tech 📐", bg1: "#0a192f", bg2: "#112240", text: "#e2e8f0", muted: "#94a3b8", accent: "#38bdf8", surface: "#1e293b", heading: "space", body: "inter", style: "vector-business", pattern: "blueprint", decoration: "geometric-vector" },
                  { name: "Executive Dark 💼", bg1: "#000000", bg2: "#141416", text: "#ffffff", muted: "#94a3b8", accent: "#e11d48", surface: "#1c1c20", heading: "montserrat", body: "inter", style: "clean", pattern: "dots", decoration: "minimal-line" },
                  { name: "Neon Sunset 🔥", bg1: "#1a0826", bg2: "#2e0854", text: "#ffffff", muted: "#cbd5e1", accent: "#f43f5e", surface: "#26113b", heading: "syne", body: "poppins", style: "gradient", pattern: "geometric", decoration: "geometric-vector" },
                  { name: "Chalkboard / Lousa ✏️", bg1: "#16241a", bg2: "#0f1a12", text: "#f8fafc", muted: "#94a3b8", accent: "#fef08a", surface: "#1b2e21", heading: "bebas", body: "inter", style: "neo-brutal", pattern: "lines", decoration: "none" },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setStudioName(p.name.replace(/[^a-zA-Z0-9 ]/g, "").trim());
                      setStudioBg1(p.bg1);
                      setStudioBg2(p.bg2);
                      setStudioTextColor(p.text);
                      setStudioMutedColor(p.muted);
                      setStudioAccentColor(p.accent);
                      setStudioSurfaceColor(p.surface);
                      setStudioHeadingFont(p.heading as FontKey);
                      setStudioBodyFont(p.body as FontKey);
                      setStudioStyle(p.style as TemplateStyle);
                      setStudioPattern(p.pattern as typeof studioPattern);
                      setStudioDecoration(p.decoration as Decoration);
                    }}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "#ffffff",
                      padding: "8px 14px",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "32px", alignItems: "start" }}>
              {/* PAINEL ESQUERDO: CONTROLES COMPLETOS DE CUSTOMIZAÇÃO */}
              <div
                style={{
                  background: "rgba(18, 18, 24, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "24px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "22px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
              >
                {/* 1. NOME DO TEMPLATE */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#ffffff", marginBottom: "6px" }}>
                    🏷️ Nome do seu Template
                  </label>
                  <input
                    type="text"
                    className="studio-input"
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    placeholder="Ex: Minimalist Dark Pro"
                  />
                </div>

                {/* 2. PLANO DE FUNDO & GRADIENTES */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 800, color: "#ffffff", marginBottom: "10px" }}>
                    🎨 Plano de Fundo & Textura
                  </label>

                  <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                    {[
                      { id: "gradient", label: "Gradiente Linear" },
                      { id: "radial", label: "Gradiente Radial" },
                      { id: "solid", label: "Cor Sólida" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setStudioBgType(m.id as typeof studioBgType)}
                        style={{
                          flex: 1,
                          padding: "6px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          border: "none",
                          background: studioBgType === m.id ? "var(--ig-sunset)" : "rgba(255,255,255,0.05)",
                          color: "#ffffff",
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: studioBgType === "solid" ? "1fr" : "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Cor Primária</span>
                      <input
                        type="color"
                        value={studioBg1}
                        onChange={(e) => setStudioBg1(e.target.value)}
                        style={{ width: "100%", height: "36px", border: "none", borderRadius: "8px", cursor: "pointer", background: "none" }}
                      />
                    </div>
                    {studioBgType !== "solid" && (
                      <div>
                        <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Cor Secundária</span>
                        <input
                          type="color"
                          value={studioBg2}
                          onChange={(e) => setStudioBg2(e.target.value)}
                          style={{ width: "100%", height: "36px", border: "none", borderRadius: "8px", cursor: "pointer", background: "none" }}
                        />
                      </div>
                    )}
                  </div>

                  {studioBgType === "gradient" && (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                        <span>Ângulo do Gradiente</span>
                        <span>{studioGradientAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        value={studioGradientAngle}
                        onChange={(e) => setStudioGradientAngle(Number(e.target.value))}
                        style={{ width: "100%" }}
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                      Textura / Padrão de Fundo
                    </label>
                    <select
                      className="studio-input"
                      value={studioPattern}
                      onChange={(e) => setStudioPattern(e.target.value as typeof studioPattern)}
                    >
                      <option value="none">Nenhuma (Fundo Liso)</option>
                      <option value="blueprint">Grid Técnico / Blueprint</option>
                      <option value="grain">Ruído Cinematográfico (Grain)</option>
                      <option value="dots">Matriz de Pontos</option>
                      <option value="geometric">Formas Geométricas Modernas</option>
                      <option value="lines">Linhas Isométricas</option>
                    </select>
                  </div>
                </div>

                {/* 3. TIPOGRAFIA & TEXTOS */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 800, color: "#ffffff", marginBottom: "10px" }}>
                    ✍️ Tipografia & Textos
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Fonte do Título</span>
                      <select
                        className="studio-input"
                        value={studioHeadingFont}
                        onChange={(e) => setStudioHeadingFont(e.target.value as FontKey)}
                      >
                        <option value="montserrat">Montserrat</option>
                        <option value="syne">Syne (Criativo)</option>
                        <option value="playfair">Playfair Display (Luxo)</option>
                        <option value="poppins">Poppins</option>
                        <option value="bebas">Bebas Neue</option>
                        <option value="space">Space Grotesk (Tech)</option>
                        <option value="dmserif">DM Serif (Editorial)</option>
                        <option value="outfit">Outfit (Clean)</option>
                        <option value="jakarta">Plus Jakarta</option>
                        <option value="inter">Inter</option>
                      </select>
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Fonte do Corpo</span>
                      <select
                        className="studio-input"
                        value={studioBodyFont}
                        onChange={(e) => setStudioBodyFont(e.target.value as FontKey)}
                      >
                        <option value="inter">Inter</option>
                        <option value="poppins">Poppins</option>
                        <option value="montserrat">Montserrat</option>
                        <option value="space">Space Grotesk</option>
                        <option value="outfit">Outfit</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                        <span>Tamanho Título</span>
                        <span>{studioTitleSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={18}
                        max={34}
                        value={studioTitleSize}
                        onChange={(e) => setStudioTitleSize(Number(e.target.value))}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Espaçamento</span>
                      <select
                        className="studio-input"
                        value={studioLetterSpacing}
                        onChange={(e) => setStudioLetterSpacing(e.target.value as typeof studioLetterSpacing)}
                      >
                        <option value="normal">Normal (0)</option>
                        <option value="tight">Apertado (-1px)</option>
                        <option value="wide">Largo (+1.5px)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#cbd5e1", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={studioUppercase}
                        onChange={(e) => setStudioUppercase(e.target.checked)}
                        style={{ accentColor: "#e1306c" }}
                      />
                      <span>TÍTULOS EM CAIXA ALTA (UPPERCASE)</span>
                    </label>
                  </div>

                  {/* CORES DE TEXTO */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>Título</span>
                      <input
                        type="color"
                        value={studioTextColor}
                        onChange={(e) => setStudioTextColor(e.target.value)}
                        style={{ width: "100%", height: "32px", border: "none", borderRadius: "6px", cursor: "pointer", background: "none" }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>Subtítulo</span>
                      <input
                        type="color"
                        value={studioMutedColor}
                        onChange={(e) => setStudioMutedColor(e.target.value)}
                        style={{ width: "100%", height: "32px", border: "none", borderRadius: "6px", cursor: "pointer", background: "none" }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>Destaque</span>
                      <input
                        type="color"
                        value={studioAccentColor}
                        onChange={(e) => setStudioAccentColor(e.target.value)}
                        style={{ width: "100%", height: "32px", border: "none", borderRadius: "6px", cursor: "pointer", background: "none" }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. CARTÃO DE CONTEÚDO (SURFACE) & MOLDURA */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 800, color: "#ffffff", marginBottom: "10px" }}>
                    🔲 Estilo do Cartão & Superfície
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Cor do Cartão</span>
                      <input
                        type="color"
                        value={studioSurfaceColor}
                        onChange={(e) => setStudioSurfaceColor(e.target.value)}
                        style={{ width: "100%", height: "34px", border: "none", borderRadius: "6px", cursor: "pointer", background: "none" }}
                      />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                        <span>Opacidade</span>
                        <span>{studioCardOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={studioCardOpacity}
                        onChange={(e) => setStudioCardOpacity(Number(e.target.value))}
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                        <span>Arredondamento</span>
                        <span>{studioBorderRadius}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={36}
                        value={studioBorderRadius}
                        onChange={(e) => setStudioBorderRadius(Number(e.target.value))}
                        style={{ width: "100%" }}
                      />
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Sombra 3D</span>
                      <select
                        className="studio-input"
                        value={studioShadow}
                        onChange={(e) => setStudioShadow(e.target.value as typeof studioShadow)}
                      >
                        <option value="none">Nenhuma</option>
                        <option value="soft">Suave Natural</option>
                        <option value="deep">Elevação Profunda</option>
                        <option value="glow">Glow Neon Colorido</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Estilo da Borda</span>
                    <select
                      className="studio-input"
                      value={studioBorderStyle}
                      onChange={(e) => setStudioBorderStyle(e.target.value as typeof studioBorderStyle)}
                    >
                      <option value="solid">Sólida Fina</option>
                      <option value="glow">Borda com Glow Neon</option>
                      <option value="dashed">Tracejada Minimalista</option>
                      <option value="none">Sem Borda</option>
                    </select>
                  </div>
                </div>

                {/* 5. INDICADORES & ELEMENTOS DECORATIVOS */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 800, color: "#ffffff", marginBottom: "10px" }}>
                    🔖 Indicadores & Elementos Visuais
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Numeração de Slides</span>
                      <select
                        className="studio-input"
                        value={studioNumberingStyle}
                        onChange={(e) => setStudioNumberingStyle(e.target.value as typeof studioNumberingStyle)}
                      >
                        <option value="pill">Pill Badge (&quot;01 / 07&quot;)</option>
                        <option value="bar">Barra de Progresso Linear</option>
                        <option value="dots">Bolinhas no Rodapé</option>
                        <option value="minimal">Discreto no Canto</option>
                        <option value="none">Nenhum</option>
                      </select>
                    </div>

                    <div>
                      <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Indicador de Deslize</span>
                      <select
                        className="studio-input"
                        value={studioSwipeStyle}
                        onChange={(e) => setStudioSwipeStyle(e.target.value as typeof studioSwipeStyle)}
                      >
                        <option value="arrow">Flecha (&quot;deslize →&quot;)</option>
                        <option value="pill">Pill (&quot;arraste pro lado&quot;)</option>
                        <option value="hand">Mãozinha 👆</option>
                        <option value="none">Nenhum</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Posição da sua Marca (@handle)</span>
                    <select
                      className="studio-input"
                      value={studioBrandPosition}
                      onChange={(e) => setStudioBrandPosition(e.target.value as typeof studioBrandPosition)}
                    >
                      <option value="top-left">Topo à Esquerda</option>
                      <option value="top-right">Topo à Direita</option>
                      <option value="bottom-left">Rodapé à Esquerda</option>
                      <option value="bottom-right">Rodapé à Direita</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* PAINEL DIREITO: LIVE PREVIEW INTERATIVO MULTI-FORMATO & MULTI-LÂMINA */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "sticky", top: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff" }}>
                    👁️ Pré-Visualização em Tempo Real:
                  </span>

                  {/* SELETOR DE FORMATO */}
                  <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.06)", padding: "3px", borderRadius: "10px" }}>
                    {(["4:5", "3:4", "1:1", "9:16"] as CarouselFormat[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setStudioPreviewFormat(f)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "none",
                          fontSize: "11px",
                          fontWeight: 800,
                          cursor: "pointer",
                          background: studioPreviewFormat === f ? "var(--ig-sunset)" : "transparent",
                          color: "#ffffff",
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SELETOR DE LÂMINA DO PREVIEW */}
                <div style={{ display: "flex", gap: "6px" }}>
                  {[
                    { idx: 0, label: "Lâmina 1 (Capa)" },
                    { idx: 1, label: "Lâmina 2 (Conteúdo)" },
                    { idx: 2, label: "Lâmina 3 (CTA Final)" },
                  ].map((s) => (
                    <button
                      key={s.idx}
                      type="button"
                      onClick={() => setStudioPreviewSlide(s.idx as 0 | 1 | 2)}
                      style={{
                        flex: 1,
                        padding: "7px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                        background: studioPreviewSlide === s.idx ? "rgba(255,255,255,0.14)" : "rgba(18,18,24,0.6)",
                        color: studioPreviewSlide === s.idx ? "#ffffff" : "#94a3b8",
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* MOCKUP DO SLIDE RENDERIZADO COM TODOS OS EFEITOS */}
                {(() => {
                  const bgStyle = studioBgType === "solid"
                    ? studioBg1
                    : studioBgType === "radial"
                    ? `radial-gradient(circle at center, ${studioBg2} 0%, ${studioBg1} 100%)`
                    : `linear-gradient(${studioGradientAngle}deg, ${studioBg1} 0%, ${studioBg2} 100%)`;

                  const patternOverlay = studioPattern === "blueprint"
                    ? "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)"
                    : studioPattern === "dots"
                    ? "radial-gradient(rgba(255,255,255,0.15) 1.5px, transparent 1.5px)"
                    : studioPattern === "lines"
                    ? "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)"
                    : "none";

                  const patternSize = studioPattern === "blueprint" ? "18px 18px" : studioPattern === "dots" ? "14px 14px" : "auto";

                  const shadowStyle = studioShadow === "deep"
                    ? "0 25px 50px -12px rgba(0,0,0,0.85)"
                    : studioShadow === "glow"
                    ? `0 0 40px ${studioAccentColor}44, 0 20px 40px rgba(0,0,0,0.6)`
                    : studioShadow === "soft"
                    ? "0 10px 25px rgba(0,0,0,0.4)"
                    : "none";

                  const heightByFormat = studioPreviewFormat === "1:1" ? "380px" : studioPreviewFormat === "9:16" ? "560px" : studioPreviewFormat === "3:4" ? "480px" : "450px";

                  return (
                    <div
                      style={{
                        width: "100%",
                        height: heightByFormat,
                        background: bgStyle,
                        backgroundImage: patternOverlay !== "none" ? `${patternOverlay}, ${bgStyle}` : bgStyle,
                        backgroundSize: patternSize,
                        color: studioTextColor,
                        borderRadius: "28px",
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative",
                        overflow: "hidden",
                        border: studioBorderStyle === "glow"
                          ? `1.5px solid ${studioAccentColor}`
                          : studioBorderStyle === "dashed"
                          ? "1.5px dashed rgba(255,255,255,0.2)"
                          : studioBorderStyle === "solid"
                          ? "1px solid rgba(255,255,255,0.12)"
                          : "none",
                        boxShadow: shadowStyle,
                        transition: "all 0.3s ease",
                      }}
                    >
                      {/* BARRA DE PROGRESSO SE ATIVA */}
                      {studioNumberingStyle === "bar" && (
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "rgba(255,255,255,0.1)" }}>
                          <div style={{ width: studioPreviewSlide === 0 ? "33%" : studioPreviewSlide === 1 ? "66%" : "100%", height: "100%", background: studioAccentColor, transition: "width 0.3s ease" }} />
                        </div>
                      )}

                      {/* CABEÇALHO DO SLIDE: BRAND & NÚMERO */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {avatarImage ? (
                            <img src={avatarImage} alt="Avatar" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>
                              {handle.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: FONTS[studioBodyFont]?.css }}>@{handle}</span>
                        </div>

                        {studioNumberingStyle === "pill" && (
                          <span style={{ fontSize: "11px", fontWeight: 800, background: "rgba(0,0,0,0.4)", color: "#ffffff", padding: "3px 9px", borderRadius: "9999px" }}>
                            0{studioPreviewSlide + 1} / 07
                          </span>
                        )}
                        {studioNumberingStyle === "minimal" && (
                          <span style={{ fontSize: "11px", fontWeight: 700, opacity: 0.8 }}>
                            {studioPreviewSlide + 1}/7
                          </span>
                        )}
                      </div>

                      {/* CONTEÚDO DENTRO DO CARD COM SURFACE STYLING */}
                      <div
                        style={{
                          background: `${studioSurfaceColor}${Math.round((studioCardOpacity / 100) * 255).toString(16).padStart(2, "0")}`,
                          borderRadius: `${studioBorderRadius}px`,
                          padding: "20px",
                          border: `1px solid rgba(255,255,255,0.1)`,
                          zIndex: 2,
                          textAlign: studioTextAlign,
                          letterSpacing: studioLetterSpacing === "tight" ? "-1px" : studioLetterSpacing === "wide" ? "1.5px" : "normal",
                        }}
                      >
                        {studioPreviewSlide === 0 && (
                          <>
                            <span style={{ fontSize: "10.5px", fontWeight: 900, color: studioAccentColor, textTransform: "uppercase", letterSpacing: "1.5px", display: "block", marginBottom: "6px", fontFamily: FONTS[studioHeadingFont]?.css }}>
                              PASSO A PASSO DEFINITIVO
                            </span>
                            <h3 style={{ fontSize: `${studioTitleSize}px`, fontWeight: 900, lineHeight: 1.25, textTransform: studioUppercase ? "uppercase" : "none", fontFamily: FONTS[studioHeadingFont]?.css, marginBottom: "8px" }}>
                              Como Dobrar seu Faturamento Usando Carrosséis
                            </h3>
                            <p style={{ fontSize: "13px", color: studioMutedColor, lineHeight: 1.5, fontFamily: FONTS[studioBodyFont]?.css }}>
                              O método validado para atrair clientes prontos para comprar sem gastar fortunas em anúncios.
                            </p>
                          </>
                        )}

                        {studioPreviewSlide === 1 && (
                          <>
                            <span style={{ fontSize: "10.5px", fontWeight: 900, color: studioAccentColor, textTransform: "uppercase", letterSpacing: "1.5px", display: "block", marginBottom: "6px", fontFamily: FONTS[studioHeadingFont]?.css }}>
                              ESTRATÉGIA #01
                            </span>
                            <h3 style={{ fontSize: `${studioTitleSize - 2}px`, fontWeight: 900, lineHeight: 1.25, textTransform: studioUppercase ? "uppercase" : "none", fontFamily: FONTS[studioHeadingFont]?.css, marginBottom: "10px" }}>
                              Os 3 Elementos de um Carrossel que Vende
                            </h3>
                            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "6px", textAlign: "left", fontSize: "12px", fontFamily: FONTS[studioBodyFont]?.css }}>
                              <li style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: studioAccentColor, fontWeight: 900 }}>✓</span> Gancho magnético nos primeiros 1.2 segundos
                              </li>
                              <li style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: studioAccentColor, fontWeight: 900 }}>✓</span> Estrutura respirável sem blocos gigantes de texto
                              </li>
                              <li style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: studioAccentColor, fontWeight: 900 }}>✓</span> Chamada única e direta no último slide
                              </li>
                            </ul>
                          </>
                        )}

                        {studioPreviewSlide === 2 && (
                          <>
                            <span style={{ fontSize: "10.5px", fontWeight: 900, color: studioAccentColor, textTransform: "uppercase", letterSpacing: "1.5px", display: "block", marginBottom: "6px", fontFamily: FONTS[studioHeadingFont]?.css }}>
                              NÃO PERCA ESSE GUIA
                            </span>
                            <h3 style={{ fontSize: `${studioTitleSize - 2}px`, fontWeight: 900, lineHeight: 1.25, textTransform: studioUppercase ? "uppercase" : "none", fontFamily: FONTS[studioHeadingFont]?.css, marginBottom: "8px" }}>
                              Gostou deste conteúdo prático?
                            </h3>
                            <p style={{ fontSize: "13px", color: studioMutedColor, lineHeight: 1.5, fontFamily: FONTS[studioBodyFont]?.css, marginBottom: "12px" }}>
                              Salve este post na bandeirinha para consultar quando for criar seu próximo post!
                            </p>
                            <div style={{ display: "inline-block", background: studioAccentColor, color: "#ffffff", padding: "8px 18px", borderRadius: "9999px", fontSize: "12px", fontWeight: 800 }}>
                              Salvar na Bandeirinha 📌
                            </div>
                          </>
                        )}
                      </div>

                      {/* RODAPÉ DO SLIDE: BOLINHAS & SWIPE */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", opacity: 0.85, zIndex: 2 }}>
                        <span>{studioName}</span>

                        {studioNumberingStyle === "dots" && (
                          <div style={{ display: "flex", gap: "4px" }}>
                            {[0, 1, 2].map((di) => (
                              <div key={di} style={{ width: studioPreviewSlide === di ? "12px" : "5px", height: "5px", borderRadius: "3px", background: studioPreviewSlide === di ? studioAccentColor : "rgba(255,255,255,0.3)" }} />
                            ))}
                          </div>
                        )}

                        {studioSwipeStyle === "arrow" && <span>deslize para o lado →</span>}
                        {studioSwipeStyle === "pill" && <span style={{ background: "rgba(0,0,0,0.3)", padding: "2px 8px", borderRadius: "9999px" }}>arraste pro lado 👉</span>}
                        {studioSwipeStyle === "hand" && <span>👆 passe para o lado</span>}
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="button"
                  onClick={handleSaveCustomTemplate}
                  className="btn-primary-ig"
                  style={{ width: "100%", padding: "14px", fontSize: "14.5px", borderRadius: "14px", fontWeight: 800 }}
                >
                  💾 Salvar Este Template & Começar a Criar
                </button>
              </div>
            </div>
              </>
            )}
          </div>
        )}

        {/* ABA 6: TUTORIAIS & CONEXÃO DE IA (TERMOS LEIGOS E LINKS DIRETOS) */}
        {activeTab === "tutorials" && (
          <div style={{ maxWidth: "860px", margin: "20px auto", display: "flex", flexDirection: "column", gap: "28px", padding: "0 14px" }}>
            <div>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#38bdf8", letterSpacing: "1px" }}>
                GUIA PRÁTICO DESCOMPLICADO
              </span>
              <h2 style={{ fontSize: "30px", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                Como Criar Conteúdos com Inteligência Artificial
              </h2>
              <p style={{ color: "#94a3b8", fontSize: "14.5px" }}>
                Você tem 2 formas super simples para criar os textos dos seus carrosséis: 100% grátis com o Super Prompt ou automática conectando sua chave.
              </p>
            </div>

            {/* OPÇÃO 1: SUPER PROMPT (100% GRÁTIS) */}
            <div style={{ background: "rgba(18, 18, 24, 0.8)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "24px", padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <span style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 800 }}>
                  OPÇÃO 1 • 100% GRÁTIS
                </span>
                <h3 style={{ fontSize: "19px", fontWeight: 900, color: "#ffffff" }}>
                  Super Prompt (Usar no ChatGPT ou Claude sem gastar nada)
                </h3>
              </div>
              <p style={{ color: "#cbd5e1", fontSize: "13.5px", lineHeight: 1.6, marginBottom: "16px" }}>
                Essa é a forma mais recomendada para quem está começando: você não precisa cadastrar cartão nem gerar chaves técnicas.
              </p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "20px", marginBottom: "6px" }}>1️⃣</div>
                  <strong style={{ fontSize: "13px", color: "#ffffff", display: "block" }}>Copie o Prompt</strong>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>No estúdio, escolha o modo "Prompt p/ ChatGPT" e clique em Copiar.</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "20px", marginBottom: "6px" }}>2️⃣</div>
                  <strong style={{ fontSize: "13px", color: "#ffffff", display: "block" }}>Cole no ChatGPT</strong>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Abra o ChatGPT ou Claude gratuito e envie o texto copiado.</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "20px", marginBottom: "6px" }}>3️⃣</div>
                  <strong style={{ fontSize: "13px", color: "#ffffff", display: "block" }}>Cole de Volta no App</strong>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Cole a resposta no campo do estúdio e todos os slides são preenchidos na hora!</span>
                </div>
              </div>
            </div>

            {/* OPÇÃO 2: CONECTAR CHAVE DE IA (GERAÇÃO COM 1 CLIQUE) */}
            <div style={{ background: "rgba(18, 18, 24, 0.8)", border: "1px solid rgba(225, 48, 108, 0.3)", borderRadius: "24px", padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <span style={{ background: "rgba(225, 48, 108, 0.15)", color: "#f472b6", padding: "4px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: 800 }}>
                  OPÇÃO 2 • AUTOMAÇÃO COM 1 CLIQUE
                </span>
                <h3 style={{ fontSize: "19px", fontWeight: 900, color: "#ffffff" }}>
                  Conectar sua Chave de IA (Geração Direta no App)
                </h3>
              </div>
              <p style={{ color: "#cbd5e1", fontSize: "13.5px", lineHeight: 1.6, marginBottom: "16px" }}>
                Para quem quer gerar textos com apenas 1 clique direto no botão <em>"Criar Carrossel Agora"</em>. O Google Gemini é gratuito e super rápido!
              </p>

              {/* CARDS COM LINKS DIRETOS PARA OBTER AS CHAVES */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginBottom: "22px" }}>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", background: "linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(99, 102, 241, 0.08))", border: "1px solid rgba(56, 189, 248, 0.35)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "6px", transition: "all 0.15s ease" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "#ffffff", fontSize: "14px" }}>1. OpenRouter (100% Grátis)</strong>
                    <span style={{ color: "#38bdf8", fontSize: "12px" }}>↗</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 800 }}>⭐ MAIS RECOMENDADO • SEM CARTÃO</span>
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                    Acesso a <strong>Llama 3.3 70B</strong> (melhor texto grátis), <strong>DeepSeek R1</strong> e <strong>Gemini 2.0 Flash</strong> de graça. Crie a chave em 30 segundos!
                  </p>
                </a>

                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "6px", transition: "all 0.15s ease" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "#ffffff", fontSize: "14px" }}>2. Google Gemini (Grátis)</strong>
                    <span style={{ color: "#38bdf8", fontSize: "12px" }}>↗</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: 700 }}>Oficial Google • 15 req/min Grátis</span>
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                    Entre no Google AI Studio com sua conta Google e clique em "Create API key". Super rápido e estável.
                  </p>
                </a>

                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "6px", transition: "all 0.15s ease" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "#ffffff", fontSize: "14px" }}>3. ChatGPT / OpenAI</strong>
                    <span style={{ color: "#38bdf8", fontSize: "12px" }}>↗</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#a855f7", fontWeight: 700 }}>GPT-4o Mini e GPT-4o</span>
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                    Painel oficial da OpenAI para quem já possui créditos do ChatGPT.
                  </p>
                </a>

                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "6px", transition: "all 0.15s ease" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "#ffffff", fontSize: "14px" }}>4. Anthropic Claude</strong>
                    <span style={{ color: "#38bdf8", fontSize: "12px" }}>↗</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#f97316", fontWeight: 700 }}>Claude 3.5 Sonnet Oficial</span>
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                    Console da Anthropic para redação de altíssimo nível humano e copywriting sofisticado.
                  </p>
                </a>
              </div>

              {/* FORMULÁRIO SEGURO PARA SALVAR A CHAVE & ESCOLHER O MODELO */}
              <div style={{ background: "rgba(0,0,0,0.35)", padding: "20px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ display: "block", fontSize: "14px", fontWeight: 800, color: "#ffffff", marginBottom: "12px" }}>
                  🔑 Configure seu Provedor, Modelo & Salve sua Chave:
                </span>

                {(() => {
                  const currentProvider = getProviderConfig(userAiProvider);
                  const currentModel = currentProvider.models.find((m) => m.id === userAiModel) || currentProvider.models[0];

                  return (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "12px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94a3b8", marginBottom: "4px", textTransform: "uppercase" }}>
                            Provedor de IA
                          </label>
                          <select
                            className="studio-input"
                            value={userAiProvider}
                            onChange={(e) => {
                              const p = e.target.value as any;
                              setUserAiProvider(p);
                              const newConfig = getProviderConfig(p);
                              setUserAiModel(newConfig.defaultModel);
                              if (typeof window !== "undefined") {
                                localStorage.setItem("mc_user_ai_provider", p);
                                localStorage.setItem("mc_user_ai_model", newConfig.defaultModel);
                              }
                            }}
                            style={{ width: "100%", padding: "10px" }}
                          >
                            {AI_PROVIDERS.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                              Modelo / LLM
                            </label>
                            {currentModel?.isFree && (
                              <span style={{ fontSize: "9.5px", background: "rgba(34, 197, 94, 0.2)", color: "#86efac", padding: "1px 5px", borderRadius: "4px", fontWeight: 800 }}>
                                GRÁTIS
                              </span>
                            )}
                          </div>
                          <select
                            className="studio-input"
                            value={userAiModel}
                            onChange={(e) => {
                              const m = e.target.value;
                              setUserAiModel(m);
                              if (typeof window !== "undefined") {
                                localStorage.setItem("mc_user_ai_model", m);
                              }
                            }}
                            style={{ width: "100%", padding: "10px" }}
                          >
                            {currentProvider.models.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.badge ? `[${m.badge}] ` : ""}{m.name} {m.isFree ? "— Grátis" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {currentModel?.description && (
                        <div style={{ background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", padding: "10px 14px", borderRadius: "10px", fontSize: "12px", color: "#bae6fd", marginBottom: "14px" }}>
                          💡 <strong>Sobre este modelo:</strong> {currentModel.description}
                        </div>
                      )}

                      <div style={{ marginBottom: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                            Chave de API ({currentProvider.shortLabel})
                          </label>
                          <a
                            href={currentProvider.keyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: "11.5px", color: "#38bdf8", textDecoration: "none", fontWeight: 700 }}
                          >
                            {currentProvider.keyUrlLabel} ↗
                          </a>
                        </div>
                        <input
                          type="password"
                          className="studio-input"
                          value={userApiKey}
                          onChange={(e) => {
                            setUserApiKey(e.target.value);
                            setAiKeyStatus("");
                          }}
                          placeholder={`Cole sua chave aqui (ex: ${currentProvider.keyPrefix})`}
                          style={{ width: "100%", padding: "10px", fontSize: "13px" }}
                        />
                      </div>
                    </>
                  );
                })()}

                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        localStorage.setItem("mc_user_ai_key", userApiKey.trim());
                        localStorage.setItem("mc_user_ai_provider", userAiProvider);
                        localStorage.setItem("mc_user_ai_model", userAiModel);
                        setAiKeyStatus("✓ Chave e modelo salvos com sucesso no seu navegador! Agora você pode gerar carrosséis com 1 clique.");
                      }
                    }}
                    className="btn-primary-ig"
                    style={{ padding: "10px 22px", fontSize: "13px" }}
                  >
                    💾 Salvar Configurações
                  </button>

                  {userApiKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserApiKey("");
                        if (typeof window !== "undefined") {
                          localStorage.removeItem("mc_user_ai_key");
                        }
                        setAiKeyStatus("Chave removida.");
                      }}
                      style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer", fontWeight: 700 }}
                    >
                      ✕ Remover Chave
                    </button>
                  )}
                  {aiKeyStatus && (
                    <span style={{ fontSize: "12px", color: aiKeyStatus.startsWith("✓") ? "#4ade80" : "#94a3b8", fontWeight: 700 }}>
                      {aiKeyStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 5: CHECKOUT MERCADO PAGO */}
        {activeTab === "checkout" && (
          <div style={{ maxWidth: "620px", margin: "20px auto", padding: "0 10px" }}>
            <div
              style={{
                background: "rgba(18, 18, 24, 0.9)",
                borderRadius: "28px",
                padding: "36px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "24px", fontWeight: 900, color: "#ffffff" }}>Checkout Seguro</h2>
                  <p style={{ fontSize: "13px", color: "#94a3b8" }}>
                    Processamento seguro via Mercado Pago
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ display: "block", textDecoration: "line-through", fontSize: "13px", color: "#94a3b8", fontWeight: 600 }}>De {scarcityTier.nextPriceFormatted}</span>
                  <div style={{ fontSize: "28px", fontWeight: 900, color: "#f472b6" }}>{scarcityTier.priceFormatted}</div>
                  <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: 700 }}>{scarcityTier.name}</span>
                </div>
              </div>

              <div style={{background:"rgba(0,158,227,.12)",padding:20,borderRadius:14,marginBottom:20}}>
                <strong>Mercado Pago · PIX e cartão de crédito</strong>
                <p style={{color:"#cbd5e1",fontSize:14,marginTop:10}}>Você será direcionado ao ambiente seguro do Mercado Pago para escolher a forma de pagamento e concluir sua compra.</p>
              </div>
              <button type="button" onClick={handleStartCheckout} disabled={paymentStatus === "pending"} className="btn-primary-ig" style={{width:"100%",padding:16}}>
                {paymentStatus === "pending" ? "Abrindo pagamento…" : "Continuar no Mercado Pago"}
              </button>

              {paymentStatus === "paid" && (
                <div style={{ textAlign: "center", marginTop: "20px", color: "#22c55e", fontWeight: 800, fontSize: "15px" }}>
                  🎉 Parabéns! Sua licença vitalícia está ativa. Você já pode criar carrosséis ilimitados!
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* BARRA DE NAVEGAÇÃO FLUTUANTE INFERIOR EXCLUSIVA MOBILE */}
      <div className="mobile-bottom-bar mobile-only">
        <button
          type="button"
          onClick={() => {
            if (!user) setIsAuthModalOpen(true);
            else setActiveTab("creator");
          }}
          className={`mobile-tab-btn ${activeTab === "creator" ? "active" : ""}`}
        >
          <span style={{ fontSize: "17px" }}>🎨</span>
          <span>Criar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!user) {
              setAuthModalMode("login");
              setIsAuthModalOpen(true);
            } else {
              setActiveTab("projects");
            }
          }}
          className={`mobile-tab-btn ${activeTab === "projects" ? "active" : ""}`}
        >
          <span style={{ fontSize: "17px" }}>📁</span>
          <span>Projetos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inspiration")}
          className={`mobile-tab-btn ${activeTab === "inspiration" ? "active" : ""}`}
        >
          <span style={{ fontSize: "17px" }}>💡</span>
          <span>Inspiração</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("templates")}
          className={`mobile-tab-btn ${activeTab === "templates" ? "active" : ""}`}
        >
          <span style={{ fontSize: "17px" }}>📂</span>
          <span>Modelos</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!user) {
              setAuthModalMode("login");
              setIsAuthModalOpen(true);
            } else {
              setActiveTab("canva-studio");
            }
          }}
          className={`mobile-tab-btn ${activeTab === "canva-studio" ? "active" : ""}`}
        >
          <span style={{ fontSize: "17px" }}>🛠️</span>
          <span>Do Zero</span>
        </button>
      </div>

      {/* NOTIFICAÇÃO FLUTUANTE DE PROVA SOCIAL AO VIVO (200+ NOTIFICAÇÕES A CADA 30s) */}
      <div
        style={{
          position: "fixed",
          bottom: "80px",
          left: "20px",
          zIndex: 999,
          maxWidth: "360px",
          background: "rgba(18, 18, 24, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "16px",
          padding: "12px 16px",
          boxShadow: "0 16px 36px rgba(0,0,0,0.6), 0 0 20px rgba(225, 48, 108, 0.12)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          opacity: showSocialToast ? 1 : 0,
          transform: showSocialToast ? "translateY(0) scale(1)" : "translateY(16px) scale(0.96)",
          pointerEvents: showSocialToast ? "auto" : "none",
          transition: "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {LIVE_SOCIAL_PROOF[socialProofIdx] && (
          <>
            <div style={{ fontSize: "26px", lineHeight: 1 }}>{LIVE_SOCIAL_PROOF[socialProofIdx].avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {LIVE_SOCIAL_PROOF[socialProofIdx].name}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {LIVE_SOCIAL_PROOF[socialProofIdx].role} • {LIVE_SOCIAL_PROOF[socialProofIdx].city}
              </div>
              <div style={{ fontSize: "11px", color: "#f472b6", fontWeight: 700, marginTop: "2px" }}>
                {LIVE_SOCIAL_PROOF[socialProofIdx].action} • <span style={{ color: "#64748b" }}>{LIVE_SOCIAL_PROOF[socialProofIdx].time}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSocialToast(false)}
              aria-label="Fechar notificação"
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "14px", padding: "4px" }}
            >
              ✕
            </button>
          </>
        )}
      </div>

      {/* BOTÃO FLUTUANTE DE ACESSO AO CANAL DO WHATSAPP */}
      <a
        href="https://whatsapp.com/channel/0029Vb95NoEKwqSYdC0K860H"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleRecordWhatsappClick("floating_button")}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 999,
          background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
          color: "#ffffff",
          padding: "10px 18px",
          borderRadius: "9999px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontWeight: 800,
          fontSize: "13px",
          textDecoration: "none",
          boxShadow: "0 10px 25px rgba(37, 211, 102, 0.35)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <span style={{ fontSize: "17px" }}>📲</span>
        <span>Canal WhatsApp</span>
      </a>

      <footer className="site-premium-footer">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Coluna 1: Marca & Confiança */}
            <div className="footer-col" style={{ maxWidth: "340px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <img src="/favicon.png" alt="Magic Carousels Logo" style={{ width: "26px", height: "26px", objectFit: "contain" }} />
                <span style={{ fontSize: "17px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px" }}>
                  Magic<span style={{ color: "#f472b6" }}>Carousels</span>
                </span>
                <span style={{ fontSize: "10px", fontWeight: 800, background: "rgba(225,48,108,0.15)", color: "#f472b6", border: "1px solid rgba(225,48,108,0.3)", padding: "2px 6px", borderRadius: "6px" }}>PRO</span>
              </div>
              <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.6, margin: "0 0 18px 0" }}>
                Crie carrosséis de alta conversão para Instagram e LinkedIn em menos de 60 segundos. Mais de 120 templates nichados com navegação idêntica ao feed.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "5px 10px", borderRadius: "8px", fontSize: "11px", color: "#cbd5e1" }}>
                  🔒 Mercado Pago
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", padding: "5px 10px", borderRadius: "8px", fontSize: "11px", color: "#86efac" }}>
                  🛡️ 7 Dias de Garantia
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "5px 10px", borderRadius: "8px", fontSize: "11px", color: "#cbd5e1" }}>
                  🇧🇷 100% Brasileiro
                </span>
              </div>
            </div>

            {/* Coluna 2: Produto */}
            <div className="footer-col">
              <h4>Produto</h4>
              <ul>
                <li><button type="button" onClick={() => setActiveTab("creator")} style={{ background: "none", border: "none", color: "inherit", padding: 0, font: "inherit", cursor: "pointer", textAlign: "left" }}>⚡ Criador de Carrossel</button></li>
                <li><button type="button" onClick={() => setActiveTab("templates")} style={{ background: "none", border: "none", color: "inherit", padding: 0, font: "inherit", cursor: "pointer", textAlign: "left" }}>🎨 120+ Templates por Nicho</button></li>
                <li><button type="button" onClick={() => setActiveTab("canva-studio")} style={{ background: "none", border: "none", color: "inherit", padding: 0, font: "inherit", cursor: "pointer", textAlign: "left" }}>🛠️ Canva Studio Pro</button></li>
                <li><button type="button" onClick={() => setActiveTab("checkout")} style={{ background: "none", border: "none", color: "inherit", padding: 0, font: "inherit", cursor: "pointer", textAlign: "left" }}>💎 Oferta Lote Fundador</button></li>
              </ul>
            </div>

            {/* Coluna 3: Comunidade & Suporte */}
            <div className="footer-col">
              <h4>Comunidade</h4>
              <ul>
                <li>
                  <a
                    href="https://whatsapp.com/channel/0029Vb95NoEKwqSYdC0K860H"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleRecordWhatsappClick("footer_link")}
                    style={{ color: "#25D366", fontWeight: 700 }}
                  >
                    📲 Canal VIP no WhatsApp
                  </a>
                </li>
                <li><Link href="/ajuda">❓ Central de Ajuda & FAQ</Link></li>
                <li><Link href="/contato">💬 Fale Conosco</Link></li>
                <li><a href="mailto:comercial@splinkapp.com.br">✉️ comercial@splinkapp.com.br</a></li>
              </ul>
            </div>

            {/* Coluna 4: Institucional & Legal */}
            <div className="footer-col">
              <h4>Institucional</h4>
              <ul>
                <li><Link href="/sobre">🏢 Sobre o Grupo SplinkApp</Link></li>
                <li><Link href="/termos">📄 Termos de Uso</Link></li>
                <li><Link href="/privacidade">🛡️ Política de Privacidade</Link></li>
                <li style={{ fontSize: "11px", color: "#64748b", marginTop: "6px", lineHeight: 1.5 }}>
                  CNPJ: 32.657.200/0001-08<br />
                  Parte do Grupo SplinkApp · Desde 2019
                </li>
              </ul>
            </div>
          </div>

          {/* Barra Inferior com Copyright e Status */}
          <div className="footer-bottom">
            <div>
              © 2026 Magic Carousels — Parte do Grupo SplinkApp. Todos os direitos reservados.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 8px #22c55e" }} />
              <span style={{ color: "#94a3b8" }}>Sistemas 100% Operacionais</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}