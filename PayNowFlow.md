# Pay Now Flow Documentation

This document outlines the end-to-end flow when a user clicks "Pay Now" in the GeSIM app.

## Overview
The purchase process is a linear sequence of steps executed in `processEsimPurchase` (`hooks/useApiActions.ts`). If any step fails, the flow terminates and throws an error, except for Rewards which is non-blocking.

## 1. Interaction Start
**User Action**: Clicks "PAY NOW" on `PurchaseModal`.
**Trigger**: `handlePayment()` calls `processEsimPurchase(plan, userId)`.

## 2. Step-by-Step Flow

### Step 1: Payment (Blockchain)
- **Method**: `handleSendTransaction(amount, 'USDC')`
- **Output**: Solana Transaction Signature (`txHash`).
- **Validation**: Checks wallet status (`connected`).
- **Retry Logic**: Internal handshake retry (5s) for connection. No retry on user rejection.
- **Fail Condition**: User rejection or network failure.

### Step 2: Logging (Backend)
- **Method**: `apiService.addTransaction(transactionData)`
- **Input**: `{ userId, amount, txHash, ... }`
- **Retry Logic**: **YES (3 attempts)**. Safe data logging.
- **Why**: Ensures we have a record even if the network blips.

### Step 3: Ordering (Backend)
- **Method**: `apiService.orderEsim(orderPayload)`
- **Input**: `{ transactionId, amount, packageInfoList }`
- **Pre-Flight Check**: Verifies `txHash` from Step 1 exists.
- **Retry Logic**: **NO RETRY**.
- **Reason**: To strictly prevent double-charging or duplicate orders. If this fails, we treat it as a critical failure requiring manual intervention/support.
- **Response Validation**: Checks if `orderRes.data.obj.orderNo` exists.
- **Fail Condition**: Network error OR missing `orderNo`.

### Step 4: Allocation (Backend)
- **Method**: `apiService.getAllocatedProfiles(allocPayload)`
- **Input**: `{ userId, orderNo, pager }`
- **Pre-Flight Check**: Verifies `orderNo` from Step 3 exists. If missing, throws Error immediately.
- **Retry Logic**: **YES (3 attempts)**.
- **Reason**: Read-only operation. Essential to deliver the product (QR Code) after a successful payment and order.
- **Output**: List of allocated profiles (`esimList`).

### Step 5: Rewards (Backend & Local)
- **Method**: `apiService.creditRewards(payload)`
- **Input**: `{ userId, reason: 'PURCHASE', referenceId: orderNo }`
- **Retry Logic**: NO (Non-blocking).
- **Error Handling**: Logged but does not fail the purchase flow.
