# Product Requirements Document: Equity Quest Platform

**Version:** 3.1 (Final & Verified)
**Date:** September 26, 2025
**Author:** Gemini Al Project Manager
**Status:** Approved for Development

---

## 1. Introduction & Overview

[cite_start]This document outlines the product and technical requirements for "Equity Quest," a web-based mock stock trading competition[cite: 5]. [cite_start]The platform will be the central hub for all competition activities and will be managed by a powerful administrator control panel that manually controls all market events and price fluctuations[cite: 6].

[cite_start]**Project Goal:** To create and launch a stable, engaging application for the competition with an institutional-grade feel[cite: 7]. [cite_start]The development timeline is a maximum of two weeks, with a requirement of no financial investment in infrastructure or software[cite: 7].

[cite_start]**Core Philosophy:** The platform will not feature automated price movements[cite: 8]. [cite_start]Instead, an Organizer (Admin) will have a real-time control panel to manually trigger all news events, price changes, and market shocks as laid out in the competition rulebook[cite: 9].

**Target Audience:**
* [cite_start]**Participants (Teams):** Competitors needing a seamless, real-time interface for trading, portfolio viewing, and reacting to admin-pushed updates[cite: 12].
* [cite_start]**Organizers (Admins):** Competition managers who will actively guide the simulation's progression, functioning as "market makers" via a dedicated control panel[cite: 13, 14].

---

## 2. Goals & Success Metrics

[cite_start]The main goal is the flawless execution of the competition, with an admin successfully managing all events from the source document[cite: 16].

| Metric | Target | Measurement Method |
| :--- | :--- | :--- |
| **System Uptime** | 100% during competition rounds | [cite_start]Server logs and uptime monitoring tools. [cite: 17] |
| **Core MVP Delivery** | Base code for real-time updates functional by Sunday, Sep 28. | [cite_start]Successful test of admin price change reflecting on participant screen. [cite: 17] |
| **Feature Completeness** | 100% of required admin controls & participant features implemented | [cite_start]Checklist against this PRD. [cite: 17] |
| **Real-time Performance** | Admin actions reflected on participant screens in < 2 seconds | [cite_start]Real-time monitoring of WebSocket and API latency. [cite: 17] |
| **On-Time Delivery** | Application deployed and handed over within 14 days | [cite_start]Project completion date vs. start date. [cite: 17] |
| **Cost Compliance** | $0 infrastructure and software cost | [cite_start]Final bill of materials for all services used. [cite: 17, 18] |

---

## 3. Functional Requirements

### 3.1. Participant-Facing Application

* [cite_start]**FR-1: Real-time Dashboard:** A single-page application that displays an asset watchlist, the user's portfolio (value, cash, P&L), an order entry form, and a news feed[cite: 21]. [cite_start]All data must update in real-time without needing a page refresh[cite: 22].
* [cite_start]**FR-2: Trading & Rules Engine:** The system must validate and execute all participant trade requests based on established rules[cite: 23].
    * [cite_start]**Starting Capital:** ₹5,00,000[cite: 24].
    * [cite_start]**Order Types:** Market, Limit, Stop-Loss[cite: 25].
    * [cite_start]**Constraint Enforcement:** The system must strictly enforce all position limits (20% stock, 25% commodity, 40% sector), transaction costs (0.10%), and short selling margin requirements (25% initial, 15% maintenance)[cite: 26].
* [cite_start]**FR-3: Live Leaderboard:** A view showing a real-time ranking of all teams based on their current portfolio value[cite: 27].
* [cite_start]**FR-4: Transaction History:** A view where participants can see a full log of their past trades and orders[cite: 28].
* **FR-5: Information Display:**
    * [cite_start]A public "News Ticker" to display headlines pushed from the Admin panel[cite: 30].
    * [cite_start]A private "Messages" inbox for receiving insider tips from the Admin[cite: 32].

### 3.2. Admin Control Panel

* [cite_start]**FR-6: Secure Admin Login:** A separate, secure login mechanism for the Admin to access the master control panel[cite: 39].
* [cite_start]**FR-7: Global Round Controls:** Buttons to START, PAUSE, and END each competition round, with a master timer displayed[cite: 40].
* [cite_start]**FR-8: Price Manipulation Interface:** A dashboard listing all tradable assets and sectors[cite: 41]. [cite_start]Each asset must have an input field for the admin to enter a percentage (e.g., -5.5 or +8) and an "Apply" button to instantly change its price for all users[cite: 42].
* **FR-9: Information Dissemination Interface:**
    * [cite_start]A "Broadcast News" tool with a text box and "Send" button for public headlines[cite: 45].
    * [cite_start]A "Send Insider Tip" tool for the admin to select a team, choose a tip, and send it as a private message[cite: 46].
* [cite_start]**FR-10: Event Macro Triggers:** A section with single-click buttons for major pre-scripted events (e.g., "Trigger Telecom Shake-up," "Trigger Black Swan")[cite: 47]. [cite_start]These buttons will automatically execute the multi-step impacts from the rulebook[cite: 48].
* [cite_start]**FR-11: Team Monitoring View:** A real-time table showing the portfolio value, cash, rank, and detailed current holdings for all teams[cite: 49].
* [cite_start]**FR-12: Manage Information Trades:** A function for the admin to approve or reject a proposed "information trade," which involves a 2% portfolio value transfer between two teams[cite: 50].

### 3.3. Scoring

* [cite_start]**FR-13: Automated Final Scoring:** At the competition's end, the system must calculate and display a final ranked list using the weighted formula: Score = (Portfolio Value * 0.70) + (Sortino Ratio * 0.30)[cite: 52].

---

## 4. Technical Architecture & Stack

| Component | Technology/Service | Justification |
| :--- | :--- | :--- |
| **Frontend** | React.js + Vite with a UI Library (e.g., MUI) | React's component architecture and a pre-built library accelerate UI development. [cite_start]Vite provides an extremely fast development feedback loop. [cite: 55] |
| **Backend** | Python with FastAPI framework | High-performance, native async support is crucial for handling many simultaneous WebSocket connections efficiently. [cite_start]Automatic data validation and API docs reduce development time. [cite: 55] |
| **Database** | PostgreSQL | [cite_start]A robust, open-source relational database perfect for organizing users, portfolios, assets, and transaction logs with high data integrity. [cite: 55] |
| **Real-time Layer** | WebSockets (via python-socketio & socket.io-client) | [cite_start]A persistent, two-way connection is the only way to achieve the required sub-2-second performance for instant market updates pushed from the admin. [cite: 55] |
| **Hosting** | Render.com (Free Tier) | [cite_start]A single, zero-cost platform that can host the PostgreSQL database, the Python/FastAPI backend, and the static React frontend site. [cite: 55] |
| **Code Repository** | GitHub | [cite_start]Industry standard for version control, collaboration, and a single source of truth for the codebase. [cite: 55] |

### 4.1. Development Tools & Methodology

| Tool | Role | Justification |
| :--- | :--- | :--- |
| **Lovable/v0.dev** | AI Frontend Scaffolding | [cite_start]Used to rapidly generate the initial React components and layouts for the Admin and Participant UIs directly from PRD feature descriptions, creating a visual baseline in hours, not days. [cite: 57] |
| **Cursor** | AI-Powered Code Editor | [cite_start]Used as the primary IDE to accelerate backend development (API endpoints, DB models) and to help integrate and refine the AI-generated frontend components. [cite: 57] |

---

## 5. Execution Plan: The "MVP by Sunday" Sprint

* **Phase 1: Foundation & MVP (Friday - Sunday)**
    * [cite_start]**Focus:** Establish the project, database schema, and the core WebSocket connection[cite: 61].
    * [cite_start]**Goal:** An admin-triggered price change is reflected on the participant's screen in real-time[cite: 62].
* **Phase 2: Full Feature Development (Monday - Thursday)**
    * [cite_start]**Focus:** Build out the full trading logic and all participant/admin UI functionalities as defined in Section 3[cite: 64].
    * [cite_start]**Goal:** All functional requirements are implemented and ready for testing[cite: 65].
* **Phase 3: Testing & Deployment (Friday - Sunday)**
    * [cite_start]**Focus:** Rigorous end-to-end testing of a full competition simulation[cite: 67].
    * [cite_start]**Goal:** A bug-free, fully-functional application is deployed and handed over[cite: 68].

---
---

# The Apex Investors' Gauntlet: The Final Definitive Edition

## 1. The Philosophy: Beyond Trading

[cite_start]This competition is designed to be a comprehensive and strategically demanding mock trading challenge[cite: 75]. [cite_start]Success requires foresight, risk management, psychological discipline, and the ability to navigate a market filled with misinformation, not just reacting to news[cite: 76]. [cite_start]The goal is to prove the superiority of an investment strategy under pressure, not just to make a profit[cite: 77].

---

## 2. Market Instruments

* **Tier 1 Equities: NIFTY 50 Constituents**
    [cite_start]You can trade any of the stocks listed in the NIFTY 50[cite: 79, 80].
* **Tier 2 Instruments: Commodities & Volatility**
    * [cite_start]**Gold (XAU/INR) & Silver (XAG/INR):** Serve as safe-haven assets, industrial proxies, and speculative instruments[cite: 85].

---

## 3. General Rules & Constraints

* [cite_start]**Starting Capital:** Each team is allocated ₹5,00,000[cite: 86]. [cite_start]No leverage is permitted[cite: 86].
* [cite_start]**Order Types:** Market, Limit, and Stop-Loss (SL) orders are available[cite: 87].
* **Position & Sector Limits:**
    * [cite_start]**Single Stock Limit:** Maximum 20% of portfolio value in any one stock[cite: 90].
    * [cite_start]**Commodity Limit:** Maximum 25% of portfolio value in Gold and Silver combined[cite: 91].
    * [cite_start]**Sector Exposure Limit:** Maximum 40% of portfolio value in any single market sector[cite: 92].
* [cite_start]**Transaction Costs (Friction):** A 0.10% fee is applied to every trade (buy and sell)[cite: 93].
* [cite_start]**Circuit Limits:** Per-round limits are set at ±10% for Stocks and ±6% for Commodities[cite: 94].
* **Short Selling:**
    * [cite_start]**Round 1:** Prohibited[cite: 96].
    * [cite_start]**Rounds 2 & 3:** Permitted[cite: 97]. [cite_start]Requires 25% initial margin and 15% maintenance margin[cite: 97]. [cite_start]Positions breaching the maintenance margin will be auto-liquidated[cite: 97].

---

## 4. The Price Path Engine: How the Market Moves

[cite_start]All asset price movements are governed by a systematic engine[cite: 99]. For each news event, the price is calculated as follows:

1.  [cite_start]**Open Gap (Minute 0):** The specified "open gap" percentage is instantly applied to the asset's last traded price at the moment a news item is released, simulating an immediate market reaction[cite: 102, 103].
2.  [cite_start]**Drift (Minute 1-30):** Following the initial gap, a "drift" factor creates a steady trend[cite: 104]. [cite_start]It is calculated each minute as (Total Drift % / 30 Minutes)[cite: 105].
3.  [cite_start]**Noise (Each Minute):** A small, random "noise" value is added to the price each minute to simulate real-world market fluctuations and prevent perfectly predictable price movements[cite: 106, 107].
4.  [cite_start]**Timed Adjustments & Catalysts:** Mid-round events will trigger a one-time, immediate price adjustment at a specified minute, overriding the drift for that moment[cite: 108].

---

## 5. Advanced Mechanics: The Information & Deception Engine

* [cite_start]**Tiered Information Quality:** Insider information provided to teams can be either true or false[cite: 111]. [cite_start]Teams must decide how to use this information[cite: 112].
* [cite_start]**Strategic Insider Information Planting:** Some teams will be randomly selected to receive insider information[cite: 113]. [cite_start]Teams are allowed to trade information once, which requires transferring 2% of their portfolio to the other team[cite: 114, 115].
* [cite_start]**Mid-Round "Catalyst" Events:** Unpredictable news will be released mid-round to interact with existing news items and create complex chain reactions[cite: 116].

---

## 6. The Scoring Doctrine: Rewarding True Alpha

[cite_start]The winner is the team that demonstrates the most skill, not luck[cite: 118]. [cite_start]The final score is a weighted average[cite: 119]:
* [cite_start]**Portfolio Value (70%):** Your final P&L[cite: 120].
* [cite_start]**Risk-Adjusted Return (30%):** Calculated using the Sortino Ratio, which penalizes downside volatility[cite: 121].

---

## 7. The Gauntlet: Three Rounds of Escalating Intensity

[cite_start]The competition consists of a 20-minute first round and two 30-minute subsequent rounds[cite: 123].

### Round 1: The Fundamentals Floor

* [cite_start]**Theme:** Assessing company-specific value and clear sector-wide news[cite: 125]. [cite_start]Shorting is prohibited[cite: 125].
* [cite_start]**Goal:** Build a solid portfolio foundation based on clear, fundamental news[cite: 126].
* **Event 1: Telecom Sector Shake-up**
    * [cite_start]**Headline:** "Reliance Jio announces an aggressive 8% tariff hike; simultaneously, the government announces a relief package for the telecom sector, reducing spectrum dues." [cite: 129]
    * [cite_start]**Impact:** (Reliance: +4.5% open, +1.5% drift; Bharti Airtel: +3.0% open, +1.0% drift)[cite: 130].
* **Event 2: Banking Asset Quality Divergence**
    * [cite_start]**Headline:** "HDFC Bank reports higher-than-expected retail loan defaults. In contrast, ICICI Bank pre-releases stellar asset quality numbers, showing NPAs at a multi-year low." [cite: 132]
    * [cite_start]**Impact:** (HDFC Bank: -4.0% open, -1.5% drift; ICICI Bank: +3.0% open, +1.0% drift)[cite: 133].

### Round 2: The Fog of War

* [cite_start]**Theme:** Navigating sector rotations, conflicting information, and misinformation[cite: 135]. [cite_start]Shorting is enabled[cite: 135].
* [cite_start]**Goal:** Profit from uncertainty and use advanced deception mechanics[cite: 136].
* **Event 3: Global Cues & IT Whiplash**
    * [cite_start]**Headline:** "US Fed surprises with a rate cut, boosting global tech sentiment." [cite: 139]
    * [cite_start]**Impact:** All major IT (Infosys, TCS, HCL, Wipro): +3.0% open, +1.0% drift[cite: 140].
    * [cite_start]**Catalyst Event (Minute 12):** "Breaking: A major US client has unexpectedly cancelled a multi-billion dollar contract with TCS, citing recessionary fears." [cite: 141, 142]
    * **Updated Impact:** TCS plunges -6% from its current price. [cite_start]Other IT stocks fall -2%[cite: 143].
* **Event 4: Commodity Supercycle Rumor**
    * [cite_start]**Public Headline:** "Chatter intensifies about a new commodity supercycle. Chinese demand for steel and aluminum is rumored to be surging." [cite: 144]
    * [cite_start]**Public Market Impact:** Hindalco, JSW Steel, Tata Steel +3.5% open, +1.0% drift[cite: 146]. [cite_start]Silver +2.0% open[cite: 147].
    * [cite_start]**Actual Market Twist (Truth):** Steel/aluminium stocks stall by Minute 10[cite: 161]. [cite_start]By Minute 20, a data leak shows China's stimulus is delayed[cite: 162].
    * [cite_start]**Net effect:** Hindalco, JSW, Tata Steel fall back -2.0% from their highs[cite: 165]. [cite_start]Silver gives up gains and ends flat[cite: 167, 168].
* **Event 5: The "Red Herring" Corporate Action**
    * [cite_start]**Headline:** "ITC board announces a 5-for-1 stock split to improve liquidity." [cite: 170]
    * **True Impact:** None. [cite_start]A stock split has zero fundamental impact on value[cite: 171].

### Round 3: The Macro Meltdown

* [cite_start]**Theme:** A chaotic, top-down market driven by major macroeconomic shocks[cite: 173].
* [cite_start]**Goal:** Survive and capitalize on extreme volatility[cite: 174].
* **Event 6: RBI Policy Shock**
    * [cite_start]**Headline:** "In an emergency meeting, RBI hikes repo rate by an unexpected 50 basis points." [cite: 177]
    * **Impact:** All Banks: -4.0%. [cite_start]Autos: -3.0%[cite: 178].
* **Event 7: Geopolitical Flare-up**
    * [cite_start]**Headline:** "Tensions escalate in the Middle East, threatening crude oil supply lines." [cite: 180]
    * **Impact:** ONGC, Reliance: +5.0%. Gold: +3.0%. [cite_start]Silver: +1.5%[cite: 180].
* **Event 8: The Evolving Policy Rumor**
    * **Minute 5 Headline:** "Sources report the government is finalizing a massive expansion to the auto scrappage policy." (Autos: +4%) [cite_start][cite: 183].
    * **Minute 20 Update:** "Govt clarifies the scrappage policy expansion is only a proposal under early review." (Autos give back -3%) [cite_start][cite: 184].
* **Event 9: THE BLACK SWAN**
    * [cite_start]**Trigger:** Occurs randomly after the first 10 minutes[cite: 187].
    * [cite_start]**Headline:** "Breaking: A major Indian bank has defaulted on its international debt obligations. Global ratings agencies are putting India's sovereign rating on a negative watch." [cite: 188, 189]
    * **Impact:**
        * [cite_start]NIFTY 50 Index immediately halts trading for 2 minutes[cite: 191].
        * [cite_start]Upon re-opening, all stocks are down 8%[cite: 192].
        * Gold spikes +5%. [cite_start]Silver spikes +3%[cite: 193].
        * [cite_start]After 10 minutes, a "flight to quality" begins, with blue-chip stocks (Reliance, HUL, Infosys) regaining 2% while others remain deeply negative[cite: 194].