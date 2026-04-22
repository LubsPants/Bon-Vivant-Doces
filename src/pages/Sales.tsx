import React, { useState } from 'react';
import { ShoppingBag, User, Calendar, Trash2 } from 'lucide-react';
import { Sale, AppState } from '../types';
import { getSellerPrice } from '../lib/sales';

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

  const availableSellerStock = state.sellerStock.filter(item => item.seller === saleData.seller && item.quantity > 0);
  const selectedSellerStock = state.sellerStock.find(
    item => item.recipeId === saleData.recipeId && item.seller === saleData.seller
  );
  const selectedReadyStock = state.readyStock.find(item => item.recipeId === saleData.recipeId);
  const hasEnoughStock = !saleData.recipeId || (
    (selectedSellerStock ? selectedSellerStock.quantity >= saleData.quantity : false)
    && (selectedReadyStock ? selectedReadyStock.quantity >= saleData.quantity : false)
  );

  const recordSale = () => {
    if (!saleData.recipeId || saleData.quantity <= 0) return;

    const recipe = state.recipes.find(r => r.id === saleData.recipeId);
    const sellerStockItem = state.sellerStock.find(
      item => item.recipeId === saleData.recipeId && item.seller === saleData.seller
    );
    const readyStockItem = state.readyStock.find(item => item.recipeId === saleData.recipeId);
    if (!recipe || !sellerStockItem || sellerStockItem.quantity < saleData.quantity || !readyStockItem || readyStockItem.quantity < saleData.quantity) return;

    const sale: Sale = {
      id: crypto.randomUUID(),
      recipeId: saleData.recipeId,
      recipeName: recipe.name,
      seller: saleData.seller,
      date: new Date().toISOString(),
      price: getSellerPrice(saleData.seller),
      quantity: saleData.quantity
    };

    setState(prev => {
      const updatedSellerStock = prev.sellerStock
        .map(item => {
          if (item.recipeId === saleData.recipeId && item.seller === saleData.seller) {
            return { ...item, quantity: Math.max(0, item.quantity - saleData.quantity) };
          }
          return item;
        })
        .filter(item => item.quantity > 0);

      const updatedReadyStock = prev.readyStock
        .map(item =>
          item.recipeId === saleData.recipeId
            ? { ...item, quantity: Math.max(0, item.quantity - saleData.quantity) }
            : item
        )
        .filter(item => item.quantity > 0);

      return {
        ...prev,
        sales: [sale, ...prev.sales],
        sellerStock: updatedSellerStock,
        readyStock: updatedReadyStock,
      };
    });

    setSaleData({ ...saleData, recipeId: '' });
  };

  const deleteSale = (id: string) => {
    setState(prev => {
      const sale = prev.sales.find(item => item.id === id);

      if (!sale) {
        return prev;
      }

      const existingStock = prev.sellerStock.find(
        item => item.recipeId === sale.recipeId && item.seller === sale.seller
      );
      const existingReadyStock = prev.readyStock.find(item => item.recipeId === sale.recipeId);
      const updatedSellerStock = existingStock
        ? prev.sellerStock.map(item =>
            item.recipeId === sale.recipeId && item.seller === sale.seller
              ? { ...item, quantity: item.quantity + sale.quantity }
              : item
          )
        : [
            ...prev.sellerStock,
            {
              recipeId: sale.recipeId,
              recipeName: sale.recipeName,
              seller: sale.seller,
              quantity: sale.quantity,
            },
          ];
      const updatedReadyStock = existingReadyStock
        ? prev.readyStock.map(item =>
            item.recipeId === sale.recipeId
              ? { ...item, quantity: item.quantity + sale.quantity }
              : item
          )
        : [
            ...prev.readyStock,
            {
              recipeId: sale.recipeId,
              recipeName: sale.recipeName,
              quantity: sale.quantity,
            },
          ];

      return {
        ...prev,
        sales: prev.sales.filter(item => item.id !== id),
        sellerStock: updatedSellerStock,
        readyStock: updatedReadyStock,
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ShoppingBag className="text-rose-500" /> Nova Venda
        </h2>
        <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Aqui entram apenas as vendas pagas na hora. Se a cliente for retirar depois, use a aba Reserva.
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sabor do Bolo</label>
            <select 
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              value={saleData.recipeId}
              onChange={e => setSaleData({...saleData, recipeId: e.target.value})}
            >
              <option value="">Selecione o sabor...</option>
              {availableSellerStock
                .map(item => {
                  const recipe = state.recipes.find(recipeItem => recipeItem.id === item.recipeId);

                  if (!recipe) {
                    return null;
                  }

                  return (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.name} - R$ {getSellerPrice(saleData.seller).toFixed(2)} • {item.quantity} com {saleData.seller}
                    </option>
                  );
                })}
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
              <div className="text-xs text-emerald-600 mt-2 font-medium">
                Valor da venda com {saleData.seller}: R$ {getSellerPrice(saleData.seller).toFixed(2)} por unidade
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

          {saleData.recipeId && (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${hasEnoughStock ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {hasEnoughStock
                ? `Com ${saleData.seller}: ${selectedSellerStock?.quantity ?? 0} unidade(s). Estoque pronto total: ${selectedReadyStock?.quantity ?? 0}.`
                : `Estoque insuficiente. Com ${saleData.seller}: ${selectedSellerStock?.quantity ?? 0}. Estoque pronto total: ${selectedReadyStock?.quantity ?? 0}.`}
            </div>
          )}

          <button 
            onClick={recordSale}
            disabled={!saleData.recipeId || saleData.quantity <= 0 || !hasEnoughStock}
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
                  title="Apagar venda e devolver ao estoque"
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
