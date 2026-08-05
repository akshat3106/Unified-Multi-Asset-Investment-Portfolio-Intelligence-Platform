/**
 * AssetBridge API service layer — one function per backend endpoint.
 * Wire these into app.js to replace in-memory state mutations.
 */

import { ENDPOINTS } from './endpoints.js';
import { apiRequest, streamRequest } from './client.js';

// ─── Health ───────────────────────────────────────────────────────────────────

/** GET /api/v1/health */
export function checkHealth() {
  return apiRequest(ENDPOINTS.health);
}

// ─── User / Profile ───────────────────────────────────────────────────────────

/**
 * GET /api/v1/users/me
 * @returns {Promise<{
 *   fullName: string,
 *   firstName: string,
 *   email: string,
 *   phone: string,
 *   avatar: string,
 *   riskProfile: 'Conservative' | 'Moderate' | 'Aggressive',
 *   cashBalance: number
 * }>}
 */
export function getCurrentUser() {
  return apiRequest(ENDPOINTS.userMe);
}

/**
 * POST /api/users/sync — creates the user's Mongo record on first login
 * (and assigns a random mock portfolio server-side). Safe to call on every
 * login; it's a no-op for existing users.
 */
export function syncUser() {
  return apiRequest(ENDPOINTS.userSync, { method: 'POST' });
}

/**
 * DELETE /api/users/me — permanently deletes the calling user's Mongo
 * record, holdings, audit logs, and their Firebase Auth account.
 */
export function deleteAccount() {
  return apiRequest(ENDPOINTS.userDelete, { method: 'DELETE' });
}

/**
 * PATCH /api/v1/users/me
 * @param {{ fullName?: string, phone?: string, riskProfile?: string }} payload
 */
export function updateCurrentUser(payload) {
  return apiRequest(ENDPOINTS.userMe, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// ─── Portfolio & Dashboard ────────────────────────────────────────────────────

/**
 * GET /api/v1/portfolio/summary
 * @returns {Promise<{
 *   totalVal: number,
 *   totalInv: number,
 *   overallGainVal: number,
 *   overallGainPct: number,
 *   allocation: Array<{ category: string, value: number, pct: number }>
 * }>}
 */
export function getPortfolioSummary() {
  return apiRequest(ENDPOINTS.portfolioSummary);
}

/**
 * GET /api/v1/portfolio/holdings
 * @param {{ category?: string, sort?: 'value' | 'return' | 'name' }} [params]
 * @returns {Promise<Array<{
 *   id: string, name: string, shortName: string, category: string,
 *   subCategory: string, invested: number, currentValue: number,
 *   units: number, returnPct: number
 * }>>}
 */
export function getHoldings(params) {
  return apiRequest(ENDPOINTS.portfolioHoldings, { params });
}

/**
 * GET /api/v1/portfolio/holdings/export
 * Returns CSV file download from backend (alternative: build CSV client-side from getHoldings).
 */
export function exportHoldingsCsv() {
  return apiRequest(ENDPOINTS.portfolioHoldingsExport, {
    headers: { Accept: 'text/csv' },
  });
}

/**
 * GET /api/v1/portfolio/performance
 * @param {{ timeframe?: '1m'|'3m'|'6m'|'1y'|'all', filter?: string }} params
 * @returns {Promise<{ labels: string[], data: number[] }>}
 */
export function getPortfolioPerformance(params) {
  return apiRequest(ENDPOINTS.portfolioPerformance, { params });
}

/**
 * POST /api/v1/portfolio/analyze
 * @param {{ user_id: string, session_id: string, holdings: object[] }} payload
 */
export function analyzePortfolio(payload) {
  return apiRequest(ENDPOINTS.portfolioAnalyze, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Transactions ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/transactions
 * @param {{ limit?: number, offset?: number, category?: string }} [params]
 */
export function getTransactions(params) {
  return apiRequest(ENDPOINTS.transactions, { params });
}

/**
 * POST /api/v1/transactions
 * Used internally by wallet deposits, purchases, goal contributions, etc.
 */
export function createTransaction(payload) {
  return apiRequest(ENDPOINTS.transactions, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/wallet/deposit
 * @param {{ amount: number, sourceAccount?: string }} payload
 * @returns {Promise<{ cashBalance: number, transaction: object, notification: object }>}
 */
export function depositWalletFunds(payload) {
  return apiRequest(ENDPOINTS.walletDeposit, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Goals ────────────────────────────────────────────────────────────────────

/** GET /api/v1/goals */
export function getGoals() {
  return apiRequest(ENDPOINTS.goals);
}

/**
 * POST /api/v1/goals
 * @param {{ name: string, target: number, year: number, monthlySip: number, icon: string }} payload
 */
export function createGoal(payload) {
  return apiRequest(ENDPOINTS.goals, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * PATCH /api/v1/goals/:goalId
 * @param {string} goalId
 * @param {{ name?: string, target?: number, year?: number, monthlySip?: number, saved?: number }} payload
 */
export function updateGoal(goalId, payload) {
  return apiRequest(ENDPOINTS.goalById(goalId), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * POST /api/v1/goals/:goalId/contributions
 * @param {string} goalId
 * @param {{ amount: number }} payload
 * @returns {Promise<{ goal: object, transaction: object, notifications: object[] }>}
 */
export function contributeToGoal(goalId, payload) {
  return apiRequest(ENDPOINTS.goalContribution(goalId), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

/** GET /api/v1/notifications */
export function getNotifications() {
  return apiRequest(ENDPOINTS.notifications);
}

/** PATCH /api/v1/notifications/:notificationId — mark single notification read */
export function markNotificationRead(notificationId) {
  return apiRequest(ENDPOINTS.notificationById(notificationId), {
    method: 'PATCH',
    body: JSON.stringify({ unread: false }),
  });
}

/** POST /api/v1/notifications/mark-all-read */
export function markAllNotificationsRead() {
  return apiRequest(ENDPOINTS.notificationsMarkAllRead, { method: 'POST' });
}

// ─── Notification Settings ──────────────────────────────────────────────────────

/** GET /api/v1/settings/notifications */
export function getNotificationSettings() {
  return apiRequest(ENDPOINTS.notificationSettings);
}

/**
 * PATCH /api/v1/settings/notifications/:settingId
 * @param {string} settingId
 * @param {{ active: boolean }} payload
 */
export function updateNotificationSetting(settingId, payload) {
  return apiRequest(ENDPOINTS.notificationSettingById(settingId), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// ─── Account Consents ───────────────────────────────────────────────────────────

/** GET /api/v1/consents */
export function getConsents() {
  return apiRequest(ENDPOINTS.consents);
}

/**
 * POST /api/v1/consents
 * @param {{ accountName: string, sourceType?: string }} payload
 */
export function linkConsentAccount(payload) {
  return apiRequest(ENDPOINTS.consents, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Invest Catalog & Orders ────────────────────────────────────────────────────

/**
 * GET /api/v1/catalog/funds
 * @param {{ category?: string, subCategory?: string, search?: string }} [params]
 */
export function getFundsCatalog(params) {
  return apiRequest(ENDPOINTS.catalogFunds, { params });
}

/** GET /api/v1/catalog/funds/:fundId */
export function getFundById(fundId) {
  return apiRequest(ENDPOINTS.catalogFundById(fundId));
}

/**
 * POST /api/v1/orders/buy
 * @param {{ fundId: string, amount: number }} payload
 * @returns {Promise<{ holding: object, transaction: object, notification: object }>}
 */
export function purchaseFund(payload) {
  return apiRequest(ENDPOINTS.ordersBuy, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Market Data ────────────────────────────────────────────────────────────────

/**
 * GET /api/market/search?q=...
 * @param {string} query
 * @returns {Promise<Array<{ symbol: string, name: string, exchange: string, type: string }>>}
 */
export function searchStocks(query) {
  return apiRequest(ENDPOINTS.marketSearch, { params: { q: query } });
}

/** GET /api/market/search?q=...&type=mutualfund */
export function searchMutualFunds(query) {
  return apiRequest(ENDPOINTS.marketSearch, { params: { q: query, type: 'mutualfund' } });
}

/** GET /api/market/quote/:symbol */
export function getStockQuote(symbol) {
  return apiRequest(ENDPOINTS.marketQuote(symbol));
}

/** GET /api/market/chart/:symbol */
export function getStockChart(symbol, params) {
  return apiRequest(ENDPOINTS.marketChart(symbol), { params });
}

/** GET /api/market/indices */
export function getMarketIndices() {
  return apiRequest(ENDPOINTS.marketIndices);
}

/** GET /api/market/mutual-funds/catalog — live Indian mutual fund data from Yahoo Finance */
export function getMutualFundCatalog() {
  return apiRequest(ENDPOINTS.mutualFundCatalog);
}

/** GET /api/market/equities/catalog — live curated NSE large-cap stock data */
export function getEquityCatalog() {
  return apiRequest(ENDPOINTS.equityCatalog);
}

/** GET /api/market/gold/catalog — live Gold ETF data (real-market proxy for digital gold) */
export function getGoldCatalog() {
  return apiRequest(ENDPOINTS.goldCatalog);
}

// ─── SIPs ───────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/sips
 * @param {{ fundName: string, amount: number, debitDay: number }} payload
 */
export function registerSip(payload) {
  return apiRequest(ENDPOINTS.sips, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** GET /api/v1/sips */
export function getSips() {
  return apiRequest(ENDPOINTS.sips);
}

// ─── Risk Profile ───────────────────────────────────────────────────────────────

/** GET /api/v1/risk-profile/quiz/questions */
export function getRiskProfileQuizQuestions() {
  return apiRequest(ENDPOINTS.riskProfileQuizQuestions);
}

/**
 * POST /api/v1/risk-profile/quiz/submit
 * @param {{ answers: string[] }} payload — e.g. ["Conservative", "Moderate"]
 * @returns {Promise<{ riskProfile: string, notification: object }>}
 */
export function submitRiskProfileQuiz(payload) {
  return apiRequest(ENDPOINTS.riskProfileQuizSubmit, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Advisor ────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/advisor/bookings
 * @param {{ date: string, timeSlot: string }} payload
 */
export function bookAdvisorCall(payload) {
  return apiRequest(ENDPOINTS.advisorBookings, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Learn Hub ──────────────────────────────────────────────────────────────────

/** GET /api/v1/learn/explainers */
export function getLearnExplainers() {
  return apiRequest(ENDPOINTS.learnExplainers);
}

/** GET /api/v1/learn/quiz/questions */
export function getLearnQuizQuestions() {
  return apiRequest(ENDPOINTS.learnQuizQuestions);
}

/**
 * POST /api/v1/learn/quiz/submit
 * @param {{ answers: Record<number, string> }} payload
 */
export function submitLearnQuiz(payload) {
  return apiRequest(ENDPOINTS.learnQuizSubmit, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── AI Chatbot ─────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/chat
 * @param {{ message: string, sessionId?: string }} payload
 * @returns {Promise<{ reply: string, sessionId?: string }>}
 */
export function sendChatMessage(payload) {
  return apiRequest(ENDPOINTS.chat, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST /api/v1/chat, streamed word-by-word.
 * @param {{ message: string, sessionId?: string }} payload
 * @param {(chunk: string) => void} onChunk - called with each new text fragment as it arrives
 * @returns {Promise<string>} the full assembled reply
 */
export function streamChatMessage(payload, onChunk) {
  return streamRequest(ENDPOINTS.chat, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, onChunk);
}

// ─── Portfolio Analyzer Audit Log ────────────────────────────────────────────────

/**
 * GET /api/v1/audit-log
 * @param {{ userId?: string }} [params]
 * @returns {Promise<{ count: number, entries: object[] }>}
 */
export function getAuditLog(params = {}) {
  return apiRequest(ENDPOINTS.auditLog, { params });
}
