<!-- PROJECT LOGO -->
<p align="center">
  <img src="https://img.shields.io/badge/Equity%20Quest-The%20Apex%20Investors'%20Gauntlet-0a0a0a?style=for-the-badge&logo=react&logoColor=61DAFB" alt="Equity Quest"/>
</p>

<h1 align="center">🦅 Equity Quest: The Apex Investors’ Gauntlet</h1>

<p align="center">
  <b>India’s Most Comprehensive Mock Stock-Trading Competition Platform</b><br/>
  <i>Built for strategy. Engineered for precision. Designed for excellence.</i><br/><br/>
  <img src="https://img.shields.io/badge/React-18.3.1-blue?logo=react" />
  <img src="https://img.shields.io/badge/Vite-7.1.9-purple?logo=vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4.17-38B2AC?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" />
</p>

---

## 📚 Table of Contents
1. [Overview](#-project-overview)
2. [Technical Architecture](#-technical-architecture)
3. [Gameplay Philosophy](#-gameplay-philosophy)
4. [Page-by-Page Guide](#-page-by-page-documentation)
5. [Component Inventory](#-component-inventory)
6. [User Flows & Navigation](#-user-flows--navigation)
7. [Database Schema](#-database-schema)
8. [API & Edge Functions](#-api-endpoints--services)
9. [Authentication & Authorization](#-authentication--authorization)
10. [Real-time Systems](#-real-time-features)
11. [Admin Panel](#-admin-functionality)
12. [Trading System](#-trading-system)
13. [Competition Mechanics](#-competition-mechanics)
14. [UI / UX Design System](#-uiux-components)
15. [Performance & Security](#-performance--security)
16. [Development & Deployment](#-development--deployment)
17. [License](#-license)

---

## 🎯 Project Overview
**Equity Quest** is a next-generation mock stock trading competition platform that simulates real-world financial markets with institutional-level precision.
It challenges participants to navigate volatility, misinformation, and risk through real-time trading, advanced order types, and dynamic competition mechanics.

Built with **React, TypeScript, and Supabase**, Equity Quest delivers a seamless, data-driven trading experience featuring live price feeds, margin management, and real-time leaderboards.
Each player competes through three escalating rounds — from fundamental analysis to chaotic macroeconomic shocks — earning scores based on both profitability and risk-adjusted performance (Sortino Ratio).

Designed for **educational institutions, finance clubs, and investment leagues**, the platform blends gamification, analytics, and financial strategy to teach participants the art of conviction-based investing under pressure.


### ✨ Highlights
- ⚡ Real-time order execution & live feeds  
- 🏁 Three escalating competition rounds  
- 📉 Market, Limit & Stop-Loss orders  
- 🧮 Short selling with margin rules  
- 🏦 Live leaderboards (P&L + Sortino Ratio)  
- 🛡️ Margin calls & exposure controls  
- 🧠 Admin control for events & resets  

---

## 🏗️ Technical Architecture
**Frontend**
| Layer | Tech |
|-------|------|
| Framework | React 18 + TypeScript |
| Builder | Vite 7 |
| UI | Shadcn/UI + Radix Primitives |
| Styling | TailwindCSS 3 |
| State | React Context + React Query |
| Charts | Recharts |
| Routing | React Router 6 |

**Backend**
| Layer | Tech |
|-------|------|
| DB | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (JWT Sessions) |
| Real-time | Supabase Realtime |
| Serverless | Supabase Edge Functions |
| API | REST + RPC Functions |

---

## 🧠 Gameplay Philosophy
> Adapted from **_The Apex Investors’ Gauntlet – Final Definitive Edition_**

Success in Equity Quest demands foresight, risk management, and mental resilience.  
The objective isn’t simply profit — it’s to prove strategic superiority under pressure.

### 🎮 Market Instruments
- **Tier 1 Equities:** NIFTY 50 constituents  
- **Tier 2 Commodities:** Gold (XAU/INR), Silver (XAG/INR)  
- 💰 Starting Capital ₹5,00,000  💱 No Leverage  
- 📊 Friction 0.10 % per trade  🔒 Circuit limits ±10 %(equities)/±6 %(commodities)

### 🧩 Information & Deception Engine
- Tiered information quality — some tips true, some false.  
- Insider information can be traded once for 2 % of portfolio value.  
- Mid-round catalysts create unpredictable chain reactions.

### 🕹️ Round Structure
| Round | Theme | Duration | Shorting | Example Events |
|--------|--------|-----------|-----------|----------------|
| 1 – Fundamentals Floor | Pure fundamentals | 20 min | 🚫 No | Sector news, earnings |
| 2 – Fog of War | Conflicting signals | 30 min | ✅ Yes | IT whiplash, insider tips |
| 3 – Macro Meltdown | Volatile macro | 30 min | ✅ Yes | RBI shock, Black Swan |

### 📈 Scoring Doctrine
`Final Score = 70 % Portfolio P&L + 30 % Sortino Ratio`

---

## 📄 Page-by-Page Documentation
*(Excerpt — full section continues in `/docs`)*  
- **Landing Page:** Hero banner + feature cards + CTA  
- **Auth Page:** Tabs for Login/Signup w/ Zod validation  
- **Dashboard:** Portfolio cards, trading panel, positions table  
- **Market Analysis:** Sector overview + Recharts visuals  
- **Leaderboard:** Live rankings + Sortino breakdown  
- **Messages:** User/Admin messaging system  
- **Transactions:** Order history + CSV export  
- **Admin:** Round control, resets, market events  
- **404:** Fallback page with return CTA  

---

## 🧩 Component Inventory
- **Layouts:** `DashboardLayout`, `ProtectedRoute`
- **Trading:** `MarketOverview`, `SectorNavigation`, `StockDetailView`
- **UI Primitives:** Buttons, Cards, Tabs, Toasts, Dialogs, Badges  
- **Charts:** Integrated Recharts line + bar components  
- **Forms:** Zod validation via Inputs, Selects, Switches  

---

## 🗺️ User Flows & Navigation
**Authentication:** Landing → Auth → Dashboard  
**Trading:** Dashboard → Select Asset → Place Order → Realtime Update  
**Competition:** Admin → Start Round → Leaderboard → Results  

Navigation includes Dashboard, Market, Leaderboard, Messages, Transactions (+ Admin panel for admins).

---

## 🗄️ Database Schema
**Core Tables**
`users`, `profiles`, `user_roles`, `assets`, `portfolios`, `positions`, `orders`, `transactions`, `competition_rounds`, `competition_events`, `news`, `messages`, `margin_warnings`, `portfolio_history`, `price_fluctuation_log`, `financial_metrics`

**Relations**
- `users → profiles (1:1)`  
- `users → positions/orders (1:many)`  
- `assets → positions/orders (1:many)`

---

## 🔌 API Endpoints & Services
**RPC Functions**
- `reset_competition()` – Full system reset  
- `is_admin_or_owner()` – Role validation  
- `handle_new_user()` – Profile bootstrap  

**Edge Functions**
- `fetch-yfinance-data` – Live price sync  
- `background-price-noise` – Simulated fluctuations  
- `black-swan-event` – Crash simulation  
- `check-margins` – Margin rules engine  

**Realtime Subscriptions**
Assets, Portfolios, Orders, News, Rounds, Margin Warnings

---

## 🔐 Authentication & Authorization
- **Auth:** Supabase email/password + auto token refresh  
- **Roles:** owner / admin / user  
- **RLS Policies:** row-level security enforced  
- **ProtectedRoute** guards front-end access  
- **Validation:** Zod schemas for inputs + Supabase constraints  

---

## ⚡ Real-time Features
- Live asset prices & portfolio P&L  
- Instant order execution feedback  
- Realtime leaderboard & news feed  
- Auto-reconnection WebSockets per page  

---

## 👑 Admin Functionality
- Round Control: start/pause/end/advance  
- Data Reset toggles (orders, positions, news, etc.)  
- Market Events & Black Swan triggers  
- User role management  
- Live analytics & risk tracking  

---

## 📈 Trading System
- Market / Limit / Stop-Loss orders  
- Short selling (25 % initial margin / 15 % maintenance)  
- Auto liquidation on breach  
- Position & sector limits  
- Friction 0.10 % per trade  
- Price validation & funds check  

---

## 🏆 Competition Mechanics
| Component | Weight | Metric |
|------------|---------|--------|
| Portfolio P&L | 70 % | Net return |
| Sortino Ratio | 30 % | Risk-adjusted return |

**Market Events**
- Sector / Global / Commodity / Policy / Geopolitical / Black Swan  
All executed via Supabase Edge functions + real-time propagation.

---

## 🎨 UI / UX Components
- Color System: Primary, Success, Warning, Error  
- Typography: Inter font, responsive scale  
- Animations: Framer Motion transitions  
- Responsive: Mobile-first grid/flex layouts  
- Feedback: Toasts + Skeleton loaders + clear error states  

---

## 🚀 Performance & Security
- Route-level code splitting & lazy loading  
- Memoization (useMemo / React.memo)  
- Tree-shaking + asset minification  
- Input sanitization (XSS safe)  
- Parameterized queries (SQL safe)  
- Rate-limiting for Edge functions  
- JWT validation & role-based guards  

---

## 🔧 Development & Deployment
**Dev Tools:** Vite | ESLint | TypeScript | Hot Reload  
**Build:** Optimized production bundle + asset compression  
**Env:** `.env.local` for Supabase keys  
**Deploy:** Static hosting (Vercel / Netlify / Supabase Hosting)  

---

## 📜 License
Distributed under the MIT License.  
© 2025 **Equity Quest** — All Rights Reserved.  

---

<p align="center">
  <i>“The Apex Investors’ Gauntlet isn’t just a simulation — it’s a test of conviction.”</i><br/>
  🦅 <b>Equity Quest</b> · Institutional-grade Trading Simulation Platform
</p>
