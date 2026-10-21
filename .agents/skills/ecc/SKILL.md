---
name: ecc
description: >-
  Enterprise Coding Context (ECC): Rigor de engenharia, planejamento arquitetural,
  auditoria de segurança de dados, verificação contínua de integridade de build e testes.
---

# ECC: Enterprise Coding Context & Rigor de Engenharia

O **ECC** estabelece padrões de produção para o desenvolvimento de software profissional, prevenindo regressões, vazamento de credenciais e falhas em build.

## 1. Portões de Qualidade (Quality Gates)
1. **Planejamento Prévio**: Nunca altere código crítico sem mapear todas as dependências afetadas (blast radius).
2. **Segurança de Dados**:
   - Todas as rotas de banco em Supabase devem utilizar Row Level Security (RLS) habilitado.
   - Segredos (chaves de API, senhas, tokens) NUNCA devem ser commitados no Git ou expostos no frontend (`process.env.NEXT_PUBLIC_*`).
   - Validação de entrada sanitizando todos os dados de formulário com restrição de tamanho.
3. **Verificação Zero Erros**:
   - Todo ciclo de trabalho deve ser validado com `npm run lint` e compilação de TypeScript (`npm run build`).
   - Nenhuma advertência que viole as regras do React 19 / Next.js 16 (funções impuras no render, estados inconsistentes).

## 2. Padrões de Persistência & Resiliência
- Se o banco de dados principal sofrer latência ou tabela não estiver migrada, forneça failover elegante e feedback amigável sem quebrar o app do usuário.
- Mantenha scripts SQL idempotentes (`create table if not exists`, `create index if not exists`).
