# 📊 Sistema de Conferência e Cálculo de Diferenças Remuneratórias por Progressão

> **Client-Side MVP** para processamento de **Fichas Financeiras (PDF) do Sistema Centi / Município de Rio Verde - GO**, apuração automática de diferenças salariais por progressão funcional (Letra 1 vs Letra 2), cálculo de reflexos constitucionais e emissão de laudo formal em PDF.

---

## 🚀 Tecnologias & Arquitetura

O projeto foi construído seguindo rigorosamente os princípios de **Clean Architecture**, **Clean Code** e **Feature-based Folder Structure**, garantindo separação de responsabilidades, alta manutenibilidade e processamento **100% Client-Side** (privacidade total dos dados sem envio para servidores externos).

- **Core:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Estilização & UI:** [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/), Efeitos Glassmorphism
- **Leitura & Parsing de PDF:** `pdfjs-dist` (extração nativa de eventos e competências do sistema Centi)
- **Engine de PDF:** `jspdf` + `jspdf-autotable` (geração do laudo oficial diagramado)
- **Efeitos de UX:** `canvas-confetti`

---

## 📁 Estrutura de Pastas (Clean Architecture)

```text
src/
├── core/                           # Camada Global e Compartilhada
│   ├── types/                      # Entidades de domínio (ServerInfo, ProgressionParams, etc.)
│   ├── utils/                      # Formatadores de moeda (BRL), percentuais e arredondamento
│   └── components/                 # Componentes genéricos de UI (Header, Card, etc.)
├── features/
│   ├── report-parser/              # Parser de PDF (pdfjs-dist) + Mock Data Generator Centi (1-Clique)
│   ├── calculation/                # Engine de Cálculo de Progressão, Reflexos e Controles de Parâmetros
│   ├── summary-view/               # Tabela Analítica Interativa com suporte a edições manuais
│   └── pdf-exporter/               # Gerador do Relatório/Laudo Oficial em PDF
├── App.tsx                         # Dashboard Principal da Aplicação
└── index.css                       # Design System em Tailwind CSS v4
```

---

## 📐 Regras de Negócio & Fórmulas de Cálculo

A engine de cálculo apura as diferenças entre a **Letra Atual (Letra 1)** e a **Letra com Progressão (Letra 2)**:

1. **Salário Base (Letra 2):**
   $$\text{Base}_{\text{Letra 2}} = \text{Base}_{\text{Letra 1}} \times (1 + \%_{\text{prog}})$$
2. **Adicional por Tempo de Serviço (ATS - Verba 149):**
   $$\text{ATS}_{\text{Letra 2}} = \text{Salário Base Letra 2} \times \%_{\text{ATS}}$$
3. **Titulação / Incentivo Funcional (Verba 104):**
   $$\text{Incentivo}_{\text{Letra 2}} = \text{Salário Base Letra 2} \times \%_{\text{Titulação}}$$
4. **Horas Extras (50% / 100%):**
   $$\text{HE} = \left(\frac{\text{Base}_{\text{Letra 2}}}{\text{Divisor}}\right) \times 1.5 \times \text{Qtd Horas}$$
5. **Adicional Noturno (20%):**
   $$\text{Adic. Noturno} = \left(\frac{\text{Base}_{\text{Letra 2}}}{\text{Divisor}}\right) \times 0.20 \times \text{Qtd Horas}$$
6. **Diferença Salarial Acumulada:**
   $$\text{Diferença Acumulada} = (\text{Valor}_{\text{Letra 2}} - \text{Valor}_{\text{Letra 1}}) \times \text{Qtd Meses}$$
7. **Reflexo em 13º Salário:**
   Proporcionalidade de $\frac{1}{12}$ por mês trabalhado aplicado sobre a diferença apurada no período.
8. **Reflexo em Férias + 1/3:**
   $\frac{1}{3}$ constitucional aplicado sobre as diferenças remuneratórias do período.

---

## ✨ Funcionalidades em Destaque

- 📥 **Upload de PDF & Ficha Financeira Demo:** Arraste e solte o PDF do Centi/Rio Verde ou use o botão **"Usar PDF de Exemplo (1-Clique)"** para testar imediatamente.
- 📅 **Seleção de Período via Calendário (`<input type="month">`):** Selecione facilmente o mês/ano inicial e final através de um seletor visual de calendário.
- ⚙️ **Parâmetros Dinâmicos:** Ajuste percentuais de progressão (ex: 6,12%), ATS, Titulação, Insalubridade e Carga Horária (150h, 200h, 220h).
- 📊 **KPI Cards & Tabela Analítica:** Visualização clara do total acumulado, comparativo mensal de folhas, reflexos e edição manual de verbas.
- 📑 **Exportação de PDF Oficial:** Download do laudo diagramado com cabeçalho oficial do Município de Rio Verde / Fundo Municipal de Saúde e campos para assinatura.

---

## 🛠️ Como Executar o Projeto

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn / pnpm

### Passos
```bash
# 1. Clonar o repositório
git clone https://github.com/Joao-Vitor-Marques-Braga/Conferencia-de-ficha-financeira.git

# 2. Entrar no diretório do projeto
cd Conferencia-de-ficha-financeira

# 3. Instalar as dependências
npm install

# 4. Iniciar o servidor de desenvolvimento local
npm run dev

# 5. Para compilar a versão final de produção
npm run build
```

---

## ⚖️ Licença e Privacidade
Este software é **100% Stateless e Client-Side**. Nenhum dado pessoal ou financeiro processado é enviado ou armazenado em servidores externos.
