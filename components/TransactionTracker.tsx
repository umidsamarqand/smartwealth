'use client';

import React, { useState } from 'react';
import { Transaction, TransactionType, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../lib/financeTypes';
import { Plus, Search, Filter, Calendar, Tag, FileText, ArrowUpRight, ArrowDownRight, Trash2, SlidersHorizontal } from 'lucide-react';
import { TRANSLATIONS, Language } from '../lib/translations';

interface TransactionTrackerProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  language: Language;
}

export default function TransactionTracker({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  language
}: TransactionTrackerProps) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Filtering & Sorting State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError(t.formError);
      return;
    }

    if (!category) {
      setFormError(t.formError);
      return;
    }

    if (!date) {
      setFormError(t.formError);
      return;
    }

    onAddTransaction({
      amount: parsedAmount,
      type,
      category,
      date,
      notes: notes.trim() || `${getCategoryLabel(category)}`
    });

    // Reset Form
    setAmount('');
    setNotes('');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  // Get translated category name
  const getCategoryLabel = (cat: string) => {
    const mapped = (t.categories as Record<string, string>)[cat];
    return mapped || cat;
  };

  // Filter & Sort Logic
  const filteredTx = transactions
    .filter(tx => {
      const translatedCat = getCategoryLabel(tx.category).toLowerCase();
      const matchesSearch = tx.notes.toLowerCase().includes(search.toLowerCase()) || 
                            tx.category.toLowerCase().includes(search.toLowerCase()) ||
                            translatedCat.includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

  const activeCategories = Array.from(new Set(transactions.map(t => t.category)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="transaction-tracker-module">
      {/* Transaction Logging Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between" id="entry-form-panel">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            {t.recordTx}
          </h3>
          <p className="text-xs font-semibold text-slate-400 mb-4">{t.logDaily}</p>

          <form onSubmit={handleSubmit} className="space-y-4" id="log-tx-form">
            {/* Type selector toggle */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50" id="tx-type-selector">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                id="type-btn-expense"
              >
                {t.expenseOutflow}
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                id="type-btn-income"
              >
                {t.incomeInflow}
              </button>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label htmlFor="tx-amount" className="text-xs font-semibold text-slate-600 block">{t.amountUsd}</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-base">$</span>
                <input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 text-sm font-semibold bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-900"
                />
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-1">
              <label htmlFor="tx-category" className="text-xs font-semibold text-slate-600 block">{t.categoryLabel}</label>
              <div className="relative">
                <select
                  id="tx-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 text-sm font-semibold bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-900 appearance-none cursor-pointer"
                >
                  {type === 'income'
                    ? INCOME_CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)
                    : EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
                </select>
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Tag className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Date selection */}
            <div className="space-y-1">
              <label htmlFor="tx-date" className="text-xs font-semibold text-slate-600 block">{t.dateLabel}</label>
              <div className="relative">
                <input
                  id="tx-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 text-sm font-semibold bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-900 appearance-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Notes description */}
            <div className="space-y-1">
              <label htmlFor="tx-notes" className="text-xs font-semibold text-slate-600 block">{t.notesLabel}</label>
              <div className="relative">
                <input
                  id="tx-notes"
                  type="text"
                  placeholder="Candy, books, chore reward..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 text-sm font-semibold bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-900"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
            </div>

            {formError && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
              id="tx-submit-btn"
            >
              <Plus className="w-4 h-4 stroke-[3px]" /> {t.addRecord}
            </button>
          </form>
        </div>

        <p className="text-[10px] font-bold text-slate-400 text-center mt-4 pt-4 border-t border-slate-100">
          {t.localSandbox}
        </p>
      </div>

      {/* Ledger History Listing */}
      <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between" id="ledger-panel">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {t.ledgerTitle}
              </h3>
              <p className="text-xs font-semibold text-slate-400">{t.ledgerSubtitle}</p>
            </div>
            <div className="text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-150 px-3 py-1 rounded-full">
              {filteredTx.length} {t.recordsFound}
            </div>
          </div>

          {/* Filtering Tools Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4" id="ledger-filters-row">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 text-slate-800"
                id="search-input"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full pl-7 pr-3 py-1.5 text-xs font-semibold bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 text-slate-800 appearance-none cursor-pointer"
                id="type-filter"
              >
                <option value="all">{t.allTypes}</option>
                <option value="income">{t.onlyInflows}</option>
                <option value="expense">{t.onlyOutflows}</option>
              </select>
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Filter className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs font-semibold bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 text-slate-800 appearance-none cursor-pointer"
                id="category-filter"
              >
                <option value="all">{t.allCategories}</option>
                {activeCategories.map(cat => (
                  <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                ))}
              </select>
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Tag className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Sorting Filter */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pl-7 pr-3 py-1.5 text-xs font-semibold bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 text-slate-800 appearance-none cursor-pointer"
                id="sorting-select"
              >
                <option value="date-desc">{t.newestFirst}</option>
                <option value="date-asc">{t.oldestFirst}</option>
                <option value="amount-desc">{t.highestAmount}</option>
                <option value="amount-asc">{t.lowestAmount}</option>
              </select>
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-slate-200/80 rounded-xl max-h-[380px] overflow-y-auto shadow-xs" id="ledger-table-container">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 sticky top-0 z-10">
                  <th className="py-3 px-4">{t.dateLabel.split('?')[0]}</th>
                  <th className="py-3 px-4">{t.categoryLabel}</th>
                  <th className="py-3 px-4">{t.notesLabel.split('/')[0]}</th>
                  <th className="py-3 px-4 text-right">{t.amountUsd.split('(')[0]}</th>
                  <th className="py-3 px-4 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {filteredTx.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400 text-sm">
                      {t.noMatchingRecords}
                    </td>
                  </tr>
                ) : (
                  filteredTx.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(tx.date).toLocaleDateString(language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uz-UZ', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-slate-50 text-slate-600 border border-slate-200/60 font-semibold">
                          {getCategoryLabel(tx.category)}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[180px] truncate text-slate-600 font-medium" title={tx.notes}>
                        {tx.notes}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${
                        tx.type === 'income' ? 'text-emerald-600 bg-emerald-50/10' : 'text-slate-900'
                      }`}>
                        <span className="inline-flex items-center gap-1">
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors inline-block cursor-pointer border border-transparent hover:border-rose-200/60"
                          title="Delete record"
                          id={`delete-btn-${tx.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[2px]" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom stats breakdown */}
        {filteredTx.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-slate-100 pt-4 mt-4 gap-2 text-xs font-semibold" id="ledger-stats-footer">
            <div className="text-slate-400">
              {t.displayingText.replace('{count}', filteredTx.length.toString()).replace('{total}', transactions.length.toString())}
            </div>
            <div className="flex gap-4">
              <span className="text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150">
                {t.footerInflows} <span className="text-emerald-600 font-bold">{formatCurrency(filteredTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))}</span>
              </span>
              <span className="text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150">
                {t.footerOutflows} <span className="text-rose-600 font-bold">{formatCurrency(filteredTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
