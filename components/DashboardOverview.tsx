'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaction, Budget } from '../lib/financeTypes';
import { ArrowUpRight, ArrowDownRight, Wallet, Percent, Calendar, FileText, Star, Sparkles } from 'lucide-react';
import { TRANSLATIONS, Language } from '../lib/translations';

interface DashboardOverviewProps {
  transactions: Transaction[];
  budgets: Budget[];
  profileName: string;
  language: Language;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  'Groceries': '#3b82f6', // blue-500
  'Rent & Housing': '#6366f1', // indigo-500
  'Utilities': '#f59e0b', // amber-500
  'Dining Out': '#f43f5e', // rose-500
  'Entertainment': '#d946ef', // fuchsia-500
  'Shopping': '#8b5cf6', // violet-500
  'Transport': '#0ea5e9', // sky-500
  'Healthcare': '#10b981', // emerald-500
  'Travel': '#06b6d4', // cyan-500
  'Miscellaneous': '#71717a', // zinc-500
};

export default function DashboardOverview({ transactions, budgets, profileName, language }: DashboardOverviewProps) {
  const [mounted, setMounted] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'all' | '30days' | '7days'>('30days');

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  // Filter transactions by period
  const filteredTransactions = transactions.filter(tx => {
    if (reportPeriod === 'all') return true;
    const txDate = new Date(tx.date);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - txDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (reportPeriod === '30days') return diffDays <= 30;
    if (reportPeriod === '7days') return diffDays <= 7;
    return true;
  });

  // Calculate high-level stats
  const totalIncome = filteredTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = filteredTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Chart 1: Trend over time (Expenses)
  const expensesByDate: { [date: string]: { income: number; expense: number } } = {};
  
  const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  sortedTx.forEach(tx => {
    const dateStr = new Date(tx.date).toLocaleDateString(language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uz-UZ', { month: 'short', day: 'numeric' });
    if (!expensesByDate[dateStr]) {
      expensesByDate[dateStr] = { income: 0, expense: 0 };
    }
    if (tx.type === 'income') {
      expensesByDate[dateStr].income += tx.amount;
    } else {
      expensesByDate[dateStr].expense += tx.amount;
    }
  });

  const trendChartData = Object.keys(expensesByDate).map(date => ({
    date,
    Income: expensesByDate[date].income,
    Expense: expensesByDate[date].expense,
  })).slice(-10);

  // Chart 2: Category distribution (Expenses)
  const expenseByCategory: { [category: string]: number } = {};
  filteredTransactions
    .filter(tx => tx.type === 'expense')
    .forEach(tx => {
      expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
    });

  const pieChartData = Object.keys(expenseByCategory).map(cat => ({
    name: cat,
    value: expenseByCategory[cat]
  }));

  // Budget status statistics
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalActualSpentInBudgets = budgets.reduce((sum, b) => {
    const spentInCategory = transactions
      .filter(tx => tx.type === 'expense' && tx.category === b.category)
      .reduce((s, tx) => s + tx.amount, 0);
    return sum + Math.min(spentInCategory, b.amount);
  }, 0);

  const budgetUsagePercent = totalBudgeted > 0 ? (totalActualSpentInBudgets / totalBudgeted) * 100 : 0;

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse" id="dashboard-skeleton">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-amber-50 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-amber-50 rounded-2xl" />
          <div className="h-96 bg-amber-50 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Get translated category name
  const getCatLabel = (cat: string) => {
    const mapped = (t.categories as Record<string, string>)[cat];
    return mapped || cat;
  };

  return (
    <div className="space-y-6" id="dashboard-overview-container">
      {/* Filters and Welcoming bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {t.welcomeBack.replace('{name}', profileName)}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">{t.decryptedMsg}</p>
        </div>
        <div className="flex bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto border border-slate-200/60" id="report-period-toggle">
          {(['7days', '30days', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setReportPeriod(p)}
              className={`flex-1 sm:flex-initial text-xs font-semibold px-4 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                reportPeriod === p
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
              id={`period-btn-${p}`}
            >
              {p === 'all' ? t.allTime : p === '30days' ? t.last30Days : t.last7Days}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-stats-grid">
        {/* Balance Card */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-sky-500 border-t border-r border-b border-slate-200/80 shadow-xs flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.netBalance}</span>
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600 font-bold">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-bold tracking-tight ${netSavings >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatCurrency(netSavings)}
            </h3>
            <span className="text-xs text-slate-400 mt-1 block font-medium">{t.accumulatedVault}</span>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-emerald-500 border-t border-r border-b border-slate-200/80 shadow-xs flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.totalIncome}</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(totalIncome)}
            </h3>
            <span className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-0.5">
              {t.inflowText}
            </span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-rose-500 border-t border-r border-b border-slate-200/80 shadow-xs flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.totalExpenses}</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 font-bold">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(totalExpense)}
            </h3>
            <span className="text-xs text-rose-600 font-medium mt-1 block">
              {filteredTransactions.filter(tx => tx.type === 'expense').length} {t.recordedLogs}
            </span>
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="bg-white p-5 rounded-2xl border-l-4 border-purple-500 border-t border-r border-b border-slate-200/80 shadow-xs flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.savingsRate}</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 font-bold">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-bold tracking-tight ${savingsRate >= 15 ? 'text-purple-600' : 'text-slate-800'}`}>
              {savingsRate.toFixed(1)}%
            </h3>
            <span className="text-xs text-purple-700 font-medium mt-1 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              {t.savingBenchmark}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs" id="trend-chart-panel">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5">
                {t.trendTitle}
              </h3>
              <p className="text-xs text-slate-500 font-medium">{t.trendSubtitle}</p>
            </div>
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <Calendar className="w-3.5 h-3.5" /> {t.last30Days}
            </span>
          </div>
          
          <div className="h-72 w-full">
            {trendChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-10 h-10 opacity-60 text-slate-400" />
                <p className="text-sm font-bold text-slate-500 px-4 text-center">{t.noTransactions}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} style={{ fontWeight: 'bold' }} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} style={{ fontWeight: 'bold' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                    labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  />
                  <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" name="Received" />
                  <Area type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" name="Spent" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expense Category Breakdown Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between" id="category-chart-panel">
          <div>
            <h3 className="text-base font-bold text-slate-900">{t.allocationTitle}</h3>
            <p className="text-xs text-slate-500 font-medium">{t.allocationSubtitle}</p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center my-4">
            {pieChartData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-10 h-10 opacity-50" />
                <p className="text-xs font-bold px-4 text-center text-slate-500">{t.noExpenses}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} strokeWidth={2} stroke="#fff" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {/* Center Summary */}
            {pieChartData.length > 0 && (
              <div className="absolute flex flex-col items-center bg-white p-2.5 rounded-full border border-slate-100 shadow-xs">
                <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">{t.totalOut}</span>
                <span className="text-xs font-bold text-slate-800">{formatCurrency(totalExpense)}</span>
              </div>
            )}
          </div>

          {/* Legends Breakdown */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1" id="category-chart-legend">
            {pieChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2 font-medium">{t.noExpenses}</p>
            ) : (
              pieChartData.map((item) => {
                const color = CATEGORY_COLORS[item.name] || '#94a3b8';
                const percentage = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs bg-slate-50/50 p-2 rounded-xl border border-slate-100/80 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full block shrink-0 border border-white" style={{ backgroundColor: color }} />
                      <span className="text-slate-700 font-bold truncate max-w-[120px]">{getCatLabel(item.name)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-bold bg-white px-1.5 py-0.5 rounded-md border border-slate-100">{percentage.toFixed(0)}%</span>
                      <span className="text-slate-900 font-black">{formatCurrency(item.value)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Budget Integration Status Area */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs" id="dashboard-budgets-status">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              {t.complianceTitle}
            </h3>
            <p className="text-xs text-slate-500 font-medium">{t.complianceSubtitle}</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
            {totalBudgeted > 0 ? `${budgetUsagePercent.toFixed(0)}% ${t.budgetUsedText}` : t.noActiveBudgets}
          </span>
        </div>

        {totalBudgeted === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-sm font-bold bg-slate-50">
            {t.noActiveBudgets}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-[1px] relative">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetUsagePercent > 100 ? 'bg-rose-500' : budgetUsagePercent > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
              <div className="p-4 bg-slate-50/50 border border-slate-200/80 rounded-xl">
                <span className="text-slate-500 block mb-1">{t.budgetCapacity}</span>
                <span className="font-bold text-slate-800 text-base">{formatCurrency(totalBudgeted)}</span>
              </div>
              <div className="p-4 bg-slate-50/50 border border-slate-200/80 rounded-xl">
                <span className="text-slate-500 block mb-1">{t.budgetSpent}</span>
                <span className="font-bold text-slate-800 text-base">{formatCurrency(totalActualSpentInBudgets)}</span>
              </div>
              <div className="p-4 bg-slate-50/50 border border-slate-200/80 rounded-xl">
                <span className="text-slate-500 block mb-1">{t.remainingMargin}</span>
                <span className={`font-bold text-base ${totalBudgeted - totalActualSpentInBudgets >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>
                  {formatCurrency(Math.max(0, totalBudgeted - totalActualSpentInBudgets))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
