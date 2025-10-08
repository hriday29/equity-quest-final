# 🎯 Equity Quest Trading Competition - Testing Guide

## 📋 **Testing Checklist**

### ✅ **Phase 1: Authentication & User Management**
- [ ] User registration with email/password
- [ ] User login/logout functionality
- [ ] Profile creation and team code assignment
- [ ] Admin role assignment and access control
- [ ] Password reset functionality

### ✅ **Phase 2: Core Trading Functionality**
- [ ] Asset listing and price display
- [ ] Buy orders (market and limit)
- [ ] Sell orders (market and limit)
- [ ] Position tracking and P&L calculation
- [ ] Portfolio value updates in real-time
- [ ] Transaction history recording

### ✅ **Phase 3: Advanced Trading Features**
- [ ] Short selling functionality
- [ ] Margin requirements and calculations
- [ ] Stop-loss orders
- [ ] Order execution and cancellation
- [ ] Margin warnings and liquidations

### ✅ **Phase 4: Competition Management**
- [ ] Round progression (1 → 2 → 3)
- [ ] Competition start/pause/end controls
- [ ] Round-specific features (short selling in Rounds 2-3)
- [ ] Leaderboard updates
- [ ] Portfolio history tracking

### ✅ **Phase 5: Market Events & Admin Controls**
- [ ] Price manipulation (absolute and percentage)
- [ ] Market event triggers (9 different events)
- [ ] News publishing system
- [ ] Private messaging between users
- [ ] Black Swan event mechanics
- [ ] Trading halt functionality

### ✅ **Phase 6: Data Management & Reset**
- [ ] Competition reset (all users)
- [ ] Simple reset (user data only)
- [ ] Comprehensive reset with verification
- [ ] NIFTY 50 asset initialization
- [ ] Real-time price fetching from yFinance

### ✅ **Phase 7: Edge Cases & Error Handling**
- [ ] Insufficient funds scenarios
- [ ] Invalid order quantities
- [ ] Network connectivity issues
- [ ] Concurrent order execution
- [ ] Database constraint violations

## 🚀 **Quick Start Testing Commands**

### 1. **Start the Application**
```bash
npm run dev
```

### 2. **Initialize Test Data**
- Go to `/admin` → Activity tab → "Initialize NIFTY 50"
- Click "Fetch Live Prices" to get real market data

### 3. **Create Test Users**
- Register multiple test accounts
- Assign different team codes
- Create at least one admin user

### 4. **Test Trading Flow**
- Start competition from admin panel
- Place buy/sell orders
- Monitor portfolio changes
- Test short selling in Round 2+

## 🎮 **Testing Scenarios**

### **Scenario 1: Basic Trading Flow**
1. Register 3 test users
2. Start Round 1
3. Each user buys different stocks
4. Verify portfolio updates
5. Check leaderboard ranking

### **Scenario 2: Market Events**
1. Trigger "Telecom Shake-up" event
2. Verify BHARTI stock price drops 15%
3. Check user portfolio impacts
4. Verify news is published

### **Scenario 3: Short Selling**
1. Advance to Round 2
2. User shorts a stock
3. Trigger negative event for that stock
4. Verify short position profits
5. Test margin requirements

### **Scenario 4: Black Swan Event**
1. Trigger Black Swan event
2. Verify 8% market crash
3. Check trading halt (90 seconds)
4. Verify blue-chip recovery (+2%)
5. Test trading resumption

### **Scenario 5: Competition Reset**
1. Run comprehensive reset
2. Verify all user data cleared
3. Check portfolios reset to ₹5,00,000
4. Verify competition rounds reset

## 🔧 **Admin Testing Tools**

### **Price Management**
- Set absolute prices for any asset
- Apply percentage changes
- Monitor price fluctuation logs

### **Event Triggers**
- 9 different market events
- Round-specific event mechanics
- Real-time price impact verification

### **User Monitoring**
- Real-time portfolio tracking
- Team performance monitoring
- Margin warning system

### **Competition Control**
- Start/pause/end rounds
- Advance between rounds
- Reset entire competition

## 📊 **Key Metrics to Monitor**

### **Performance Metrics**
- Order execution speed
- Real-time updates latency
- Database query performance
- Memory usage during events

### **Business Logic**
- Portfolio value calculations
- P&L accuracy
- Margin requirement compliance
- Competition round transitions

### **User Experience**
- UI responsiveness
- Error message clarity
- Navigation flow
- Mobile compatibility

## 🐛 **Common Issues to Test**

### **Data Consistency**
- Portfolio values match sum of positions + cash
- Transaction history accuracy
- Order status synchronization

### **Concurrency**
- Multiple users trading same stock
- Simultaneous order placement
- Real-time price updates

### **Error Recovery**
- Network disconnection handling
- Invalid input validation
- Database constraint violations

## 📝 **Test Data Requirements**

### **Users**
- 5+ regular users with different team codes
- 1 admin user
- Mix of trading strategies

### **Assets**
- All NIFTY 50 stocks initialized
- Real-time prices from yFinance
- Different sectors represented

### **Orders**
- Various order types (market, limit, stop-loss)
- Different quantities and prices
- Both buy and sell orders

## 🎯 **Success Criteria**

### **Functional Requirements**
- ✅ All trading operations work correctly
- ✅ Real-time updates function properly
- ✅ Admin controls operate as expected
- ✅ Competition flow is smooth
- ✅ Data integrity maintained

### **Performance Requirements**
- ✅ Page load times < 2 seconds
- ✅ Real-time updates < 1 second delay
- ✅ Order execution < 500ms
- ✅ No memory leaks during extended use

### **User Experience**
- ✅ Intuitive navigation
- ✅ Clear error messages
- ✅ Responsive design
- ✅ Consistent UI behavior

---

## 🚨 **Critical Testing Points**

1. **Portfolio Calculations** - Ensure P&L is accurate
2. **Margin Management** - Test short selling limits
3. **Event Impact** - Verify price changes match event mechanics
4. **Competition Flow** - Test round transitions
5. **Data Reset** - Ensure complete data clearing
6. **Real-time Updates** - Test live price feeds
7. **Admin Controls** - Verify all admin functions work
8. **Error Handling** - Test edge cases and failures

---

*Happy Testing! 🎉*
