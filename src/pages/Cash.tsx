import React, { useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Trash2, Wallet } from 'lucide-react';
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

export const CashPage: React.FC<CashPageProps> = ({ state, setState }) => {
  const [formData, setFormData] = useState({
    type: 'expense' as CashMovement['type'],
    category: 'market' as CashMovementCategory,
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const monthlyMovements = getCashMovementsForMonth(state.cashMovements, currentMonth);
  const balance = getCashBalance(state.cashMovements);
  const monthlyIncome = getCashTotalByType(monthlyMovements, 'income');
  const monthlyExpenses = getCashTotalByType(monthlyMovements, 'expense');
  const monthlyWithdrawals = getCashTotalByCategory(monthlyMovements, 'withdrawal');

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
        <h3 className="text-xl font-bold text-slate-800 px-2">Movimentações</h3>
        {state.cashMovements.length === 0 && (
          <div className="text-center py-10 text-slate-400 italic">Nenhuma movimentação no caixa ainda.</div>
        )}
        {state.cashMovements.map(movement => {
          const signedAmount = getCashMovementSignedAmount(movement);
          const isManual = movement.sourceType === 'manual';
          const isIncome = movement.type === 'income';

          return (
            <div key={movement.id} className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100 flex justify-between items-center gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
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
                  <button
                    type="button"
                    onClick={() => deleteManualMovement(movement.id)}
                    className="text-slate-300 hover:text-rose-500 transition-colors"
                    title="Apagar lançamento manual"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
