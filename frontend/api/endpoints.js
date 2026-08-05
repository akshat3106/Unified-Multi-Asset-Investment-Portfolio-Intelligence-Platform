/**
 * REST API route definitions for AssetBridge backend integration.
 * Base URL is configured via VITE_API_BASE_URL (see .env.example).
 *
 * All protected routes expect: Authorization: Bearer <Firebase ID token>
 */

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const ENDPOINTS = {
  // ─── Health ───────────────────────────────────────────────────────────────
  health: `${API_PREFIX}/health`,

  // ─── User / Profile ───────────────────────────────────────────────────────
  userMe: `${API_PREFIX}/users/me`,
  userSync: '/api/users/sync',
  userDelete: '/api/users/me',

  // ─── Portfolio & Dashboard ──────────────────────────────────────────────────
  portfolioSummary: `${API_PREFIX}/portfolio/summary`,
  portfolioHoldings: `${API_PREFIX}/portfolio/holdings`,
  portfolioHoldingsExport: `${API_PREFIX}/portfolio/holdings/export`,
  portfolioPerformance: `${API_PREFIX}/portfolio/performance`,
  portfolioAnalyze: `${API_PREFIX}/portfolio/analyze`,

  // ─── Transactions ─────────────────────────────────────────────────────────
  transactions: `${API_PREFIX}/transactions`,

  // ─── Wallet ─────────────────────────────────────────────────────────────────
  walletDeposit: `${API_PREFIX}/wallet/deposit`,

  // ─── Goals ──────────────────────────────────────────────────────────────────
  goals: `${API_PREFIX}/goals`,
  goalById: (goalId) => `${API_PREFIX}/goals/${goalId}`,
  goalContribution: (goalId) => `${API_PREFIX}/goals/${goalId}/contributions`,

  // ─── Notifications ──────────────────────────────────────────────────────────
  notifications: `${API_PREFIX}/notifications`,
  notificationById: (notificationId) => `${API_PREFIX}/notifications/${notificationId}`,
  notificationsMarkAllRead: `${API_PREFIX}/notifications/mark-all-read`,

  // ─── Notification Settings ──────────────────────────────────────────────────
  notificationSettings: `${API_PREFIX}/settings/notifications`,
  notificationSettingById: (settingId) => `${API_PREFIX}/settings/notifications/${settingId}`,

  // ─── Account Consents (Account Aggregator) ──────────────────────────────────
  consents: `${API_PREFIX}/consents`,

  // ─── Invest Catalog & Orders ────────────────────────────────────────────────
  catalogFunds: `${API_PREFIX}/catalog/funds`,
  catalogFundById: (fundId) => `${API_PREFIX}/catalog/funds/${fundId}`,
  ordersBuy: `${API_PREFIX}/orders/buy`,

  // ─── Market Data (stocks, unversioned) ──────────────────────────────────────
  marketSearch: '/api/market/search',
  marketQuote: (symbol) => `/api/market/quote/${symbol}`,
  marketChart: (symbol) => `/api/market/chart/${symbol}`,
  marketIndices: '/api/market/indices',
  mutualFundCatalog: '/api/market/mutual-funds/catalog',
  equityCatalog: '/api/market/equities/catalog',
  goldCatalog: '/api/market/gold/catalog',

  // ─── SIPs ───────────────────────────────────────────────────────────────────
  sips: `${API_PREFIX}/sips`,

  // ─── Risk Profile ───────────────────────────────────────────────────────────
  riskProfileQuizQuestions: `${API_PREFIX}/risk-profile/quiz/questions`,
  riskProfileQuizSubmit: `${API_PREFIX}/risk-profile/quiz/submit`,

  // ─── Advisor ────────────────────────────────────────────────────────────────
  advisorBookings: `${API_PREFIX}/advisor/bookings`,

  // ─── Learn Hub ──────────────────────────────────────────────────────────────
  learnExplainers: `${API_PREFIX}/learn/explainers`,
  learnQuizQuestions: `${API_PREFIX}/learn/quiz/questions`,
  learnQuizSubmit: `${API_PREFIX}/learn/quiz/submit`,

  // ─── AI Chatbot ─────────────────────────────────────────────────────────────
  chat: `${API_PREFIX}/chat`,

  // ─── Portfolio Analyzer Audit Log ──────────────────────────────────────────
  auditLog: `${API_PREFIX}/audit-log`,
};
