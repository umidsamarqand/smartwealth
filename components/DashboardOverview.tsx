'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Transaction, Budget, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../lib/financeTypes';
import { ArrowUpRight, ArrowDownRight, Wallet, Percent, Calendar, FileText } from 'lucide-react';

interface DashboardOverviewProps {
  transactions: Transaction[];
  budgets: Budget[];
  profileName: string;
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

export default function DashboardOverview({ transactions, budgets, profileName }: DashboardOverviewProps) {
  const [mounted, setMounted] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'all' | '30days' | '7days'>('30days');

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
  // Aggregate expenses by date
  const expensesByDate: { [date: string]: { income: number; expense: number } } = {};
  
  // Sort transactions to ensure chronological order
  const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Take last 15 transaction dates for clean layout representation
  sortedTx.forEach(tx => {
    const dateStr = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
  })).slice(-10); // show last 10 entries for optimal readability

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
    return sum + Math.min(spentInCategory, b.amount); // cap at budget limit to show realistic allocation met
  }, 0);

  const budgetUsagePercent = totalBudgeted > 0 ? (totalActualSpentInBudgets / totalBudgeted) * 100 : 0;

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse" id="dashboard-skeleton">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-100 rounded-2xl" />
          <div className="h-96 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="dashboard-overview-container">
      {/* Filters and Welcoming bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Welcome Back, {profileName}!</h2>
          <p className="text-xs text-slate-500">Your accounts are decrypted and active locally.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto" id="report-period-toggle">
          {(['7days', '30days', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setReportPeriod(p)}
              className={`flex-1 sm:flex-initial text-xs font-medium px-4 py-1.5 rounded-lg transition-all capitalize ${
                reportPeriod === p
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
              id={`period-btn-${p}`}
            >
              {p === 'all' ? 'All Time' : p === '30days' ? 'Last 30 Days' : 'Last 7 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-stats-grid">
        {/* Balance Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Balance</span>
            <span className="p-2 rounded-xl bg-slate-50 text-slate-600">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-bold tracking-tight ${netSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(netSavings)}
            </h3>
            <span className="text-xs text-slate-400 mt-1 block">Accumulated vault balance</span>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Income</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-slate-950">
              {formatCurrency(totalIncome)}
            </h3>
            <span className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-0.5">
              +{(totalIncome > 0 ? 100 : 0).toFixed(0)}% inflow this period
            </span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Expenses</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold tracking-tight text-slate-950">
              {formatCurrency(totalExpense)}
            </h3>
            <span className="text-xs text-slate-400 mt-1 block">
              {filteredTransactions.filter(tx => tx.type === 'expense').length} separate logs recorded
            </span>
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Savings Rate</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-bold tracking-tight ${savingsRate >= 15 ? 'text-emerald-600' : 'text-slate-800'}`}>
              {savingsRate.toFixed(1)}%
            </h3>
            <span className="text-xs text-slate-400 mt-1 block">
              Goal benchmark: 20.0%
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs" id="trend-chart-panel">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Inflow vs Outflow Trend</h3>
              <p className="text-xs text-slate-500">Timeline view of income and expenditure streams</p>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Recent Activity
            </span>
          </div>
          
          <div className="h-72 w-full">
            {trendChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <FileText className="w-8 h-8 opacity-60 animate-bounce" />
                <p className="text-xs">No transactions recorded for trend visualization.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }} 
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  />
                  <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expense Category Breakdown Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between" id="category-chart-panel">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Expense Allocation</h3>
            <p className="text-xs text-slate-500">Proportional category distribution of active period spending</p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center my-4">
            {pieChartData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                <FileText className="w-8 h-8 opacity-60" />
                <p className="text-xs">No expense metrics available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {/* Center Summary */}
            {pieChartData.length > 0 && (
              <div className="absolute flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Out</span>
                <span className="text-base font-bold text-slate-800">{formatCurrency(totalExpense)}</span>
              </div>
            )}
          </div>

          {/* Legends Breakdown */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1" id="category-chart-legend">
            {pieChartData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">Add transaction expenses to see division charts.</p>
            ) : (
              pieChartData.map((item) => {
                const color = CATEGORY_COLORS[item.name] || '#94a3b8';
                const percentage = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full block shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-slate-600 font-medium truncate max-w-[120px]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">{percentage.toFixed(0)}%</span>
                      <span className="text-slate-800 font-semibold">{formatCurrency(item.value)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Budget Integration Status Area */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs" id="dashboard-budgets-status">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Active Budgets Compliance Tracker</h3>
            <p className="text-xs text-slate-500">Overall aggregate budget consumption rates</p>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-lg">
            {totalBudgeted > 0 ? `${budgetUsagePercent.toFixed(0)}% Used` : 'No Active Budgets'}
          </span>
        </div>

        {totalBudgeted === 0 ? (
          <div className="p-6 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
            No budgets established. Configure category budget envelopes under the &quot;Budget Manager&quot; tab to trace targets.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetUsagePercent > 100 ? 'bg-rose-500' : budgetUsagePercent > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Total Envelopes Capacity</span>
                <span className="font-bold text-slate-800 text-sm">{formatCurrency(totalBudgeted)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Aggregate Allocated Spent</span>
                <span className="font-bold text-slate-800 text-sm">{formatCurrency(totalActualSpentInBudgets)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Remaining Safety Margin</span>
                <span className={`font-bold text-sm ${totalBudgeted - totalActualSpentInBudgets >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
