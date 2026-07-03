'use client';

import React, { useState } from 'react';
import { Transaction, TransactionType, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../lib/financeTypes';
import { Plus, Search, Filter, Calendar, Tag, FileText, ArrowUpRight, ArrowDownRight, Trash2, SlidersHorizontal } from 'lucide-react';

interface TransactionTrackerProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function TransactionTracker({
  transactions,
  onAddTransaction,
  onDeleteTransaction
}: TransactionTrackerProps) {
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
      setFormError('Please enter a valid amount greater than zero.');
      return;
    }

    if (!category) {
      setFormError('Please select a category.');
      return;
    }

    if (!date) {
      setFormError('Please select a transaction date.');
      return;
    }

    onAddTransaction({
      amount: parsedAmount,
      type,
      category,
      date,
      notes: notes.trim() || `${category} transaction`
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

  // Filter & Sort Logic
  const filteredTx = transactions
    .filter(tx => {
      const matchesSearch = tx.notes.toLowerCase().includes(search.toLowerCase()) || 
                            tx.category.toLowerCase().includes(search.toLowerCase());
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
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between" id="entry-form-panel">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Record Transaction</h3>
          <p className="text-xs text-slate-500 mb-4">Log daily income inflows or expenditure receipts</p>

          <form onSubmit={handleSubmit} className="space-y-4" id="log-tx-form">
            {/* Type selector toggle */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl" id="tx-type-selector">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  type === 'expense'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                id="type-btn-expense"
              >
                Expense Outflow
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  type === 'income'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                id="type-btn-income"
              >
                Income Inflow
              </button>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label htmlFor="tx-amount" className="text-xs font-semibold text-slate-600">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-1">
              <label htmlFor="tx-category" className="text-xs font-semibold text-slate-600">Category</label>
              <div className="relative">
                <select
                  id="tx-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-900 appearance-none"
                >
                  {type === 'income'
                    ? INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                    : EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Tag className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Date selection */}
            <div className="space-y-1">
              <label htmlFor="tx-date" className="text-xs font-semibold text-slate-600">Transaction Date</label>
              <div className="relative">
                <input
                  id="tx-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-900 appearance-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Notes description */}
            <div className="space-y-1">
              <label htmlFor="tx-notes" className="text-xs font-semibold text-slate-600">Notes / Description</label>
              <div className="relative">
                <input
                  id="tx-notes"
                  type="text"
                  placeholder="e.g. Weekly grocery trip to Trader Joe's"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all text-slate-900"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
            </div>

            {formError && (
              <p className="text-xs font-medium text-rose-600 animate-pulse bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-98 cursor-pointer"
              id="tx-submit-btn"
            >
              <Plus className="w-4 h-4" /> Add Record
            </button>
          </form>
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-4 pt-4 border-t border-slate-100">
          Transactions are committed to your local encrypted ledger immediately.
        </p>
      </div>

      {/* Ledger History Listing */}
      <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between" id="ledger-panel">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Financial Ledger</h3>
              <p className="text-xs text-slate-500">View and manage your historic records</p>
            </div>
            <div className="text-xs text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
              {filteredTx.length} records found
            </div>
          </div>

          {/* Filtering Tools Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4" id="ledger-filters-row">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white text-slate-800"
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
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 appearance-none cursor-pointer"
                id="type-filter"
              >
                <option value="all">All Types</option>
                <option value="income">Inflows Only</option>
                <option value="expense">Outflows Only</option>
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
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 appearance-none cursor-pointer"
                id="category-filter"
              >
                <option value="all">All Categories</option>
                {activeCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
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
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 appearance-none cursor-pointer"
                id="sorting-select"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-[420px] overflow-y-auto" id="ledger-table-container">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 sticky top-0 z-10">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTx.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No matching records found in this ledger.
                    </td>
                  </tr>
                ) : (
                  filteredTx.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-500">
                        {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate text-slate-600 font-medium" title={tx.notes}>
                        {tx.notes}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                      }`}>
                        <span className="inline-flex items-center gap-0.5">
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors inline-block cursor-pointer"
                          title="Delete record"
                          id={`delete-btn-${tx.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-slate-100 pt-4 mt-4 gap-2 text-xs" id="ledger-stats-footer">
            <div className="text-slate-500 font-medium">
              Displaying <span className="font-semibold text-slate-800">{filteredTx.length}</span> of <span className="font-semibold text-slate-800">{transactions.length}</span> records
            </div>
            <div className="flex gap-4">
              <span className="text-slate-500 font-medium">
                Inflows: <span className="text-emerald-600 font-bold">{formatCurrency(filteredTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))}</span>
              </span>
              <span className="text-slate-500 font-medium">
                Outflows: <span className="text-rose-600 font-bold">{formatCurrency(filteredTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
