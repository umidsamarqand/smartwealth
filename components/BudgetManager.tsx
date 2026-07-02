'use client';

import React, { useState } from 'react';
import { Budget, BudgetPeriod, EXPENSE_CATEGORIES, Transaction } from '../lib/financeTypes';
import { Plus, Target, CheckCircle2, AlertTriangle, AlertOctagon, Trash2, ShieldAlert } from 'lucide-react';
import { TRANSLATIONS, Language } from '../lib/translations';

interface BudgetManagerProps {
  budgets: Budget[];
  transactions: Transaction[];
  onSetBudget: (budget: Budget) => void;
  onDeleteBudget: (category: string) => void;
  language: Language;
}

export default function BudgetManager({
  budgets,
  transactions,
  onSetBudget,
  onDeleteBudget,
  language
}: BudgetManagerProps) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

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
      setFormError(t.formError);
      return;
    }

    onSetBudget({
      category,
      amount: parsedAmount,
      period
    });

    setSuccessMsg(t.successBudget);
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

  const getCategoryLabel = (cat: string) => {
    const mapped = (t.categories as Record<string, string>)[cat];
    return mapped || cat;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="budget-manager-module">
      {/* Set Category Budget Card */}
      <div className="bg-white p-6 rounded-3xl border-4 border-purple-200 shadow-sm flex flex-col justify-between" id="budget-creation-panel">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            {t.configureBudget}
          </h3>
          <p className="text-xs font-bold text-slate-500 mb-4">{t.assignThreshold}</p>

          <form onSubmit={handleSetBudgetSubmit} className="space-y-4" id="set-budget-form">
            {/* Category */}
            <div className="space-y-1">
              <label htmlFor="budget-category" className="text-xs font-black text-slate-700 block">{t.categoryLabel}</label>
              <select
                id="budget-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:bg-white transition-all text-slate-900 cursor-pointer"
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                ))}
              </select>
            </div>

            {/* Target Amount */}
            <div className="space-y-1">
              <label htmlFor="budget-amount" className="text-xs font-black text-slate-700 block">{t.targetAmount}</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-500 font-black text-base">$</span>
                <input
                  id="budget-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 text-sm font-bold bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            {/* Period */}
            <div className="space-y-1">
              <label htmlFor="budget-period" className="text-xs font-black text-slate-700 block">{t.recurrencePeriod}</label>
              <select
                id="budget-period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
                className="w-full px-4 py-3 text-sm font-bold bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:bg-white transition-all text-slate-900 cursor-pointer"
              >
                <option value="weekly">{t.weeklyBudget}</option>
                <option value="monthly">{t.monthlyBudget}</option>
                <option value="yearly">{t.yearlyBudget}</option>
              </select>
            </div>

            {formError && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border-2 border-rose-200 animate-pulse">
                {formError}
              </p>
            )}

            {successMsg && (
              <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-3 rounded-xl border-2 border-emerald-200 flex items-center gap-1.5 animate-bounce">
                {successMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white transition-all text-sm font-black flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
              id="set-budget-btn"
            >
              <Plus className="w-5 h-5 stroke-[3px]" /> {t.saveBudget}
            </button>
          </form>
        </div>

        <p className="text-[10px] font-bold text-slate-400 text-center mt-4 pt-4 border-t-2 border-slate-100">
          {t.localSandbox}
        </p>
      </div>

      {/* Envelopes Tracking List */}
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl border-4 border-slate-200 shadow-sm flex flex-col justify-between" id="envelopes-panel">
        <div>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                {t.activeEnvelopes}
              </h3>
              <p className="text-xs font-bold text-slate-500">{t.trackLimits}</p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 bg-purple-50 border-2 border-purple-200 text-purple-800 rounded-full">
              {budgets.length} {t.envelopesConfigured}
            </span>
          </div>

          {budgets.length === 0 ? (
            <div className="py-20 text-center border-4 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 bg-slate-50" id="empty-budgets-view">
              <Target className="w-12 h-12 text-slate-300 animate-bounce" />
              <p className="text-slate-600 font-bold text-sm">{t.emptyBudgets}</p>
              <p className="text-slate-400 text-xs max-w-xs px-4">{t.emptyBudgetsSub}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1" id="budgets-grid-container">
              {budgets.map((b) => {
                const spent = calculateSpent(b.category);
                const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
                const isOver = spent > b.amount;
                const isNear = !isOver && percent >= 80;

                return (
                  <div 
                    key={b.category} 
                    className={`p-4 rounded-2xl border-4 transition-all hover:scale-[1.01] ${
                      isOver ? 'bg-rose-50/40 border-rose-200' :
                      isNear ? 'bg-amber-50/40 border-amber-200' :
                      'bg-emerald-50/20 border-emerald-100'
                    }`}
                    id={`budget-card-${b.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <span className="text-sm font-black text-slate-800 block leading-tight">{getCategoryLabel(b.category)}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider capitalize">
                          {b.period === 'weekly' ? t.weeklyCap : b.period === 'monthly' ? t.monthlyCap : t.yearlyCap}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => onDeleteBudget(b.category)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer border border-transparent hover:border-rose-200"
                        title="Delete Envelope"
                        id={`delete-budget-btn-${b.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      >
                        <Trash2 className="w-4 h-4 stroke-[2.5px]" />
                      </button>
                    </div>

                    {/* Progress details */}
                    <div className="flex justify-between items-end text-xs mb-1.5 font-bold">
                      <div className="text-slate-600">
                        <span className="font-black text-slate-850">{formatCurrency(spent)}</span>
                        {' '}/{' '}
                        <span className="font-bold text-slate-500">{formatCurrency(b.amount)}</span>
                      </div>
                      <div className={`font-black text-xs ${
                        isOver ? 'text-rose-600' : isNear ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {percent.toFixed(0)}%
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-slate-100 border-2 border-slate-200 rounded-full overflow-hidden mb-3">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>

                    {/* Alert Banner / Status indicator */}
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                      {isOver ? (
                        <span className="text-rose-600 flex items-center gap-1">
                          <AlertOctagon className="w-3.5 h-3.5 animate-bounce" /> {t.exceededBy} {formatCurrency(spent - b.amount)}!
                        </span>
                      ) : isNear ? (
                        <span className="text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> {t.approachingLimit}
                        </span>
                      ) : (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {t.healthyAllocation}
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
          <div className="border-t-2 border-slate-100 pt-4 mt-4 flex items-center justify-between text-xs text-slate-400 font-bold" id="budgets-footer">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" /> {t.securedWorkspace}
            </span>
            <span>FinVault Kids</span>
          </div>
        )}
      </div>
    </div>
  );
}
