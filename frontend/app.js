// AssetBridge Unified Investing Dashboard - App Core Logic
//0. FIREBASE AUTH
// 1. Firebase SDK Imports
import { searchStocks, searchMutualFunds, getStockQuote, getStockChart, getMarketIndices, streamChatMessage, getAuditLog, analyzePortfolio, getMutualFundCatalog, getEquityCatalog, getGoldCatalog, setAuthTokenProvider, syncUser, getHoldings, getPortfolioPerformance } from './api/index.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 2. Paste your Firebase Keys from Step 1
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// Attach the logged-in user's Firebase ID token to every backend API request.
setAuthTokenProvider(async () => {
  const user = auth.currentUser;
  return user ? user.getIdToken() : null;
});

// 3. Track Auth State Changes and sync with AssetBridge state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Configure API HTTP client to attach Firebase token to backend calls
    setAuthTokenProvider(() => user.getIdToken());

    // Update active user state from Firebase account
    state.user.fullName = user.displayName || user.email.split('@')[0];
    state.user.firstName = state.user.fullName.split(' ')[0];
    state.user.email = user.email;

    // Update UI headers
    const sidebarUserName = document.getElementById('sidebar-user-name');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    if (sidebarUserName) sidebarUserName.textContent = state.user.fullName;
    if (sidebarAvatar) sidebarAvatar.textContent = state.user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();

    // Creates the user's backend record on first login (assigning a random
    // mock portfolio server-side), then loads their real holdings.
    try {
      await syncUser();
      const holdings = await getHoldings();
      state.holdings = holdings;
    } catch (err) {
      console.error('Failed to load holdings from backend, keeping previous state.', err);
    }

    renderAll();
    renderAuditLog();
    initPortfolioChart();
  } else {
    setAuthTokenProvider(null);
    // User is signed out -> Open login modal automatically
    document.getElementById('modal-auth').classList.add('active');
  }
});

// Helper for programmatic sign out
window.assetBridgeSignOut = () => signOut(auth);
// 1. Initial State Definition
const state = {
  user: {
    fullName: "Arpit Agarwal",
    firstName: "Arpit",
    phone: "+91 ••••• ••982",
    avatar: "AA",
    riskProfile: "Moderate", // Conservative, Moderate, Aggressive
    cashBalance: 45000,       // Available uninvested cash in wallet
  },
  
  holdings: [
    { id: "h1", name: "HDFC Nifty 50 Index Fund", shortName: "HDFCN50", category: "mf", subCategory: "index", invested: 120000, currentValue: 138500, units: 1045.28, returnPct: 15.42 },
    { id: "h2", name: "Parag Parikh Flexi Cap Fund Direct", shortName: "PPFCF", category: "mf", subCategory: "equity", invested: 85000, currentValue: 98200, units: 681.94, returnPct: 15.53 },
    { id: "h3", name: "Tata Motors Limited Direct Equity", shortName: "TATA", category: "equity", subCategory: "equity", invested: 72000, currentValue: 88410, units: 95.0, returnPct: 22.79 },
    { id: "h4", name: "Reliance Industries Limited", shortName: "RELIANCE", category: "equity", subCategory: "equity", invested: 66000, currentValue: 69200, units: 28.0, returnPct: 4.85 },
    { id: "h5", name: "Digital Gold (PhonePe Safegold)", shortName: "GOLD", category: "gold", subCategory: "gold", invested: 30000, currentValue: 34000, units: 5.86, returnPct: 13.33 },
    { id: "h6", name: "SBI Tax Saving FD - 5 Year", shortName: "SBIFD", category: "fd", subCategory: "debt", invested: 40000, currentValue: 40000, units: 1.0, returnPct: 0.00 },
    { id: "h7", name: "NPS Tier 1 Scheme E (SBI)", shortName: "NPS", category: "nps", subCategory: "hybrid", invested: 15000, currentValue: 14000, units: 150.0, returnPct: -6.67 }
  ],
  
  transactions: [
    { type: "BUY", assetName: "Parag Parikh Flexi Cap Fund", date: "Today 10:15 AM", category: "mf", amount: 5000, units: 38.21, price: 130.85, typeLabel: "SIP Execution" },
    { type: "BUY", assetName: "Reliance Industries Ltd", date: "June 20, 2026", category: "equity", amount: 12500, units: 5.0, price: 2500.0, typeLabel: "Manual Order" },
    { type: "BUY", assetName: "Digital Gold (Safegold)", date: "June 15, 2026", category: "gold", amount: 2000, units: 0.32, price: 6250.0, typeLabel: "SIP Execution" },
    { type: "SELL", assetName: "Tata Motors Ltd", date: "June 10, 2026", category: "equity", amount: 15000, units: 20.0, price: 750.0, typeLabel: "Manual Order" },
    { type: "BUY", assetName: "SBI Tax Saving FD", date: "June 01, 2026", category: "fd", amount: 40000, units: 1.0, price: 40000.0, typeLabel: "Manual Order" }
  ],
  
  goals: [
    { id: "g1", name: "Europe Trip", target: 300000, year: 2027, saved: 140000, icon: "trip", monthlySip: 5000 },
    { id: "g2", name: "Home Downpayment", target: 8000000, year: 2035, saved: 2240000, icon: "house", monthlySip: 30000 },
    { id: "g3", name: "Tesla Electric Vehicle", target: 1200000, year: 2030, saved: 336000, icon: "car", monthlySip: 10000 }
  ],
  
  notifications: [
    { id: "n1", type: "warning", title: "Rebalancing needed", description: "Equity represents 58% of your portfolio, drifting past your target of 50%. Sell equity or buy debt to align.", time: "Today 9:42 AM", unread: true },
    { id: "n2", type: "success", title: "SIP Executed Successfully", description: "Your monthly SIP of ₹5,000 in Parag Parikh Flexi Cap Fund was processed via Auto-Debit.", time: "Today 10:15 AM", unread: true },
    { id: "n3", type: "success", title: "Milestone reached!", description: "Your Europe Trip goal is now 46% funded! You are ahead of schedule by 1 month.", time: "Yesterday", unread: true },
    { id: "n4", type: "info", title: "Market news update", description: "SEBI introduces new framework for mutual fund expense ratio caps. Overall impact is neutral.", time: "June 23, 2026", unread: false }
  ],
  
  consents: [
    { id: "c1", accountName: "SBI Savings Account", sourceType: "Account Aggregator", status: "Linked", logo: "SBI" },
    { id: "c2", accountName: "Zerodha Demat Account", sourceType: "Broking APIs", status: "Linked", logo: "Z" },
    { id: "c3", accountName: "MF Central Account", sourceType: "Mutual Fund Registrar", status: "Linked", logo: "MF" },
    { id: "c4", accountName: "PhonePe SafeGold Wallet", sourceType: "Digital Gold API", status: "Linked", logo: "PP" }
  ],
  
  notificationSettings: [
    { id: "s1", name: "Rebalancing alerts", desc: "Trigger notifications when asset allocation drifts more than 5% from target", active: true },
    { id: "s2", name: "SIP reminders", desc: "Send SMS & WhatsApp alerts 3 days before any SIP execution date", active: true },
    { id: "s3", name: "Market news updates", desc: "Receive real-time notifications about major regulatory actions & movements", active: false },
    { id: "s4", name: "Goal milestone achievements", desc: "Notify when goal savings targets hit key percentages (e.g. 25%, 50%, 75%)", active: true },
    { id: "s5", name: "Price alert indicators", desc: "Send triggers when watchlisted stocks change price by more than 3% in a day", active: true }
  ],
  
  explainers: [
    {
      id: "exp-sip-timing",
      category: "basics",
      title: "What is SIP and how does it beat market timing?",
      readTime: "6 min read",
      difficulty: "Beginner",
      body: `
        <p>A <strong>Systematic Investment Plan (SIP)</strong> is an instruction you give a mutual fund to automatically deduct a fixed amount from your bank account at a regular interval — usually monthly — and invest it into a scheme of your choice. Instead of trying to find the "perfect moment" to invest a lump sum, you invest small, fixed amounts continuously, letting the process run on autopilot for years.</p>

        <p><strong>The core mechanic: rupee-cost averaging</strong></p>
        <p>This is the real engine behind why SIPs work. Since you invest the same rupee amount every month regardless of the fund's price (NAV), you automatically buy <em>more units</em> when prices are low and <em>fewer units</em> when prices are high. Over time, this smooths out your average purchase cost per unit, instead of locking in whatever price happened to be prevailing on one single day.</p>
        <p>Consider a simple illustration with a ₹5,000 monthly SIP:</p>
        <ul>
          <li>Month 1 — NAV ₹50 → you get 100 units</li>
          <li>Month 2 — market dips, NAV ₹40 → you get 125 units</li>
          <li>Month 3 — market recovers, NAV ₹55 → you get ~91 units</li>
        </ul>
        <p>Your average cost per unit across these three months works out to be lower than simply averaging the three NAVs, precisely because you bought more when it was cheap. A lump-sum investor who put in all ₹15,000 on Month 1 at ₹50/unit would have no such advantage.</p>

        <p><strong>Why trying to time the market usually fails</strong></p>
        <p>Successfully timing the market requires getting two decisions right: when to get in, <em>and</em> when to get out — consistently, again and again. Even professional fund managers with research teams and decades of experience rarely achieve this reliably over the long run. Missing just the 10 best trading days in a 20-year period has been shown, across multiple market studies, to cut total returns dramatically — and those best days often occur right after the scariest crashes, exactly when most retail investors are too fearful to invest.</p>
        <p>SIPs remove this decision entirely. You don't need to predict anything — you're structurally present in the market every single month, capturing both the dips (buying cheap) and the rallies (participating in the recovery) without having to correctly call either.</p>

        <p><strong>The behavioral advantage</strong></p>
        <p>Beyond the math, SIPs solve a psychological problem. Left to their own judgment, most investors buy when markets feel good (near tops, driven by greed and FOMO) and sell when markets feel scary (near bottoms, driven by panic) — the exact opposite of "buy low, sell high." Because a SIP is automated, it removes that emotional trigger point. The money leaves your account whether the news that week is good or bad, and that consistency is what actually builds wealth over a decade or two.</p>

        <p><strong>Where SIPs don't have an edge</strong></p>
        <p>SIPs are not magic — they're a risk-management and discipline tool, not a returns-boosting one. If you had perfect foresight and invested a lump sum right before a multi-year bull run, that lump sum would outperform an equivalent SIP spread over the same period, simply because 100% of your money was working from day one instead of trickling in gradually. The entire value of a SIP comes from the fact that nobody has that foresight in advance — so spreading entry points reduces the risk of unknowingly investing everything right before a downturn.</p>

        <p><strong>Practical takeaway</strong></p>
        <p>SIPs are best suited for long-term goals (5+ years) where you want to build a habit of investing without needing to actively manage entry timing. The longer the horizon, the more rupee-cost averaging and compounding work in your favor — which is why SIPs are the default recommended vehicle for goals like retirement, a child's education, or a house down payment 10-20 years out.</p>
      `,
    },
    {
      id: "exp-xirr-cagr",
      category: "returns",
      title: "XIRR vs CAGR — which one actually matters?",
      readTime: "6 min read",
      difficulty: "Intermediate",
      body: `
        <p>Both CAGR and XIRR try to answer the same underlying question — "what annual rate of return did my money actually earn?" — but they're built for two completely different investing patterns, and using the wrong one gives you a number that looks precise but is quietly wrong.</p>

        <p><strong>CAGR — Compound Annual Growth Rate</strong></p>
        <p>CAGR assumes the simplest possible cash flow pattern: one lump sum invested on day one, left completely untouched, and one final value on the day you check it. The formula is:</p>
        <p style="text-align:center; font-family:monospace;">CAGR = (Ending Value / Beginning Value)^(1 / Number of Years) − 1</p>
        <p>Example: You invest ₹1,00,000 and it grows to ₹2,00,000 in exactly 6 years, with no other deposits or withdrawals in between. CAGR = (2,00,000/1,00,000)^(1/6) − 1 ≈ 12.25% per year. This number is accurate and meaningful <em>only</em> because there was exactly one cash flow at the start and one at the end.</p>

        <p><strong>XIRR — Extended Internal Rate of Return</strong></p>
        <p>Real portfolios rarely look like that. You might start a SIP, add a lump-sum bonus in month 7, pause contributions for two months, then resume, and eventually make a partial withdrawal. XIRR is designed exactly for this: it takes every single cash flow — each one tagged with its own date and amount, positive for money going in, negative for money coming out — and calculates the single annualized rate of return that makes all of those cash flows mathematically consistent with the final portfolio value.</p>
        <p>Because XIRR accounts for the <em>exact date</em> of every rupee, it correctly gives more weight to money that has been invested longer and less weight to money that just went in last week — which is precisely how real returns behave.</p>

        <p><strong>A concrete comparison</strong></p>
        <p>Imagine two investors who both end up with a portfolio worth ₹3,00,000 after 3 years:</p>
        <ul>
          <li><strong>Investor A</strong> put in a single lump sum of ₹2,00,000 on day one. CAGR is the right tool here, and it might show roughly 14.5% annualized.</li>
          <li><strong>Investor B</strong> ran a SIP of ₹5,000/month for 3 years (total invested ≈ ₹1,80,000) and ended at the same ₹3,00,000. Using CAGR on Investor B's numbers would be misleading, because it would treat the ₹1,80,000 as if it were all invested on day one — hugely understating how good the actual return was, since most of that money was only invested for a fraction of the 3 years. XIRR correctly accounts for each monthly contribution's actual holding period and would show a meaningfully higher effective annual return for Investor B.</li>
        </ul>

        <p><strong>Why this matters practically</strong></p>
        <p>Almost every mutual fund platform and portfolio tracker (including the Portfolio Health metrics in this app) reports XIRR for SIP-based holdings for exactly this reason — it's the only metric that doesn't distort the picture when your money went in at different times. If you ever see a fund's "returns since inception" and it doesn't match your own portfolio's return, the difference is very often this exact CAGR-vs-XIRR mismatch, not a fee or a hidden cost.</p>

        <p><strong>Simple decision rule</strong></p>
        <p>Single investment, no interim deposits/withdrawals → CAGR is fine and simpler to compute by hand. Any SIP, staggered lump sums, or partial redemptions → XIRR is the only metric that reflects your true annualized return.</p>
      `,
    },
    {
      id: "exp-inflation-savings",
      category: "basics",
      title: "How inflation silently eats your savings over 20 years",
      readTime: "6 min read",
      difficulty: "Beginner",
      body: `
        <p>Inflation is the gradual, ongoing rise in the price of goods and services across the economy. It's measured in India primarily via the CPI (Consumer Price Index) — the metric the RBI officially targets, aiming to keep it in a 2-6% band. What makes inflation dangerous to long-term savers isn't any single year's number; it's what happens when that number compounds, unnoticed, for 15-20 years.</p>

        <p><strong>The core problem: purchasing power, not rupee count</strong></p>
        <p>Your bank statement will always show your rupee balance growing (assuming you're earning any interest at all) — inflation never shows up as a debit entry. But the real question isn't "how many rupees do I have?", it's "what can those rupees actually buy?" That second number is what inflation quietly erodes, year after year, without ever appearing on any statement.</p>

        <p><strong>A concrete 20-year illustration</strong></p>
        <p>At a steady 6% average annual inflation (a reasonable long-run assumption for India), prices roughly double every 12 years. So something costing ₹50,000 today would cost approximately:</p>
        <ul>
          <li>~₹89,500 in 10 years</li>
          <li>~₹1,60,000 in 20 years</li>
        </ul>
        <p>That's more than triple the rupee figure — for the exact same goods or services. If your ₹50,000 in savings sat in an instrument earning less than 6% (a regular savings account paying 3-4%, for instance), you'd technically have more rupees in 20 years, but you'd be able to buy <em>less</em> than what ₹50,000 buys today. In real terms, your wealth shrank while its rupee-labeled number grew — which is exactly why this erosion is so easy to miss.</p>

        <p><strong>Real return vs nominal return</strong></p>
        <p>This is the concept of <em>real return</em>: Real Return ≈ Nominal Return − Inflation Rate. A fixed deposit paying 7% during a period of 6% inflation is only really earning you about 1% in actual purchasing power terms — and that's before accounting for tax on the interest, which can push the real, post-tax return into negative territory entirely for many investors.</p>

        <p><strong>Why this matters enormously for goal planning</strong></p>
        <p>If you're setting a savings target for something 15-20 years away — a child's college education, a retirement corpus, a house down payment — the target itself must be inflation-adjusted, not just based on today's cost. A goal that costs ₹50 lakh today in real terms will require a much larger rupee figure by the time you actually need the money, purely because prices will have risen throughout that period. Underestimating this is one of the most common and costly planning mistakes: people save diligently toward a rupee number calculated using today's prices, and then discover at the finish line that it doesn't buy what they expected.</p>

        <p><strong>The counter-strategy: growth assets</strong></p>
        <p>This is precisely why "safe" instruments alone are insufficient for long-horizon goals. Equity mutual funds, direct equities, and other growth assets have historically compounded at rates that meaningfully outpace inflation over 10+ year periods (though with real short-term volatility along the way) — they exist specifically to counter this erosion. A sensible long-term strategy typically blends some inflation-beating growth exposure with safer instruments, rather than relying entirely on capital-protection vehicles that quietly lose real value the longer money sits in them.</p>

        <p><strong>Key takeaway</strong></p>
        <p>Inflation is the single most persistent, invisible risk to long-term savings. It doesn't announce itself in any account statement, doesn't require a market crash to do damage, and works silently in the background every single year — which makes it easy to ignore and expensive to underestimate.</p>
      `,
    },
    {
      id: "exp-elss-ppf-nps",
      category: "tax",
      title: "ELSS vs PPF vs NPS — which saves more tax?",
      readTime: "7 min read",
      difficulty: "Intermediate",
      body: `
        <p>All three of these instruments reduce your taxable income under the Income Tax Act, but they take very different paths to get there — different lock-ins, different risk profiles, and different deduction limits. The "best" choice depends far more on your time horizon and risk tolerance than on which one technically "saves the most tax," since for two of the three the deduction cap is identical.</p>

        <p><strong>ELSS — Equity Linked Savings Scheme</strong></p>
        <ul>
          <li><strong>Deduction:</strong> Up to ₹1.5 lakh per year under Section 80C (shared with PPF, EPF, life insurance premiums, and other 80C instruments — it's one combined ₹1.5 lakh cap, not ₹1.5 lakh per instrument).</li>
          <li><strong>Lock-in:</strong> Just 3 years — the shortest mandatory lock-in of any Section 80C instrument (compare to PPF's 15 years or a tax-saver FD's 5 years).</li>
          <li><strong>How it invests:</strong> Fully in equities, actively or passively managed depending on the scheme. Returns are entirely market-linked.</li>
          <li><strong>Risk & return profile:</strong> Because it's 100% equity, ELSS can be genuinely volatile in any given 1-3 year window, but has historically compounded in the 12-15% range over long multi-year periods — well ahead of PPF's fixed rate, at the cost of real short-term uncertainty.</li>
        </ul>

        <p><strong>PPF — Public Provident Fund</strong></p>
        <ul>
          <li><strong>Deduction:</strong> Also up to ₹1.5 lakh, and shares the exact same combined 80C cap as ELSS — so putting money in both doesn't get you ₹3 lakh of deduction, it's still capped at ₹1.5 lakh total across everything in that basket.</li>
          <li><strong>Lock-in:</strong> 15 years, extendable indefinitely in blocks of 5 years thereafter. Partial withdrawals are allowed from the 7th year onward under specific rules, but it's fundamentally a long-horizon commitment.</li>
          <li><strong>Tax treatment:</strong> PPF is one of the rare "EEE" (Exempt-Exempt-Exempt) instruments in India — your contribution is deductible, the interest earned is tax-free, and the maturity proceeds are also completely tax-free. No other instrument on this list offers that full triple exemption.</li>
          <li><strong>Risk & return:</strong> Government-backed with zero market risk. The interest rate is set quarterly by the government (historically hovering in the 7-8% range) and is guaranteed regardless of what markets do.</li>
        </ul>

        <p><strong>NPS — National Pension System</strong></p>
        <ul>
          <li><strong>Deduction:</strong> This is the key differentiator — NPS offers an <em>additional</em> ₹50,000 deduction under Section 80CCD(1B), completely separate from and on top of the ₹1.5 lakh 80C limit. This makes NPS the only one of the three instruments here that can push your total deduction beyond ₹1.5 lakh, up to ₹2 lakh combined.</li>
          <li><strong>Lock-in:</strong> Effectively until retirement (age 60), with limited partial withdrawal provisions for specific life events.</li>
          <li><strong>How it invests:</strong> A mix of equity, corporate debt, and government securities, in proportions you can typically choose within regulatory limits, managed by a Pension Fund Manager (PFM) you select.</li>
          <li><strong>The annuity requirement:</strong> At retirement, a mandatory portion of the final NPS corpus (typically at least 40%) must be used to purchase an annuity — a product that pays you a regular pension income — rather than being withdrawn as a lump sum. This is a meaningful liquidity trade-off compared to ELSS or even PPF.</li>
        </ul>

        <p><strong>Putting it side by side</strong></p>
        <p>If your priority is the shortest possible lock-in combined with the highest long-term growth potential, and you can tolerate short-term volatility, ELSS is the strongest fit. If you want a completely risk-free, guaranteed instrument and don't mind a genuinely long 15-year commitment, PPF's full tax-free treatment is hard to beat. If you've already exhausted your ₹1.5 lakh 80C limit through other instruments (EPF, insurance, ELSS, etc.) and specifically want to reduce your tax bill further while building a retirement-specific corpus, NPS's extra ₹50,000 deduction is the only lever among these three that gets you there.</p>

        <p><strong>A common mistake to avoid</strong></p>
        <p>A frequent misunderstanding is assuming ELSS and PPF deductions "stack" to give ₹3 lakh in total savings — they don't, since both draw from the same ₹1.5 lakh 80C bucket. Only NPS's Section 80CCD(1B) component sits in a genuinely separate bucket.</p>
      `,
    },
    {
      id: "exp-pe-ratio",
      category: "stocks",
      title: "How to read a P/E ratio without getting confused",
      readTime: "6 min read",
      difficulty: "Beginner",
      body: `
        <p>The <strong>Price-to-Earnings (P/E) ratio</strong> is one of the most widely quoted numbers in investing, and also one of the most frequently misread. In plain terms, it tells you how much investors are collectively willing to pay today for every ₹1 of a company's current annual profit.</p>
        <p style="text-align:center; font-family:monospace;">P/E = Current Share Price / Earnings Per Share (EPS)</p>

        <p><strong>A worked example</strong></p>
        <p>Suppose a company's stock trades at ₹500, and its trailing 12-month EPS is ₹25. Its P/E is 500/25 = 20. This means investors are paying 20 times the company's current per-share earnings to own a piece of it — or, put differently, if the company kept generating exactly this same profit every year and paid it all out, it would take 20 years of earnings to "recoup" the price paid for the share.</p>

        <p><strong>What a high P/E can signal</strong></p>
        <p>A P/E well above the market average (say, 35-40+) most commonly means one of two things: either the market genuinely expects the company's earnings to grow rapidly in the future and is pricing that growth in ahead of time (very common for technology, new-age consumer internet, or early-stage high-growth companies) — or the stock has simply become overvalued relative to its actual current earnings, detached from fundamentals by hype or momentum. Distinguishing between these two requires looking well beyond the P/E number alone — at revenue growth trends, competitive positioning, and the broader sector.</p>

        <p><strong>What a low P/E can signal</strong></p>
        <p>A P/E well below the market average (say, under 10-12) can genuinely represent an undervalued bargain that the market hasn't fully appreciated yet — but it can equally reflect real, well-founded market concerns: a structurally declining industry, weakening competitive position, one-off accounting profits inflating the EPS temporarily, or looming regulatory/business risk. A low P/E is a prompt to investigate further, not an automatic buy signal.</p>

        <p><strong>The comparison trap — P/E only works relative to something</strong></p>
        <p>The single biggest mistake in reading P/E ratios is treating a number in isolation as universally "cheap" or "expensive." P/E is only meaningful when compared like-for-like:</p>
        <ul>
          <li><strong>Against the company's own historical average</strong> — is this stock trading unusually high or low relative to where it's typically traded over the past several years?</li>
          <li><strong>Against direct sector peers</strong> — a P/E of 40 might be entirely normal and even conservative for a fast-growing software company, while the same P/E of 40 for a traditional public-sector bank would be extraordinarily expensive, since banking and software carry fundamentally different structural growth rates, margins, and capital requirements.</li>
          <li><strong>Against the broader index</strong> — comparing a stock's P/E to the Nifty 50 or Sensex average gives a sense of whether it's trading at a premium or discount to "the market" as a whole, though this too needs sector context.</li>
        </ul>

        <p><strong>What P/E doesn't tell you</strong></p>
        <p>P/E says nothing about a company's debt levels, cash flow quality, growth trajectory, or the sustainability of its current earnings. Two companies can have an identical P/E of 20 while one is a fundamentally much safer, more predictable business than the other — P/E is a starting point for valuation discussion, never a complete answer on its own.</p>
      `,
    },
    {
      id: "exp-mf-factsheet",
      category: "mf",
      title: "What does a mutual fund factsheet actually tell you?",
      readTime: "7 min read",
      difficulty: "Intermediate",
      body: `
        <p>A mutual fund factsheet is a standardized document every fund house (AMC) publishes monthly, and it's genuinely the fastest way to evaluate a fund properly — well beyond just glancing at its headline 1-year return. Here's what each major section actually tells you, and why it matters.</p>

        <p><strong>NAV (Net Asset Value)</strong></p>
        <p>This is the fund's per-unit price, declared daily after market close. A very common misconception is treating NAV like a stock price — assuming a fund with NAV ₹500 is somehow "more expensive" or "better performing" than one with NAV ₹50. This is incorrect: NAV is simply total fund assets divided by total units outstanding, an accounting artifact of how many units have been issued. What actually matters is the <em>percentage growth</em> in NAV over time, not its absolute level.</p>

        <p><strong>AUM (Assets Under Management)</strong></p>
        <p>This is the total money the fund currently manages across all its investors. A larger AUM often signals broader investor trust and platform longevity, but it cuts both ways — in small-cap or mid-cap categories specifically, a very large AUM can make it structurally harder for a fund manager to enter or exit stock positions without moving the price against themselves, since smaller companies have limited available trading volume.</p>

        <p><strong>Expense Ratio</strong></p>
        <p>This is the annual fee the fund charges, expressed as a percentage of your invested assets, covering management, research, and administrative costs. It's deducted continuously from the fund's NAV, so you never see it as a separate transaction — but it compounds against you every single year. A seemingly small difference of even 1% in expense ratio can translate into a meaningfully large gap in your final corpus over a 15-20 year horizon, purely from the effect of compounding. <strong>Direct plans</strong> always carry a lower expense ratio than <strong>Regular plans</strong> for the identical underlying scheme, since Direct plans cut out the distributor commission that Regular plans pay to whoever sold you the fund.</p>

        <p><strong>Portfolio holdings & sector allocation</strong></p>
        <p>This section lists exactly which stocks (or bonds, for debt funds) the fund currently holds, and what percentage of the portfolio each one represents, along with a sector-wise breakdown. This is the best tool for checking whether a fund's actual holdings match what its name and stated category imply — a "Flexi Cap" fund that's actually 70% concentrated in large-caps, for instance, isn't really behaving the way its category name suggests.</p>

        <p><strong>Riskometer</strong></p>
        <p>A SEBI-mandated visual gauge running from "Low" to "Very High" risk, standardized in format across every fund house so investors can compare risk levels at a glance without reading through dense documentation. It's a helpful sanity check, though it's a fairly coarse categorization and shouldn't replace looking at the fund's actual volatility history and holdings.</p>

        <p><strong>Rolling returns and benchmark comparison</strong></p>
        <p>Rather than quoting a single "1-year return" or "5-year return" figure — both of which can be flattered or distorted purely by the luck of which exact start and end date you happen to pick — rolling returns measure performance across many overlapping periods (for example, every possible 3-year window within the past decade). This gives a far more honest sense of how <em>consistently</em> a fund has performed relative to its benchmark index across different market cycles, rather than relying on one cherry-pickable snapshot.</p>

        <p><strong>Putting it together</strong></p>
        <p>A fund with a great 1-year return but a high expense ratio, holdings that don't match its stated category, and weak rolling returns relative to its benchmark is a very different (and generally worse) proposition than one with a modest 1-year number but low costs, consistent benchmark-beating rolling returns, and holdings that clearly reflect its strategy. The factsheet is what lets you tell these two apart — the headline return number alone cannot.</p>
      `,
    },
  ],
  
  fundsCatalog: [
    { id: "f1", name: "HDFC Nifty 50 Index Fund", category: "mf", subCategory: "index", risk: "High", ret1y: "16.8%", ret3y: "14.2%", aum: "8,940 Cr", bg: "#1e3a8a", initials: "HDFC" },
    { id: "f2", name: "Parag Parikh Flexi Cap Fund", category: "mf", subCategory: "equity", risk: "High", ret1y: "21.4%", ret3y: "17.8%", aum: "48,500 Cr", bg: "#065f46", initials: "PP" },
    { id: "f3", name: "SBI Bluechip Direct Fund", category: "mf", subCategory: "equity", risk: "High", ret1y: "14.2%", ret3y: "13.6%", aum: "38,200 Cr", bg: "#b91c1c", initials: "SBI" },
    { id: "f4", name: "ICICI Prudential Debt Fund", category: "mf", subCategory: "debt", risk: "Low-Moderate", ret1y: "7.2%", ret3y: "6.9%", aum: "12,400 Cr", bg: "#701a75", initials: "ICICI" },
    { id: "f5", name: "Kotak Equity Hybrid Fund", category: "mf", subCategory: "hybrid", risk: "Moderately High", ret1y: "12.8%", ret3y: "11.4%", aum: "15,800 Cr", bg: "#a21caf", initials: "K" },
    { id: "f6", name: "Quant Tax Saver Fund (ELSS)", category: "mf", subCategory: "elss", risk: "Very High", ret1y: "25.6%", ret3y: "22.3%", aum: "9,600 Cr", bg: "#854d0e", initials: "Q" },
    { id: "f9", name: "MMTC Digital Gold (24K)", category: "gold", subCategory: "gold", risk: "Low", ret1y: "14.8%", ret3y: "11.2%", aum: "PhonePe SafeGold", bg: "#b45309", initials: "DG" },
    { id: "f10", name: "HDFC Bank FD - 1 Year", category: "fd", subCategory: "debt", risk: "No risk", ret1y: "7.1%", ret3y: "7.0%", aum: "HDFC Bank", bg: "#312e81", initials: "HDFD" }
  ],
  
  quizQuestions: [
    {
      q: "What does XIRR capture that CAGR (Compound Annual Growth Rate) ignores?",
      a: "Irregular cash flows (SIPs/withdrawals) at different dates",
      options: [
        "Dividends re-invested automatically",
        "Irregular cash flows (SIPs/withdrawals) at different dates",
        "Impact of expense ratio charges",
        "The effect of capital gains tax"
      ],
      feedback: "XIRR stands for Extended Internal Rate of Return. Unlike CAGR, which only considers start and end values over a duration, XIRR factors in the exact dates of multiple cash inflows and outflows, making it correct for SIP evaluations."
    },
    {
      q: "If an equity investment drifts from 50% to 65% of your portfolio due to a bull run, what is the best risk mitigation action?",
      a: "Rebalance by selling some equity and buying debt",
      options: [
        "Hold it all; winners keep winning",
        "Sell everything and sit in cash",
        "Rebalance by selling some equity and buying debt",
        "Double down on riskier microcap stocks"
      ],
      feedback: "Rebalancing returns your portfolio back to its target asset allocation, keeping your risk alignment aligned with your risk tolerance profile instead of drifting into an over-leveraged state."
    },
    {
      q: "How does inflation affect a fixed deposit (FD) earning 7% interest when inflation is at 6%?",
      a: "Your real rate of return is roughly 1%",
      options: [
        "Your purchasing power grows by 7%",
        "Your real rate of return is roughly 1%",
        "You actually lose money in nominal terms",
        "Inflation doesn't affect fixed interest assets"
      ],
      feedback: "The real rate of return = Nominal interest - Inflation. Earning 7% nominally in an economy with 6% inflation means your purchasing power only increases by about 1%."
    }
  ],
  
  activeQuizIndex: 0,
  quizAnswersRecorded: []
};

// 2. Global Variables for UI components
let portfolioChart = null;

// 3. Page Switching & Navigation
let isAutoScrolling = false;

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  
  // Intercept normal tag clicks
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPageId = item.getAttribute('data-page');
      isAutoScrolling = true;
      navigateToPage(targetPageId);
      setTimeout(() => {
        isAutoScrolling = false;
      }, 800);
    });
  });

  // Handle in-page navigation clicks (elements with data-goto)
  document.addEventListener('click', (e) => {
    const targetLink = e.target.closest('[data-goto]');
    if (targetLink) {
      e.preventDefault();
      const pageId = targetLink.getAttribute('data-goto');
      isAutoScrolling = true;
      navigateToPage(pageId);
      setTimeout(() => {
        isAutoScrolling = false;
      }, 800);
    }
  });

  // Mobile hamburger menu
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileNavPanel = document.getElementById('mobile-nav-panel');
  if (mobileMenuToggle && mobileNavPanel) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileNavPanel.classList.toggle('active');
    });

    mobileNavPanel.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPageId = item.getAttribute('data-page');
        mobileNavPanel.classList.remove('active');
        isAutoScrolling = true;
        navigateToPage(targetPageId);
        setTimeout(() => {
          isAutoScrolling = false;
        }, 800);
      });
    });
  }

  // Handle URL hashes on reload
  window.addEventListener('load', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`${hash}-page`)) {
      navigateToPage(hash);
    } else {
      navigateToPage('hero');
    }
    renderAll();
    initScrollSpy();
  });
}

function navigateToPage(pageId) {
  closeProfilePage();

  const mobileNavPanel = document.getElementById('mobile-nav-panel');
  if (mobileNavPanel) mobileNavPanel.classList.remove('active');

  const navItems = document.querySelectorAll('.nav-item');
  const targetSection = document.getElementById(`${pageId}-page`);

  // Format Title
  let formattedTitle = pageId.charAt(0).toUpperCase() + pageId.slice(1);
  if (pageId === 'buddy') formattedTitle = 'Portfolio Analyzer';
  if (pageId === 'hero') formattedTitle = 'Home';

  const pageTitleElement = document.getElementById('current-page-title');
  if (pageTitleElement) {
    pageTitleElement.textContent = formattedTitle;
  }
  
  // Update active nav link
  navItems.forEach(nav => {
    const wasActive = nav.classList.contains('active');
    nav.classList.remove('active');
    if (nav.getAttribute('data-page') === pageId) {
      nav.classList.add('active');
      if (!wasActive) window.dispatchEvent(new Event('navActiveChanged'));
    }
  });

  document.querySelectorAll('.mobile-nav-item').forEach(nav => {
    nav.classList.toggle('active', nav.getAttribute('data-page') === pageId);
  });

  // Set window hash silently without page trigger loop
  window.history.pushState(null, null, `#${pageId}`);

  // Scroll to section
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  // Page specific re-initializations
  if (pageId === 'portfolio') {
    initPortfolioChart();
  }
}

// Profile is a standalone overlay page, separate from the continuous scroll flow
// of the rest of the app — it only opens/closes via the account chip, not the main nav.
function openProfilePage() {
  document.getElementById('profile-page').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProfilePage() {
  document.getElementById('profile-page').classList.remove('active');
  document.body.style.overflow = '';
}

function initScrollSpy() {
  const sections = document.querySelectorAll('.page');
  const navItems = document.querySelectorAll('.nav-item');
  
  const options = {
    root: null,
    rootMargin: '-85px 0px -60% 0px', // trigger when section occupies top area
    threshold: 0
  };
  
  const observer = new IntersectionObserver((entries) => {
    if (isAutoScrolling) return; // skip updating while smooth scrolling from click
    
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id.replace('-page', '');
        
        // Highlight corresponding nav item
        navItems.forEach(item => {
          if (item.getAttribute('data-page') === id) {
            if (!item.classList.contains('active')) {
              item.classList.add('active');
              window.dispatchEvent(new Event('navActiveChanged'));
            }
          } else {
            item.classList.remove('active');
          }
        });
        
        let formattedTitle = id.charAt(0).toUpperCase() + id.slice(1);
        if (id === 'buddy') formattedTitle = 'Portfolio Analyzer';
        if (id === 'hero') formattedTitle = 'Home';
        
        const pageTitleElement = document.getElementById('current-page-title');
        if (pageTitleElement) {
          pageTitleElement.textContent = formattedTitle;
        }
      }
    });
  }, options);
  
  sections.forEach(section => {
    observer.observe(section);
  });
}

// 4. Calculations Helpers
function formatRupee(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

// Helper to calculate total portfolio numbers
function calculatePortfolioMetrics() {
  let totalVal = 0;
  let totalInv = 0;
  
  state.holdings.forEach(h => {
    totalVal += h.currentValue;
    totalInv += h.invested;
  });
  
  const overallGainVal = totalVal - totalInv;
  const overallGainPct = (overallGainVal / totalInv) * 100;
  
  return {
    totalVal,
    totalInv,
    overallGainVal,
    overallGainPct
  };
}

// Target asset-class allocation per risk profile — same figures shown as
// prose on the Profile page's risk description.
const RISK_PROFILE_TARGETS = {
  Conservative: { equity: 30, debt: 60, gold: 10 },
  Moderate: { equity: 50, debt: 30, gold: 20 },
  Aggressive: { equity: 75, debt: 15, gold: 10 },
};

// Portfolio Health Score card: computed live from real holdings/goals/risk
// profile instead of the static demo numbers the markup ships with.
function renderPortfolioHealthScore() {
  const numEl = document.getElementById('health-score-num');
  if (!numEl) return;

  const { totalVal } = calculatePortfolioMetrics();

  // Diversification: Herfindahl-Hirschman Index across individual holdings
  // and across asset categories — fewer/more concentrated positions score lower.
  let diversificationScore10 = 0;
  if (totalVal > 0) {
    const holdingWeights = state.holdings.map(h => h.currentValue / totalVal);
    const hhiHoldings = holdingWeights.reduce((sum, w) => sum + w * w, 0);
    const effectiveHoldings = hhiHoldings > 0 ? 1 / hhiHoldings : 0;

    const categoryTotals = {};
    state.holdings.forEach(h => {
      categoryTotals[h.category] = (categoryTotals[h.category] || 0) + h.currentValue;
    });
    const categoryWeights = Object.values(categoryTotals).map(v => v / totalVal);
    const hhiCategories = categoryWeights.reduce((sum, w) => sum + w * w, 0);
    const effectiveCategories = hhiCategories > 0 ? 1 / hhiCategories : 0;

    const holdingsScore = Math.min(effectiveHoldings / 8, 1) * 50;
    const categoryScore = Math.min(effectiveCategories / 4, 1) * 50;
    diversificationScore10 = (holdingsScore + categoryScore) / 10;
  }

  // Risk Alignment: how closely actual equity/debt/gold allocation matches
  // the target mix for the user's stated risk profile.
  let riskAlignmentScore10 = 10;
  if (totalVal > 0) {
    let equityVal = 0, goldVal = 0, debtVal = 0;
    state.holdings.forEach(h => {
      if (h.category === 'equity' || h.category === 'mf') equityVal += h.currentValue;
      else if (h.category === 'gold') goldVal += h.currentValue;
      else debtVal += h.currentValue; // fd, nps, etc. treated as stable/debt-like
    });

    const actual = {
      equity: (equityVal / totalVal) * 100,
      debt: (debtVal / totalVal) * 100,
      gold: (goldVal / totalVal) * 100,
    };
    const target = RISK_PROFILE_TARGETS[state.user.riskProfile] || RISK_PROFILE_TARGETS.Moderate;
    const totalDrift = Math.abs(actual.equity - target.equity) + Math.abs(actual.debt - target.debt) + Math.abs(actual.gold - target.gold);
    riskAlignmentScore10 = Math.max(0, 10 - (totalDrift / 2) / 10);
  }

  // Goal Progress: average completion % across active goals.
  let goalProgressScore10 = 0;
  if (state.goals.length > 0) {
    const avgCompletionPct = state.goals.reduce((sum, g) => sum + Math.min(g.saved / g.target, 1) * 100, 0) / state.goals.length;
    goalProgressScore10 = avgCompletionPct / 10;
  }

  const overall = (diversificationScore10 + riskAlignmentScore10 + goalProgressScore10) / 3;

  let healthLabel = 'Poor Health';
  if (overall >= 7.5) healthLabel = 'Good Health';
  else if (overall >= 5) healthLabel = 'Needs Improvement';

  numEl.textContent = overall.toFixed(1);
  document.getElementById('health-score-txt').textContent = healthLabel;

  document.getElementById('health-score-div').textContent = `${diversificationScore10.toFixed(1)}/10`;
  document.getElementById('health-bar-div').style.width = `${diversificationScore10 * 10}%`;

  document.getElementById('health-score-risk').textContent = `${riskAlignmentScore10.toFixed(1)}/10`;
  document.getElementById('health-bar-risk').style.width = `${riskAlignmentScore10 * 10}%`;

  document.getElementById('health-score-goals').textContent = `${goalProgressScore10.toFixed(1)}/10`;
  document.getElementById('health-bar-goals').style.width = `${goalProgressScore10 * 10}%`;
}

// 5. Render Core Components

// A. Update Dashboard Numbers and Stats (New Agent Bento Grid)
function renderDashboard() {
  const metrics = calculatePortfolioMetrics();
  
  // Nudge logic
  const isNudgeClosed = localStorage.getItem('nudge-dismissed-rebalance') === 'true';
  const nudgeCard = document.getElementById('dashboard-nudge');
  if (nudgeCard) {
    nudgeCard.style.display = isNudgeClosed ? 'none' : 'flex';
  }
  
  // Update greeting dynamically based on the current time of day
  const now = new Date();
  const hours = now.getHours();
  let greetingWord = "Good morning";
  if (hours >= 12 && hours < 17) {
    greetingWord = "Good afternoon";
  } else if (hours >= 17) {
    greetingWord = "Good evening";
  }
  
  const greetingEl = document.getElementById('dashboard-greeting');
  if (greetingEl) {
    greetingEl.textContent = `${greetingWord}, ${state.user.firstName || 'User'}`;
  }
  
  const dateEl = document.getElementById('dashboard-date');
  if (dateEl) {
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', dateOptions);
  }

  const phoneGreetingHi = document.querySelector('.phone-greeting-hi');
  if (phoneGreetingHi) {
    phoneGreetingHi.textContent = `Hello, ${state.user.firstName || 'User'} 👋`;
  }

  const phoneAvatar = document.querySelector('.phone-avatar-circle');
  if (phoneAvatar && state.user.fullName) {
    phoneAvatar.textContent = state.user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  renderCard1AssetFlow();
  renderCard2Metrics(metrics);
  renderCard3Transactions();
  renderCard4Allocation(metrics.totalVal);
  renderCard5TopHoldings(metrics.totalVal);
}

// Card 1: Asset Flow SVG Graph
let flowInterval;
function renderCard1AssetFlow() {
  const container = document.getElementById('card1-visual');
  if (!container) return;
  
  container.innerHTML = `
    <svg class="w-full h-full" style="width:100%; height:100%; min-height:220px;" viewBox="0 0 340 210" preserveAspectRatio="xMidYMid meet">
      <!-- Clean Grid Pattern -->
      <pattern id="clean-grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.2" fill="#cbd5e1"></circle>
      </pattern>
      <rect width="100%" height="100%" fill="url(#clean-grid)"></rect>
      
      <!-- Connectors with smooth paths -->
      <path d="M 75 105 C 120 105, 120 105, 155 105" fill="none" stroke="#94a3b8" stroke-width="2.2" stroke-dasharray="5 5"/>
      <path d="M 175 105 C 210 105, 210 42, 245 42" fill="none" stroke="#94a3b8" stroke-width="2.2" stroke-dasharray="5 5"/>
      <path d="M 175 105 C 210 105, 210 105, 245 105" fill="none" stroke="#94a3b8" stroke-width="2.2" stroke-dasharray="5 5"/>
      <path d="M 175 105 C 210 105, 210 168, 245 168" fill="none" stroke="#94a3b8" stroke-width="2.2" stroke-dasharray="5 5"/>
      
      <!-- Source Node P -->
      <foreignObject x="32" y="83" width="46" height="46" class="overflow-visible">
        <div style="width:44px; height:44px; border-radius:14px; background:linear-gradient(135deg, #2563eb, #1d4ed8); color:#ffffff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; box-shadow:0 4px 14px rgba(37,99,235,0.35); border:1px solid rgba(255,255,255,0.4);">
          P
        </div>
      </foreignObject>
      
      <!-- Router Node -->
      <foreignObject x="153" y="93" width="26" height="26" class="overflow-visible">
        <div id="router-node" style="width:24px; height:24px; border-radius:50%; border:2px solid #2563eb; background:#ffffff; box-shadow:0 2px 10px rgba(37,99,235,0.25); display:flex; align-items:center; justify-content:center; transition:all 0.3s;">
           <div style="width:8px; height:8px; border-radius:50%; background:#2563eb;"></div>
        </div>
      </foreignObject>
      
      <!-- Target Asset Nodes -->
      <foreignObject x="245" y="22" width="60" height="44" class="overflow-visible">
        <div class="flow-node" style="width:54px; height:40px; border-radius:12px; background:linear-gradient(135deg, #10b981, #059669); color:#ffffff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; box-shadow:0 4px 12px rgba(16,185,129,0.3); transition:transform 0.3s; border:1px solid rgba(255,255,255,0.4);">
          EQ
        </div>
      </foreignObject>
      
      <foreignObject x="245" y="85" width="60" height="44" class="overflow-visible">
        <div class="flow-node" style="width:54px; height:40px; border-radius:12px; background:linear-gradient(135deg, #f59e0b, #d97706); color:#ffffff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; box-shadow:0 4px 12px rgba(245,158,11,0.3); transition:transform 0.3s; border:1px solid rgba(255,255,255,0.4);">
          GD
        </div>
      </foreignObject>
      
      <foreignObject x="245" y="148" width="60" height="44" class="overflow-visible">
        <div class="flow-node" style="width:54px; height:40px; border-radius:12px; background:linear-gradient(135deg, #8b5cf6, #7c3aed); color:#ffffff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; box-shadow:0 4px 12px rgba(139,92,246,0.3); transition:transform 0.3s; border:1px solid rgba(255,255,255,0.4);">
          DB
        </div>
      </foreignObject>
    </svg>
  `;
  
  if (flowInterval) clearInterval(flowInterval);
  let step = 0;
  const nodes = container.querySelectorAll('.flow-node');
  flowInterval = setInterval(() => {
    if(nodes.length === 0) return;
    nodes.forEach(n => n.style.transform = 'scale(1)');
    if (nodes[step]) nodes[step].style.transform = 'scale(1.16)';
    step = (step + 1) % nodes.length;
  }, 2000);
}

// Card 2: Portfolio Metrics
function renderCard2Metrics(metrics) {
  const row = document.getElementById('card2-metrics-row');
  const bars = document.getElementById('card2-bars');
  const labels = document.getElementById('card2-labels');
  if (!row || !bars || !labels) return;
  
  const gainColor = metrics.overallGainVal >= 0 ? '#059669' : '#dc2626';
  const gainBg = metrics.overallGainVal >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
  const gainSign = metrics.overallGainVal >= 0 ? '+' : '';
  
  row.innerHTML = `
    <div class="metric-box">
      <div class="metric-box-inner active">
        <div style="display:flex; flex-direction:column; min-width:0;">
          <span style="font-size:10px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.08em;">Total Value</span>
          <span style="font-size:15px; font-weight:800; color:#0f172a; margin-top:2px;">${formatRupee(metrics.totalVal)}</span>
          <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
            <span style="font-size:10px; font-weight:800; color:${gainColor}; background:${gainBg}; padding:2px 6px; border-radius:6px;">${gainSign}${metrics.overallGainPct.toFixed(2)}%</span>
            <span style="font-size:10px; font-weight:600; color:#64748b;">overall</span>
          </div>
        </div>
      </div>
    </div>
    <div class="metric-box">
      <div class="metric-box-inner">
        <div style="display:flex; flex-direction:column; min-width:0;">
          <span style="font-size:10px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.08em;">Total Invested</span>
          <span style="font-size:15px; font-weight:800; color:#0f172a; margin-top:2px;">${formatRupee(metrics.totalInv)}</span>
          <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
            <span style="font-size:10px; font-weight:800; color:#7c3aed; background:rgba(139,92,246,0.12); padding:2px 6px; border-radius:6px;">14.8%</span>
            <span style="font-size:10px; font-weight:600; color:#64748b;">XIRR</span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Generate random daily bars
  const heights = [40, 55, 45, 75, 60, 85, 95];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  
  bars.innerHTML = '';
  labels.innerHTML = '';
  heights.forEach((h, i) => {
    bars.innerHTML += `
      <div class="metric-bar">
        <div class="metric-bar-fill" style="height:0%;" data-target="${h}%"></div>
      </div>
    `;
    labels.innerHTML += `<span>${days[i]}</span>`;
  });
  
  // Animate bars on load
  setTimeout(() => {
    bars.querySelectorAll('.metric-bar-fill').forEach(fill => {
      fill.style.height = fill.getAttribute('data-target');
    });
  }, 100);
}

// Card 3: Recent Transactions Stack
let txInterval;
function renderCard3Transactions() {
  const stack = document.getElementById('card3-stack');
  if (!stack) return;
  
  const recent = state.transactions.slice(0, 5);
  stack.innerHTML = '';
  
  recent.forEach((t, i) => {
    const isBuy = t.type === 'BUY';
    const color = isBuy ? '#059669' : '#dc2626';
    const bgBadge = isBuy ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';
    
    const div = document.createElement('div');
    div.className = 'tx-item';
    div.innerHTML = `
      <div class="tx-item-icon" style="background:${isBuy ? '#10b981' : '#ef4444'};">
        <i data-lucide="${isBuy ? 'arrow-down-left' : 'arrow-up-right'}" style="width:18px; height:18px;"></i>
      </div>
      <div class="tx-item-content">
        <div class="tx-item-top">
          <span class="tx-item-name">${t.assetName}</span>
          <span class="tx-item-status" style="background:${bgBadge}; color:${color};">${t.type}</span>
        </div>
        <div class="tx-item-desc">${t.typeLabel} · ${t.units} units</div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px;">
        <span style="font-size:12px; font-weight:800; color:${color};">${isBuy?'+':'-'}${formatRupee(t.amount)}</span>
        <span class="tx-item-time">${t.date}</span>
      </div>
    `;
    stack.appendChild(div);
  });
  lucide.createIcons();
  
  if (txInterval) clearInterval(txInterval);
  let activeIdx = 0;
  
  const updateStack = () => {
    const items = Array.from(stack.children);
    items.forEach((item, i) => {
      let slot = i - activeIdx;
      const N = items.length;
      if (slot > Math.floor(N / 2)) slot -= N;
      if (slot < -Math.floor(N / 2)) slot += N;
      
      const abs = Math.abs(slot);
      const isVisible = abs <= 2;
      const yOffset = slot === 0 ? 0 : slot === 1 ? 48 : slot === 2 ? 88 : slot === -1 ? -48 : slot === -2 ? -88 : 150;
      const scale = slot === 0 ? 1 : abs === 1 ? 0.94 : 0.88;
      const opacity = slot === 0 ? 1 : abs === 1 ? 0.75 : 0.45;
      const zIndex = slot === 0 ? 30 : abs === 1 ? 20 : 10;
      
      item.style.transform = `translateY(${yOffset}px) scale(${scale})`;
      item.style.opacity = isVisible ? opacity : 0;
      item.style.zIndex = zIndex;
    });
    activeIdx = (activeIdx + 1) % items.length;
  };
  
  updateStack();
  txInterval = setInterval(updateStack, 2500);
}

// Card 4: Asset Allocation
let allocInterval;
function renderCard4Allocation(totalVal) {
  const barsList = document.getElementById('card4-bars-list');
  const logList = document.getElementById('card4-log-list');
  if (!barsList || !logList) return;
  
  const categories = {
    equity: { name: "Equities", val: 0, color: "#2563eb" },
    mf: { name: "Mutual Funds", val: 0, color: "#10b981" },
    gold: { name: "Digital Gold", val: 0, color: "#f59e0b" },
    fd: { name: "Fixed Deposits", val: 0, color: "#8b5cf6" }
  };
  
  state.holdings.forEach(h => {
    if (h.category === 'nps') categories.fd.val += h.currentValue;
    else if (categories[h.category]) categories[h.category].val += h.currentValue;
  });
  
  barsList.innerHTML = '';
  Object.keys(categories).forEach(k => {
    const cat = categories[k];
    const pct = totalVal > 0 ? (cat.val / totalVal) * 100 : 0;
    
    barsList.innerHTML += `
      <div class="alloc-row" data-cat="${k}">
        <div class="alloc-icon" style="color:${cat.color};"><i data-lucide="layers" style="width:16px;"></i></div>
        <div class="alloc-name">${cat.name}</div>
        <div class="alloc-track">
          <div class="alloc-fill" style="background:${cat.color};" data-w="${pct}%"></div>
        </div>
        <div class="alloc-val">${pct.toFixed(0)}%</div>
      </div>
    `;
  });
  lucide.createIcons();
  
  setTimeout(() => {
    barsList.querySelectorAll('.alloc-fill').forEach(fill => {
      fill.style.width = fill.getAttribute('data-w');
    });
  }, 100);
  
  // Cycle active state
  if(allocInterval) clearInterval(allocInterval);
  let idx = 0;
  const rows = barsList.querySelectorAll('.alloc-row');
  allocInterval = setInterval(() => {
    rows.forEach(r => {
      r.classList.remove('active');
      const icon = r.querySelector('.alloc-icon');
      if(icon) {
        icon.style.background = '#f8fafc';
        icon.style.color = '#64748b';
      }
    });
    if(rows[idx]) {
      rows[idx].classList.add('active');
      const catKey = rows[idx].getAttribute('data-cat');
      const cat = categories[catKey];
      if (cat) {
        const icon = rows[idx].querySelector('.alloc-icon');
        if (icon) {
          icon.style.background = cat.color;
          icon.style.color = '#ffffff';
        }
      }
    }
    idx = (idx + 1) % rows.length;
  }, 2000);
  
  // Top movers log
  const movers = [...state.holdings].sort((a,b) => b.returnPct - a.returnPct).slice(0, 4);
  logList.innerHTML = '';
  movers.forEach(m => {
    logList.innerHTML += `
      <div class="log-item">
        <div class="log-item-top">
          <span class="log-badge" style="background:rgba(16,185,129,0.12); color:#059669;">+${m.returnPct.toFixed(1)}%</span>
          <span class="log-time">${m.category.toUpperCase()}</span>
        </div>
        <div class="log-text">${m.name}</div>
      </div>
    `;
  });
}

// Card 5: Top Holdings
function renderCard5TopHoldings(totalVal) {
  const grid = document.getElementById('card5-grid');
  if (!grid) return;
  
  const top = [...state.holdings].sort((a, b) => b.currentValue - a.currentValue).slice(0, 4);
  grid.innerHTML = '';
  
  const colors = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6"];
  
  top.forEach((h, i) => {
    const color = colors[i % colors.length];
    const pct = totalVal > 0 ? (h.currentValue / totalVal) * 100 : 0;
    
    grid.innerHTML += `
      <div class="holding-card">
        <div class="hc-top">
          <div class="hc-icon" style="background:${color};"><i data-lucide="briefcase" style="width:15px;"></i></div>
          <div class="hc-val-col">
            <span class="hc-val">${formatRupee(h.currentValue)}</span>
            <span class="hc-sub">Valuation</span>
          </div>
        </div>
        <div class="hc-bot">
          <div class="hc-bot-text">
            <span class="hc-name">${h.shortName}</span>
            <span class="hc-ret" style="color:${h.returnPct>=0?'#059669':'#dc2626'}; font-weight:800;">${h.returnPct>=0?'+':''}${h.returnPct.toFixed(1)}%</span>
          </div>
          <div class="hc-track">
            <div class="hc-fill" style="background:${color};" data-w="${pct}%"></div>
          </div>
        </div>
      </div>
    `;
  });
  lucide.createIcons();
  
  setTimeout(() => {
    grid.querySelectorAll('.hc-fill').forEach(fill => {
      fill.style.width = fill.getAttribute('data-w');
    });
  }, 100);
}

// B. Portfolio View Render
function renderPortfolioBreakdown() {
  const tbody = document.getElementById('portfolio-holdings-table-body');
  tbody.innerHTML = '';
  
  // Sort settings
  const sortSelect = document.getElementById('portfolio-sort-select');
  const activeSort = sortSelect ? sortSelect.value : 'value';
  
  // Filter settings
  const activeTab = document.querySelector('.filter-tab.active');
  const activeFilter = activeTab ? activeTab.getAttribute('data-filter') : 'all';
  
  let filtered = [...state.holdings];
  if (activeFilter !== 'all') {
    filtered = filtered.filter(h => h.category === activeFilter);
  }
  
  // Apply Sort
  if (activeSort === 'value') {
    filtered.sort((a, b) => b.currentValue - a.currentValue);
  } else if (activeSort === 'return') {
    filtered.sort((a, b) => b.returnPct - a.returnPct);
  } else if (activeSort === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:32px; color:var(--text-muted);">No holdings in this asset class.</td></tr>`;
    return;
  }
  
  filtered.forEach(h => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="portfolio-asset-info">
          <div class="portfolio-asset-logo ${h.category}" style="position:relative; overflow:hidden;">
            <span>${h.shortName.substring(0, 4)}</span>
            ${h.logoUrl ? `<img src="${h.logoUrl}" alt="" loading="lazy" onerror="this.remove()" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain; background:#fff; padding:4px;">` : ''}
          </div>
          <div style="min-width:0;">
            <div style="font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${h.name}">${h.name}</div>
            <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:2px;">${h.category.toUpperCase()} · Invested ${formatRupee(h.invested)}</div>
          </div>
        </div>
      </td>
      <td style="text-align:right; font-weight:700;">
        ${formatRupee(h.currentValue)}
      </td>
      <td style="text-align:right;">
        <span class="badge ${h.returnPct >= 0 ? 'badge-success' : 'badge-danger'}">
          ${h.returnPct >= 0 ? '+' : ''}${h.returnPct.toFixed(2)}%
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// C. Invest View Render
let lastEquitySearchResults = [];
let lastMutualFundSearchResults = [];
let catalogSearchQuery = ''; // free-text filter for the gold/fd tabs (client-side, mock data)

function renderInvestCatalog() {
  const grid = document.getElementById('invest-funds-grid');
  grid.innerHTML = '';

  // Category tab
  const activeTab = document.querySelector('#invest-category-tabs .filter-tab.active');
  const category = activeTab ? activeTab.getAttribute('data-category') : 'equity';

  if (category === 'equity') {
    const searchInputEl = document.getElementById('invest-stock-search-input');
    const hasLiveQuery = searchInputEl && searchInputEl.value.trim().length > 0;
    if (hasLiveQuery) {
      renderEquityResults(lastEquitySearchResults);
      return;
    }
    // No search yet — show the curated live equity catalog (real Yahoo Finance data).
    renderCuratedEquityCatalog();
    return;
  }

  if (category === 'mf') {
    const searchInputEl = document.getElementById('invest-stock-search-input');
    const hasLiveQuery = searchInputEl && searchInputEl.value.trim().length > 0;
    if (hasLiveQuery) {
      renderMutualFundResults(lastMutualFundSearchResults);
      return;
    }
    // No search yet — show the curated live fund catalog (real Yahoo Finance data).
    renderCuratedMutualFundCatalog();
    return;
  }

  if (category === 'gold') {
    renderCuratedGoldCatalog();
    return;
  }

  // Sub filter chip
  const activeChip = document.querySelector('#invest-sub-filters .chip-btn.active');
  const subFilter = activeChip ? activeChip.getAttribute('data-sub') : 'all';

  let catalog = state.fundsCatalog.filter(f => f.category === category);

  if (category === 'mf' && subFilter !== 'all') {
    catalog = catalog.filter(f => f.subCategory === subFilter);
  }

  if (catalogSearchQuery) {
    catalog = catalog.filter(f => f.name.toLowerCase().includes(catalogSearchQuery));
  }

  if (!catalog.length) {
    grid.innerHTML = `
      <div class="glass-card b-c4 b-r1" style="text-align:center; padding:32px; color:var(--text-muted);">
        No results found${catalogSearchQuery ? ` for "${catalogSearchQuery}"` : ''}.
      </div>
    `;
    return;
  }

  catalog.forEach((fund) => {
    const card = document.createElement('div');

    card.className = `glass-card fund-card b-c2 b-r1`;
    card.innerHTML = `
      <div>
        <div class="fund-header">
          <div class="fund-logo" style="background:${fund.bg}">${fund.initials}</div>
          <div class="fund-identity">
            <h5 class="fund-title">${fund.name}</h5>
            <span class="fund-category">${fund.category.toUpperCase()} · ${fund.risk}</span>
          </div>
        </div>
        
        <div class="fund-grid-stats">
          <div class="fund-stat-item">
            <span class="fund-stat-label">1Y return</span>
            <span class="fund-stat-val up">${fund.ret1y}</span>
          </div>
          <div class="fund-stat-item">
            <span class="fund-stat-label">3Y return</span>
            <span class="fund-stat-val up">${fund.ret3y}</span>
          </div>
          <div class="fund-stat-item">
            <span class="fund-stat-label">AUM</span>
            <span class="fund-stat-val">${fund.aum}</span>
          </div>
        </div>
      </div>
      
      <button class="btn btn-primary invest-buy-btn" data-fund-id="${fund.id}" style="width:100%; justify-content:center;">
        Invest Now
      </button>
    `;
    grid.appendChild(card);
  });
  
  // Setup CTA events
  document.querySelectorAll('.invest-buy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fundId = btn.getAttribute('data-fund-id');
      const fund = state.fundsCatalog.find(f => f.id === fundId);
      openInvestCheckoutModal(fund);
    });
  });
}

// C2. Live Equity Search Results Render (real stocks, no mock data)
function renderEquityResults(stocks) {
  const grid = document.getElementById('invest-funds-grid');
  grid.innerHTML = '';

  if (!stocks.length) {
    grid.innerHTML = `
      <div class="glass-card b-c4 b-r1" style="text-align:center; padding:32px; color:var(--text-muted);">
        Search for a stock symbol or company name above to see live prices.
      </div>
    `;
    return;
  }

  stocks.forEach((stock) => {
    const card = document.createElement('div');
    const bentoClass = 'b-c2 b-r1';

    const isUp = stock.changePercent >= 0;

    card.className = `glass-card fund-card ${bentoClass}`;
    card.style.cursor = 'pointer';
    card.title = 'View price chart';
    card.innerHTML = `
      <div>
        <div class="fund-header">
          <div class="fund-logo" style="background:#4f46e5; position:relative; overflow:hidden;">
            <span>${stock.symbol.slice(0, 2)}</span>
            ${stock.logoUrl ? `<img src="${stock.logoUrl}" alt="" loading="lazy" onerror="this.remove()" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain; background:#fff; padding:4px;">` : ''}
          </div>
          <div class="fund-identity">
            <h5 class="fund-title">${stock.name}</h5>
            <span class="fund-category">${stock.symbol} · ${stock.exchange || 'LIVE'}</span>
          </div>
        </div>

        <div class="fund-grid-stats">
          <div class="fund-stat-item">
            <span class="fund-stat-label">Price</span>
            <span class="fund-stat-val">${stock.price != null ? formatRupee(stock.price) : '—'}</span>
          </div>
          <div class="fund-stat-item">
            <span class="fund-stat-label">Change</span>
            <span class="fund-stat-val ${isUp ? 'up' : 'down'}">${stock.changePercent != null ? stock.changePercent.toFixed(2) + '%' : '—'}</span>
          </div>
          <div class="fund-stat-item">
            <span class="fund-stat-label">Type</span>
            <span class="fund-stat-val">${stock.type || 'EQUITY'}</span>
          </div>
        </div>
      </div>

      <button class="btn btn-primary invest-stock-buy-btn" data-symbol="${stock.symbol}" style="width:100%; justify-content:center;">
        Invest Now
      </button>
    `;

    card.addEventListener('click', () => openStockChartModal(stock));

    grid.appendChild(card);
  });

  document.querySelectorAll('.invest-stock-buy-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // don't also trigger the card's chart-open click
      const symbol = btn.getAttribute('data-symbol');
      const stock = stocks.find((s) => s.symbol === symbol);
      if (stock) openBrokerChoiceModal(stock);
    });
  });
}

// Strips the Yahoo-style exchange suffix (.NS/.BO) so we're left with the
// plain ticker brokers use in their own search/URLs (e.g. RELIANCE.NS -> RELIANCE).
function bareSymbol(symbol) {
  return (symbol || '').split('.')[0];
}

// Groww's stock pages live at groww.in/stocks/<company-slug>, e.g.
// "ICICI Bank Limited" -> "icici-bank-ltd". Derived from the company name
// since Groww's slug isn't the ticker symbol.
function growwSlug(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\blimited\b/g, 'ltd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// "Invest Now" on a live stock/gold-ETF/mutual-fund card -> let the user pick
// which broker to place the actual order with, then deep-link to that
// instrument on the broker's site. `assetType` is 'equity' (stocks & gold
// ETFs, both traded on NSE) or 'mf' (mutual fund schemes).
function openBrokerChoiceModal(item, assetType = 'equity') {
  const symbol = bareSymbol(item.symbol);
  document.getElementById('broker-choice-stock-name').textContent = item.name;
  document.getElementById('broker-choice-stock-symbol').textContent = symbol;

  const zerodhaBtn = document.getElementById('broker-choice-zerodha');
  const growwBtn = document.getElementById('broker-choice-groww');
  const zerodhaSubtitle = zerodhaBtn.querySelector('small');
  const close = () => document.getElementById('modal-broker-choice').classList.remove('active');

  if (assetType === 'mf') {
    // Coin's fund URLs are keyed by ISIN (coin.zerodha.com/mf/fund/<ISIN>/<slug>),
    // which our catalog data doesn't include, so there's no way to deep-link a
    // specific scheme — send the user to Coin's mutual fund search instead.
    zerodhaSubtitle.textContent = 'Search on Coin';
    zerodhaBtn.onclick = () => {
      window.open('https://coin.zerodha.com/mf', '_blank', 'noopener');
      close();
    };
    // Groww's mutual fund pages are keyed by scheme name slug, same as their stock pages.
    growwBtn.onclick = () => {
      window.open(`https://groww.in/mutual-funds/${encodeURIComponent(growwSlug(item.name))}`, '_blank', 'noopener');
      close();
    };
  } else {
    zerodhaSubtitle.textContent = 'Open via Kite';
    zerodhaBtn.onclick = () => {
      const exchange = (item.exchange || 'NSE').toUpperCase();
      const segment = item.type === 'GOLD ETF' ? 'etf' : 'stocks';
      window.open(`https://zerodha.com/markets/${segment}/${encodeURIComponent(exchange)}/${encodeURIComponent(symbol)}/`, '_blank', 'noopener');
      close();
    };
    growwBtn.onclick = () => {
      const segment = item.type === 'GOLD ETF' ? 'etfs' : 'stocks';
      window.open(`https://groww.in/${segment}/${encodeURIComponent(growwSlug(item.name))}`, '_blank', 'noopener');
      close();
    };
  }

  document.getElementById('modal-broker-choice').classList.add('active');
}

// Factory for "curated live catalog" tabs: fetch once from a real backend
// endpoint, cache the result, and re-render from cache on subsequent visits
// to that tab. `requireNoLiveQuery: true` means this category also has its
// own live search override (equity/mf) — the fetched catalog is only painted
// if the user hasn't since typed into the search box, so a slow response
// can't clobber live search results that arrived first.
function createCuratedCatalogLoader({ category, fetchFn, renderFn, label, requireNoLiveQuery = false }) {
  let cache = null;
  let promise = null;

  return function load(filterQuery) {
    const grid = document.getElementById('invest-funds-grid');

    const paint = (items) => {
      const filtered = filterQuery
        ? items.filter((i) => i.name.toLowerCase().includes(filterQuery))
        : items;
      renderFn(filtered);
    };

    if (cache) {
      paint(cache);
      return;
    }

    grid.innerHTML = `
      <div class="glass-card b-c4 b-r1" style="text-align:center; padding:32px; color:var(--text-muted);">
        Loading live ${label} data…
      </div>
    `;

    if (!promise) promise = fetchFn();

    promise
      .then((items) => {
        cache = items;
        const activeTab = document.querySelector('#invest-category-tabs .filter-tab.active');
        const stillOnCategory = activeTab && activeTab.getAttribute('data-category') === category;
        const searchInputEl = document.getElementById('invest-stock-search-input');
        const stillNoQuery = !requireNoLiveQuery || !(searchInputEl && searchInputEl.value.trim().length > 0);
        if (stillOnCategory && stillNoQuery) paint(items);
      })
      .catch(() => {
        promise = null;
        grid.innerHTML = `
          <div class="glass-card b-c4 b-r1" style="text-align:center; padding:32px; color:var(--text-muted);">
            Could not load live ${label} data right now. Please try again.
          </div>
        `;
      });
  };
}

// Mutual Funds tab — hand-picked flagship funds (Yahoo's Indian MF search
// coverage is too inconsistent to query on the fly for a "browse" view).
const renderCuratedMutualFundCatalog = createCuratedCatalogLoader({
  category: 'mf',
  fetchFn: getMutualFundCatalog,
  renderFn: renderMutualFundResults,
  label: 'mutual fund',
  requireNoLiveQuery: true,
});

// Equities tab — curated large-cap NSE stocks shown before any search.
const renderCuratedEquityCatalog = createCuratedCatalogLoader({
  category: 'equity',
  fetchFn: getEquityCatalog,
  renderFn: renderEquityResults,
  label: 'equity',
  requireNoLiveQuery: true,
});

// Digital Gold tab — real Gold ETF quotes (no live search override here, so
// the search box just filters this cached catalog client-side by name).
const loadCuratedGoldCatalog = createCuratedCatalogLoader({
  category: 'gold',
  fetchFn: getGoldCatalog,
  renderFn: renderEquityResults,
  label: 'gold ETF',
});

function renderCuratedGoldCatalog() {
  loadCuratedGoldCatalog(catalogSearchQuery);
}

// Live Mutual Fund Search Results Render (real NAV/returns from Yahoo, no mock data)
function renderMutualFundResults(funds) {
  const grid = document.getElementById('invest-funds-grid');
  grid.innerHTML = '';

  if (!funds.length) {
    grid.innerHTML = `
      <div class="glass-card b-c4 b-r1" style="text-align:center; padding:32px; color:var(--text-muted);">
        Search for a mutual fund scheme name to see live NAV & returns.
      </div>
    `;
    return;
  }

  funds.forEach((fund) => {
    const card = document.createElement('div');
    const bentoClass = 'b-c2 b-r1';

    const isUp = fund.ytdReturn >= 0;

    card.className = `glass-card fund-card ${bentoClass}`;
    card.style.cursor = 'pointer';
    card.title = 'View NAV chart';
    card.innerHTML = `
      <div>
        <div class="fund-header">
          <div class="fund-logo" style="background:#059669; position:relative; overflow:hidden;">
            <span>${fund.symbol.slice(0, 2)}</span>
            ${fund.logoUrl ? `<img src="${fund.logoUrl}" alt="" loading="lazy" onerror="this.remove()" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain; background:#fff; padding:4px;">` : ''}
          </div>
          <div class="fund-identity">
            <h5 class="fund-title">${fund.name}</h5>
            <span class="fund-category">${fund.symbol} · ${fund.exchange || 'LIVE'}</span>
          </div>
        </div>

        <div class="fund-grid-stats">
          <div class="fund-stat-item">
            <span class="fund-stat-label">NAV</span>
            <span class="fund-stat-val">${fund.price != null ? formatRupee(fund.price) : '—'}</span>
          </div>
          <div class="fund-stat-item">
            <span class="fund-stat-label">YTD Return</span>
            <span class="fund-stat-val ${isUp ? 'up' : 'down'}">${fund.ytdReturn != null ? fund.ytdReturn.toFixed(2) + '%' : '—'}</span>
          </div>
          <div class="fund-stat-item">
            <span class="fund-stat-label">3M Return</span>
            <span class="fund-stat-val">${fund.threeMonthReturn != null ? fund.threeMonthReturn.toFixed(2) + '%' : '—'}</span>
          </div>
        </div>
      </div>

      <button class="btn btn-primary invest-mf-buy-btn" data-symbol="${fund.symbol}" style="width:100%; justify-content:center;">
        Invest Now
      </button>
    `;

    card.addEventListener('click', () => openStockChartModal(fund));

    grid.appendChild(card);
  });

  document.querySelectorAll('.invest-mf-buy-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const symbol = btn.getAttribute('data-symbol');
      const fund = funds.find((f) => f.symbol === symbol);
      if (fund) openBrokerChoiceModal(fund, 'mf');
    });
  });
}

// Stock Price Chart Modal
let stockChartInstance = null;
let activeChartSymbol = null;

function openStockChartModal(stock) {
  activeChartSymbol = stock.symbol;
  document.getElementById('stock-chart-title').textContent = `${stock.name} (${stock.symbol})`;
  document.getElementById('modal-stock-chart').classList.add('active');

  document.querySelectorAll('#stock-chart-range-tabs .chip-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === 0);
  });

  loadStockChart(stock.symbol, '1mo');
}

function loadStockChart(symbol, range) {
  const wrap = document.querySelector('.stock-chart-canvas-wrap');
  wrap.innerHTML = '<div class="stock-chart-loading">Loading price history…</div><canvas id="stockChartCanvas"></canvas>';
  document.getElementById('stockChartCanvas').style.display = 'none';

  getStockChart(symbol, { range })
    .then((data) => {
      if (activeChartSymbol !== symbol) return; // modal closed/changed before this resolved
      wrap.querySelector('.stock-chart-loading')?.remove();
      document.getElementById('stockChartCanvas').style.display = 'block';
      renderStockChartCanvas(data);
    })
    .catch((err) => {
      console.error('Failed to load chart:', err.message);
      if (activeChartSymbol === symbol) {
        wrap.innerHTML = '<div class="stock-chart-loading">Could not load price history.</div>';
      }
    });
}

function renderStockChartCanvas(data) {
  const ctx = document.getElementById('stockChartCanvas');
  if (!ctx) return;

  if (stockChartInstance) {
    stockChartInstance.destroy();
  }

  const labels = data.candles.map((c) => new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
  const closes = data.candles.map((c) => c.close);
  const isUp = closes.length > 1 && closes[closes.length - 1] >= closes[0];
  const strokeColor = isUp ? '#059669' : '#dc2626';

  const chartCtx = ctx.getContext('2d');
  const gradient = chartCtx.createLinearGradient(0, 0, 0, 280);
  gradient.addColorStop(0, hexToRgba(strokeColor, 0.15));
  gradient.addColorStop(1, hexToRgba(strokeColor, 0.0));

  stockChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: `Price (${data.currency || 'INR'})`,
        data: closes,
        borderColor: strokeColor,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: strokeColor,
        fill: true,
        backgroundColor: gradient,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: '#0f1422',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' } },
      },
    },
  });
}

function bindStockChartModalEvents() {
  const overlay = document.getElementById('modal-stock-chart');
  const closeBtn = document.getElementById('close-modal-stock-chart');

  const close = () => {
    overlay.classList.remove('active');
    activeChartSymbol = null;
  };

  if (closeBtn) closeBtn.addEventListener('click', close);

  document.querySelectorAll('#stock-chart-range-tabs .chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#stock-chart-range-tabs .chip-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (activeChartSymbol) loadStockChart(activeChartSymbol, btn.getAttribute('data-range'));
    });
  });
}

// Market Indices Ticker Strip (Dashboard)
function renderMarketIndices() {
  const strip = document.getElementById('market-indices-strip');
  if (!strip) return;

  getMarketIndices()
    .then((indices) => {
      strip.innerHTML = '';
      indices.forEach((idx) => {
        const isUp = idx.changePercent >= 0;
        const pill = document.createElement('div');
        pill.className = 'market-index-pill';
        pill.innerHTML = `
          <span class="market-index-name">${idx.name}</span>
          <span class="market-index-price">${idx.price != null ? idx.price.toLocaleString('en-IN') : '—'}</span>
          <span class="market-index-change ${isUp ? 'up' : 'down'}">${isUp ? '+' : ''}${idx.changePercent != null ? idx.changePercent.toFixed(2) : '0.00'}%</span>
        `;
        strip.appendChild(pill);
      });
    })
    .catch((err) => {
      console.error('Failed to load market indices:', err.message);
      strip.innerHTML = '<div class="market-indices-loading">Live market indices unavailable right now.</div>';
    });
}

// Shared debounced live-search runner for both the Equities and Mutual Funds
// tabs: search by name/symbol, then fetch a real quote for each result (search
// alone doesn't include price), guarding against stale responses if the tab or
// query changed before the request resolved.
const liveSearchDebounceTimers = {};

function runLiveSymbolSearch({ query, category, searchFn, onResults }) {
  clearTimeout(liveSearchDebounceTimers[category]);

  if (!query) {
    onResults([]);
    renderInvestCatalog();
    return;
  }

  liveSearchDebounceTimers[category] = setTimeout(() => {
    searchFn(query)
      .then((results) => {
        const currentTab = document.querySelector('#invest-category-tabs .filter-tab.active');
        if (!currentTab || currentTab.getAttribute('data-category') !== category) return;

        Promise.all(
          results.slice(0, 12).map((r) => getStockQuote(r.symbol).catch(() => null))
        ).then((quotes) => {
          onResults(quotes.filter(Boolean));
          renderInvestCatalog();
        });
      })
      .catch((err) => console.error(`${category} search failed:`, err.message));
  }, 300);
}

function initInvestStockSearch() {
  const input = document.getElementById('invest-stock-search-input');
  if (!input) return;

  input.addEventListener('input', () => {
    const activeTab = document.querySelector('#invest-category-tabs .filter-tab.active');
    const category = activeTab ? activeTab.getAttribute('data-category') : 'equity';

    // Digital Gold / Fixed Deposits are still mock data (no real backend for
    // these yet) — just filter the local array.
    if (category === 'gold' || category === 'fd') {
      catalogSearchQuery = input.value.trim().toLowerCase();
      renderInvestCatalog();
      return;
    }

    if (category === 'equity') {
      runLiveSymbolSearch({
        query: input.value.trim(),
        category: 'equity',
        searchFn: searchStocks,
        onResults: (quotes) => { lastEquitySearchResults = quotes; },
      });
      return;
    }

    if (category === 'mf') {
      runLiveSymbolSearch({
        query: input.value.trim(),
        category: 'mf',
        searchFn: searchMutualFunds,
        onResults: (quotes) => { lastMutualFundSearchResults = quotes; },
      });
      return;
    }
  });
}

// D. Goals View Render
function renderGoalsGrid() {
  const grid = document.getElementById('goals-cards-grid');
  grid.innerHTML = '';
  
  let totalActiveCount = state.goals.length;
  let totalTracked = state.goals.reduce((acc, g) => acc + g.target, 0);
  
  document.getElementById('goals-summary-text').textContent = `Active Targets: ${totalActiveCount} goals`;
  
  state.goals.forEach(goal => {
    const pct = Math.min((goal.saved / goal.target) * 100, 100);
    const card = document.createElement('div');
    card.className = 'glass-card goal-card';
    card.innerHTML = `
      <div class="goal-header">
        <div>
          <h5 class="goal-title">${goal.name}</h5>
          <span class="goal-target">Target year: ${goal.year}</span>
        </div>
        <div class="goal-icon-wrapper ${goal.icon}">
          ${getGoalEmoji(goal.icon)}
        </div>
      </div>
      
      <div class="goal-progress-box">
        <div class="goal-progress-stats">
          <span class="goal-percentage">${pct.toFixed(0)}% saved</span>
          <span class="goal-saved-ratio">${formatRupee(goal.saved)} of ${formatRupee(goal.target)}</span>
        </div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill ${goal.icon}" style="width:${pct}%;"></div>
        </div>
      </div>
      
      <div class="goal-footer">
        <div class="goal-sip-linked">SIP: <span>${formatRupee(goal.monthlySip)}/mo</span></div>
        <button class="btn btn-secondary add-goal-savings-btn" data-goal-id="${goal.id}" style="padding:6px 12px; font-size:0.75rem;">
          Add Capital
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
  
  // CTA for goal savings additions
  document.querySelectorAll('.add-goal-savings-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const gId = btn.getAttribute('data-goal-id');
      const goal = state.goals.find(g => g.id === gId);
      
      const amtStr = prompt(`Enter savings amount to deploy for target: ${goal.name}`, "10000");
      const amt = parseFloat(amtStr);
      if (!isNaN(amt) && amt > 0) {
        goal.saved += amt;
        
        // Append transaction & notify
        state.transactions.unshift({
          type: "BUY",
          assetName: `${goal.name} (Goal Savings Contribution)`,
          date: "Just Now",
          category: "mf",
          amount: amt,
          units: 1,
          price: amt,
          typeLabel: "Goal Contribution"
        });
        
        state.notifications.unshift({
          id: `n_goal_${Date.now()}`,
          type: "success",
          title: "Goal Updated",
          description: `Successfully allocated ${formatRupee(amt)} to your ${goal.name} target.`,
          time: "Just Now",
          unread: true
        });
        
        // Check milestone trigger
        if (goal.saved >= goal.target) {
          state.notifications.unshift({
            id: `n_goal_comp_${Date.now()}`,
            type: "success",
            title: `Goal Achieved: ${goal.name}!`,
            description: `Congratulations! You have completed your target goal savings of ${formatRupee(goal.target)}.`,
            time: "Just Now",
            unread: true
          });
        }
        
        renderAll();
      }
    });
  });
}

function getGoalEmoji(icon) {
  if (icon === 'trip') return '✈️';
  if (icon === 'house') return '🏠';
  if (icon === 'car') return '🚗';
  return '🌴';
}

// E. Learn Page View Render
function renderLearnHub() {
  // Render Explainers List
  const explainersGrid = document.getElementById('explainers-grid');
  if (explainersGrid) {
    explainersGrid.innerHTML = '';
    state.explainers.forEach(art => {
      const card = document.createElement('div');
      card.className = 'glass-card explainer-card';
      card.innerHTML = `
        <div class="explainer-meta">
          <span class="explainer-cat ${art.category}">${art.category.toUpperCase()}</span>
          <span class="badge badge-info" style="font-size:0.6rem;">${art.difficulty}</span>
        </div>
        <h5 class="explainer-title">${art.title}</h5>
        <div class="explainer-footer">
          <span>${art.readTime}</span>
          <a href="#" class="card-link read-article-btn" data-explainer-id="${art.id}">Read Now <i data-lucide="arrow-right" style="width:12px;"></i></a>
        </div>
      `;
      explainersGrid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();

    explainersGrid.querySelectorAll('.read-article-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openExplainerArticle(btn.dataset.explainerId);
      });
    });
  }
}

function openExplainerArticle(explainerId) {
  const article = state.explainers.find((art) => art.id === explainerId);
  if (!article) return;

  document.getElementById('explainer-article-cat').textContent = article.category.toUpperCase();
  document.getElementById('explainer-article-difficulty').textContent = article.difficulty;
  document.getElementById('explainer-article-title').textContent = article.title;
  document.getElementById('explainer-article-readtime').textContent = article.readTime;
  document.getElementById('explainer-article-body').innerHTML = article.body;

  document.getElementById('modal-explainer-article').classList.add('active');
}

// F. Notifications Page Render
function renderNotifications() {
  const feed = document.getElementById('notifications-feed');
  if (!feed) return;
  
  feed.innerHTML = '';
  
  let unreadCount = 0;
  state.notifications.forEach(n => {
    if (n.unread) unreadCount++;
    
    const row = document.createElement('div');
    row.className = `notif-row ${n.unread ? 'unread' : ''}`;
    
    let emoji = '🔔';
    if (n.type === 'warning') emoji = '⚠️';
    if (n.type === 'success') emoji = '✅';
    if (n.type === 'info') emoji = 'ℹ️';
    
    row.innerHTML = `
      <div class="notif-icon-box ${n.type}">
        <span>${emoji}</span>
      </div>
      <div class="notif-body">
        <div class="notif-title-row">
          <strong class="notif-title">${n.title}</strong>
          ${n.unread ? `<span class="badge badge-warning" style="font-size:0.6rem; padding: 2px 6px;">New</span>` : ''}
        </div>
        <div class="notif-desc">${n.description}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    `;
    feed.appendChild(row);
  });
  
  // Update sidebar counters
  const notifCountBadge = document.getElementById('sidebar-notif-count');
  const topbarBellDot = document.getElementById('topbar-bell-dot');
  
  if (unreadCount > 0) {
    if (notifCountBadge) {
      notifCountBadge.textContent = unreadCount;
      notifCountBadge.style.display = 'block';
    }
    if (topbarBellDot) topbarBellDot.style.display = 'block';
  } else {
    if (notifCountBadge) notifCountBadge.style.display = 'none';
    if (topbarBellDot) topbarBellDot.style.display = 'none';
  }
}

// G. Profile View Render
function renderProfile() {
  // Render linked accounts
  const container = document.getElementById('linked-accounts-container');
  if (container) {
    container.innerHTML = '';
    state.consents.forEach(acc => {
      const row = document.createElement('div');
      row.className = 'linked-account-row';
      row.innerHTML = `
        <div class="linked-account-info">
          <div class="linked-account-logo">${acc.logo}</div>
          <div>
            <div class="linked-account-name">${acc.accountName}</div>
            <div class="linked-account-source">${acc.sourceType}</div>
          </div>
        </div>
        <span class="badge badge-success">Linked</span>
      `;
      container.appendChild(row);
    });
  }
  
  // Render notifications setting toggles
  const settingsContainer = document.getElementById('notification-settings-list');
  if (settingsContainer) {
    settingsContainer.innerHTML = '';
    state.notificationSettings.forEach(set => {
      const row = document.createElement('div');
      row.className = 'toggle-setting-row';
      row.innerHTML = `
        <div class="toggle-setting-info">
          <span class="toggle-setting-name">${set.name}</span>
          <span class="toggle-setting-desc">${set.desc}</span>
        </div>
        <label class="switch">
          <input type="checkbox" ${set.active ? 'checked' : ''} class="profile-setting-checkbox" data-setting-id="${set.id}">
          <span class="slider"></span>
        </label>
      `;
      settingsContainer.appendChild(row);
    });
    
    // Bind toggle events
    document.querySelectorAll('.profile-setting-checkbox').forEach(box => {
      box.addEventListener('change', () => {
        const setVal = box.checked;
        const setId = box.getAttribute('data-setting-id');
        const settingObj = state.notificationSettings.find(s => s.id === setId);
        settingObj.active = setVal;
      });
    });
  }
  
  // User values on profile view
  const titleLetters = state.user.fullName.split(' ').map(n => n.charAt(0)).join('');
  document.getElementById('profile-avatar-letters').textContent = titleLetters;
  document.getElementById('profile-full-name').textContent = state.user.fullName;
  document.getElementById('profile-masked-phone').textContent = state.user.phone;
  
  // Dynamic Risk Profile descriptions
  const riskLabel = document.getElementById('profile-risk-label');
  const riskDesc = document.getElementById('profile-risk-desc');
  if (riskLabel && riskDesc) {
    riskLabel.className = `risk-level-badge ${state.user.riskProfile.toLowerCase()}`;
    riskLabel.textContent = `${state.user.riskProfile} Risk Profile`;
    
    if (state.user.riskProfile === 'Conservative') {
      riskDesc.textContent = "Your asset allocation targets steady growth and capital preservation. Your suggested model allocation is 30% equities / index funds, 60% FDs & debt instruments, and 10% gold / hedge assets.";
    } else if (state.user.riskProfile === 'Moderate') {
      riskDesc.textContent = "You seek balanced returns over a medium term. Suggested allocation comprises 50% equities / direct funds, 30% Fixed Deposits & government bonds, and 20% gold & alternate sectors.";
    } else {
      riskDesc.textContent = "You focus on long-term compound gains, accepting temporary high volatility. Model allocation recommends 75% equity, 15% debt & bonds, and 10% digital gold or commodities.";
    }
  }
}

// Main overall redraw router
function renderAll() {
  renderDashboard();
  renderPortfolioBreakdown();
  renderInvestCatalog();
  renderGoalsGrid();
  renderLearnHub();
  renderNotifications();
  renderProfile();
  renderPortfolioHealthScore();
  lucide.createIcons();
}

// 6. Interactive Calculators Setup
const calculators = {
  sip: {
    title: "SIP Calculator",
    inputs: [
      { id: "sip-amount", label: "Monthly Deposit (INR)", min: 500, max: 100000, val: 10000, suffix: "₹" },
      { id: "sip-years", label: "Investment Horizon (Years)", min: 1, max: 30, val: 10, suffix: "yrs" },
      { id: "sip-returns", label: "Expected Annual Returns (%)", min: 1, max: 25, val: 12, suffix: "%" }
    ],
    calc: () => {
      const p = parseFloat(document.getElementById('calc-sip-amount').value);
      const yrs = parseFloat(document.getElementById('calc-sip-years').value);
      const r = parseFloat(document.getElementById('calc-sip-returns').value);
      
      const n = yrs * 12;
      const i = (r / 100) / 12;
      
      const invested = p * n;
      const maturity = p * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
      const gain = maturity - invested;
      
      return {
        heroLabel: "Maturity Value",
        heroValue: formatRupee(maturity),
        rows: [
          { label: "Total Deployed capital", val: formatRupee(invested) },
          { label: "Net Investment Gain", val: formatRupee(gain) }
        ]
      };
    }
  },
  cagr: {
    title: "CAGR Calculator",
    inputs: [
      { id: "cagr-initial", label: "Initial Outlay (INR)", min: 1000, max: 10000000, val: 100000, suffix: "₹" },
      { id: "cagr-final", label: "Maturity Value (INR)", min: 2000, max: 20000000, val: 250000, suffix: "₹" },
      { id: "cagr-years", label: "Investment Term (Years)", min: 1, max: 20, val: 5, suffix: "yrs" }
    ],
    calc: () => {
      const init = parseFloat(document.getElementById('calc-cagr-initial').value);
      const fin = parseFloat(document.getElementById('calc-cagr-final').value);
      const yrs = parseFloat(document.getElementById('calc-cagr-years').value);
      
      const cagr = (Math.pow((fin / init), (1 / yrs)) - 1) * 100;
      
      return {
        heroLabel: "Annualised Return (CAGR)",
        heroValue: `${cagr.toFixed(2)}%`,
        rows: [
          { label: "Absolute Gains", val: formatRupee(fin - init) },
          { label: "Timeframe Period", val: `${yrs} years` }
        ]
      };
    }
  },
  inflation: {
    title: "Inflation Impact Calculator",
    inputs: [
      { id: "inf-amount", label: "Current Cost of Living (INR)", min: 10000, max: 2000000, val: 50000, suffix: "₹" },
      { id: "inf-years", label: "Horizon Time (Years)", min: 1, max: 30, val: 15, suffix: "yrs" },
      { id: "inf-rate", label: "Estimated Inflation Rate (%)", min: 1, max: 15, val: 6, suffix: "%" }
    ],
    calc: () => {
      const p = parseFloat(document.getElementById('calc-inf-amount').value);
      const yrs = parseFloat(document.getElementById('calc-inf-years').value);
      const rate = parseFloat(document.getElementById('calc-inf-rate').value);
      
      const finalCost = p * Math.pow((1 + rate/100), yrs);
      
      return {
        heroLabel: "Required Future Outlay",
        heroValue: formatRupee(finalCost),
        rows: [
          { label: "Nominal Depreciation", val: formatRupee(finalCost - p) },
          { label: "Estimated Rate used", val: `${rate}% per annum` }
        ]
      };
    }
  },
  fd: {
    title: "FD Return Calculator",
    inputs: [
      { id: "fd-principal", label: "Principal deposit (INR)", min: 5000, max: 5000000, val: 100000, suffix: "₹" },
      { id: "fd-rate", label: "Interest Rate (%)", min: 3, max: 12, val: 7.25, suffix: "%" },
      { id: "fd-years", label: "FD Period (Years)", min: 1, max: 10, val: 3, suffix: "yrs" }
    ],
    calc: () => {
      const p = parseFloat(document.getElementById('calc-fd-principal').value);
      const r = parseFloat(document.getElementById('calc-fd-rate').value);
      const yrs = parseFloat(document.getElementById('calc-fd-years').value);
      
      // Compounded quarterly in Indian Banks
      const n = yrs * 4;
      const ratePerQuarter = (r / 100) / 4;
      const maturity = p * Math.pow(1 + ratePerQuarter, n);
      
      return {
        heroLabel: "FD Maturity Value",
        heroValue: formatRupee(maturity),
        rows: [
          { label: "Interest Income", val: formatRupee(maturity - p) },
          { label: "Rate of Interest", val: `${r}% compounded quarterly` }
        ]
      };
    }
  },
  goals: {
    title: "Goal Target Calculator",
    inputs: [
      { id: "goal-target", label: "Desired Goal Target (INR)", min: 100000, max: 50000000, val: 1000000, suffix: "₹" },
      { id: "goal-years", label: "Time Limit (Years)", min: 1, max: 25, val: 7, suffix: "yrs" },
      { id: "goal-rate", label: "Expected Portfolio Return (%)", min: 5, max: 20, val: 12, suffix: "%" }
    ],
    calc: () => {
      const target = parseFloat(document.getElementById('calc-goal-target').value);
      const yrs = parseFloat(document.getElementById('calc-goal-years').value);
      const r = parseFloat(document.getElementById('calc-goal-rate').value);
      
      const n = yrs * 12;
      const i = (r / 100) / 12;
      
      // Target monthly SIP formula
      const sip = (target * i) / ((Math.pow(1 + i, n) - 1) * (1 + i));
      
      return {
        heroLabel: "Monthly SIP Required",
        heroValue: formatRupee(sip),
        rows: [
          { label: "Net Capital Contributed", val: formatRupee(sip * n) },
          { label: "Compounding Growth Yield", val: formatRupee(target - (sip * n)) }
        ]
      };
    }
  }
};

function renderSelectedCalculator(calcKey) {
  const container = document.getElementById('calculator-inner-box');
  if (!container) return;
  
  const calcObj = calculators[calcKey];
  
  let inputsHTML = '';
  calcObj.inputs.forEach(inp => {
    inputsHTML += `
      <div class="input-group">
        <div class="input-label-row">
          <label for="calc-${inp.id}">${inp.label}</label>
          <span class="input-val-box" id="lbl-${inp.id}">${inp.val} ${inp.suffix}</span>
        </div>
        <input type="range" class="input-slider calc-slider-input" 
               id="calc-${inp.id}" 
               min="${inp.min}" 
               max="${inp.max}" 
               step="${inp.max / 100}" 
               value="${inp.val}" 
               data-suffix="${inp.suffix}" 
               data-target-lbl="lbl-${inp.id}">
      </div>
    `;
  });
  
  container.innerHTML = `
    <div class="calculator-inputs">
      <h4 class="card-title" style="margin-bottom:12px;">${calcObj.title}</h4>
      ${inputsHTML}
    </div>
    <div class="calculator-outputs" id="calculator-outputs-panel">
      <!-- Calculated outputs inside here -->
    </div>
  `;
  
  // Set output state initially
  updateCalculatorOutput(calcKey);
  
  // Attach listeners
  document.querySelectorAll('.calc-slider-input').forEach(slide => {
    slide.addEventListener('input', () => {
      const lblId = slide.getAttribute('data-target-lbl');
      const suffix = slide.getAttribute('data-suffix');
      
      let formattedVal = slide.value;
      if (suffix === '₹') {
        formattedVal = formatRupee(slide.value);
      } else {
        formattedVal = `${slide.value} ${suffix}`;
      }
      
      document.getElementById(lblId).textContent = formattedVal;
      updateCalculatorOutput(calcKey);
    });
  });
}

function updateCalculatorOutput(calcKey) {
  const calcObj = calculators[calcKey];
  const results = calcObj.calc();
  
  const outPanel = document.getElementById('calculator-outputs-panel');
  
  let rowsHTML = '';
  results.rows.forEach(r => {
    rowsHTML += `
      <div class="output-row">
        <span>${r.label}</span>
        <strong class="output-row-val">${r.val}</strong>
      </div>
    `;
  });
  
  outPanel.innerHTML = `
    <div class="output-hero">
      <span class="output-hero-label">${results.heroLabel}</span>
      <div class="output-hero-val">${results.heroValue}</div>
    </div>
    ${rowsHTML}
  `;
}

function initCalculatorTabs() {
  const tabSip = document.getElementById('calc-tab-sip');
  const tabCagr = document.getElementById('calc-tab-cagr');
  const tabInflation = document.getElementById('calc-tab-inflation');
  const tabFd = document.getElementById('calc-tab-fd');
  const tabGoals = document.getElementById('calc-tab-goals');
  
  const tabs = [tabSip, tabCagr, tabInflation, tabFd, tabGoals];
  const keys = ['sip', 'cagr', 'inflation', 'fd', 'goals'];
  
  tabs.forEach((tab, index) => {
    if (tab) {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderSelectedCalculator(keys[index]);
      });
    }
  });
  
  // Default Sip load
  renderSelectedCalculator('sip');
}

function initLearnTabs() {
  // Navigation tabs binded inline to onclick in index.html
}

window.switchLearnTab = function(btn, targetTab) {
  const tabs = document.querySelectorAll('.learn-tab');
  const sections = document.querySelectorAll('.learn-section');

  // Toggle active tab class
  tabs.forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  // Toggle active section visibility
  sections.forEach(sec => {
    sec.classList.remove('active');
    if (sec.id === `learn-${targetTab}-section`) {
      sec.classList.add('active');
    }
  });
};

// 7. Dynamic Educational Quizzes Setup
function renderQuiz() {
  const container = document.getElementById('quiz-container');
  if (!container) return;
  
  const totalQ = state.quizQuestions.length;
  const currentIdx = state.activeQuizIndex;
  
  if (currentIdx >= totalQ) {
    // Quiz completed state
    let correctCount = state.quizAnswersRecorded.filter(x => x === true).length;
    container.innerHTML = `
      <div style="text-align:center; padding:24px;">
        <i data-lucide="award" style="width:64px; height:64px; color:var(--color-success); margin-bottom:16px;"></i>
        <h4 class="card-title" style="font-size:1.4rem; margin-bottom:12px;">Quiz Completed!</h4>
        <p style="color:var(--text-secondary); margin-bottom:20px; font-size:0.95rem;">
          You scored <strong>${correctCount} out of ${totalQ}</strong> correct answers!
        </p>
        <div style="background:rgba(255,255,255,0.02); padding:16px; border-radius:var(--border-radius-md); border:1px solid var(--border-glass); font-size:0.85rem; line-height:1.5; text-align:left; max-width:400px; margin:0 auto 24px auto;">
          <strong>AI Insights:</strong> ${correctCount === totalQ ? 'Exceptional literacy! You understand complex returns metrics. Your risk score has improved by 0.5 points.' : 'Good start! Try reading our explainers on CAGR/XIRR to optimize your decision making.'}
        </div>
        <button class="btn btn-primary" id="quiz-restart-btn">Restart Quiz</button>
      </div>
    `;
    lucide.createIcons();
    
    document.getElementById('quiz-restart-btn').addEventListener('click', () => {
      state.activeQuizIndex = 0;
      state.quizAnswersRecorded = [];
      renderQuiz();
    });
    
    // Update dashboard health score if they got all right!
    if (correctCount === totalQ) {
      document.getElementById('health-score-num').textContent = "7.7";
      document.getElementById('health-bar-risk').style.width = "75%";
      document.getElementById('health-score-risk').textContent = "7.5/10";
    }
    
    return;
  }
  
  const question = state.quizQuestions[currentIdx];
  
  let optionsHTML = '';
  question.options.forEach((opt, oIdx) => {
    optionsHTML += `
      <li class="quiz-option" data-option="${opt}">
        <span>${opt}</span>
        <i data-lucide="circle" style="width:16px;height:16px; color:var(--text-muted);"></i>
      </li>
    `;
  });
  
  container.innerHTML = `
    <div class="quiz-header">
      <span>Question ${currentIdx + 1} of ${totalQ}</span>
      <span>Financial Literacy Score Tracker</span>
    </div>
    
    <div class="quiz-question-box">
      <h4 class="quiz-question-text">${question.q}</h4>
    </div>
    
    <ul class="quiz-options-list">
      ${optionsHTML}
    </ul>
    
    <div class="quiz-feedback" id="quiz-feedback-box">
      <!-- Injected answer feedback -->
    </div>
    
    <div style="margin-top:24px; display:flex; justify-content:flex-end;">
      <button class="btn btn-primary" id="quiz-next-btn" style="display:none;">Next Question <i data-lucide="arrow-right"></i></button>
    </div>
  `;
  
  lucide.createIcons();
  
  // Event listeners on options
  document.querySelectorAll('.quiz-option').forEach(el => {
    el.addEventListener('click', () => {
      // Avoid double clicks
      if (document.getElementById('quiz-next-btn').style.display === 'inline-flex') return;
      
      const chosen = el.getAttribute('data-option');
      const isCorrect = chosen === question.a;
      
      state.quizAnswersRecorded.push(isCorrect);
      
      // Update element styles
      document.querySelectorAll('.quiz-option').forEach(optionNode => {
        const val = optionNode.getAttribute('data-option');
        if (val === question.a) {
          optionNode.classList.add('correct');
          optionNode.querySelector('i').outerHTML = `<i data-lucide="check-circle" style="color:var(--color-success);width:16px;height:16px;"></i>`;
        } else if (val === chosen && !isCorrect) {
          optionNode.classList.add('incorrect');
          optionNode.querySelector('i').outerHTML = `<i data-lucide="x-circle" style="color:var(--color-danger);width:16px;height:16px;"></i>`;
        }
      });
      
      const feedbackBox = document.getElementById('quiz-feedback-box');
      feedbackBox.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
      feedbackBox.innerHTML = `
        <strong>${isCorrect ? '✅ Correct Answer!' : '❌ Incorrect.'}</strong><br>
        ${question.feedback}
      `;
      feedbackBox.style.display = 'block';
      
      document.getElementById('quiz-next-btn').style.display = 'inline-flex';
      lucide.createIcons();
    });
  });
  
  document.getElementById('quiz-next-btn').addEventListener('click', () => {
    state.activeQuizIndex++;
    renderQuiz();
  });
}

const CHART_PERIOD_LABELS = { '1w': '1W Change', '1m': '1M Change', '3m': '3M Change', '1y': '1Y Change', all: 'All-Time Change' };

// Fills the stats row below the chart: Current Value / Total Invested / Overall
// Gain are real, computed straight from state.holdings. Period Change tracks
// whichever timeframe button is active, derived from that range's own plotted
// series (first point vs. last), since this app has no stored historical
// snapshots to compute a genuine period-over-period return from.
function updateChartStatsRow(timeframe, dataPoints) {
  const currentValueEl = document.getElementById('chart-stat-current-value');
  if (!currentValueEl) return;

  const metrics = calculatePortfolioMetrics();

  currentValueEl.textContent = formatRupee(metrics.totalVal);
  document.getElementById('chart-stat-invested').textContent = formatRupee(metrics.totalInv);

  const overallGainEl = document.getElementById('chart-stat-overall-gain');
  const gainUp = metrics.overallGainVal >= 0;
  overallGainEl.textContent = `${gainUp ? '+' : ''}${formatRupee(metrics.overallGainVal)} (${gainUp ? '+' : ''}${metrics.overallGainPct.toFixed(2)}%)`;
  overallGainEl.className = `chart-stat-val ${gainUp ? 'up' : 'down'}`;
  document.getElementById('chart-stat-overall-gain-icon').className = `chart-stat-icon ${gainUp ? 'up' : 'down'}`;

  const series = dataPoints.data;
  const periodChangeVal = series.length >= 2 ? series[series.length - 1] - series[0] : 0;
  const periodChangePct = series.length >= 2 && series[0] !== 0 ? (periodChangeVal / series[0]) * 100 : 0;
  const periodUp = periodChangeVal >= 0;

  document.getElementById('chart-stat-period-label').textContent = CHART_PERIOD_LABELS[timeframe] || 'Change';
  const periodChangeEl = document.getElementById('chart-stat-period-change');
  periodChangeEl.textContent = `${periodUp ? '+' : ''}${formatRupee(periodChangeVal)} (${periodUp ? '+' : ''}${periodChangePct.toFixed(2)}%)`;
  periodChangeEl.className = `chart-stat-val ${periodUp ? 'up' : 'down'}`;
  document.getElementById('chart-stat-period-icon').className = `chart-stat-icon ${periodUp ? 'up' : 'down'}`;

  if (window.lucide) lucide.createIcons();
}

// 8. Dynamic Portfolio Performance Graph (Chart.js)
let portfolioChartRequestId = 0;

async function initPortfolioChart() {
  const ctx = document.getElementById('portfolioMainChart');
  if (!ctx) return;

  // Determine chart colors matching asset category
  const activeTab = document.querySelector('.filter-tab.active');
  const filterType = activeTab ? activeTab.getAttribute('data-filter') : 'all';

  let strokeColor = '#3b82f6'; // default equity blue
  if (filterType === 'mf') strokeColor = '#10b981';
  if (filterType === 'gold') strokeColor = '#f59e0b';
  if (filterType === 'fd') strokeColor = '#8b5cf6';
  if (filterType === 'nps') strokeColor = '#06b6d4';

  const activeTfBtn = document.querySelector('.timeframe-selector .tf-btn.active');
  const timeframe = activeTfBtn ? activeTfBtn.getAttribute('data-tf') : '3m';

  // Real portfolio value history, reconstructed from each holding's actual
  // historical price at each date (see backend getPerformance) — not mock
  // data. Guard against out-of-order responses if the user clicks quickly.
  const requestId = ++portfolioChartRequestId;
  let dataPoints;
  try {
    dataPoints = await getPortfolioPerformance({ range: timeframe, category: filterType });
  } catch (err) {
    console.error('Failed to load real portfolio performance.', err);
    dataPoints = { labels: [], data: [] };
  }
  if (requestId !== portfolioChartRequestId) return;

  updateChartStatsRow(timeframe, dataPoints);

  if (portfolioChart) {
    portfolioChart.destroy();
  }

  // Setup Gradient Fill
  const chartCtx = ctx.getContext('2d');
  const gradient = chartCtx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, hexToRgba(strokeColor, 0.15));
  gradient.addColorStop(1, hexToRgba(strokeColor, 0.0));

  portfolioChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataPoints.labels,
      datasets: [{
        label: 'Portfolio Value (INR)',
        data: dataPoints.data,
        borderColor: strokeColor,
        borderWidth: 2,
        pointBackgroundColor: strokeColor,
        pointBorderColor: '#ffffff',
        pointHoverRadius: 6,
        pointRadius: 2,
        fill: true,
        backgroundColor: gradient,
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: '#0f1422',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          titleFont: { family: 'Plus Jakarta Sans', weight: 'bold' },
          bodyFont: { family: 'Plus Jakarta Sans' },
          callbacks: {
            label: function(context) {
              return ` Value: ${formatRupee(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#6b7280',
            font: { family: 'Plus Jakarta Sans', size: 10 }
          }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.03)' },
          ticks: {
            color: '#6b7280',
            font: { family: 'Plus Jakarta Sans', size: 10 },
            callback: function(value) {
              return '₹' + (value / 1000) + 'k';
            }
          }
        }
      }
    }
  });
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Generate data mapping
// Attach timeframe and sort changes to redraw
function bindPortfolioEvents() {
  // Filters switching
  document.querySelectorAll('#portfolio-filters .filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#portfolio-filters .filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update UI components
      renderPortfolioBreakdown();
      initPortfolioChart();
    });
  });
  
  // Timeframe selector
  document.querySelectorAll('.timeframe-selector .tf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.timeframe-selector .tf-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      initPortfolioChart();
    });
  });
  
  // Sort drop list changes
  const sortSelect = document.getElementById('portfolio-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      renderPortfolioBreakdown();
    });
  }
}

const CATALOG_SEARCH_PLACEHOLDERS = {
  mf: 'Search mutual funds by name…',
  equity: 'Search live stocks e.g. RELIANCE, TCS, INFY…',
  gold: 'Search digital gold products…',
  fd: 'Search fixed deposits…',
};

function bindInvestEvents() {
  const categoryTabs = document.querySelectorAll('#invest-category-tabs .filter-tab');
  const subFiltersContainer = document.getElementById('invest-sub-filters');
  const subFilterChips = document.querySelectorAll('#invest-sub-filters .chip-btn');
  const stockSearchInput = document.getElementById('invest-stock-search-input');

  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const category = tab.getAttribute('data-category');

      // Show sub-filters only for Mutual Funds (mf)
      if (category === 'mf') {
        if (subFiltersContainer) subFiltersContainer.style.display = 'flex';
      } else {
        if (subFiltersContainer) subFiltersContainer.style.display = 'none';
      }

      // Reset search state when switching tabs — each tab searches its own data
      lastEquitySearchResults = [];
      catalogSearchQuery = '';
      if (stockSearchInput) {
        stockSearchInput.value = '';
        stockSearchInput.placeholder = CATALOG_SEARCH_PLACEHOLDERS[category] || 'Search…';
      }

      renderInvestCatalog();
    });
  });

  subFilterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      subFilterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderInvestCatalog();
    });
  });
}

// 9. Autocomplete Search Utility

// Builds an avatar with initials underneath and a real logo <img> on top.
// The logo silently removes itself on load failure (unreliable name->domain
// guess on the backend), leaving the initials visible as fallback.
function buildAvatar(avatarBg, avatarText, logoUrl) {
  const avatar = document.createElement('div');
  avatar.className = 'search-result-avatar';
  avatar.style.background = avatarBg;

  const fallback = document.createElement('span');
  fallback.className = 'avatar-fallback-text';
  fallback.textContent = avatarText;
  avatar.appendChild(fallback);

  if (logoUrl) {
    const img = document.createElement('img');
    img.className = 'avatar-logo-img';
    img.alt = '';
    img.loading = 'lazy';
    img.addEventListener('error', () => img.remove());
    img.src = logoUrl;
    avatar.appendChild(img);
  }

  return avatar;
}

function buildSearchResultItem({ avatarBg, avatarText, logoUrl, name, meta, onClick }) {
  const item = document.createElement('div');
  item.className = 'search-result-item';

  item.appendChild(buildAvatar(avatarBg, avatarText, logoUrl));

  const textWrap = document.createElement('div');
  textWrap.className = 'search-result-text';

  const nameEl = document.createElement('span');
  nameEl.className = 'search-result-name';
  nameEl.textContent = name;

  const metaEl = document.createElement('span');
  metaEl.className = 'search-result-type';
  metaEl.textContent = meta;

  textWrap.appendChild(nameEl);
  textWrap.appendChild(metaEl);
  item.appendChild(textWrap);

  const arrow = document.createElement('i');
  arrow.setAttribute('data-lucide', 'arrow-right');
  arrow.className = 'search-result-arrow';
  item.appendChild(arrow);

  if (onClick) item.addEventListener('click', onClick);
  return item;
}

function buildSearchSectionLabel(text) {
  const label = document.createElement('div');
  label.className = 'search-section-label';
  label.textContent = text;
  return label;
}

function initSearchAutocomplete() {
  const searchInput = document.getElementById('global-search-input');
  const dropdown = document.getElementById('search-dropdown');

  if (!searchInput || !dropdown) return;

  let searchRequestId = 0;
  let stockDebounce = null;

  function renderEmptyStateIfNeeded(val) {
    if (!dropdown.querySelector('.search-result-item')) {
      dropdown.innerHTML = `<div class="search-empty-state">No results found for "${val}"</div>`;
    }
  }

  searchInput.addEventListener('input', () => {
    const rawVal = searchInput.value.trim();
    const val = rawVal.toLowerCase();

    clearTimeout(stockDebounce);

    if (val.length === 0) {
      dropdown.classList.remove('active');
      return;
    }

    dropdown.innerHTML = '';

    // Mock catalog matches, grouped by their actual category so a gold or FD
    // result never shows up mislabeled under a "Mutual Funds" heading.
    const matches = state.fundsCatalog.filter(f =>
      f.name.toLowerCase().includes(val) ||
      f.category.toLowerCase().includes(val)
    );

    const CATEGORY_SECTION_LABELS = {
      mf: 'Mutual Funds',
      equity: 'Equities',
      gold: 'Digital Gold',
      fd: 'Fixed Deposits',
    };
    const CATEGORY_ORDER = ['mf', 'equity', 'gold', 'fd'];

    CATEGORY_ORDER.forEach((category) => {
      const categoryMatches = matches.filter((m) => m.category === category);
      if (!categoryMatches.length) return;

      dropdown.appendChild(buildSearchSectionLabel(CATEGORY_SECTION_LABELS[category] || category.toUpperCase()));
      categoryMatches.slice(0, 4).forEach(m => {
        const item = buildSearchResultItem({
          avatarBg: m.bg,
          avatarText: m.initials,
          name: m.name,
          meta: `${m.category.toUpperCase()} · 1Y Ret: ${m.ret1y}`,
          onClick: () => {
            searchInput.value = m.name;
            dropdown.classList.remove('active');
            navigateToPage('invest');
            document.querySelectorAll('#invest-category-tabs .filter-tab').forEach(tab => {
              tab.classList.remove('active');
              if (tab.getAttribute('data-category') === m.category) {
                tab.classList.add('active');
              }
            });
            renderInvestCatalog();
          },
        });
        dropdown.appendChild(item);
      });
    });

    // Jumps to the Invest page, activates the given tab, and triggers that
    // tab's own live search with the clicked result's symbol/name.
    function goToInvestTabWithQuery(category, query) {
      dropdown.classList.remove('active');
      navigateToPage('invest');
      document.querySelectorAll('#invest-category-tabs .filter-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-category') === category) tab.classList.add('active');
      });
      const subFiltersContainer = document.getElementById('invest-sub-filters');
      if (subFiltersContainer) subFiltersContainer.style.display = category === 'mf' ? 'flex' : 'none';
      const catalogInput = document.getElementById('invest-stock-search-input');
      if (catalogInput) {
        catalogInput.placeholder = CATALOG_SEARCH_PLACEHOLDERS[category] || 'Search…';
        catalogInput.value = query;
        catalogInput.dispatchEvent(new Event('input'));
      }
    }

    // Two independent live sections (stocks + mutual funds), each with its own
    // loading placeholder. The empty-state message only fires once BOTH have
    // resolved with nothing — otherwise a fast-finishing empty section would
    // wipe out the other section while it's still loading.
    let pendingLiveSections = 2;
    function onLiveSectionSettled() {
      pendingLiveSections -= 1;
      if (pendingLiveSections === 0) renderEmptyStateIfNeeded(val);
    }

    const stockSection = document.createElement('div');
    stockSection.className = 'search-stock-section';
    stockSection.appendChild(buildSearchSectionLabel('Live Stocks'));
    const stockLoading = document.createElement('div');
    stockLoading.className = 'search-loading-state';
    stockLoading.textContent = 'Searching live stocks…';
    stockSection.appendChild(stockLoading);
    dropdown.appendChild(stockSection);

    const mfSection = document.createElement('div');
    mfSection.className = 'search-stock-section';
    mfSection.appendChild(buildSearchSectionLabel('Live Mutual Funds'));
    const mfLoading = document.createElement('div');
    mfLoading.className = 'search-loading-state';
    mfLoading.textContent = 'Searching live mutual funds…';
    mfSection.appendChild(mfLoading);
    dropdown.appendChild(mfSection);

    lucide.createIcons();
    dropdown.classList.add('active');

    const requestId = ++searchRequestId;
    stockDebounce = setTimeout(() => {
      searchStocks(rawVal)
        .then((stocks) => {
          if (requestId !== searchRequestId) return; // stale response, input changed since

          if (!stocks.length) {
            stockSection.remove();
            onLiveSectionSettled();
            return;
          }

          stockSection.innerHTML = '';
          stockSection.appendChild(buildSearchSectionLabel('Live Stocks'));

          stocks.slice(0, 5).forEach((s) => {
            const item = buildSearchResultItem({
              avatarBg: '#4f46e5',
              avatarText: s.symbol.slice(0, 2),
              logoUrl: s.logoUrl,
              name: s.name,
              meta: `STOCK · ${s.symbol}`,
              onClick: () => goToInvestTabWithQuery('equity', s.symbol),
            });
            stockSection.appendChild(item);
          });

          lucide.createIcons();
          onLiveSectionSettled();
        })
        .catch((err) => {
          console.error('Stock search failed:', err.message);
          stockSection.remove();
          onLiveSectionSettled();
        });

      searchMutualFunds(rawVal)
        .then((funds) => {
          if (requestId !== searchRequestId) return;

          if (!funds.length) {
            mfSection.remove();
            onLiveSectionSettled();
            return;
          }

          mfSection.innerHTML = '';
          mfSection.appendChild(buildSearchSectionLabel('Live Mutual Funds'));

          funds.slice(0, 5).forEach((f) => {
            const item = buildSearchResultItem({
              avatarBg: '#059669',
              avatarText: f.symbol.slice(0, 2),
              logoUrl: f.logoUrl,
              name: f.name,
              meta: `MUTUAL FUND · ${f.symbol}`,
              onClick: () => goToInvestTabWithQuery('mf', f.symbol),
            });
            mfSection.appendChild(item);
          });

          lucide.createIcons();
          onLiveSectionSettled();
        })
        .catch((err) => {
          console.error('Mutual fund search failed:', err.message);
          mfSection.remove();
          onLiveSectionSettled();
        });
    }, 250);
  });

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      dropdown.classList.remove('active');
    }
  });
}

// 10. CSV Exporter Utility
function initExportCSV() {
  const exportBtn = document.getElementById('portfolio-export-csv-btn');
  if (!exportBtn) return;
  
  exportBtn.addEventListener('click', () => {
    // Generate CSV string
    let csv = 'Asset Name,Short Name,Category,Amount Invested,Current Value,Growth Percentage\n';
    
    state.holdings.forEach(h => {
      csv += `"${h.name}","${h.shortName}",${h.category},${h.invested},${h.currentValue},${h.returnPct.toFixed(2)}%\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, 'assetbridge_holdings.csv');
    } else {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'assetbridge_holdings_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    state.notifications.unshift({
      id: `n_csv_${Date.now()}`,
      type: "success",
      title: "CSV Export Successful",
      description: "Successfully exported holdings dataset. Look in your device downloads folder.",
      time: "Just Now",
      unread: true
    });
    renderNotifications();
  });
}

// 11. Modal Controllers Integration
function setupModals() {
  let isSignUpMode = false;

  const modal = document.getElementById('modal-auth');
  const title = document.getElementById('auth-modal-title');
  const nameGroup = document.getElementById('auth-name-group');
  const toggleBtn = document.getElementById('auth-toggle-mode-btn');
  const submitBtn = document.getElementById('auth-submit-btn');

  // Toggle between Sign In and Sign Up UI
  toggleBtn.addEventListener('click', () => {
    isSignUpMode = !isSignUpMode;
    title.textContent = isSignUpMode ? "Create AssetBridge Account" : "Sign In to AssetBridge";
    nameGroup.style.display = isSignUpMode ? "flex" : "none";
    submitBtn.textContent = isSignUpMode ? "Create Account" : "Sign In";
    toggleBtn.textContent = isSignUpMode ? "Already have an account? Sign In" : "Need an account? Sign Up";
  });

  // Handle Form Submission
  submitBtn.addEventListener('click', async () => {
    const email = document.getElementById('auth-email-input').value.trim();
    const password = document.getElementById('auth-password-input').value.trim();
    const fullName = document.getElementById('auth-name-input').value.trim();

    if (!email || !password) return alert("Please fill in email and password.");

    try {
      if (isSignUpMode) {
        // Create user in Firebase
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (fullName) {
          await updateProfile(cred.user, { displayName: fullName });
        }
        alert("Account created successfully!");
      } else {
        // Sign in existing user
        await signInWithEmailAndPassword(auth, email, password);
      }
      modal.classList.remove('active');
    } catch (err) {
      alert(`Auth Error: ${err.message}`);
    }
  });

  // Close modal button
  document.getElementById('close-modal-auth').addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Generic open/close functions
  const openModal = (id) => document.getElementById(id).classList.add('active');
  const closeModal = (id) => document.getElementById(id).classList.remove('active');

  // Hero "Learn More" / arrow CTAs -> scroll to the "How It Works" section
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works-page')?.scrollIntoView({ behavior: 'smooth' });
  };
  const heroLearnBtn = document.getElementById('action-hero-learn');
  const heroArrowBtn = document.getElementById('action-hero-arrow');
  if (heroLearnBtn) heroLearnBtn.addEventListener('click', scrollToHowItWorks);
  if (heroArrowBtn) heroArrowBtn.addEventListener('click', scrollToHowItWorks);

  // Explainer Article
  document.getElementById('close-modal-explainer-article').addEventListener('click', () => closeModal('modal-explainer-article'));

  // Broker Choice (Invest Now on a live stock)
  document.getElementById('close-modal-broker-choice').addEventListener('click', () => closeModal('modal-broker-choice'));

  // A. Add Funds
  document.getElementById('action-add-funds').addEventListener('click', () => openModal('modal-add-funds'));
  document.getElementById('close-modal-funds').addEventListener('click', () => closeModal('modal-add-funds'));
  document.getElementById('cancel-funds-btn').addEventListener('click', () => closeModal('modal-add-funds'));
  
  document.getElementById('confirm-funds-btn').addEventListener('click', () => {
    const inputAmt = parseFloat(document.getElementById('fund-amount-input').value);
    if (!isNaN(inputAmt) && inputAmt > 0) {
      state.user.cashBalance += inputAmt;
      
      // Update transactions
      state.transactions.unshift({
        type: "BUY",
        assetName: "Cash Capital Injection",
        date: "Just Now",
        category: "fd",
        amount: inputAmt,
        units: 1.0,
        price: inputAmt,
        typeLabel: "Fund Deposit"
      });
      
      // Add system notification
      state.notifications.unshift({
        id: `n_funds_${Date.now()}`,
        type: "success",
        title: "Capital Loaded Successfully",
        description: `Successfully added ${formatRupee(inputAmt)} into your linked wallet from SBI Bank.`,
        time: "Just Now",
        unread: true
      });
      
      closeModal('modal-add-funds');
      renderAll();
    } else {
      alert("Please enter a valid amount.");
    }
  });

  // B. Start SIP (Dynamic targets select list populate)
  document.getElementById('action-start-sip').addEventListener('click', () => {
    const select = document.getElementById('sip-target-select');
    select.innerHTML = '';
    state.fundsCatalog.forEach(f => {
      select.innerHTML += `<option value="${f.name}">${f.name} (${f.category.toUpperCase()})</option>`;
    });
    openModal('modal-start-sip');
  });
  
  document.getElementById('close-modal-sip').addEventListener('click', () => closeModal('modal-start-sip'));
  document.getElementById('cancel-sip-btn').addEventListener('click', () => closeModal('modal-start-sip'));
  
  document.getElementById('confirm-sip-btn').addEventListener('click', () => {
    const name = document.getElementById('sip-target-select').value;
    const amount = parseFloat(document.getElementById('sip-amount-input').value);
    const date = document.getElementById('sip-date-input').value;
    
    if (!isNaN(amount) && amount > 0) {
      // Create SIP notification
      state.notifications.unshift({
        id: `n_sip_${Date.now()}`,
        type: "success",
        title: "SIP Registration Completed",
        description: `New monthly SIP of ${formatRupee(amount)} registered for ${name}. Triggers on the ${date}th of every month.`,
        time: "Just Now",
        unread: true
      });
      
      closeModal('modal-start-sip');
      renderAll();
    } else {
      alert("Enter a valid monthly sum.");
    }
  });

  // C. New Goal creation modal
  document.getElementById('action-new-goal').addEventListener('click', () => openModal('modal-new-goal'));
  document.getElementById('close-modal-goal').addEventListener('click', () => closeModal('modal-new-goal'));
  document.getElementById('cancel-goal-btn').addEventListener('click', () => closeModal('modal-new-goal'));
  
  document.getElementById('confirm-goal-btn').addEventListener('click', () => {
    const name = document.getElementById('goal-name-input').value;
    const target = parseFloat(document.getElementById('goal-target-amount-input').value);
    const year = parseInt(document.getElementById('goal-year-input').value);
    const monthlySip = parseFloat(document.getElementById('goal-sip-input').value);
    const icon = document.getElementById('goal-icon-select').value;
    
    if (name.trim().length > 0 && !isNaN(target) && target > 0) {
      state.goals.push({
        id: `g_${Date.now()}`,
        name,
        target,
        year,
        saved: 0,
        icon,
        monthlySip
      });
      
      state.notifications.unshift({
        id: `n_goal_${Date.now()}`,
        type: "success",
        title: "New Target Activated",
        description: `Goal "${name}" tracking has been successfully added to your roadmap.`,
        time: "Just Now",
        unread: true
      });
      
      closeModal('modal-new-goal');
      renderAll();
    } else {
      alert("Please check your target goal name and amount.");
    }
  });

  // Dropdown Menu Toggle
  window.myFunction = function() {
    const dropdown = document.getElementById("myDropdown");
    if (dropdown) {
      dropdown.classList.toggle("show");
    }
  };

  // Close dropdown menu when clicking outside
  window.addEventListener('click', (event) => {
    if (!event.target.closest('.profile-link-consent-row') && !event.target.matches('.dropbtn')) {
      const dropdowns = document.getElementsByClassName("dropdown-content");
      for (let i = 0; i < dropdowns.length; i++) {
        dropdowns[i].classList.remove('show');
      }
    }
  });

  // Link Account Modal Controller
  let selectedAccountType = null;
  const linkModal = document.getElementById("link-account-modal");
  const openModalBtn = document.getElementById("dropdown");
  const closeModalBtn = document.getElementById("close-link-modal");
  const continueBtn = document.getElementById("continue-link-account");

  function openLinkAccountModal() {
    if (linkModal) {
      linkModal.classList.add("active");
    }
  }

  function closeLinkAccountModal() {
    if (linkModal) {
      linkModal.classList.remove("active");
    }
  }

  if (openModalBtn) {
    openModalBtn.addEventListener("click", openLinkAccountModal);
  }

  document.querySelectorAll('#myDropdown [data-action="link-account"]').forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const type = btn.getAttribute("data-type");
      const dropdown = document.getElementById("myDropdown");
      if (dropdown) dropdown.classList.remove("show");
      
      if (type) {
        document.querySelectorAll(".account-option").forEach(c => {
          c.classList.toggle("selected", c.dataset.type === type);
        });
        selectedAccountType = type;
      }
      openLinkAccountModal();
    });
  });

  document.querySelectorAll('[data-action="link-account"], #linkBankBtn, #profile-link-consent-btn, #dropdownMenuButton').forEach(btn => {
    btn.addEventListener("click", (e) => {
      if (btn.id === 'dropdownMenuButton') return; // Handled by myFunction toggle
      openLinkAccountModal();
    });
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeLinkAccountModal);
  }

  if (linkModal) {
    linkModal.addEventListener("click", (e) => {
      if (e.target === linkModal) {
        closeLinkAccountModal();
      }
    });
  }

  document.querySelectorAll(".account-option").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".account-option").forEach(c => {
        c.classList.remove("selected");
      });
      card.classList.add("selected");
      selectedAccountType = card.dataset.type;
    });
  });

  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      if (!selectedAccountType) {
        const optionsContainer = document.querySelector(".account-options");
        if (optionsContainer) {
          optionsContainer.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.4)";
          setTimeout(() => optionsContainer.style.boxShadow = "", 800);
        }
        return;
      }

      closeLinkAccountModal();

      const accountConfigs = {
        bank: {
          name: "HDFC Bank (Account Aggregator)",
          type: "Bank Account Aggregator"
        },
        zerodha: {
          name: "Zerodha / Groww Demat",
          type: "Demat Account Feed"
        },
        mf: {
          name: "MF Central / CAMS",
          type: "Mutual Fund Portfolio Feed"
        },
        gold: {
          name: "SafeGold / MMTC",
          type: "Digital Gold Vault"
        }
      };

      const config = accountConfigs[selectedAccountType] || {
        name: "Financial Account",
        type: "Linked Account Feed"
      };

      if (selectedAccountType === 'bank' && typeof window.openFinvuWidget === 'function') {
        try {
          window.openFinvuWidget();
        } catch (e) {
          console.warn("Finvu widget fallback:", e);
        }
      }
      
      addConsentAccount(config.name, config.type);
    });
  }

  function addConsentAccount(name, type) {
    state.consents.push({
      id: `c_${Date.now()}`,
      accountName: name,
      sourceType: type,
      status: "Linked",
      logo: name.substring(0, 2).toUpperCase()
    });
    state.notifications.unshift({
      id: `n_consent_${Date.now()}`,
      type: "success",
      title: "Account Consent Authorized",
      description: `Linked ${name} (${type}) feed to your unified investing dashboard.`,
      time: "Just Now",
      unread: true
    });
    renderAll();
  }
  

  // D. Risk profile quiz modal (trigger on Profile Page)
  const profileRetakeQuizBtn = document.getElementById('profile-retake-quiz-btn');
  if (profileRetakeQuizBtn) {
    profileRetakeQuizBtn.addEventListener('click', () => {
      renderQuizModalFlow();
      openModal('modal-risk-quiz');
    });
  }
  document.getElementById('close-modal-quiz').addEventListener('click', () => closeModal('modal-risk-quiz'));
  document.getElementById('quiz-modal-cancel').addEventListener('click', () => closeModal('modal-risk-quiz'));

  // E. RIA Booking Modal
  const bookCallBtn = document.getElementById('buddy-book-call-btn');
  if (bookCallBtn) {
    bookCallBtn.addEventListener('click', () => openModal('modal-book-call'));
  }
  document.getElementById('close-modal-call').addEventListener('click', () => closeModal('modal-book-call'));
  document.getElementById('cancel-call-btn').addEventListener('click', () => closeModal('modal-book-call'));
  document.getElementById('confirm-call-btn').addEventListener('click', () => {
    const dateVal = document.getElementById('call-date-input').value;
    const slotVal = document.getElementById('call-time-input').value;
    
    state.notifications.unshift({
      id: `n_call_${Date.now()}`,
      type: "success",
      title: "Advisor Call Scheduled",
      description: `A 30-min session with RIA advisor has been booked for ${dateVal} at ${slotVal}. Meet link sent to your email.`,
      time: "Just Now",
      unread: true
    });
    
    closeModal('modal-book-call');
    renderAll();
  });
  
  // Link More Consent Account - delegates to Link Account Modal (openLinkAccountModal)
}

// Direct buy/sell order modal checkout
let activeFundForPurchase = null;

function openInvestCheckoutModal(fund) {
  activeFundForPurchase = fund;
  const isLiveStock = fund.price != null;

  document.getElementById('checkout-title').textContent = `Purchase units of ${fund.name}`;
  document.getElementById('checkout-asset-class').textContent = fund.category.toUpperCase();
  document.getElementById('checkout-asset-nav').textContent = isLiveStock
    ? `Live Price: ${formatRupee(fund.price)} · ${fund.ret1y}`
    : `1Y Yield: ${fund.ret1y}`;
  document.getElementById('checkout-asset-risk').textContent = `${fund.risk} Risk level`;
  
  const amtInput = document.getElementById('checkout-amount-input');
  amtInput.value = '10000';
  
  document.getElementById('modal-invest-checkout').classList.add('active');
  
  setTimeout(() => {
    amtInput.focus();
    amtInput.select();
  }, 100);
}

// Confirm investment purchase handlers
function bindInvestCheckoutEvents() {
  const cancelBtn = document.getElementById('cancel-checkout-btn');
  const confirmBtn = document.getElementById('confirm-checkout-btn');
  const overlay = document.getElementById('modal-invest-checkout');
  
  const close = () => overlay.classList.remove('active');
  
  if (cancelBtn) cancelBtn.addEventListener('click', close);
  document.getElementById('close-modal-checkout').addEventListener('click', close);
  
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const amount = parseFloat(document.getElementById('checkout-amount-input').value);
      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid investment capital.");
        return;
      }
      
      const fund = activeFundForPurchase;
      const navPrice = fund.price || 120; // live price for real stocks, dummy NAV for mock funds
      const holdingKey = (fund.symbol || fund.initials).toLowerCase();

      // Update holding values dynamically
      let existHolding = state.holdings.find(h => (h.symbol || h.shortName).toLowerCase() === holdingKey);

      if (existHolding) {
        existHolding.invested += amount;
        existHolding.currentValue += amount;
        // recalculate returns percent
        existHolding.returnPct = ((existHolding.currentValue - existHolding.invested) / existHolding.invested) * 100;
      } else {
        // Create new holding entry
        state.holdings.push({
          id: `h_${Date.now()}`,
          name: fund.name,
          shortName: fund.initials,
          symbol: fund.symbol,
          category: fund.category,
          subCategory: fund.subCategory,
          invested: amount,
          currentValue: amount,
          units: amount / navPrice,
          returnPct: 0.0
        });
      }

      // Log Transaction
      state.transactions.unshift({
        type: "BUY",
        assetName: fund.name,
        date: "Just Now",
        category: fund.category,
        amount: amount,
        units: parseFloat((amount / navPrice).toFixed(2)),
        price: navPrice,
        typeLabel: fund.symbol ? "Live Stock Order" : "Manual Order"
      });
      
      // Notify
      state.notifications.unshift({
        id: `n_buy_${Date.now()}`,
        type: "success",
        title: "Investment Purchase Confirmed",
        description: `Successfully allocated ${formatRupee(amount)} to ${fund.name}. Units will allocate in T+1 business days.`,
        time: "Just Now",
        unread: true
      });
      
      close();
      renderAll();
    });
  }
}

// User risk quiz flow modal layout
function renderQuizModalFlow() {
  const container = document.getElementById('quiz-question-container');
  if (!container) return;
  
  const questions = [
    {
      q: "What is your primary investment goal timeframe?",
      opts: ["Under 2 Years (Short)", "2 to 5 Years (Medium)", "Over 5 Years (Long)"],
      scores: ["Conservative", "Moderate", "Aggressive"]
    },
    {
      q: "How do you react if your equity portfolio drops 15% due to market corrections?",
      opts: ["Panic and sell immediately to avoid further loss", "Hold steady and wait for market recovery", "Buy more units to average down the cost"],
      scores: ["Conservative", "Moderate", "Aggressive"]
    }
  ];
  
  let currentStep = 0;
  let answers = [];
  
  const renderQuizStep = () => {
    const qObj = questions[currentStep];
    let optsHTML = '';
    qObj.opts.forEach((opt, idx) => {
      optsHTML += `
        <div class="quiz-option quiz-modal-step-option" data-idx="${idx}" style="margin-bottom:12px;">
          <span>${opt}</span>
          <i data-lucide="circle" style="width:16px;height:16px;"></i>
        </div>
      `;
    });
    
    container.innerHTML = `
      <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:10px;">Step ${currentStep + 1} of 2</div>
      <h4 style="font-size:1.05rem; font-weight:700; line-height:1.4; margin-bottom:18px;">${qObj.q}</h4>
      <div class="quiz-options-list" style="list-style:none; padding:0;">
        ${optsHTML}
      </div>
    `;
    lucide.createIcons();
    
    // Bind option click
    document.querySelectorAll('.quiz-modal-step-option').forEach(el => {
      el.addEventListener('click', () => {
        const oIdx = parseInt(el.getAttribute('data-idx'));
        answers.push(qObj.scores[oIdx]);
        
        currentStep++;
        if (currentStep < questions.length) {
          renderQuizStep();
        } else {
          // Process quiz final result
          let consCount = answers.filter(x => x === 'Conservative').length;
          let aggCount = answers.filter(x => x === 'Aggressive').length;
          
          let finalRisk = "Moderate";
          if (consCount > aggCount) finalRisk = "Conservative";
          if (aggCount > consCount) finalRisk = "Aggressive";
          
          state.user.riskProfile = finalRisk;
          
          container.innerHTML = `
            <div style="text-align:center; padding:12px;">
              <i data-lucide="shield-alert" style="width:48px;height:48px;color:var(--color-equity); margin-bottom:12px;"></i>
              <h4 style="font-size:1.2rem; font-weight:800; margin-bottom:8px;">Evaluation Finished!</h4>
              <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.4; margin-bottom:20px;">
                Based on your diagnostic, your risk appetite is categorized as <strong>${finalRisk}</strong>. We've updated your asset guidelines.
              </p>
              <button class="btn btn-primary" id="close-risk-quiz-result-btn" style="width:100%; justify-content:center;">Apply Allocation Target</button>
            </div>
          `;
          lucide.createIcons();
          
          // Trigger notifications
          state.notifications.unshift({
            id: `n_risk_${Date.now()}`,
            type: "info",
            title: "Risk Profile Diagnostic Concluded",
            description: `Evaluated risk status updated to: ${finalRisk}. Rebalancing guidelines adjusted.`,
            time: "Just Now",
            unread: true
          });
          
          document.getElementById('close-risk-quiz-result-btn').addEventListener('click', () => {
            document.getElementById('modal-risk-quiz').classList.remove('active');
            renderAll();
          });
        }
      });
    });
  };
  
  renderQuizStep();
}

// 12. AI Finance Buddy Chatbot
// Reusable chat engine — instantiated once for the full Finance Buddy page,
// and again for the floating widget available from anywhere on the site.
function createChatWidget({ messagesEl, inputEl, sendBtnEl, chipsContainerEl }) {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const TYPEWRITER_MS_PER_CHAR = 15; // ~65 chars/sec

  function appendMessage(sender, text) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${sender}`;

    const isAi = sender === 'ai';
    const avatarText = isAi ? 'AI' : 'UA';

    wrapper.innerHTML = `
      <div class="message-avatar">${avatarText}</div>
      <div class="message-bubble">
        ${formatMarkdown(text)}
      </div>
    `;
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrapper.querySelector('.message-bubble');
  }

  function showTypingIndicator() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper ai';
    wrapper.dataset.typingIndicator = 'true';

    wrapper.innerHTML = `
      <div class="message-avatar">AI</div>
      <div class="message-bubble" style="padding: 8px 16px;">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTypingIndicator() {
    const indicator = messagesEl.querySelector('[data-typing-indicator="true"]');
    if (indicator) indicator.remove();
  }

  async function askBuddy(txt) {
    appendMessage("user", txt);
    showTypingIndicator();

    let bubble = null;
    let fullText = '';
    let shownLength = 0;
    let typewriterTimer = null;

    const revealNextChar = () => {
      if (shownLength >= fullText.length) {
        typewriterTimer = null;
        return;
      }
      shownLength++;
      bubble.textContent = fullText.slice(0, shownLength);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      typewriterTimer = setTimeout(revealNextChar, TYPEWRITER_MS_PER_CHAR);
    };

    try {
      await streamChatMessage({ message: txt, sessionId }, (chunk) => {
        if (!bubble) {
          removeTypingIndicator();
          bubble = appendMessage("ai", "");
        }
        fullText += chunk;
        if (!typewriterTimer) revealNextChar();
      });

      // Let the typewriter finish revealing any text still queued up.
      while (shownLength < fullText.length) {
        await new Promise((resolve) => setTimeout(resolve, TYPEWRITER_MS_PER_CHAR));
      }

      if (bubble) {
        bubble.innerHTML = formatMarkdown(fullText);
      } else {
        removeTypingIndicator();
        appendMessage("ai", "Sorry, I couldn't generate a response.");
      }
    } catch (err) {
      if (typewriterTimer) clearTimeout(typewriterTimer);
      removeTypingIndicator();
      if (bubble) {
        bubble.closest('.message-wrapper').remove();
      }
      appendMessage("ai", "Sorry, Finance Buddy is currently unavailable. Please try again in a moment.");
    }
  }

  const sendMessage = () => {
    const txt = inputEl.value.trim();
    if (txt.length === 0) return;
    inputEl.value = '';
    askBuddy(txt);
  };

  sendBtnEl.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  if (chipsContainerEl) {
    chipsContainerEl.querySelectorAll('.suggested-chip').forEach(chip => {
      chip.addEventListener('click', () => askBuddy(chip.textContent));
    });
  }

  return { askBuddy };
}

function setupFloatingChatWidget() {
  const anchor = document.getElementById('fab-chat-anchor');
  const toggleBtn = document.getElementById('fab-chat-toggle');
  const panel = document.getElementById('fab-chat-panel');
  const closeBtn = document.getElementById('fab-chat-close-btn');
  const messagesEl = document.getElementById('fab-chat-messages');
  const inputEl = document.getElementById('fab-chat-input-field');
  const sendBtnEl = document.getElementById('fab-chat-send-btn');
  const chipsContainerEl = document.getElementById('fab-suggested-questions-row');

  if (!anchor || !toggleBtn || !panel || !messagesEl || !inputEl || !sendBtnEl) return;

  createChatWidget({ messagesEl, inputEl, sendBtnEl, chipsContainerEl });

  // Position the chat panel next to wherever the anchor currently is,
  // flipping to whichever side/edge keeps it fully on-screen.
  const positionPanel = () => {
    const rect = anchor.getBoundingClientRect();
    const gap = 12;
    const panelWidth = Math.min(380, window.innerWidth - 32);
    const panelHeight = Math.min(560, window.innerHeight - 140);

    const opensAbove = rect.top - panelHeight - gap > 0;
    // Prefer extending rightward from the button's left edge, but only if the
    // panel actually fits — otherwise anchor to the button's right edge instead
    // so the panel extends leftward and stays fully on-screen.
    const opensRightward = rect.left + panelWidth <= window.innerWidth;

    panel.style.width = `${panelWidth}px`;
    panel.style.height = `${panelHeight}px`;

    if (opensAbove) {
      panel.style.top = 'auto';
      panel.style.bottom = `${window.innerHeight - rect.top + gap}px`;
    } else {
      panel.style.bottom = 'auto';
      panel.style.top = `${rect.bottom + gap}px`;
    }

    if (opensRightward) {
      panel.style.right = 'auto';
      panel.style.left = `${rect.left}px`;
    } else {
      panel.style.left = 'auto';
      panel.style.right = `${window.innerWidth - rect.right}px`;
    }
  };

  const openPanel = () => {
    positionPanel();
    panel.classList.add('active');
    toggleBtn.classList.add('active');
    anchor.classList.add('panel-open');
  };

  const closePanel = () => {
    panel.classList.remove('active');
    toggleBtn.classList.remove('active');
    anchor.classList.remove('panel-open');
  };

  toggleBtn.addEventListener('click', () => {
    if (panel.classList.contains('active')) closePanel();
    else openPanel();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closePanel);
  }

  // Dragging — a pointer-based drag with a small movement threshold so a
  // plain click still toggles the chat instead of being swallowed as a drag.
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let originLeft = 0;
  let originTop = 0;

  toggleBtn.addEventListener('pointerdown', (e) => {
    dragging = true;
    moved = false;
    const rect = anchor.getBoundingClientRect();
    originLeft = rect.left;
    originTop = rect.top;
    startX = e.clientX;
    startY = e.clientY;

    anchor.style.right = 'auto';
    anchor.style.bottom = 'auto';
    anchor.style.left = `${originLeft}px`;
    anchor.style.top = `${originTop}px`;

    toggleBtn.setPointerCapture(e.pointerId);
  });

  toggleBtn.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      if (!moved) anchor.classList.add('dragging');
      moved = true;
    }
    if (!moved) return;

    const rect = anchor.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width;
    const maxTop = window.innerHeight - rect.height;
    const newLeft = Math.min(Math.max(0, originLeft + dx), maxLeft);
    const newTop = Math.min(Math.max(0, originTop + dy), maxTop);

    anchor.style.left = `${newLeft}px`;
    anchor.style.top = `${newTop}px`;

    if (panel.classList.contains('active')) positionPanel();
  });

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    anchor.classList.remove('dragging');
    if (toggleBtn.hasPointerCapture(e.pointerId)) {
      toggleBtn.releasePointerCapture(e.pointerId);
    }
    if (moved) {
      // Suppress the click event this same interaction would otherwise fire,
      // so ending a drag doesn't also toggle the chat panel open/closed.
      const suppressClick = (clickEvent) => {
        clickEvent.stopImmediatePropagation();
        clickEvent.preventDefault();
      };
      toggleBtn.addEventListener('click', suppressClick, { capture: true, once: true });
    }
  };

  toggleBtn.addEventListener('pointerup', endDrag);
  toggleBtn.addEventListener('pointercancel', endDrag);

  window.addEventListener('resize', () => {
    if (panel.classList.contains('active')) positionPanel();
  });
}

// 12b. Portfolio Analyzer
const portfolioAnalysisSessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Real holdings (fetched from the backend) carry a category — 'equity',
// 'mf', or 'gold' — but no per-holding sector data (Yahoo Finance's basic
// quote doesn't include it), so sector is a generic default per category
// rather than something fabricated per individual holding.
const ANALYZER_ASSET_TYPE_BY_CATEGORY = {
  mf: "Mutual Fund",
  equity: "Equity",
  gold: "Gold",
};

const ANALYZER_SECTOR_BY_CATEGORY = {
  mf: "Diversified",
  equity: "Equity",
  gold: "Commodities",
};

function buildPortfolioAnalysisPayload() {
  const holdings = state.holdings.map((h) => ({
    asset_name: h.name,
    asset_type: ANALYZER_ASSET_TYPE_BY_CATEGORY[h.category] || "Equity",
    sector: ANALYZER_SECTOR_BY_CATEGORY[h.category] || "General",
    quantity: h.units,
    avg_buy_price: h.invested / h.units,
    current_price: h.currentValue / h.units,
  }));

  return {
    user_id: auth.currentUser?.uid || 'demo-user',
    session_id: portfolioAnalysisSessionId,
    holdings,
  };
}

function setupPortfolioAnalyzer() {
  const runBtn = document.getElementById('portfolio-analyzer-run-btn');
  if (!runBtn) return;

  runBtn.addEventListener('click', runPortfolioAnalysis);
}

async function runPortfolioAnalysis() {
  const idleEl = document.getElementById('portfolio-analyzer-idle');
  const loadingEl = document.getElementById('portfolio-analyzer-loading');
  const resultEl = document.getElementById('portfolio-analyzer-result');

  idleEl.style.display = 'none';
  resultEl.style.display = 'none';
  loadingEl.style.display = 'block';

  try {
    const result = await analyzePortfolio(buildPortfolioAnalysisPayload());
    renderPortfolioAnalysisResult(result);
    loadingEl.style.display = 'none';
    resultEl.style.display = 'block';
    renderAuditLog();
  } catch (err) {
    loadingEl.style.display = 'none';
    idleEl.style.display = 'block';
    alert('Could not analyze your portfolio right now. The Portfolio Analyzer service may be unavailable.');
  }
}

const ANALYZER_RISK_COLOR = { Low: 'var(--color-success)', Moderate: 'var(--color-warning)', High: 'var(--color-danger, #dc2626)' };

function renderPortfolioAnalysisResult(result) {
  const resultEl = document.getElementById('portfolio-analyzer-result');
  const risk = result.risk_analysis;
  const rec = result.recommendations;
  const riskColor = ANALYZER_RISK_COLOR[risk.overall_risk] || 'var(--text-primary)';

  const warningsHtml = risk.warnings.length
    ? `<ul style="margin:8px 0 0; padding-left:18px; font-size:0.78rem; color:var(--text-secondary); line-height:1.5;">
        ${risk.warnings.map(w => `<li>${w}</li>`).join('')}
      </ul>`
    : '';

  const recommendationsHtml = rec.recommendations.length
    ? `<ul style="margin:8px 0 0; padding-left:18px; font-size:0.78rem; line-height:1.5;">
        ${rec.recommendations.map(r => `<li>${r}</li>`).join('')}
      </ul>`
    : '';

  resultEl.innerHTML = `
    <div style="display:flex; gap:10px; margin-bottom:14px;">
      <div style="flex:1; text-align:center; padding:10px; border-radius:10px; background:rgba(37,99,235,0.06);">
        <div style="font-size:1.3rem; font-weight:700;">${result.health_score}/100</div>
        <div style="font-size:0.7rem; color:var(--text-secondary);">${result.health_label}</div>
      </div>
      <div style="flex:1; text-align:center; padding:10px; border-radius:10px; background:rgba(37,99,235,0.06);">
        <div style="font-size:1.3rem; font-weight:700; color:${riskColor};">${risk.overall_risk}</div>
        <div style="font-size:0.7rem; color:var(--text-secondary);">Overall Risk</div>
      </div>
    </div>

    <div style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:4px;">
      Diversification Score: <strong style="color:var(--text-primary);">${risk.diversification_score}/100</strong>
    </div>
    ${warningsHtml}

    <div style="margin-top:16px; padding-top:14px; border-top:1px solid var(--border-glass);">
      <strong style="font-size:0.85rem;">AI Insight</strong>
      <p style="font-size:0.8rem; line-height:1.5; margin-top:6px;">${rec.overall_summary}</p>
      ${recommendationsHtml}
    </div>

    <p style="font-size:0.68rem; color:var(--text-muted); margin-top:14px;">${rec.disclaimer}</p>

    <button class="btn btn-secondary" id="portfolio-analyzer-rerun-btn" style="width:100%; justify-content:center; margin-top:12px;">
      Re-analyze
    </button>
  `;

  document.getElementById('portfolio-analyzer-rerun-btn').addEventListener('click', runPortfolioAnalysis);
  if (window.lucide) lucide.createIcons();
}

// 12c. Portfolio Analyzer Audit Log
function setupAuditLog() {
  const refreshBtn = document.getElementById('audit-log-refresh-btn');
  if (!refreshBtn) return;

  refreshBtn.addEventListener('click', renderAuditLog);
  renderAuditLog();
}

// Shortens long Firebase UIDs / session IDs for the audit log row (full value
// stays available via the element's title tooltip).
function truncateId(id) {
  if (!id || id === 'N/A' || id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

async function renderAuditLog() {
  const list = document.getElementById('audit-log-list');
  if (!list) return;

  list.innerHTML = `<p style="font-size:0.8rem; color:var(--text-secondary);">Loading audit log...</p>`;

  try {
    const { entries } = await getAuditLog({ userId: auth.currentUser?.uid });

    if (!entries || entries.length === 0) {
      list.innerHTML = `<p style="font-size:0.8rem; color:var(--text-secondary);">No audit log entries yet. Entries appear here once a portfolio analysis is run.</p>`;
      return;
    }

    const orderedEntries = entries.slice().reverse();

    list.innerHTML = orderedEntries
      .map((entry, i) => {
        const time = new Date(entry.timestamp).toLocaleString();
        const risk = entry.response?.risk_analysis;
        const healthLabel = entry.response?.health_label ?? 'N/A';
        const overallRisk = risk?.overall_risk ?? 'N/A';
        const holdingsCount = entry.request?.holdings?.length ?? 0;

        const sessionIdFull = entry.session_id ?? 'N/A';
        const sessionIdShort = truncateId(sessionIdFull);
        const userName = state.user?.fullName ?? entry.user_id ?? 'N/A';

        return `
          <div style="border:1px solid var(--border-color, rgba(0,0,0,0.08)); border-radius:10px; overflow:hidden; flex-shrink:0;">
            <button class="audit-log-row-toggle" data-audit-index="${i}">
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.78rem; color:var(--text-secondary); margin-bottom:4px;">
                <span>${time}</span>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span title="${sessionIdFull}">Session: ${sessionIdShort}</span>
                  <i data-lucide="chevron-down" class="audit-log-chevron" style="width:14px; height:14px; transition: transform 0.2s;"></i>
                </div>
              </div>
              <div style="font-size:0.85rem;">
                <strong>User:</strong> ${userName} &nbsp;·&nbsp;
                <strong>Holdings:</strong> ${holdingsCount} &nbsp;·&nbsp;
                <strong>Risk:</strong> ${overallRisk} &nbsp;·&nbsp;
                <strong>Health:</strong> ${healthLabel}
              </div>
            </button>
            <div class="audit-log-detail" id="audit-log-detail-${i}" style="display:none; padding:0 14px 14px; border-top:1px solid var(--border-color, rgba(0,0,0,0.08));">
              ${formatAuditLogDetail(entry)}
            </div>
          </div>
        `;
      })
      .join('');

    list.querySelectorAll('.audit-log-row-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = btn.dataset.auditIndex;
        const detail = document.getElementById(`audit-log-detail-${idx}`);
        const chevron = btn.querySelector('.audit-log-chevron');
        const isOpen = detail.style.display !== 'none';
        detail.style.display = isOpen ? 'none' : 'block';
        chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
      });
    });

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    list.innerHTML = `<p style="font-size:0.8rem; color:var(--color-danger, #d33);">Could not load audit log. The Portfolio Analyzer service may be unavailable.</p>`;
  }
}

function formatAuditLogDetail(entry) {
  const holdings = entry.request?.holdings ?? [];
  const risk = entry.response?.risk_analysis;
  const rec = entry.response?.recommendations;
  const pa = entry.response?.portfolio_analysis;

  // Entries logged before a serialization fix stored these as plain Python
  // repr strings instead of structured JSON — nothing to render for those.
  const isLegacyFormat = (risk && typeof risk !== 'object') || (rec && typeof rec !== 'object') || (pa && typeof pa !== 'object');
  if (isLegacyFormat) {
    return `
      <div style="font-size:0.78rem; line-height:1.6; padding-top:10px; color:var(--text-secondary);">
        Detailed breakdown isn't available for this entry — it was logged before a data formatting fix.
        Run a new analysis to see full details here.
      </div>
    `;
  }

  const holdingsRows = holdings
    .map(h => `
      <tr>
        <td style="padding:4px 8px 4px 0;">${h.asset_name}</td>
        <td style="padding:4px 8px;">${h.asset_type}</td>
        <td style="padding:4px 8px;">${h.sector}</td>
        <td style="padding:4px 8px; text-align:right;">${h.quantity}</td>
        <td style="padding:4px 0 4px 8px; text-align:right;">${formatRupee(h.current_value ?? h.quantity * h.current_price)}</td>
      </tr>
    `)
    .join('');

  const warningsHtml = risk?.warnings?.length
    ? `<ul style="margin:4px 0 0; padding-left:16px;">${risk.warnings.map(w => `<li>${w}</li>`).join('')}</ul>`
    : '<span style="color:var(--text-secondary);">None</span>';

  const sectorConcentrationHtml = risk?.sector_concentration
    ? Object.entries(risk.sector_concentration).map(([sector, pct]) => `${sector}: ${pct}%`).join(' · ')
    : 'N/A';

  const recommendationsHtml = rec?.recommendations?.length
    ? `<ul style="margin:4px 0 0; padding-left:16px;">${rec.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>`
    : '<span style="color:var(--text-secondary);">None</span>';

  return `
    <div style="font-size:0.78rem; line-height:1.6; padding-top:10px;">
      <strong>Holdings submitted</strong>
      <table style="width:100%; border-collapse:collapse; margin:6px 0 12px; font-size:0.76rem;">
        <thead>
          <tr style="color:var(--text-secondary); text-align:left;">
            <th style="padding:2px 8px 2px 0;">Asset</th>
            <th style="padding:2px 8px;">Type</th>
            <th style="padding:2px 8px;">Sector</th>
            <th style="padding:2px 8px; text-align:right;">Qty</th>
            <th style="padding:2px 0 2px 8px; text-align:right;">Value</th>
          </tr>
        </thead>
        <tbody>${holdingsRows}</tbody>
      </table>

      <strong>Portfolio Analysis</strong>
      <p style="margin:4px 0 12px;">
        Total value: <strong>${pa ? formatRupee(pa.total_portfolio_value) : 'N/A'}</strong> ·
        Largest holding: <strong>${pa?.largest_holding ?? 'N/A'}</strong>
        (${pa ? pa.largest_holding_percentage.toFixed(1) : '0'}%)
      </p>

      <strong>Risk Analysis</strong>
      <p style="margin:4px 0 6px;">
        Concentration risk: <strong>${risk?.concentration_risk ?? 'N/A'}</strong> ·
        Diversification score: <strong>${risk?.diversification_score ?? 'N/A'}/100</strong>
      </p>
      <p style="margin:0 0 4px; color:var(--text-secondary);">Sector concentration: ${sectorConcentrationHtml}</p>
      <div style="margin-bottom:12px;">Warnings: ${warningsHtml}</div>

      <strong>AI Recommendations</strong>
      <p style="margin:4px 0 6px;">${rec?.overall_summary ?? 'N/A'}</p>
      ${recommendationsHtml}

      <p style="margin-top:12px; color:var(--text-muted); font-size:0.7rem;">${rec?.disclaimer ?? ''}</p>

      <p style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--border-color, rgba(0,0,0,0.08)); color:var(--text-muted); font-size:0.68rem; word-break:break-all;">
        Analyzer version: <strong>${entry.analyzer_version ?? 'N/A'}</strong> ·
        Response hash (SHA-256): <code>${entry.response_hash ?? 'N/A'}</code>
      </p>
    </div>
  `;
}

// Markdown Formatter
function formatMarkdown(text) {
  // Simple markdown processor converting bold blocks and line breaks
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
  
  // Process list lines starting with -
  const lines = html.split('<br>');
  let insideList = false;
  let result = [];
  
  lines.forEach(l => {
    if (l.trim().startsWith('- ')) {
      if (!insideList) {
        result.push('<ul>');
        insideList = true;
      }
      result.push(`<li>${l.trim().substring(2)}</li>`);
    } else {
      if (insideList) {
        result.push('</ul>');
        insideList = false;
      }
      result.push(l);
    }
  });
  
  if (insideList) result.push('</ul>');
  
  return result.join('<br>').replace(/<\/ul><br>/g, '</ul>').replace(/<br><ul>/g, '<ul>');
}

// 13. Initialization & Event Triggers
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  bindPortfolioEvents();
  bindInvestEvents();
  initInvestStockSearch();
  initSearchAutocomplete();
  initExportCSV();
  setupModals();
  bindInvestCheckoutEvents();
  bindStockChartModalEvents();
  renderMarketIndices();
  initCalculatorTabs();
  initLearnTabs();
  renderQuiz();
  setupFloatingChatWidget();
  setupAuditLog();
  setupPortfolioAnalyzer();
  
  // Close welcome nudge card alert logic
  const closeNudgeBtn = document.getElementById('close-dashboard-nudge');
  if (closeNudgeBtn) {
    closeNudgeBtn.addEventListener('click', () => {
      localStorage.setItem('nudge-dismissed-rebalance', 'true');
      document.getElementById('dashboard-nudge').style.display = 'none';
    });
  }
  
  // Goals nudge dismiss
  const closeGoalsNudgeBtn = document.getElementById('close-goals-nudge');
  if (closeGoalsNudgeBtn) {
    closeGoalsNudgeBtn.addEventListener('click', () => {
      document.getElementById('goals-milestone-nudge').style.display = 'none';
    });
  }
  
  // Topbar settings trigger
  const topbarSettingsBtn = document.getElementById('topbar-settings-btn');
  if (topbarSettingsBtn) {
    topbarSettingsBtn.addEventListener('click', () => {
      openProfilePage();
    });
  }
  
  // Topbar bell trigger
  const topbarBellBtn = document.getElementById('topbar-bell-btn');
  if (topbarBellBtn) {
    topbarBellBtn.addEventListener('click', () => {
      navigateToPage('notifications');
    });
  }
  
  // Sidebar settings trigger
  const sidebarSettingsBtn = document.getElementById('sidebar-settings-btn');
  if (sidebarSettingsBtn) {
    sidebarSettingsBtn.addEventListener('click', () => {
      openProfilePage();
    });
  }

  const profileBackBtn = document.getElementById('profile-back-btn');
  if (profileBackBtn) {
    profileBackBtn.addEventListener('click', closeProfilePage);
  }

  const profileSignOutBtn = document.getElementById('profile-signout-btn');
  if (profileSignOutBtn) {
    profileSignOutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        closeProfilePage();
      } catch (err) {
        alert('Sign out failed. Please try again.');
      }
    });
  }


  // Notifications mark all read button
  const notifMarkReadBtn = document.getElementById('notif-mark-read-btn');
  if (notifMarkReadBtn) {
    notifMarkReadBtn.addEventListener('click', () => {
      state.notifications.forEach(n => n.unread = false);
      renderAll();
    });
  }
  
  // Initial render
  renderAll();
  initPortfolioChart();
  initSpotlightNavbar();
});

// ─── SpotlightNavbar Engine ──────────────────────────────────────────────────
function initSpotlightNavbar() {
  const nav    = document.getElementById('spotlight-nav');
  const pill   = document.getElementById('nav-spotlight-pill');
  const cursor = document.getElementById('nav-spotlight-cursor');
  if (!nav || !pill || !cursor) return;

  // Position the pill over the currently active nav <li> element
  function movePillToActive() {
    const active = nav.querySelector('.nav-item.active');
    if (!active) return;
    const navRect = nav.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    pill.style.left  = (activeRect.left - navRect.left) + 'px';
    pill.style.width = activeRect.width + 'px';
    pill.style.opacity = '1';
  }

  // On load, snap to active without animation
  function initializePill() {
    pill.style.transition = 'none';
    movePillToActive();
    // Re-enable transition after next frame
    requestAnimationFrame(() => {
      // The CSS specifies the transition, so we just clear the inline override
      pill.style.transition = '';
    });
  }

  initializePill();

  // Listen for the custom event when active item changes (from scroll or click)
  window.addEventListener('navActiveChanged', () => {
    movePillToActive(); // Animate to new active item
  });

  // Re-snap whenever window resizes (pill position is absolute px)
  window.addEventListener('resize', initializePill);

  // Cursor glow: track mouse position relative to nav and update the ::before pseudo
  nav.addEventListener('mousemove', (e) => {
    const rect = nav.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cursor.style.setProperty('--cx', x + 'px');
    cursor.style.setProperty('--cy', y + 'px');
    cursor.style.background =
      `radial-gradient(circle 80px at ${x}px ${y}px, rgba(255,255,255,0.10) 0%, transparent 70%)`;
  });

  nav.addEventListener('mouseleave', () => {
    cursor.style.background = 'none';
  });
}
