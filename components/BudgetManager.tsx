'use client';

import React, { useState } from 'react';
import { Budget, BudgetPeriod, EXPENSE_CATEGORIES, Transaction } from '../lib/financeTypes';
import { Plus, Target, CheckCircle2, AlertTriangle, AlertOctagon, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';

interface BudgetManagerProps {
  budgets: Budget[];
  transactions: Transaction[];
  onSetBudget: (budget: Budget) => void;
  onDeleteBudget: (category: string) => void;
}

export default function BudgetManager({
  budgets,
  transactions,
  onSetBudget,
  onDeleteBudget
}: BudgetManagerProps) {
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSetBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid budget target amount greater than zero.');
      return;
    }

    onSetBudget({
      category,
      amount: parsedAmount,
      period
    });

    setSuccessMsg(`Successfully established ${period} budget envelope for ${category}!`);
    setAmount('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  // Helper to calculate total spent in category
  const calculateSpent = (cat: string) => {
    return transactions
      .filter(tx => tx.type === 'expense' && tx.category === cat)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="budget-manager-module">
      {/* Set Category Budget Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between" id="budget-creation-panel">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Configure Budget Envelope</h3>
          <p className="text-xs text-slate-500 mb-4">Assign maximum spending thresholds for distinct expense categories</p>

          <form onSubmit={handleSetBudgetSubmit} className="space-y-4" id="set-budget-form">
            {/* Category */}
            <div className="space-y-1">
              <label htmlFor="budget-category" className="text-xs font-semibold text-slate-600">Expense Category</label>
              <select
                id="budget-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-900 cursor-pointer"
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Target Amount */}
            <div className="space-y-1">
              <label htmlFor="budget-amount" className="text-xs font-semibold text-slate-600">Budget Limit (USD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input
                  id="budget-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            {/* Period */}
            <div className="space-y-1">
              <label htmlFor="budget-period" className="text-xs font-semibold text-slate-600">Recurrence Period</label>
              <select
                id="budget-period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
                className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-900 cursor-pointer"
              >
                <option value="weekly">Weekly Budget</option>
                <option value="monthly">Monthly Budget</option>
                <option value="yearly">Yearly Budget</option>
              </select>
            </div>

            {formError && (
              <p className="text-xs font-medium text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100 animate-pulse">
                {formError}
              </p>
            )}

            {successMsg && (
              <p className="text-xs font-medium text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {successMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-98 cursor-pointer"
              id="set-budget-btn"
            >
              <Target className="w-4 h-4" /> Save Budget Envelope
            </button>
          </form>
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-4 pt-4 border-t border-slate-100">
          Updating an existing category will overwrite its threshold targets.
        </p>
      </div>

      {/* Envelopes Tracking List */}
      <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between" id="envelopes-panel">
        <div>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Active Envelopes</h3>
              <p className="text-xs text-slate-500">Track current expenditure limits in real-time</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-lg">
              {budgets.length} envelopes configured
            </span>
          </div>

          {budgets.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2" id="empty-budgets-view">
              <Target className="w-10 h-10 text-slate-300 animate-pulse" />
              <p className="text-slate-400 font-semibold text-xs">No active spending budget envelopes configured.</p>
              <p className="text-slate-400 text-[10px] max-w-xs">Use the left configuration manager panel to assign targeted caps for specific dining, travel, rent, or utilities categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1" id="budgets-grid-container">
              {budgets.map((b) => {
                const spent = calculateSpent(b.category);
                const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
                const isOver = spent > b.amount;
                const isNear = !isOver && percent >= 80;

                return (
                  <div 
                    key={b.category} 
                    className={`p-4 rounded-xl border transition-all ${
                      isOver ? 'bg-rose-50/20 border-rose-100 shadow-rose-50/10' :
                      isNear ? 'bg-amber-50/20 border-amber-100 shadow-amber-50/10' :
                      'bg-slate-50/40 border-slate-100 hover:border-slate-200'
                    }`}
                    id={`budget-card-${b.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block leading-tight">{b.category}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider capitalize">{b.period} Envelope</span>
                      </div>
                      
                      <button
                        onClick={() => onDeleteBudget(b.category)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white hover:border hover:border-slate-100 transition-all cursor-pointer"
                        title="Delete Envelope"
                        id={`delete-budget-btn-${b.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Progress details */}
                    <div className="flex justify-between items-end text-xs mb-1.5">
                      <div className="text-slate-500 font-semibold">
                        <span className="font-bold text-slate-800">{formatCurrency(spent)}</span>
                        {' '}of{' '}
                        <span className="font-bold text-slate-600">{formatCurrency(b.amount)}</span>
                      </div>
                      <div className={`font-bold text-[11px] ${
                        isOver ? 'text-rose-600' : isNear ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {percent.toFixed(0)}%
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden mb-3">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>

                    {/* Alert Banner / Status indicator */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                      {isOver ? (
                        <span className="text-rose-600 flex items-center gap-1">
                          <AlertOctagon className="w-3.5 h-3.5" /> Exceeded by {formatCurrency(spent - b.amount)}!
                        </span>
                      ) : isNear ? (
                        <span className="text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Approaching threshold limit!
                        </span>
                      ) : (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Healthy allocation safety
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {budgets.length > 0 && (
          <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between text-xs text-slate-400 font-semibold" id="budgets-footer">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" /> Auto compliance warnings activated
            </span>
            <span>Local Database Synced</span>
          </div>
        )}
      </div>
    </div>
  );
}
