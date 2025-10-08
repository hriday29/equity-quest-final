# Equity Quest: The Apex Investors' Gauntlet
## Comprehensive Website Overview & Technical Documentation

---

## 📋 **Table of Contents**

1. [Project Overview](#project-overview)
2. [Technical Architecture](#technical-architecture)
3. [Page-by-Page Documentation](#page-by-page-documentation)
4. [Component Inventory](#component-inventory)
5. [User Flows & Navigation](#user-flows--navigation)
6. [Database Schema](#database-schema)
7. [API Endpoints & Services](#api-endpoints--services)
8. [Authentication & Authorization](#authentication--authorization)
9. [Real-time Features](#real-time-features)
10. [Admin Functionality](#admin-functionality)
11. [Trading System](#trading-system)
12. [Competition Mechanics](#competition-mechanics)
13. [UI/UX Components](#uiux-components)
14. [Performance & Security](#performance--security)

---

## 🎯 **Project Overview**

**Equity Quest: The Apex Investors' Gauntlet** is a comprehensive mock stock trading competition platform built with modern web technologies. It simulates real-world trading conditions with institutional-grade features, real-time market data, and sophisticated competition mechanics.

### **Key Features:**
- **Real-time Trading**: Live price feeds, instant order execution
- **Competition Rounds**: 3 escalating rounds with different market conditions
- **Advanced Order Types**: Market, Limit, Stop-Loss orders
- **Short Selling**: With margin requirements and risk management
- **Live Leaderboard**: Real-time rankings with sophisticated scoring
- **Admin Controls**: Comprehensive competition management
- **Risk Management**: Margin calls, position limits, sector exposure controls

---

## 🏗️ **Technical Architecture**

### **Frontend Stack:**
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 7.1.9
- **UI Library**: Shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS 3.4.17
- **State Management**: React Context + React Query
- **Routing**: React Router DOM 6.30.1
- **Charts**: Recharts 2.15.4
- **Icons**: Lucide React 0.462.0

### **Backend Stack:**
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Edge Functions**: Supabase Edge Functions
- **API**: RESTful with RPC functions

### **Key Dependencies:**
- **@supabase/supabase-js**: 2.58.0
- **@tanstack/react-query**: 5.83.0
- **date-fns**: 3.6.0
- **sonner**: 1.7.4 (Toast notifications)
- **zod**: 3.25.76 (Validation)

---

## 📄 **Page-by-Page Documentation**

### **1. Landing Page (`/`) - Index.tsx**

#### **Navigation Bar:**
- **Logo**: Equity Quest with TrendingUp icon
- **Sign In Button**: Ghost variant, navigates to `/auth`
- **Enter Competition Button**: Primary gradient, navigates to `/auth`

#### **Hero Section:**
- **Main Title**: "Equity Quest" (7xl/8xl font, gradient text)
- **Subtitle**: "The Apex Investors' Gauntlet"
- **Description**: "India's Most Comprehensive Mock Stock Trading Competition"
- **CTA Buttons**:
  - **"Enter Competition"**: Primary gradient, size lg, navigates to `/auth`
  - **"Sign In"**: Outline variant, size lg, navigates to `/auth`

#### **Feature Cards (4 columns):**
1. **Starting Capital**: ₹5,00,000
2. **NIFTY 50 Stocks**: 50+ stocks plus commodities
3. **Real-Time Updates**: Live price feeds
4. **3 Rounds**: 20-30 min each, escalating intensity

#### **Institutional Features (4 columns):**
1. **Advanced Trading**: Market, Limit, Stop-Loss orders
2. **Risk Management**: Position limits, margin calls
3. **Live Leaderboard**: Real-time rankings
4. **Market Intelligence**: News feed, market events

#### **Competition Structure (3 columns):**
1. **Round 1 - The Fundamentals Floor**: 20 min, no shorting
2. **Round 2 - The Fog of War**: 30 min, shorting enabled
3. **Round 3 - The Macro Meltdown**: 30 min, extreme volatility

#### **Footer:**
- **Copyright**: "© 2025 Equity Quest. All rights reserved."

---

### **2. Authentication Page (`/auth`) - Auth.tsx**

#### **Tab System:**
- **Login Tab**: Email/password authentication
- **Sign Up Tab**: Registration with validation

#### **Login Form:**
- **Email Input**: Required field
- **Password Input**: Required field
- **Sign In Button**: Primary variant, handles login
- **Loading State**: Disabled during authentication

#### **Sign Up Form:**
- **Full Name Input**: Required, client-side validation
- **Email Input**: Required, email format validation
- **Password Input**: Required, strength validation (6+ chars, uppercase, lowercase, number)
- **Team Code Input**: Optional
- **Sign Up Button**: Primary variant, handles registration
- **Loading State**: Disabled during registration

#### **Validation Features:**
- **Password Strength**: Real-time validation
- **Email Format**: Client-side validation
- **Required Fields**: Form validation
- **Error Handling**: Toast notifications

---

### **3. Dashboard (`/dashboard`) - Dashboard.tsx**

#### **Header Section:**
- **Trading Halt Banner**: Shows when trading is halted
- **Competition Status**: Current round information

#### **Portfolio Overview Card:**
- **Cash Balance**: Current available cash
- **Total Value**: Portfolio + cash value
- **P&L**: Profit/Loss with percentage
- **P&L Trend**: Up/down arrows with colors

#### **Trading Panel:**
- **Asset Selector**: Dropdown with all available assets
- **Order Type Selector**: Market, Limit, Stop-Loss
- **Quantity Input**: Number input for shares
- **Limit Price Input**: Conditional on order type
- **Buy/Sell Toggle**: Toggle buttons
- **Place Order Button**: Primary variant, executes orders
- **Loading State**: Disabled during order execution

#### **Positions Table:**
- **Symbol Column**: Asset symbol and name
- **Quantity Column**: Number of shares
- **Average Price**: Entry price
- **Current Value**: Current position value
- **P&L Column**: Profit/Loss with colors
- **Actions**: Close position buttons

#### **Market Overview:**
- **Top Gainers**: 5 best performing stocks
- **Top Losers**: 5 worst performing stocks
- **Market Stats**: Total volume, active stocks

#### **News Feed:**
- **News Items**: Latest market news
- **Categories**: Market Alert, Sector News, etc.
- **Timestamps**: Relative time display

#### **Margin Warning System:**
- **Active Warnings**: Unread margin warnings
- **Short Positions**: List of short positions
- **Margin Levels**: Current margin percentages
- **Close Position Buttons**: Emergency position closure

---

### **4. Market Analysis (`/market`) - MarketAnalysis.tsx**

#### **Header:**
- **Page Title**: "Market Analysis" with BarChart3 icon
- **Back Button**: Returns to sector view (conditional)

#### **Sector Navigation (Left Panel):**
- **Sector List**: All available sectors
- **Sector Stats**: Asset count, average change
- **Expandable Assets**: Click to show sector stocks
- **Asset Selection**: Click to view detailed analysis

#### **Market Overview (Right Panel):**
- **Market Stats**: Gain, volume, active stocks
- **Top Gainers**: 5 best performers with badges
- **Top Losers**: 5 worst performers with badges

#### **Stock Detail View (Full Width):**
- **Asset Header**: Symbol, name, sector badges
- **Price Display**: Current price with change indicators
- **Key Metrics**: Previous close, 52W high/low, market cap
- **Price Chart**: Interactive line chart with time ranges (1D, 1W, 1M)
- **Volume Chart**: Bar chart showing trading volume
- **Additional Info**: Trading information, valuation metrics

---

### **5. Leaderboard (`/leaderboard`) - Leaderboard.tsx**

#### **Header:**
- **Page Title**: "Competition Leaderboard" with Trophy icon
- **Scoring Info**: "70% Portfolio P&L + 30% Sortino Ratio"
- **Refresh Button**: Updates leaderboard data

#### **Winner Announcement Card:**
- **Winner Display**: Team code and final score
- **Portfolio Value**: Total value with P&L percentage
- **Sortino Ratio**: Risk-adjusted return metric

#### **Competition Stats (3 columns):**
- **Total Participants**: Number of competitors
- **Average Return**: Market average performance
- **Competition Status**: Current status

#### **Tab System:**
1. **Final Scores**: Combined P&L + Sortino scoring
2. **Sortino Ratios**: Risk-adjusted rankings
3. **Portfolio Values**: Total value rankings

#### **Leaderboard Entries:**
- **Rank Icons**: Crown (1st), Trophy (2nd), Medal (3rd)
- **Team/Individual**: Team code or "Individual Participant"
- **Score Breakdown**: P&L component, Sortino component
- **Portfolio Value**: Total value with P&L percentage
- **Current User Highlight**: Special styling for user's entry

---

### **6. Messages (`/messages`) - Messages.tsx**

#### **Header:**
- **Page Title**: "Messages" with MessageSquare icon
- **Unread Badge**: Count of unread messages
- **New Message Button**: Opens message composition dialog

#### **Message Composition Dialog:**
- **Subject Input**: Message title
- **Recipient Selector**: User dropdown (admin only)
- **Message Type**: Support, General, Urgent, Admin Broadcast
- **Content Textarea**: Message body
- **Send Button**: Submits message

#### **Tab System:**
1. **Inbox**: Received messages
2. **Sent**: Sent messages
3. **All Messages**: All messages (admin only)

#### **Message List:**
- **Message Cards**: Title, content preview, sender/recipient
- **Status Badges**: Pending, In Progress, Resolved, Closed
- **Type Icons**: Different icons for message types
- **Timestamps**: Relative time display
- **Read/Unread States**: Visual indicators

#### **Message Details:**
- **Full Message**: Complete message content
- **Reply Section**: Textarea for responses (admin)
- **Status Actions**: Mark as in progress, resolved (admin)
- **Reply Button**: Send response

---

### **7. Transaction History (`/transactions`) - TransactionHistory.tsx**

#### **Header:**
- **Page Title**: "Transaction History" with History icon
- **Export CSV Button**: Downloads transaction data

#### **Filter Panel:**
- **Search Input**: Filter by symbol or name
- **Status Filter**: All, Executed, Pending, Cancelled, Rejected
- **Type Filter**: All, Market, Limit, Stop Loss

#### **Orders Table:**
- **Date Column**: Order timestamp
- **Symbol Column**: Asset symbol and name
- **Type Column**: Order type badges
- **Side Column**: Buy/Sell badges
- **Quantity Column**: Number of shares
- **Price Column**: Order price or "Market"
- **Executed Column**: Execution price
- **Status Column**: Order status badges
- **P&L Column**: Current profit/loss

---

### **8. Admin Panel (`/admin`) - Admin.tsx**

#### **Header:**
- **Page Title**: "Admin Control Panel" with Settings icon
- **Competition Status**: Current round and status

#### **Competition Management:**
- **Start Round Button**: Begins competition round
- **Pause Round Button**: Pauses current round
- **End Round Button**: Ends current round
- **Advance Round Button**: Moves to next round

#### **Reset Options Panel:**
- **Reset Portfolios**: Toggle for portfolio reset
- **Reset Positions**: Toggle for position reset
- **Reset Orders**: Toggle for order reset
- **Reset Transactions**: Toggle for transaction reset
- **Reset Messages**: Toggle for message reset
- **Reset Margin Warnings**: Toggle for margin warning reset
- **Reset Portfolio History**: Toggle for history reset
- **Reset Competition Events**: Toggle for event reset
- **Reset News**: Toggle for news reset
- **Reset Price History**: Toggle for price history reset
- **Reset Price Fluctuations**: Toggle for fluctuation reset
- **Starting Cash Input**: Amount for portfolio reset
- **Reset Rounds**: Toggle for round reset
- **Reset Competition Button**: Executes comprehensive reset

#### **Market Events Panel:**
- **Event Type Selector**: Sector Impact, Global Impact, etc.
- **Event Description**: Textarea for event details
- **Impact Percentage**: Number input for price impact
- **Affected Assets**: Multi-select for target assets
- **Trigger Event Button**: Executes market event

#### **Black Swan Event Panel:**
- **Event Description**: Textarea for event details
- **Trigger Black Swan Button**: Executes market crash

#### **Competition Statistics:**
- **Total Participants**: Number of users
- **Active Positions**: Current positions count
- **Total Volume**: Trading volume
- **Market Status**: Current market state

#### **User Management:**
- **User List**: All registered users
- **Role Management**: Admin role assignment
- **User Actions**: View, edit, delete options

---

### **9. 404 Page (`/*`) - NotFound.tsx**

#### **Error Display:**
- **404 Number**: Large display with primary color
- **Error Message**: "Page Not Found"
- **Description**: Helpful error message
- **Return Home Button**: Navigates to landing page

---

## 🧩 **Component Inventory**

### **Layout Components:**
- **DashboardLayout**: Main layout wrapper with navigation
- **ProtectedRoute**: Route protection with role checking

### **Trading Components:**
- **MarketOverview**: Market statistics and top performers
- **SectorNavigation**: Sector-based asset navigation
- **StockDetailView**: Detailed stock analysis with charts
- **MarginWarningSystem**: Margin management and warnings
- **TradingHaltBanner**: Trading halt notifications

### **UI Components (Shadcn/ui):**
- **Button**: Primary, secondary, outline, ghost variants
- **Card**: Enhanced cards with borders and shadows
- **Input**: Form inputs with validation
- **Select**: Dropdown selectors
- **Tabs**: Tab navigation system
- **Badge**: Status and type indicators
- **Dialog**: Modal dialogs
- **Alert**: Warning and info alerts
- **Toast**: Notification system
- **Table**: Data tables
- **Chart**: Recharts integration

### **Form Components:**
- **Label**: Form labels
- **Textarea**: Multi-line text input
- **Checkbox**: Boolean inputs
- **Radio Group**: Single selection
- **Switch**: Toggle switches

---

## 🗺️ **User Flows & Navigation**

### **Authentication Flow:**
1. **Landing Page** → **Sign In/Enter Competition** → **Auth Page**
2. **Login/Signup** → **Dashboard** (if successful)
3. **Auto-redirect**: Authenticated users skip landing page

### **Trading Flow:**
1. **Dashboard** → **Select Asset** → **Choose Order Type** → **Enter Quantity** → **Place Order**
2. **Market Analysis** → **Select Stock** → **View Details** → **Return to Trading**
3. **Transaction History** → **View Past Orders** → **Export Data**

### **Competition Flow:**
1. **Admin Panel** → **Start Round** → **Monitor Progress** → **End Round**
2. **Leaderboard** → **View Rankings** → **Check Scores**
3. **Messages** → **Contact Support** → **Receive Responses**

### **Navigation Structure:**
- **Main Navigation**: Dashboard, Market, Leaderboard, Messages, Transactions
- **Admin Navigation**: Admin Panel (admin only)
- **User Menu**: Profile, Settings, Logout
- **Breadcrumbs**: Contextual navigation

---

## 🗄️ **Database Schema**

### **Core Tables:**
- **users**: Supabase auth users
- **profiles**: User profile information
- **user_roles**: Role-based access control
- **assets**: NIFTY 50 stocks and commodities
- **portfolios**: User portfolio data
- **positions**: User stock positions
- **orders**: Trading orders
- **transactions**: Order executions
- **competition_rounds**: Competition structure
- **competition_events**: Market events
- **news**: Market news feed
- **messages**: User communications
- **margin_warnings**: Risk management
- **portfolio_history**: Historical data
- **price_fluctuation_log**: Price changes
- **financial_metrics**: Asset metrics

### **Key Relationships:**
- **users** → **profiles** (1:1)
- **users** → **portfolios** (1:1)
- **users** → **positions** (1:many)
- **users** → **orders** (1:many)
- **assets** → **positions** (1:many)
- **assets** → **orders** (1:many)

---

## 🔌 **API Endpoints & Services**

### **Supabase RPC Functions:**
- **reset_competition()**: Comprehensive competition reset
- **is_admin_or_owner()**: Role checking
- **has_role()**: Permission validation
- **handle_new_user()**: User creation trigger

### **Edge Functions:**
- **fetch-yfinance-data**: Real-time price fetching
- **background-price-noise**: Price fluctuation simulation
- **black-swan-event**: Market crash simulation
- **check-margins**: Margin requirement checking
- **execute-event**: Market event execution

### **Real-time Subscriptions:**
- **assets**: Price updates
- **portfolios**: Portfolio changes
- **orders**: Order status updates
- **news**: New news items
- **competition_rounds**: Round status changes
- **margin_warnings**: Risk alerts

---

## 🔐 **Authentication & Authorization**

### **Authentication:**
- **Provider**: Supabase Auth
- **Methods**: Email/password
- **Session Management**: Automatic token refresh
- **Password Requirements**: 6+ chars, uppercase, lowercase, number

### **Authorization:**
- **Roles**: owner, admin, user
- **RLS Policies**: Row-level security
- **Route Protection**: ProtectedRoute component
- **Admin Access**: Admin-only features

### **Security Features:**
- **Input Validation**: Client and server-side
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Same-origin policy

---

## ⚡ **Real-time Features**

### **Live Data Updates:**
- **Asset Prices**: Real-time price feeds
- **Portfolio Values**: Live P&L calculations
- **Order Status**: Instant execution updates
- **Leaderboard**: Real-time rankings
- **News Feed**: Live news updates
- **Margin Warnings**: Instant risk alerts

### **WebSocket Connections:**
- **Consolidated Channels**: Single connection per page
- **Event Filtering**: User-specific updates
- **Reconnection Logic**: Automatic reconnection
- **Performance Optimization**: Reduced polling

---

## 👑 **Admin Functionality**

### **Competition Management:**
- **Round Control**: Start, pause, end, advance rounds
- **Reset Options**: Comprehensive data reset
- **Event Triggers**: Market events and Black Swan
- **User Management**: Role assignment and monitoring

### **Market Control:**
- **Price Manipulation**: Event-driven price changes
- **Trading Halts**: Market suspension
- **News Management**: Market news control
- **Event Scheduling**: Timed market events

### **Analytics:**
- **Participation Stats**: User engagement metrics
- **Trading Volume**: Market activity
- **Performance Tracking**: Competition analytics
- **Risk Monitoring**: Margin call tracking

---

## 📈 **Trading System**

### **Order Types:**
- **Market Orders**: Immediate execution at current price
- **Limit Orders**: Execution at specified price
- **Stop-Loss Orders**: Risk management orders

### **Order Execution:**
- **Real-time Processing**: Instant order handling
- **Price Validation**: Market price verification
- **Quantity Validation**: Available shares checking
- **Balance Validation**: Sufficient funds checking

### **Position Management:**
- **Long Positions**: Standard stock purchases
- **Short Positions**: Borrowed stock sales
- **Margin Requirements**: 25% initial, 15% maintenance
- **Position Limits**: Sector exposure controls

### **Risk Management:**
- **Margin Calls**: Automatic warnings
- **Liquidation**: Automatic position closure
- **Position Limits**: Maximum exposure controls
- **Sector Limits**: Diversification requirements

---

## 🏆 **Competition Mechanics**

### **Scoring System:**
- **Final Score**: 70% Portfolio P&L + 30% Sortino Ratio
- **P&L Component**: Profit/loss percentage
- **Sortino Ratio**: Risk-adjusted return
- **Real-time Updates**: Live score calculations

### **Round Structure:**
1. **Round 1**: Fundamentals, no shorting, 20 min
2. **Round 2**: Advanced trading, shorting enabled, 30 min
3. **Round 3**: Extreme volatility, Black Swan events, 30 min

### **Market Events:**
- **Sector Impact**: Industry-specific events
- **Global Impact**: Market-wide events
- **Commodity Impact**: Resource price changes
- **Corporate Actions**: Company-specific events
- **Policy Impact**: Regulatory changes
- **Geopolitical**: International events
- **Black Swan**: Extreme market crashes

---

## 🎨 **UI/UX Components**

### **Design System:**
- **Color Palette**: Primary, secondary, success, warning, error
- **Typography**: Inter font family
- **Spacing**: Consistent margin/padding system
- **Shadows**: Layered shadow system
- **Borders**: Rounded corners and borders

### **Interactive Elements:**
- **Hover Effects**: Smooth transitions
- **Loading States**: Skeleton loaders
- **Error States**: Clear error messages
- **Success States**: Confirmation feedback
- **Disabled States**: Visual feedback

### **Responsive Design:**
- **Mobile First**: Mobile-optimized layouts
- **Breakpoints**: sm, md, lg, xl
- **Grid System**: CSS Grid and Flexbox
- **Adaptive Components**: Responsive tables and cards

---

## 🚀 **Performance & Security**

### **Performance Optimizations:**
- **Code Splitting**: Route-based splitting
- **Lazy Loading**: Component lazy loading
- **Memoization**: React.memo and useMemo
- **Bundle Optimization**: Tree shaking
- **Image Optimization**: WebP format support

### **Security Measures:**
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Prevention**: Input sanitization
- **CSRF Protection**: Same-origin policy
- **Rate Limiting**: API rate limiting
- **Authentication**: JWT token validation

### **Monitoring:**
- **Error Tracking**: Console error logging
- **Performance Monitoring**: Core Web Vitals
- **User Analytics**: Usage tracking
- **Security Monitoring**: Suspicious activity detection

---

## 📊 **Data Flow Architecture**

### **State Management:**
- **User Context**: Authentication and profile data
- **React Query**: Server state management
- **Local State**: Component-level state
- **Real-time State**: WebSocket updates

### **Data Flow:**
1. **User Action** → **Component State** → **API Call** → **Database**
2. **Database Change** → **Real-time Update** → **Component Re-render**
3. **Error Handling** → **Toast Notification** → **User Feedback**

---

## 🔧 **Development & Deployment**

### **Development Tools:**
- **Vite**: Fast development server
- **ESLint**: Code linting
- **TypeScript**: Type checking
- **Hot Reload**: Instant updates

### **Build Process:**
- **Production Build**: Optimized bundle
- **Asset Optimization**: Minification and compression
- **Environment Variables**: Configuration management
- **Deployment**: Static hosting ready

---

## 📝 **Conclusion**

Equity Quest represents a comprehensive, institutional-grade mock trading platform with sophisticated features including real-time trading, advanced order types, risk management, competition mechanics, and admin controls. The platform is built with modern web technologies and follows best practices for performance, security, and user experience.

The system supports complex trading scenarios, real-time market simulation, and comprehensive competition management, making it suitable for educational institutions, financial training programs, and competitive trading events.

---

*This document provides a complete technical overview of every component, feature, and functionality within the Equity Quest platform. Every button, form, navigation element, and user interaction has been documented to ensure comprehensive understanding of the system.*
