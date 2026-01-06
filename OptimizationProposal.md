# GeSIM Optimization & Architecture Proposal

This document outlines the strategy for making the GeSIM app faster, lighter, and more robust by shifting orchestration to the backend and optimizing the data fetching layer.

## 1. Moving Logic to the Backend (Purchase Flow)

Currently, the mobile app acts as an "orchestrator," hitting 5 different API endpoints in sequence. This is risky and slow.

### Current Challenges
- **Network Latency**: 5 round-trips from a mobile device (high latency) to the backend.
- **Risk of Inconsistency**: If the user's internet drops between Step 3 and Step 4, they might have paid but never get their eSIM profile.
- **App Weight**: The app has to manage complex retry states and error handling for 5 different APIs.

### Proposed Solution: "Atomic Purchase"
We should create a single backend endpoint: `POST /api/purchase/atomic`.

**The Flow:**
1. **Mobile**: Send USDC Payment (Solana tx).
2. **Mobile**: Call `/api/purchase/atomic` with `{ txHash, packageCode, userId }`.
3. **Backend**: 
    - Verify `txHash` on Solana.
    - Log transaction.
    - Order eSIM from provider.
    - Credit Rewards.
    - Return the final eSIM Profile (QR/LPA) in **ONE** response.

**Benefits:**
- **Speed**: Only 1 mobile round-trip instead of 5.
- **Reliability**: Backend-to-Backend requests are much faster and more stable.
- **Lighter App**: We can remove ~100 lines of complex orchestration code from `useApiActions.ts`.
- **Atomicity**: The backend can handle failures gracefully (e.g., if eSIM ordering fails, it can automatically flag the transaction for a refund or retry).

---

## 3. Handling Failures & Refund Strategy

To maintain user confidence when a payment is successful but the order fails (e.g., Error `200005: package price expired`), we need a robust safety net.

### Automated Refund Flow (Backend-Driven)
Manual refunds are slow and hurt user trust. We should implement an automated refund listener:
1. **Transaction Monitoring**: The backend should monitor the Solana blockchain for the `txHash` provided by the app.
2. **Order Check**: If a transaction is verified but no `orderNo` is associated with it within 5 minutes, the backend should trigger an **Automatic Refund** (or alert an admin for immediate manual settlement).
3. **User Notification**: The app should show a "Transaction Flagged" screen instead of just an error, explaining that the funds are safe and a refund/retry is being processed.

---

## 4. Immediate Action for "Price Expired" (Error 200005)

The user's recent error logs confirm that local JSON data is leading to financial friction.

### The Fix: Force-Update on Failure
In the short term, if the `orderEsim` API returns `"errorCode": "200005"`, the app should:
1. **Invalidate Cache**: Immediately wipe the local plan cache.
2. **Refetch**: Trigger an urgent background fetch of the latest plans.
3. **Alert User**: "Price for this plan has changed. Please try again with the updated pricing."

---

## 5. Remote Syncing & External Triggers (Postman/Dashboard)

To update plans without changing app code or requiring a store update, we will use a **Config Versioning Strategy**.

### The Mechanism: `GET /api/config/version`
Instead of fetching 3MB of plans every time, the app will ping a tiny (1KB) endpoint on every launch and regular intervals.

1. **The Check**: The API returns: `{ "planVersion": "2026-01-10T12:00:00Z", "forceUpdate": false }`.
2. **The Logic**: 
   - If the `planVersion` on the server is newer than the `cached_version` in the app, the app triggers a fetch.
   - **External Trigger**: If you update plans via Postman or your Dashboard, simply update that `planVersion` timestamp on the server. The next time any user opens the app (or within a polling interval), they will detect the change and pull the new data automatically.

---

## 6. UI Feedback: The Loader Experience

Even with background syncing, there are times when an "Urgent Update" is needed (e.g., after Error 200005 or when a `forceUpdate` flag is set).

### The "Updating Data Plans" Experience
1. **Blocking Overlay**: If an update is critical, we show a premium, glassmorphism-style loader with the text: **"Updating Data Plans... Syncing latest rates."**
2. **Non-Blocking Toast**: For routine background syncs, we show a subtle, non-intrusive notification: *"Plans updated successfully."*
3. **Speed**: By using the "Atomic Purchase" (Phase 3) and regional fetching, this update should take < 2 seconds.

## Revised Action Plan

- [ ] **Phase 1: Force-Refresh on Error 200005**
    - [ ] Update `useApiActions.ts` to detect price expiry.
    - [ ] Add the "Updating Data Plans" UI overlay to `plans.tsx` for forced refreshes.
- [ ] **Phase 2: UsePlans Hook & Versioning**
    - [ ] Implement `AsyncStorage` caching for plans.
    - [ ] Create the `planVersion` check logic to trigger updates from your Dashboard/Postman.
- [ ] **Phase 3: Backend Integration**
    - [ ] Replace `allPlans.json` entirely with the API.
    - [ ] Finalize the Atomic Purchase flow (Backend work).
