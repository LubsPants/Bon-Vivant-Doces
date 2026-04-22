import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { AppState, Ingredient } from '../types';
import { getIngredientCost } from '../utils/costs';

interface IngredientsPageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

type IngredientFormState = {
  name: string;
  unit: Ingredient['unit'];
  purchasePrice: string;
  purchaseQuantity: string;
  currentStock: string;
  minStock: string;
  yieldQuantity: string;
  category: Ingredient['category'];
};

type EditMode = 'update' | 'restock';

const EMPTY_FORM: IngredientFormState = {
  name: '',
  unit: 'g',
  purchasePrice: '',
  purchaseQuantity: '',
  currentStock: '',
  minStock: '10',
  yieldQuantity: '',
  category: 'ingredient',
};

function toFormState(ingredient: Ingredient): IngredientFormState {
  return {
    name: ingredient.name,
    unit: ingredient.unit,
    purchasePrice: ingredient.purchasePrice.toString(),
    purchaseQuantity: ingredient.purchaseQuantity.toString(),
    currentStock: ingredient.currentStock.toString(),
    minStock: ingredient.minStock.toString(),
    yieldQuantity: ingredient.yieldQuantity?.toString() ?? '',
    category: ingredient.category,
  };
}

export const IngredientsPage: React.FC<IngredientsPageProps> = ({ state, setState }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'ingredient' | 'packaging'>('all');
  const [form, setForm] = useState<IngredientFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>('update');

  const isEditing = Boolean(editingId);

  useEffect(() => {
    if (!isEditing) {
      setEditMode('update');
    }
  }, [isEditing]);

  const visibleIngredients = useMemo(() => {
    return state.ingredients.filter(ingredient => {
      if (activeFilter === 'all') {
        return true;
      }

      return ingredient.category === activeFilter;
    });
  }, [activeFilter, state.ingredients]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setEditMode('update');
  };

  const handleSubmit = () => {
    if (!form.name || !form.purchasePrice || !form.purchaseQuantity) {
      return;
    }

    if (editingId) {
      setState(prev => ({
        ...prev,
        ingredients: prev.ingredients.map(item => {
          if (item.id !== editingId) {
            return item;
          }

          const purchasePrice = parseFloat(form.purchasePrice);
          const purchaseQuantity = parseFloat(form.purchaseQuantity);
          const minStock = parseFloat(form.minStock) || 0;
          const yieldQuantity = form.yieldQuantity ? parseFloat(form.yieldQuantity) : undefined;

          if (editMode === 'restock') {
            const addedStock = parseFloat(form.currentStock) || 0;

            return {
              ...item,
              purchasePrice,
              purchaseQuantity,
              currentStock: item.currentStock + addedStock,
              minStock,
              yieldQuantity,
              unit: form.unit,
              category: form.category,
              name: form.name,
            };
          }

          return {
            ...item,
            name: form.name,
            unit: form.unit,
            purchasePrice,
            purchaseQuantity,
            currentStock: parseFloat(form.currentStock) || 0,
            minStock,
            category: form.category,
            yieldQuantity,
          };
        }),
      }));

      resetForm();
      return;
    }

    const ingredient: Ingredient = {
      id: crypto.randomUUID(),
      name: form.name,
      unit: form.unit,
      purchasePrice: parseFloat(form.purchasePrice),
      purchaseQuantity: parseFloat(form.purchaseQuantity),
      currentStock: parseFloat(form.currentStock || form.purchaseQuantity),
      minStock: parseFloat(form.minStock) || 0,
      category: form.category,
      yieldQuantity: form.yieldQuantity ? parseFloat(form.yieldQuantity) : undefined,
    };

    setState(prev => ({ ...prev, ingredients: [...prev.ingredients, ingredient] }));
    resetForm();
  };

  const startEditing = (ingredient: Ingredient) => {
    setEditingId(ingredient.id);
    setForm(toFormState(ingredient));
    setEditMode('update');
  };

  const deleteIngredient = (id: string) => {
    setState(prev => ({ ...prev, ingredients: prev.ingredients.filter(i => i.id !== id) }));
    if (editingId === id) {
      resetForm();
    }
  };

  const getCardStyle = (ingredient: Ingredient) => {
    if (ingredient.currentStock <= 0) {
      return 'border-red-300 bg-red-50';
    }

    if (ingredient.currentStock <= ingredient.minStock) {
      return 'border-amber-200 bg-amber-50';
    }

    return 'border-rose-100 bg-white';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            {isEditing ? 'Editar Item de Estoque' : 'Novo Item de Estoque'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre ingredientes e embalagens. Na reposicao, informe a quantidade comprada agora para somar ao estoque.
          </p>
        </div>

        {isEditing && (
          <div className="mb-4 flex gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setEditMode('update')}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${editMode === 'update' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
            >
              Atualizar cadastro
            </button>
            <button
              type="button"
              onClick={() => {
                setEditMode('restock');
                setForm(current => ({ ...current, currentStock: '' }));
              }}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${editMode === 'restock' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
            >
              Reposicao
            </button>
          </div>
        )}

        {isEditing && (
          <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${editMode === 'restock' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
            {editMode === 'restock'
              ? 'Modo reposicao: informe o valor da compra atual, a quantidade comprada agora e quanto vai entrar no estoque.'
              : 'Modo atualizacao: use quando precisar corrigir nome, unidade, estoque atual, alerta minimo ou dados de custo.'}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Insumo</label>
            <input
              className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              placeholder="Ex: Leite Condensado"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
            <select
              className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value as Ingredient['category'] })}
            >
              <option value="ingredient">Ingrediente</option>
              <option value="packaging">Embalagem</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Unidade</label>
            <select
              className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              value={form.unit}
              onChange={e => setForm({ ...form, unit: e.target.value as Ingredient['unit'] })}
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
            <label className="block text-xs font-medium text-slate-500 mb-1">Valor da Compra</label>
            <input
              type="number"
              className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              placeholder="R$ 0,00"
              value={form.purchasePrice}
              onChange={e => setForm({ ...form, purchasePrice: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Qtd. Comprada</label>
            <input
              type="number"
              className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              placeholder="Ex: 395"
              value={form.purchaseQuantity}
              onChange={e => setForm({ ...form, purchaseQuantity: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Rendeu Quantos Bolos?</label>
            <input
              type="number"
              className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              placeholder="Ex: 20"
              value={form.yieldQuantity}
              onChange={e => setForm({ ...form, yieldQuantity: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {editMode === 'restock' ? 'Qtd. da Reposicao' : 'Estoque Atual'}
            </label>
            <input
              type="number"
              className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              placeholder={editMode === 'restock' ? 'Ex: 500' : 'Ex: 1000'}
              value={form.currentStock}
              onChange={e => setForm({ ...form, currentStock: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Estoque Mínimo</label>
            <input
              type="number"
              className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              placeholder="10"
              value={form.minStock}
              onChange={e => setForm({ ...form, minStock: e.target.value })}
            />
          </div>
          <div className="col-span-2 pt-2 flex gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isEditing ? <Save size={18} /> : <Plus size={20} />}
              {isEditing ? (editMode === 'restock' ? 'Salvar Reposicao' : 'Salvar Edicao') : 'Adicionar ao Estoque'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 bg-slate-100 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
            )}
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

        {visibleIngredients.map(ingredient => {
          const isOutOfStock = ingredient.currentStock <= 0;
          const isLowStock = !isOutOfStock && ingredient.currentStock <= ingredient.minStock;

          return (
            <div key={ingredient.id} className={`p-4 rounded-2xl shadow-sm border flex justify-between items-center ${getCardStyle(ingredient)}`}>
              <div>
                <div className="font-bold text-slate-700 flex items-center gap-2">
                  {ingredient.name}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${ingredient.category === 'packaging' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {ingredient.category === 'packaging' ? 'Embalagem' : 'Ingrediente'}
                  </span>
                  {isOutOfStock && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      Zerado
                    </span>
                  )}
                  {isLowStock && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      Alerta
                    </span>
                  )}
                </div>
                <div className={`text-xs mt-1 ${isOutOfStock ? 'text-red-700' : 'text-slate-500'}`}>
                  Estoque: {ingredient.currentStock} {ingredient.unit} | Min.: {ingredient.minStock} {ingredient.unit}
                </div>
                <div className="text-xs text-slate-500">
                  Custo base: R$ {formatCurrency(ingredient.purchasePrice / ingredient.purchaseQuantity)}/{ingredient.unit}
                </div>
                {ingredient.yieldQuantity ? (
                  <div className="text-xs text-slate-500 mt-1">
                    Rendimento: {ingredient.yieldQuantity} bolos | Custo por bolo: R$ {formatCurrency(getIngredientCost(ingredient, 1))}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                {(isOutOfStock || isLowStock) && (
                  <AlertTriangle size={18} className={isOutOfStock ? 'text-red-500' : 'text-amber-500'} />
                )}
                <button
                  type="button"
                  onClick={() => startEditing(ingredient)}
                  className="p-2 text-slate-400 hover:text-sky-500 transition-colors"
                  aria-label={`Editar ${ingredient.name}`}
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteIngredient(ingredient.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  aria-label={`Excluir ${ingredient.name}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
