import React, { useState } from 'react';
import { ShoppingBag, User, Calendar, Trash2 } from 'lucide-react';
import { Sale, AppState } from '../types';

interface SalesPageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const SalesPage: React.FC<SalesPageProps> = ({ state, setState }) => {
  const [saleData, setSaleData] = useState({
    recipeId: '',
    seller: 'Luiza' as 'Luiza' | 'Priscila',
    quantity: 1,
  });

  const recordSale = () => {
    if (!saleData.recipeId) return;

    const recipe = state.recipes.find(r => r.id === saleData.recipeId);
    if (!recipe) return;

    const sale: Sale = {
      id: crypto.randomUUID(),
      recipeId: saleData.recipeId,
      recipeName: recipe.name,
      seller: saleData.seller,
      date: new Date().toISOString(),
      price: recipe.salePrice,
      quantity: saleData.quantity
    };

    // Update state: add sale and subtract from ready stock
    setState(prev => {
      const updatedReadyStock = prev.readyStock.map(rs => {
        if (rs.recipeId === saleData.recipeId) {
          return { ...rs, quantity: Math.max(0, rs.quantity - saleData.quantity) };
        }
        return rs;
      });

      return {
        ...prev,
        sales: [sale, ...prev.sales],
        readyStock: updatedReadyStock
      };
    });

    setSaleData({ ...saleData, recipeId: '' });
  };

  const deleteSale = (id: string) => {
    setState(prev => ({ ...prev, sales: prev.sales.filter(s => s.id !== id) }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ShoppingBag className="text-rose-500" /> Nova Venda
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sabor do Bolo</label>
            <select 
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              value={saleData.recipeId}
              onChange={e => setSaleData({...saleData, recipeId: e.target.value})}
            >
              <option value="">Selecione o sabor...</option>
              {state.recipes.map(r => (
                <option key={r.id} value={r.id}>{r.name} - R$ {r.salePrice.toFixed(2)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Quem vendeu?</label>
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button 
                  onClick={() => setSaleData({...saleData, seller: 'Luiza'})}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${saleData.seller === 'Luiza' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Luiza
                </button>
                <button 
                  onClick={() => setSaleData({...saleData, seller: 'Priscila'})}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${saleData.seller === 'Priscila' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Priscila
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Quantidade</label>
              <input 
                type="number"
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none" 
                value={saleData.quantity}
                onChange={e => setSaleData({...saleData, quantity: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <button 
            onClick={recordSale}
            disabled={!saleData.recipeId}
            className="w-full bg-rose-500 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-md hover:bg-rose-600 transition-all"
          >
            Registrar Venda
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-slate-800 px-2">Vendas Recentes</h2>
        {state.sales.length === 0 && (
          <div className="text-center py-10 text-slate-400 italic">Nenhuma venda registrada.</div>
        )}
        {state.sales.map(sale => {
          const recipe = state.recipes.find(r => r.id === sale.recipeId);
          return (
            <div key={sale.id} className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center font-bold">
                  {sale.quantity}x
                </div>
                <div>
                  <div className="font-bold text-slate-700">{recipe?.name || 'Sabor removido'}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <User size={10} /> {sale.seller} • <Calendar size={10} /> {new Date(sale.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-bold text-slate-700">R$ {(sale.price * sale.quantity).toFixed(2)}</div>
                <button 
                  onClick={() => deleteSale(sale.id)}
                  className="text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
