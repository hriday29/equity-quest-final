# 🎯 Equity Quest Testing Workflow

## 🚀 **Phase 1: Environment Setup & Initialization**

### Step 1: Start the Application
```bash
# Terminal 1: Start the dev server
npm run dev

# Terminal 2: Start Supabase (if running locally)
supabase start
```

### Step 2: Initialize Test Data
1. **Open Admin Panel**: Navigate to `http://localhost:5173/admin`
2. **Initialize Assets**: 
   - Go to "Activity" tab
   - Click "Initialize NIFTY 50" button
   - Wait for success message
3. **Fetch Live Prices**:
   - Click "Fetch Live Prices" button
   - Verify real-time prices are loaded
4. **Verify Assets**: Check that 50+ assets are loaded with current prices

### Step 3: Create Test Users
1. **Register Admin User**:
   - Go to `/auth`
   - Register with email: `admin@test.com`
   - Password: `AdminTest123!`
   - Assign admin role in database
2. **Register Regular Users**:
   - Register 3-5 test users with different emails
   - Use team codes: `TEAM1`, `TEAM2`, `TEAM3`
   - Note down all user credentials

---

## 🧪 **Phase 2: Core Functionality Testing**

### Test 1: Authentication & User Management
- [ ] **Login/Logout**: Test all user accounts
- [ ] **Profile Creation**: Verify user profiles are created
- [ ] **Team Assignment**: Check team codes are assigned
- [ ] **Admin Access**: Verify admin can access admin panel
- [ ] **Role-based Access**: Test that regular users cannot access admin

### Test 2: Asset Management
- [ ] **Asset Display**: Verify all NIFTY 50 stocks are shown
- [ ] **Price Updates**: Check real-time price updates
- [ ] **Asset Details**: Verify asset information (sector, type, etc.)
- [ ] **Search/Filter**: Test asset search functionality

### Test 3: Portfolio Operations
- [ ] **Initial Portfolio**: Verify starting cash is ₹5,00,000
- [ ] **Portfolio Display**: Check portfolio value calculation
- [ ] **Real-time Updates**: Monitor portfolio value changes
- [ ] **P&L Calculation**: Verify profit/loss calculations

---

## 💰 **Phase 3: Trading Functionality Testing**

### Test 4: Order Placement
1. **Market Buy Orders**:
   - Place buy order for 10 shares of RELIANCE
   - Verify order appears in pending orders
   - Check portfolio cash balance decreases
   - Verify position is created after execution

2. **Limit Buy Orders**:
   - Place limit buy order below current price
   - Verify order stays pending
   - Manually adjust price to trigger execution
   - Check order executes correctly

3. **Sell Orders**:
   - Sell 5 shares of existing position
   - Verify cash balance increases
   - Check position quantity decreases
   - Verify transaction is recorded

### Test 5: Position Management
- [ ] **Position Tracking**: Verify positions are displayed correctly
- [ ] **P&L Updates**: Check position P&L updates with price changes
- [ ] **Average Price**: Verify average price calculations
- [ ] **Position Value**: Check current value calculations

### Test 6: Transaction History
- [ ] **Transaction Recording**: Verify all trades are recorded
- [ ] **Transaction Details**: Check transaction information accuracy
- [ ] **Transaction History**: Test transaction history display
- [ ] **Transaction Filtering**: Test date/asset filters

---

## 🎮 **Phase 4: Competition Management Testing**

### Test 7: Competition Rounds
1. **Start Competition**:
   - Go to admin panel → Competition tab
   - Click "Start Competition"
   - Verify Round 1 becomes active
   - Check all users can see active competition

2. **Round Progression**:
   - Let Round 1 run for a few minutes
   - Click "Advance Round" to move to Round 2
   - Verify Round 2 is active
   - Check short selling is enabled

3. **Round Completion**:
   - Advance to Round 3
   - Complete the competition
   - Verify final rankings

### Test 8: Leaderboard
- [ ] **Real-time Updates**: Check leaderboard updates with trades
- [ ] **Ranking Accuracy**: Verify rankings are correct
- [ ] **Team Display**: Check team information is shown
- [ ] **Performance Metrics**: Verify P&L percentages

---

## ⚡ **Phase 5: Advanced Features Testing**

### Test 9: Short Selling (Round 2+)
1. **Short Position Creation**:
   - Advance to Round 2
   - Place short sell order for 10 shares
   - Verify short position is created
   - Check margin requirements

2. **Short Position Management**:
   - Monitor short position P&L
   - Place cover order to close position
   - Verify position is closed correctly
   - Check margin calculations

### Test 10: Margin Management
- [ ] **Margin Requirements**: Verify initial margin requirements
- [ ] **Maintenance Margin**: Check maintenance margin calculations
- [ ] **Margin Warnings**: Test margin warning system
- [ ] **Liquidation**: Test automatic liquidation (if applicable)

### Test 11: Stop-Loss Orders
- [ ] **Stop-Loss Creation**: Place stop-loss orders
- [ ] **Stop-Loss Execution**: Trigger stop-loss with price movement
- [ ] **Stop-Loss Cancellation**: Cancel pending stop-loss orders
- [ ] **Stop-Loss Updates**: Modify existing stop-loss orders

---

## 🎯 **Phase 6: Market Events & Admin Controls**

### Test 12: Price Manipulation
1. **Absolute Price Changes**:
   - Go to admin → Prices tab
   - Select an asset and set new price
   - Verify price changes across all users
   - Check price history is recorded

2. **Percentage Price Changes**:
   - Apply 10% increase to an asset
   - Verify percentage calculation is correct
   - Check all positions update accordingly
   - Verify price fluctuation log

### Test 13: Market Events
1. **Event 1 - Telecom Shake-up**:
   - Trigger "Telecom Shake-up" event
   - Verify BHARTI stock drops 15%
   - Check news is published
   - Verify user portfolios are affected

2. **Event 3 - IT Whiplash**:
   - Trigger "IT Whiplash" event
   - Verify IT stocks increase 12%
   - Check catalyst effect at 15 minutes
   - Verify portfolio impacts

3. **Event 9 - Black Swan**:
   - Trigger Black Swan event
   - Verify 8% market crash
   - Check trading halt (90 seconds)
   - Verify blue-chip recovery (+2%)

### Test 14: News & Messaging
- [ ] **News Publishing**: Publish market news
- [ ] **News Display**: Verify news appears to users
- [ ] **Private Messages**: Send messages between users
- [ ] **Message Delivery**: Check message delivery system

---

## 🔄 **Phase 7: Data Management & Reset Testing**

### Test 15: Competition Reset
1. **Simple Reset**:
   - Go to admin → Competition tab
   - Click "Reset Competition"
   - Verify all user data is cleared
   - Check portfolios reset to ₹5,00,000

2. **Comprehensive Reset**:
   - Test comprehensive reset options
   - Verify all selected data is cleared
   - Check reset verification system
   - Confirm competition rounds reset

### Test 16: Data Integrity
- [ ] **Portfolio Consistency**: Verify portfolio values match positions + cash
- [ ] **Transaction Accuracy**: Check transaction records are correct
- [ ] **Order Status**: Verify order statuses are accurate
- [ ] **Real-time Sync**: Test real-time data synchronization

---

## 🐛 **Phase 8: Edge Cases & Error Handling**

### Test 17: Error Scenarios
1. **Insufficient Funds**:
   - Try to buy more shares than cash allows
   - Verify proper error message
   - Check order is rejected

2. **Invalid Orders**:
   - Place order with 0 quantity
   - Place order with negative price
   - Verify validation errors

3. **Network Issues**:
   - Disconnect internet during trading
   - Reconnect and verify data consistency
   - Test offline/online transitions

### Test 18: Concurrent Operations
- [ ] **Multiple Users**: Test multiple users trading simultaneously
- [ ] **Same Asset**: Multiple users trading same stock
- [ ] **Order Conflicts**: Test order execution conflicts
- [ ] **Data Consistency**: Verify data remains consistent

---

## 📊 **Phase 9: Performance & Load Testing**

### Test 19: Performance Metrics
- [ ] **Page Load Times**: Measure initial page load
- [ ] **Real-time Latency**: Test update delays
- [ ] **Order Execution Speed**: Measure order processing time
- [ ] **Database Performance**: Monitor query performance

### Test 20: Load Testing
- [ ] **Multiple Users**: Test with 10+ concurrent users
- [ ] **High Frequency Trading**: Rapid order placement
- [ ] **Large Orders**: Test with large quantities
- [ ] **System Stability**: Monitor for crashes/errors

---

## ✅ **Phase 10: Final Verification**

### Test 21: End-to-End Scenarios
1. **Complete Trading Session**:
   - Start competition
   - Multiple users trade for 30 minutes
   - Trigger market events
   - Complete all rounds
   - Verify final results

2. **Admin Management Session**:
   - Manage prices and events
   - Monitor user activity
   - Send messages and news
   - Reset competition

### Test 22: Documentation & Cleanup
- [ ] **Test Documentation**: Document all test results
- [ ] **Bug Reports**: Create detailed bug reports
- [ ] **Performance Report**: Document performance metrics
- [ ] **Cleanup**: Reset test data and environment

---

## 🎯 **Success Criteria Checklist**

### Functional Requirements
- [ ] All trading operations work correctly
- [ ] Real-time updates function properly
- [ ] Admin controls operate as expected
- [ ] Competition flow is smooth
- [ ] Data integrity maintained

### Performance Requirements
- [ ] Page load times < 2 seconds
- [ ] Real-time updates < 1 second delay
- [ ] Order execution < 500ms
- [ ] No memory leaks during extended use

### User Experience
- [ ] Intuitive navigation
- [ ] Clear error messages
- [ ] Responsive design
- [ ] Consistent UI behavior

---

## 🚨 **Critical Issues to Watch For**

1. **Portfolio Calculation Errors**: Ensure P&L is always accurate
2. **Real-time Update Failures**: Monitor for missed updates
3. **Order Execution Issues**: Verify orders execute correctly
4. **Data Inconsistencies**: Check for data synchronization problems
5. **Admin Control Failures**: Ensure admin functions work reliably
6. **Competition Flow Bugs**: Verify round transitions work smoothly
7. **Margin Calculation Errors**: Check short selling calculations
8. **Event Impact Accuracy**: Verify market events affect prices correctly

---

*Happy Testing! 🎉 Remember to document all findings and create detailed bug reports for any issues discovered.*
