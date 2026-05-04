import React, { useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Check, Pencil, Trash2, Wallet, X } from 'lucide-react';
import { AppState, CashMovement, CashMovementCategory } from '../types';
import {
  CASH_CATEGORY_LABELS,
  getCashBalance,
  getCashMovementSignedAmount,
  getCashMovementsForMonth,
  getCashTotalByCategory,
  getCashTotalByType,
} from '../lib/cash';

interface CashPageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const CATEGORY_OPTIONS: CashMovementCategory[] = [
  'market',
  'ingredient',
  'packaging',
  'withdrawal',
  'transport',
  'other',
];
const PERIOD_OPTIONS = [
  { id: 'today', label: 'Hoje' },
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: 'month', label: 'Este mês' },
  { id: 'all', label: 'Tudo' },
] as const;

type CashPeriodFilter = (typeof PERIOD_OPTIONS)[number]['id'];

export const CashPage: React.FC<CashPageProps> = ({ state, setState }) => {
  const [formData, setFormData] = useState({
    type: 'expense' as CashMovement['type'],
    category: 'market' as CashMovementCategory,
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [periodFilter, setPeriodFilter] = useState<CashPeriodFilter>('today');
  const [typeFilter, setTypeFilter] = useState<'all' | CashMovement['type']>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CashMovementCategory>('all');
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({
    type: 'expense' as CashMovement['type'],
    category: 'market' as CashMovementCategory,
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const todayKey = new Date().toISOString().slice(0, 10);

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const monthlyMovements = getCashMovementsForMonth(state.cashMovements, currentMonth);
  const balance = getCashBalance(state.cashMovements);
  const monthlyIncome = getCashTotalByType(monthlyMovements, 'income');
  const monthlyExpenses = getCashTotalByType(monthlyMovements, 'expense');
  const monthlyWithdrawals = getCashTotalByCategory(monthlyMovements, 'withdrawal');
  const filteredMovements = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(`${todayKey}T00:00:00`);

    return state.cashMovements.filter(movement => {
      const movementDate = new Date(movement.date);

      const matchesPeriod = (() => {
        switch (periodFilter) {
          case 'today':
            return movement.date.slice(0, 10) === todayKey;
          case '7d': {
            const sevenDaysAgo = new Date(startOfToday);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            return movementDate >= sevenDaysAgo;
          }
          case '30d': {
            const thirtyDaysAgo = new Date(startOfToday);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
            return movementDate >= thirtyDaysAgo;
          }
          case 'month':
            return movement.date.slice(0, 7) === currentMonth;
          case 'all':
            return true;
          default:
            return movementDate <= now;
        }
      })();

      const matchesType = typeFilter === 'all' || movement.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || movement.category === categoryFilter;

      return matchesPeriod && matchesType && matchesCategory;
    });
  }, [categoryFilter, currentMonth, periodFilter, state.cashMovements, todayKey, typeFilter]);
  const filteredIncome = getCashTotalByType(filteredMovements, 'income');
  const filteredExpenses = getCashTotalByType(filteredMovements, 'expense');
  const filteredBalance = filteredIncome - filteredExpenses;

  const filterSummaryTitle = {
    today: 'Caixa de Hoje',
    '7d': 'Caixa dos Últimos 7 Dias',
    '30d': 'Caixa dos Últimos 30 Dias',
    month: 'Caixa Deste Mês',
    all: 'Caixa Geral',
  }[periodFilter];

  const renderMovementCard = (movement: CashMovement, mutedExpense = false) => {
    const signedAmount = getCashMovementSignedAmount(movement);
    const isManual = movement.sourceType === 'manual';
    const isIncome = movement.type === 'income';
    const isEditing = editingMovementId === movement.id;

    if (isEditing && isManual) {
      return (
        <div key={movement.id} className="bg-white p-4 rounded-2xl shadow-sm border border-amber-200 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-amber-700">Editando lançamento manual</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={saveEditedMovement}
                className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                title="Salvar edição"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={cancelEditingMovement}
                className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                title="Cancelar edição"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setEditingData(prev => ({ ...prev, type: 'income', category: 'other' }))}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${editingData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setEditingData(prev => ({ ...prev, type: 'expense', category: prev.category === 'sale' ? 'market' : prev.category }))}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${editingData.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Saída
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
              <select
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={editingData.category}
                onChange={e => setEditingData(prev => ({ ...prev, category: e.target.value as CashMovementCategory }))}
              >
                {(editingData.type === 'income' ? ['other'] : CATEGORY_OPTIONS).map(category => (
                  <option key={category} value={category}>
                    {CASH_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
            <input
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              value={editingData.description}
              onChange={e => setEditingData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Valor</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={editingData.amount}
                onChange={e => setEditingData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
              <input
                type="date"
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={editingData.date}
                onChange={e => setEditingData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={movement.id} className={`bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center gap-4 ${mutedExpense ? 'border-slate-100' : 'border-rose-100'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-emerald-50 text-emerald-600' : mutedExpense ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-600'}`}>
            {isIncome ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-700 truncate">{movement.description}</div>
            <div className="text-[11px] text-slate-400">
              {CASH_CATEGORY_LABELS[movement.category]} • {new Date(movement.date).toLocaleDateString('pt-BR')} • {isManual ? 'Manual' : 'Automático'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className={`font-bold ${signedAmount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {signedAmount >= 0 ? '+' : '-'} R$ {formatCurrency(Math.abs(signedAmount))}
          </div>
          {isManual && (
            <>
              <button
                type="button"
                onClick={() => startEditingMovement(movement)}
                className="text-slate-300 hover:text-amber-500 transition-colors"
                title="Editar lançamento manual"
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => deleteManualMovement(movement.id)}
                className="text-slate-300 hover:text-rose-500 transition-colors"
                title="Apagar lançamento manual"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const saveManualMovement = () => {
    const amount = Number(formData.amount.replace(',', '.'));

    if (!formData.description.trim() || !formData.date || Number.isNaN(amount) || amount <= 0) {
      return;
    }

    const movement: CashMovement = {
      id: crypto.randomUUID(),
      type: formData.type,
      category: formData.category,
      description: formData.description.trim(),
      amount,
      date: new Date(`${formData.date}T12:00:00`).toISOString(),
      sourceType: 'manual',
    };

    setState(prev => ({
      ...prev,
      cashMovements: [movement, ...prev.cashMovements],
    }));

    setFormData(prev => ({
      ...prev,
      description: '',
      amount: '',
    }));
  };

  const deleteManualMovement = (id: string) => {
    setState(prev => ({
      ...prev,
      cashMovements: prev.cashMovements.filter(
        movement => !(movement.id === id && movement.sourceType === 'manual')
      ),
    }));
  };

  const startEditingMovement = (movement: CashMovement) => {
    if (movement.sourceType !== 'manual') {
      return;
    }

    setEditingMovementId(movement.id);
    setEditingData({
      type: movement.type,
      category: movement.category === 'sale' ? 'other' : movement.category,
      description: movement.description,
      amount: movement.amount.toString(),
      date: movement.date.slice(0, 10),
    });
  };

  const cancelEditingMovement = () => {
    setEditingMovementId(null);
  };

  const saveEditedMovement = () => {
    if (!editingMovementId) {
      return;
    }

    const amount = Number(editingData.amount.replace(',', '.'));

    if (!editingData.description.trim() || !editingData.date || Number.isNaN(amount) || amount <= 0) {
      return;
    }

    setState(prev => ({
      ...prev,
      cashMovements: prev.cashMovements.map(movement =>
        movement.id === editingMovementId && movement.sourceType === 'manual'
          ? {
              ...movement,
              type: editingData.type,
              category: editingData.category,
              description: editingData.description.trim(),
              amount,
              date: new Date(`${editingData.date}T12:00:00`).toISOString(),
            }
          : movement
      ),
    }));

    setEditingMovementId(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Wallet className="text-rose-500" /> Caixa
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">Saldo Atual</div>
            <div className={`text-2xl font-black ${balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              R$ {formatCurrency(balance)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-sky-50 to-cyan-50 p-4 rounded-2xl border border-sky-100">
            <div className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-2">Entradas do Mês</div>
            <div className="text-2xl font-black text-sky-700">R$ {formatCurrency(monthlyIncome)}</div>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-4 rounded-2xl border border-rose-100">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2">Saídas do Mês</div>
            <div className="text-2xl font-black text-rose-700">R$ {formatCurrency(monthlyExpenses)}</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-2xl border border-amber-100">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">Retiradas do Mês</div>
            <div className="text-2xl font-black text-amber-700">R$ {formatCurrency(monthlyWithdrawals)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Novo Lançamento</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: 'other' }))}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: prev.category === 'sale' ? 'market' : prev.category }))}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Saída
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
              <select
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as CashMovementCategory }))}
              >
                {(formData.type === 'income' ? ['other'] : CATEGORY_OPTIONS).map(category => (
                  <option key={category} value={category}>
                    {CASH_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
            <input
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              placeholder="Ex: Supermercado, retirada do caixa, compra de potes"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Valor</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                placeholder="50,00"
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
              <input
                type="date"
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={saveManualMovement}
            className="w-full bg-rose-500 text-white font-bold py-4 rounded-2xl shadow-md hover:bg-rose-600 transition-all"
          >
            Salvar Lançamento
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-bold text-slate-800 px-2">{filterSummaryTitle}</h3>
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-rose-100 space-y-4">
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => setPeriodFilter(option.id)}
                className={`px-3 py-2 rounded-full text-xs font-bold transition-colors ${
                  periodFilter === option.id
                    ? 'bg-rose-500 text-white'
                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
              <select
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as 'all' | CashMovement['type'])}
              >
                <option value="all">Tudo</option>
                <option value="income">Entradas</option>
                <option value="expense">Saídas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
              <select
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value as 'all' | CashMovementCategory)}
              >
                <option value="all">Todas</option>
                <option value="sale">Venda</option>
                {CATEGORY_OPTIONS.map(category => (
                  <option key={category} value={category}>
                    {CASH_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-1">Entradas</div>
              <div className="text-lg font-black text-emerald-700">R$ {formatCurrency(filteredIncome)}</div>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-4 rounded-2xl border border-rose-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-1">Saídas</div>
              <div className="text-lg font-black text-rose-700">R$ {formatCurrency(filteredExpenses)}</div>
            </div>
            <div className="bg-gradient-to-br from-sky-50 to-cyan-50 p-4 rounded-2xl border border-sky-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-sky-600 mb-1">Saldo</div>
              <div className={`text-lg font-black ${filteredBalance >= 0 ? 'text-sky-700' : 'text-rose-700'}`}>
                R$ {formatCurrency(filteredBalance)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-bold text-slate-800 px-2">Movimentações Filtradas</h3>
        {state.cashMovements.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center text-slate-400 italic">
            Nenhuma movimentação no caixa ainda.
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center text-slate-400 italic">
            Nenhuma movimentação encontrada com esse filtro.
          </div>
        ) : (
          filteredMovements.map(movement => renderMovementCard(movement, periodFilter !== 'today' && movement.date.slice(0, 10) !== todayKey))
        )}
      </div>
    </div>
  );
};
