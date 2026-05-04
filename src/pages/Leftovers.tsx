import React, { useMemo, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { AppState, LeftoverRecord, LossReason, SellerName } from '../types';
import { getAvailableSellerStock, getAvailableSellerStockItem } from '../lib/stock';
import { getRecipeCost } from '../utils/costs';

interface LeftoversPageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const REASON_LABELS: Record<LossReason, string> = {
  not_sold: 'Não vendeu',
  expired: 'Venceu',
  damaged: 'Danificou',
  donation: 'Doação/Degustação',
  other: 'Outro',
};

export const LeftoversPage: React.FC<LeftoversPageProps> = ({ state, setState }) => {
  const [formData, setFormData] = useState({
    seller: 'Luiza' as SellerName,
    recipeId: '',
    quantity: 1,
    reason: 'not_sold' as LossReason,
    note: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const availableSellerStock = getAvailableSellerStock(state, formData.seller);
  const selectedSellerStock = getAvailableSellerStockItem(state, formData.seller, formData.recipeId);
  const currentMonthLeftovers = useMemo(
    () => state.leftovers.filter(item => item.date.slice(0, 7) === currentMonth),
    [currentMonth, state.leftovers]
  );
  const monthlyLossUnits = currentMonthLeftovers.reduce((sum, item) => sum + item.quantity, 0);
  const monthlyLossValue = currentMonthLeftovers.reduce((sum, item) => sum + item.totalLoss, 0);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleCreateLeftover = () => {
    if (!formData.recipeId || formData.quantity <= 0) {
      return;
    }

    const recipe = state.recipes.find(item => item.id === formData.recipeId);
    const sellerStockItem = getAvailableSellerStockItem(state, formData.seller, formData.recipeId);

    if (!recipe || !sellerStockItem || sellerStockItem.quantity < formData.quantity) {
      return;
    }

    const unitCost = getRecipeCost(recipe, state.ingredients, state.preparations);
    const leftover: LeftoverRecord = {
      id: crypto.randomUUID(),
      recipeId: recipe.id,
      recipeName: recipe.name,
      seller: formData.seller,
      quantity: formData.quantity,
      reason: formData.reason,
      note: formData.note.trim() || undefined,
      unitCost,
      totalLoss: unitCost * formData.quantity,
      date: new Date(`${formData.date}T12:00:00`).toISOString(),
    };

    setState(prev => ({
      ...prev,
      leftovers: [leftover, ...prev.leftovers],
    }));

    setFormData(prev => ({
      ...prev,
      recipeId: '',
      quantity: 1,
      note: '',
    }));
  };

  const handleDeleteLeftover = (id: string) => {
    setState(prev => ({
      ...prev,
      leftovers: prev.leftovers.filter(item => item.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="text-rose-500" /> Sobrou / Prejuízo
        </h2>
        <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Registre aqui os bolos que sobraram e não puderam ser vendidos. O sistema baixa do estoque total e também de quem estava com o bolo.
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Com quem estava?</label>
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, seller: 'Luiza', recipeId: '' }))}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.seller === 'Luiza' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Luiza
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, seller: 'Priscila', recipeId: '' }))}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.seller === 'Priscila' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Priscila
                </button>
              </div>
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

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sabor</label>
            <select
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              value={formData.recipeId}
              onChange={e => setFormData(prev => ({ ...prev, recipeId: e.target.value }))}
            >
              <option value="">Selecione o sabor...</option>
              {availableSellerStock.map(item => (
                <option key={item.recipeId} value={item.recipeId}>
                  {item.recipeName} • {item.quantity} com {formData.seller}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Quantidade</label>
              <input
                type="number"
                min="1"
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={formData.quantity}
                onChange={e => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Motivo</label>
              <select
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={formData.reason}
                onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value as LossReason }))}
              >
                {Object.entries(REASON_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Observação</label>
            <input
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              placeholder="Opcional"
              value={formData.note}
              onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
            />
          </div>

          {formData.recipeId && (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${(selectedSellerStock?.quantity ?? 0) >= formData.quantity ? 'border-amber-100 bg-amber-50 text-amber-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {(selectedSellerStock?.quantity ?? 0) >= formData.quantity
                ? `Disponível com ${formData.seller}: ${selectedSellerStock?.quantity ?? 0} unidade(s).`
                : `Quantidade maior que o disponível com ${formData.seller}: ${selectedSellerStock?.quantity ?? 0} unidade(s).`}
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateLeftover}
            disabled={!formData.recipeId || formData.quantity <= 0 || (selectedSellerStock?.quantity ?? 0) < formData.quantity}
            className="w-full bg-rose-500 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-md hover:bg-rose-600 transition-all"
          >
            Registrar Sobra
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-3xl shadow-sm border border-amber-100">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">Sobras no Mês</div>
          <div className="text-2xl font-black text-amber-700">{monthlyLossUnits}</div>
          <div className="text-xs text-amber-600 mt-1">unidades descartadas</div>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-red-50 p-5 rounded-3xl shadow-sm border border-rose-100">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2">Prejuízo no Mês</div>
          <div className="text-2xl font-black text-rose-700">R$ {formatCurrency(monthlyLossValue)}</div>
          <div className="text-xs text-rose-600 mt-1">calculado pelo custo</div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-slate-800 px-2">Histórico de Sobras</h2>
        {state.leftovers.length === 0 && (
          <div className="text-center py-10 text-slate-400 italic">Nenhuma sobra registrada.</div>
        )}
        {state.leftovers.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100 flex justify-between items-center gap-4">
            <div>
              <div className="font-bold text-slate-700">{item.recipeName}</div>
              <div className="text-sm text-slate-500">
                {item.quantity}x com {item.seller} • {REASON_LABELS[item.reason]}
              </div>
              <div className="text-[11px] text-slate-400">
                {new Date(item.date).toLocaleDateString('pt-BR')}
                {item.note ? ` • ${item.note}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-bold text-rose-700">- R$ {formatCurrency(item.totalLoss)}</div>
                <div className="text-[11px] text-slate-400">custo</div>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteLeftover(item.id)}
                className="text-slate-300 hover:text-rose-500 transition-colors"
                title="Apagar registro de sobra"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
