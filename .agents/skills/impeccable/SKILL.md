---
name: impeccable
description: >-
  Framework de design de alta fidelidade e combate ao "AI slop" (layouts genéricos gerados por IA).
  Ensina regras estritas de direção de arte, tipografia refinada, paletas sofisticadas,
  hierarquia visual intencional e micro-animações táteis.
---

# Impeccable Design Skill

O **Impeccable** é um framework de direção visual e refinamento estético criado para garantir que interfaces e carrosséis nunca pareçam genéricos ("AI slop").

## 1. Princípios Fundamentais de Direção de Arte
- **Eliminação de Clichês**: Proibido usar apenas 3 cards idênticos lado a lado com gradiente roxo previsível. Crie assimetria intencional, pontos focais claros e variação de densidade.
- **Tipografia com Caráter**: Nunca rely em tipografia padrão do navegador. Combine famílias com autoridade (ex: Plus Jakarta Sans, Outfit, Syne, Playfair Display) com contraste de peso e tracking negativo em títulos grandes (`letter-spacing: -1px` a `-1.5px`).
- **Paleta Harmoniosa & Semântica**: Cores secundárias e acentos devem ter propósito. Fundo escuro premium (grafite/ônix profundo `#0a0a0f`, `#12121a`) com bordas sutis (`rgba(255,255,255,0.08)` a `0.14`).
- **Superfícies Táteis**: Glassmorphism com `backdrop-filter: blur(14px)`, sombras multicamadas (`0 10px 30px rgba(0,0,0,0.5), 0 0 20px ...`) e feedbacks táteis ao toque/clique (`transform: scale(0.98)`).

## 2. Comandos e Modos de Operação
- **Audit**: Avalia contraste WCAG, respiro visual, ergonomia em smartphones e consistência de espaçamento modular (múltiplos de 4px e 8px).
- **Polish**: Aplica refinamento nos raios de borda (`border-radius`), padding proporcional e transições suaves (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Bolder**: Eleva o contraste, amplia o tamanho da headline com `clamp()`, reforça a chamada de ação e satura o acento principal.
- **Quieter**: Diminui ruído visual, remove bordas redundantes, harmoniza os tons de texto secundário (`#94a3b8`, `#cbd5e1`).

## 3. Checklist de Validação
1. O primeiro slide (capa) chama atenção em menos de 2 segundos no feed?
2. O texto tem contraste legível sob luz solar direta no celular?
3. Há ritmo visual entre lâminas densas e lâminas de respiro?
4. O CTA final é direto, claro e sem ambiguidade?
