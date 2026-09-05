import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Search, Sparkles,
  Clock, CreditCard, TrendingUp, DollarSign, UserCheck,
  Layers, CheckCircle2, FileText, AlertCircle, Sun, Moon,
  Database, Cpu, ChevronDown
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────── */
/* Theme Context                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('fraud-desk-theme');
    return saved !== null ? saved === 'dark' : true; // default dark
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
      document.body.style.backgroundColor = '#080C14';
      document.body.style.color = '#f3f4f6';
    } else {
      root.classList.add('light-mode');
      document.body.classList.add('light-mode');
      document.body.style.backgroundColor = '#f0f4f8';
      document.body.style.color = '#0f172a';
    }
    localStorage.setItem('fraud-desk-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return { isDark, toggleTheme: () => setIsDark(v => !v) };
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Theme Toggle Button                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */
function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`
        theme-toggle-btn relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isDark 
          ? 'bg-slate-700 border border-slate-600 focus:ring-offset-slate-900' 
          : 'bg-blue-100 border border-blue-200 focus:ring-offset-white'}
      `}
    >
      {/* Track icons */}
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[11px]">
        {isDark ? '🌙' : ''}
      </span>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px]">
        {!isDark ? '☀️' : ''}
      </span>
      {/* Thumb */}
      <span className={`
        absolute top-0.5 w-6 h-6 rounded-full shadow-md flex items-center justify-center transition-all duration-300
        ${isDark 
          ? 'left-0.5 bg-slate-900 text-yellow-300' 
          : 'left-[calc(100%-1.625rem)] bg-white text-amber-500 shadow-lg'}
      `}>
        {isDark 
          ? <Moon className="w-3 h-3" /> 
          : <Sun className="w-3 h-3" />}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Main App Component                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */
export default function App() {
  const { isDark, toggleTheme } = useTheme();

  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('clean');
  const [transactionsData, setTransactionsData] = useState(null);
  const [baselineData, setBaselineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [investigating, setInvestigating] = useState(false);
  const [investigationReport, setInvestigationReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');

  useEffect(() => { fetchScenarios(); }, []);
  useEffect(() => { loadScenarioData(selectedScenario); }, [selectedScenario]);

  async function fetchScenarios() {
    try {
      const res = await fetch('/api/scenarios');
      if (res.ok) setScenarios(await res.json());
    } catch {}
  }

  async function loadScenarioData(scenarioId) {
    setLoading(true);
    try {
      const [txRes, baseRes] = await Promise.all([
        fetch(`/api/transactions?scenario_id=${scenarioId}`),
        fetch(`/api/baseline?scenario_id=${scenarioId}`)
      ]);
      if (txRes.ok && baseRes.ok) {
        setTransactionsData(await txRes.json());
        setBaselineData(await baseRes.json());
      }
    } catch {}
    finally { setLoading(false); }
  }

  async function handleRunInvestigation() {
    setInvestigating(true);
    try {
      const res = await fetch(`/api/investigate?scenario_id=${selectedScenario}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setInvestigationReport(data.investigation_report);
        setShowReportModal(true);
      }
    } catch {}
    finally { setInvestigating(false); }
  }

  const activeScenarioObj = scenarios.find(s => s.id === selectedScenario) || { name: '', description: '' };
  const anomalyCount = transactionsData?.anomaly_count || 0;

  const filteredTransactions = (transactionsData?.all_transactions || []).filter(t => {
    const q = searchTerm.toLowerCase();
    const match = t.transaction_id.toLowerCase().includes(q) ||
                  t.payee.toLowerCase().includes(q) ||
                  t.description.toLowerCase().includes(q) ||
                  t.channel.toLowerCase().includes(q);
    return filterMode === 'flagged' ? match && t.is_anomalous : match;
  });

  // Colour helpers that adapt to theme
  const T = {
    // backgrounds
    base:      isDark ? 'bg-[#080C14]'  : 'bg-[#f0f4f8]',
    nav:       isDark ? 'bg-[#0C111D]/90' : 'bg-white/95',
    card:      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200',
    cardSolid: isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200',
    tableHead: isDark ? 'bg-slate-900/80' : 'bg-slate-50',
    tableRow:  isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50',
    tableRowFlag: isDark ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'bg-red-50 hover:bg-red-100/70',
    input:     isDark ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400',
    modal:     isDark ? 'bg-[#0D131F] border-slate-700' : 'bg-white border-slate-200',
    modalHead: isDark ? 'bg-slate-900/60' : 'bg-slate-50',
    badge:     isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-300',
    navBorder: isDark ? 'border-slate-800/80' : 'border-slate-200',
    // text
    primary:   isDark ? 'text-slate-100' : 'text-slate-900',
    secondary: isDark ? 'text-slate-400' : 'text-slate-500',
    muted:     isDark ? 'text-slate-500' : 'text-slate-400',
    heading:   isDark ? 'text-slate-200' : 'text-slate-700',
    // dividers
    divide:    isDark ? 'divide-slate-800/60' : 'divide-slate-200',
    border:    isDark ? 'border-slate-800' : 'border-slate-200',
  };

  return (
    <div className={`min-h-screen ${T.base} ${T.primary} flex flex-col font-sans pb-16`}>

      {/* ── TOP NAVIGATION ───────────────────────────────────────────────── */}
      <header className={`border-b ${T.navBorder} ${T.nav} backdrop-blur sticky top-0 z-40 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  NEXUS FRAUD DESK
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  TRACK_ID=PS06
                </span>
              </div>
              <p className={`text-xs ${T.secondary}`}>Transaction Risk & Anomaly Investigation Engine</p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* System badges - hidden on mobile */}
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg ${T.cardSolid} text-xs font-mono`}>
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span className={T.secondary}>SQLite:</span>
              <span className="text-emerald-500 font-semibold">Ready</span>
            </div>
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${T.cardSolid} text-xs font-mono`}>
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              <span className={T.secondary}>Model:</span>
              <span className="text-blue-500 font-semibold">Gemini 3.5 Flash Lite</span>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

            {/* Investigate CTA */}
            <button
              onClick={handleRunInvestigation}
              disabled={investigating}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-lg ${
                investigating 
                  ? 'bg-blue-600/50 text-blue-200 cursor-wait'
                  : anomalyCount > 0
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-rose-900/30 ring-2 ring-rose-500/30'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/30'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${investigating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{investigating ? 'Investigating...' : 'Run Investigation'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full space-y-5">

        {/* SCENARIO SELECTOR */}
        <section className={`glass-panel p-4 rounded-2xl border ${T.border} flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <h2 className={`text-xs font-bold uppercase tracking-widest ${T.secondary}`}>Customer Scenario</h2>
            </div>
            <p className={`text-xs ${T.muted} max-w-xl`}>{activeScenarioObj.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {scenarios.map((s) => {
              const isActive = selectedScenario === s.id;
              const color = s.id === 'clean'
                ? { on: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600', dot: 'bg-emerald-500' }
                : s.id === 'burst_attack'
                  ? { on: 'bg-amber-500/10 border-amber-500/40 text-amber-600', dot: 'bg-amber-500' }
                  : { on: 'bg-rose-500/10 border-rose-500/40 text-rose-600', dot: 'bg-rose-500' };
              return (
                <button key={s.id}
                  onClick={() => { setSelectedScenario(s.id); setInvestigationReport(null); }}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all
                    ${isActive ? color.on : `${T.cardSolid} ${T.secondary} hover:${T.heading}`}`}
                >
                  <span className={`w-2 h-2 rounded-full ${color.dot} ${!isActive && 'opacity-40'}`} />
                  {s.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* METRIC CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Spend */}
          <div className={`glass-panel p-5 rounded-2xl border ${T.border}`}>
            <div className={`flex items-center justify-between mb-2 ${T.secondary}`}>
              <span className="text-xs font-semibold uppercase tracking-wider">6-Month Spend (₹)</span>
              <DollarSign className="w-4 h-4 text-blue-500" />
            </div>
            <div className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ₹{(baselineData?.total_volume || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`mt-2 flex items-center gap-1.5 text-xs ${T.muted}`}>
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{baselineData?.total_transactions || 0} Total Transactions</span>
            </div>
          </div>

          {/* Baseline Average */}
          <div className={`glass-panel p-5 rounded-2xl border ${T.border}`}>
            <div className={`flex items-center justify-between mb-2 ${T.secondary}`}>
              <span className="text-xs font-semibold uppercase tracking-wider">Baseline Avg</span>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-500">
              ₹{(baselineData?.mean_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`mt-2 flex items-center gap-2 text-xs ${T.muted}`}>
              <span className={`px-1.5 py-0.5 rounded font-mono ${T.badge}`}>σ ₹{(baselineData?.std_dev || 0).toFixed(0)}</span>
              <span>3× cap ₹{(baselineData?.threshold_3x_mean || 0).toFixed(0)}</span>
            </div>
          </div>

          {/* Operating Hours */}
          <div className={`glass-panel p-5 rounded-2xl border ${T.border}`}>
            <div className={`flex items-center justify-between mb-2 ${T.secondary}`}>
              <span className="text-xs font-semibold uppercase tracking-wider">Normal Hours</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-500">07:00 – 22:30</div>
            <div className={`mt-2 flex items-center gap-1.5 text-xs ${T.muted}`}>
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>01:00–05:30 = Anomalous</span>
            </div>
          </div>

          {/* Deterministic Flags */}
          <div className={`p-5 rounded-2xl border transition-all ${
            anomalyCount > 0
              ? isDark 
                ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/30'
                : 'bg-red-50 border-red-300 shadow-sm shadow-red-200'
              : `glass-panel ${T.border}`
          }`}>
            <div className={`flex items-center justify-between mb-2 ${T.secondary}`}>
              <span className="text-xs font-semibold uppercase tracking-wider">Anomaly Flags</span>
              {anomalyCount > 0 
                ? <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
                : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
            <div className={`text-2xl font-bold font-mono ${anomalyCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {anomalyCount} {anomalyCount === 1 ? 'Anomaly' : 'Anomalies'}
            </div>
            <div className={`mt-2 text-xs font-medium ${anomalyCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {anomalyCount > 0 ? 'Deterministic Rule Triggered' : '100% Within Statistical Bounds'}
            </div>
          </div>
        </section>

        {/* TIMELINE CHART + PAYEES */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* 24-Hour Activity Bar Chart */}
          <div className={`lg:col-span-2 glass-panel p-5 rounded-2xl border ${T.border}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>24-Hour Activity Profile</h3>
                <p className={`text-xs ${T.secondary}`}>Transaction distribution across time of day</p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className={`flex items-center gap-1 ${T.secondary}`}>
                  <span className="w-2.5 h-2.5 rounded bg-blue-500/50"></span>Normal
                </span>
                <span className="flex items-center gap-1 text-rose-500">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>Off-Hours
                </span>
              </div>
            </div>

            <div className="h-36 flex items-end gap-1 pb-2 border-b" style={{ borderColor: isDark ? '#1f2937' : '#e2e8f0' }}>
              {Array.from({ length: 24 }).map((_, hour) => {
                const hourStat = baselineData?.hourly_distribution?.find(h => h.hour_of_day === hour);
                const count = hourStat ? hourStat.count : 0;
                const isOffHours = hour >= 1 && hour < 6;
                const isSpike = isOffHours && count > 0;
                const maxCount = Math.max(...(baselineData?.hourly_distribution?.map(h => h.count) || [1]), 10);
                const heightPct = Math.max(4, Math.min(100, (count / maxCount) * 100));
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t transition-all ${
                        isSpike
                          ? 'bg-rose-500 shadow-md shadow-rose-500/40'
                          : count > 0
                            ? isDark ? 'bg-blue-500/60 group-hover:bg-blue-400' : 'bg-blue-400/70 group-hover:bg-blue-500'
                            : isDark ? 'bg-slate-800/40' : 'bg-slate-200/60'
                      }`}
                    />
                    <span className={`text-[9px] font-mono ${hour % 4 === 0 ? T.muted : 'text-transparent'}`}>
                      {hour}h
                    </span>
                    {/* Tooltip */}
                    <div className={`absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center text-[11px] rounded px-2 py-1.5 shadow-xl z-20 whitespace-nowrap pointer-events-none border
                      ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                      <span className="font-semibold">{hour}:00 – {hour}:59</span>
                      <span className={T.secondary}>{count} Txns {isSpike && '⚠️ Off-Hours'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={`flex justify-between text-[10px] font-mono mt-2 ${T.muted}`}>
              <span>00:00</span><span>12:00</span><span>23:59</span>
            </div>
          </div>

          {/* Frequent Payees */}
          <div className={`glass-panel p-5 rounded-2xl border ${T.border}`}>
            <h3 className={`text-sm font-semibold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Frequent Payees</h3>
            <p className={`text-xs mb-3 ${T.secondary}`}>Verified recurring beneficiaries</p>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {(baselineData?.frequent_payees || []).slice(0, 6).map((payee, idx) => (
                <div key={idx} className={`flex items-center justify-between p-2 rounded-lg border text-xs ${T.cardSolid}`}>
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center font-mono text-[10px] font-bold
                      ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                      {idx + 1}
                    </span>
                    <span className={`truncate font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{payee.payee}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className={`font-mono text-[10px] ${T.muted}`}>{payee.count}×</span>
                    <span className={`font-mono font-bold text-[11px] ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      ₹{payee.total_volume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRANSACTIONS TABLE */}
        <section className={`glass-panel rounded-2xl border ${T.border} overflow-hidden`}>
          {/* Table Header Bar */}
          <div className={`p-4 border-b ${T.border} ${isDark ? 'bg-slate-900/40' : 'bg-slate-50'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
            <div>
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                <CreditCard className="w-4 h-4 text-blue-500" />
                6-Month Transaction Ledger (INR / ₹)
              </h3>
              <p className={`text-xs ${T.secondary}`}>
                {filteredTransactions.length} of {transactionsData?.total_scanned || 0} records
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 min-w-[160px] sm:w-56">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${T.muted}`} />
                <input type="text" placeholder="Search ID, Payee, Channel..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:border-blue-500 ${T.input}`}
                />
              </div>
              {/* Filter pills */}
              <div className={`flex rounded-xl p-1 border gap-1 ${T.cardSolid}`}>
                <button onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${filterMode === 'all'
                    ? 'bg-blue-600 text-white shadow'
                    : T.secondary}`}>
                  All ({transactionsData?.total_scanned || 0})
                </button>
                <button onClick={() => setFilterMode('flagged')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${filterMode === 'flagged'
                    ? 'bg-rose-600 text-white shadow'
                    : T.secondary}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Flagged ({anomalyCount})
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`${T.tableHead} ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider font-semibold border-b ${T.border}`}>
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 font-mono">Txn ID</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Payee / Beneficiary</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Anomaly Rule</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${T.divide}`}>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`py-12 text-center ${T.muted}`}>
                      No transactions match the current filter.
                    </td>
                  </tr>
                ) : filteredTransactions.map(tx => (
                  <tr key={tx.transaction_id}
                    className={`transition-colors ${tx.is_anomalous ? T.tableRowFlag : T.tableRow}`}>

                    <td className="py-3 px-4">
                      {tx.is_anomalous ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3" /> Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Routine
                        </span>
                      )}
                    </td>

                    <td className={`py-3 px-4 font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {tx.transaction_id}
                    </td>

                    <td className="py-3 px-4">
                      <div className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{tx.date}</div>
                      <div className={`text-[11px] font-mono ${T.muted}`}>{tx.time}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{tx.payee}</div>
                      <div className={`text-[11px] ${T.secondary} truncate max-w-xs`}>{tx.description}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded font-mono text-[10px] border ${T.badge}`}>
                        {tx.channel}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                      <span className={tx.is_anomalous ? 'text-rose-500' : isDark ? 'text-slate-100' : 'text-slate-800'}>
                        ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      {tx.is_anomalous ? (
                        <div className="space-y-1">
                          {tx.flags.map((f, fi) => (
                            <div key={fi} className="text-[11px] text-rose-500 flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                              <span><span className="font-mono font-semibold">{f.rule}:</span> {f.description}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className={`text-[11px] italic ${T.muted}`}>Within statistical limits</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ── INVESTIGATION REPORT MODAL ───────────────────────────────────── */}
      {showReportModal && investigationReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`${T.modal} rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden border`}>

            {/* Modal Header */}
            <div className={`p-5 border-b ${T.border} ${T.modalHead} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border
                  ${(investigationReport.rag_status || 'RED') === 'RED'
                    ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                    : (investigationReport.rag_status || '') === 'AMBER'
                      ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'}`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    AI Risk Dossier
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono border bg-blue-500/10 text-blue-500 border-blue-500/20`}>
                      {investigationReport.model_used || 'gemini-3.5-flash-lite'}
                    </span>
                  </h2>
                  <p className={`text-xs ${T.secondary}`}>Synthesis over deterministically flagged transactions in INR (₹)</p>
                </div>
              </div>
              <button onClick={() => setShowReportModal(false)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'}`}>
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              
              {/* Verdict Banner with RAG Badge */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3
                ${(investigationReport.rag_status || 'RED') === 'RED'
                  ? isDark ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' : 'bg-red-50 border-red-300 text-red-800'
                  : (investigationReport.rag_status || '') === 'AMBER'
                    ? isDark ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800'
                    : isDark ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-800'}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {/* RAG Status Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                      (investigationReport.rag_status || 'RED') === 'RED'
                        ? 'bg-red-500/20 text-red-500 border-red-500/40 animate-pulse'
                        : (investigationReport.rag_status || '') === 'AMBER'
                          ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        (investigationReport.rag_status || 'RED') === 'RED' ? 'bg-red-500' :
                        (investigationReport.rag_status || '') === 'AMBER' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      RAG STATUS: {investigationReport.rag_status || (investigationReport.risk_level === 'CRITICAL' || investigationReport.risk_level === 'HIGH' ? 'RED' : investigationReport.risk_level === 'MEDIUM' ? 'AMBER' : 'GREEN')}
                    </span>
                  </div>
                  <div className="text-lg font-bold mt-0.5">{investigationReport.verdict}</div>
                  <p className="text-xs mt-1 opacity-90 leading-relaxed">{investigationReport.executive_summary}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className={`text-[10px] uppercase font-mono block ${T.muted}`}>Risk Score</span>
                    <span className="text-3xl font-extrabold font-mono">{investigationReport.risk_score}/100</span>
                  </div>
                </div>
              </div>

              {/* Triage & Routing Summary Card (Appended for RED / AMBER) */}
              {investigationReport.triage_summary && (
                <div className={`p-4 rounded-xl border space-y-3 ${
                  (investigationReport.rag_status || 'RED') === 'RED'
                    ? isDark ? 'bg-rose-950/20 border-rose-500/30' : 'bg-red-50/80 border-red-200'
                    : (investigationReport.rag_status || '') === 'AMBER'
                      ? isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50/80 border-amber-200'
                      : isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-500">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Triage & Escalation Summary
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className={`text-[10px] uppercase font-mono font-semibold block ${T.muted}`}>Discrepancy</span>
                      <div className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {investigationReport.triage_summary.discrepancy}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className={`text-[10px] uppercase font-mono font-semibold block ${T.muted}`}>Trigger</span>
                      <div className={`font-mono font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {investigationReport.triage_summary.trigger}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className={`text-[10px] uppercase font-mono font-semibold block ${T.muted}`}>Escalation Routing</span>
                      <div className="font-bold text-amber-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        {investigationReport.triage_summary.escalation_routing}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Baseline Divergence */}
              <div className="space-y-1.5">
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${T.secondary}`}>
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  Baseline Divergence (INR / ₹)
                </h4>
                <div className={`p-4 rounded-xl border text-sm leading-relaxed ${T.cardSolid} ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {investigationReport.baseline_divergence}
                </div>
              </div>

              {/* Cited Transaction IDs */}
              {investigationReport.cited_transaction_ids?.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${T.secondary}`}>
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    Cited Transactions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {investigationReport.cited_transaction_ids.map(id => (
                      <span key={id} className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 font-mono text-xs font-bold">
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Checklist */}
              <div className="space-y-1.5">
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${T.secondary}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Investigator Action Checklist
                </h4>
                <div className="space-y-2">
                  {(investigationReport.investigation_steps || []).map((step, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${T.cardSolid}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5
                        ${isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                        {idx + 1}
                      </span>
                      <span className={`leading-normal ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Disclaimer */}
              <div className={`p-3 rounded-xl border text-[11px] flex items-center gap-2 ${isDark ? 'bg-slate-900/40 border-slate-800/60 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>Guardrail Enforced:</strong> Event is classified strictly as a High-Risk Escalation / Elevated Risk Indicator. Never declared as confirmed fraud.</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t ${T.border} ${T.modalHead} flex justify-end`}>
              <button onClick={() => setShowReportModal(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-lg shadow-blue-900/20">
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
