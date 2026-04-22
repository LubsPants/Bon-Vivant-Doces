import React, { useState } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Ingredient, AppState } from '../types';
import { getIngredientCost } from '../utils/costs';

interface IngredientsPageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const IngredientsPage: React.FC<IngredientsPageProps> = ({ state, setState }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'ingredient' | 'packaging'>('all');
  const [newIng, setNewIng] = useState({
    name: '',
    unit: 'g' as 'g' | 'ml' | 'un' | 'kg' | 'L' | 'pct',
    purchasePrice: '',
    purchaseQuantity: '',
    currentStock: '',
    minStock: '10',
    yieldQuantity: '',
    category: 'ingredient' as 'ingredient' | 'packaging',
  });

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const addIngredient = () => {
    if (!newIng.name || !newIng.purchasePrice || !newIng.purchaseQuantity) return;
    
    const ingredient: Ingredient = {
      id: crypto.randomUUID(),
      name: newIng.name,
      unit: newIng.unit,
      purchasePrice: parseFloat(newIng.purchasePrice),
      purchaseQuantity: parseFloat(newIng.purchaseQuantity),
      currentStock: parseFloat(newIng.currentStock || newIng.purchaseQuantity),
      minStock: parseFloat(newIng.minStock) || 10,
      category: newIng.category,
      yieldQuantity: newIng.yieldQuantity ? parseFloat(newIng.yieldQuantity) : undefined,
    };

    setState(prev => ({ ...prev, ingredients: [...prev.ingredients, ingredient] }));
    setNewIng({
      name: '',
      unit: 'g',
      purchasePrice: '',
      purchaseQuantity: '',
      currentStock: '',
      minStock: '10',
      yieldQuantity: '',
      category: 'ingredient',
    });
  };

  const deleteIngredient = (id: string) => {
    setState(prev => ({ ...prev, ingredients: prev.ingredients.filter(i => i.id !== id) }));
  };

  const visibleIngredients = state.ingredients.filter(ingredient => {
    if (activeFilter === 'all') {
      return true;
    }

    return ingredient.category === activeFilter;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-800">Novo Item de Estoque</h2>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre ingredientes e embalagens aqui. Se souber quantos bolos um item rende, o sistema calcula melhor o custo por unidade.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Insumo</label>
            <input 
              className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none" 
              placeholder="Ex: Leite Condensado"
              value={newIng.name}
              onChange={e => setNewIng({...newIng, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
            <select
              className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              value={newIng.category}
              onChange={e => setNewIng({...newIng, category: e.target.value as 'ingredient' | 'packaging'})}
            >
              <option value="ingredient">Ingrediente</option>
              <option value="packaging">Embalagem</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Unidade</label>
            <select 
              className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              value={newIng.unit}
              onChange={e => setNewIng({...newIng, unit: e.target.value as 'g' | 'ml' | 'un' | 'kg' | 'L' | 'pct'})}
            >
              <option value="g">Gramas (g)</option>
              <option value="kg">Quilos (kg)</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="L">Litros (L)</option>
              <option value="un">Unidade (un)</option>
              <option value="pct">Pacote (pct)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Preço de Compra</label>
            <input 
              type="number"
              className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none" 
              placeholder="R$ 0,00"
              value={newIng.purchasePrice}
              onChange={e => setNewIng({...newIng, purchasePrice: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Qtd. Comprada</label>
            <input 
              type="number"
              className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none" 
              placeholder="Ex: 395"
              value={newIng.purchaseQuantity}
              onChange={e => setNewIng({...newIng, purchaseQuantity: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Rendeu Quantos Bolos?</label>
            <input
              type="number"
              className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              placeholder="Ex: 20"
              value={newIng.yieldQuantity}
              onChange={e => setNewIng({...newIng, yieldQuantity: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Estoque Atual</label>
            <input 
              type="number"
              className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none" 
              placeholder="Ex: 1000"
              value={newIng.currentStock}
              onChange={e => setNewIng({...newIng, currentStock: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Estoque Mínimo</label>
            <input
              type="number"
              className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              placeholder="10"
              value={newIng.minStock}
              onChange={e => setNewIng({...newIng, minStock: e.target.value})}
            />
          </div>
          <div className="col-span-2 pt-2">
            <button 
              onClick={addIngredient}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} /> Adicionar ao Estoque
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-2 gap-3">
          <h2 className="text-xl font-bold text-slate-800">Estoque Atual</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeFilter === 'all' ? 'bg-rose-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('ingredient')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeFilter === 'ingredient' ? 'bg-rose-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
            >
              Ingredientes
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('packaging')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeFilter === 'packaging' ? 'bg-rose-500 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
            >
              Embalagens
            </button>
          </div>
        </div>
        {visibleIngredients.length === 0 && (
          <div className="text-center py-10 text-slate-400 italic">Nenhum item cadastrado nesse filtro.</div>
        )}
        {visibleIngredients.map(ing => (
          <div key={ing.id} className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100 flex justify-between items-center">
            <div>
              <div className="font-bold text-slate-700 flex items-center gap-2">
                {ing.name}
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${ing.category === 'packaging' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {ing.category === 'packaging' ? 'Embalagem' : 'Ingrediente'}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Estoque: {ing.currentStock} {ing.unit} | Custo base: R$ {formatCurrency(ing.purchasePrice / ing.purchaseQuantity)}/{ing.unit}
              </div>
              {ing.yieldQuantity ? (
                <div className="text-xs text-slate-500 mt-1">
                  Rendimento: {ing.yieldQuantity} bolos | Custo por bolo: R$ {formatCurrency(getIngredientCost(ing, 1))}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              {ing.currentStock <= ing.minStock && (
                <AlertTriangle size={18} className="text-amber-500" />
              )}
              <button 
                onClick={() => deleteIngredient(ing.id)}
                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
