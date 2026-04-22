import React, { useState } from 'react';
import { ChefHat, Pencil, Plus, Trash2 } from 'lucide-react';
import { AppState, Recipe, RecipeIngredient } from '../types';
import { getRecipeItemsCost } from '../utils/costs';

interface RecipesPageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

type RecipeFormState = {
  name: string;
  flavor: string;
  salePrice: string;
  ingredients: RecipeIngredient[];
  packaging: RecipeIngredient[];
};

const EMPTY_RECIPE: RecipeFormState = {
  name: '',
  flavor: '',
  salePrice: '',
  ingredients: [],
  packaging: [],
};

export const RecipesPage: React.FC<RecipesPageProps> = ({ state, setState }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recipeForm, setRecipeForm] = useState<RecipeFormState>(EMPTY_RECIPE);
  const [tempIng, setTempIng] = useState({ ingredientId: '', quantity: '' });
  const [tempPackaging, setTempPackaging] = useState({ ingredientId: '', quantity: '1' });
  const [activeTab, setActiveTab] = useState<'ingredients' | 'packaging'>('ingredients');

  const calculateCost = (ingredients: RecipeIngredient[], packaging: RecipeIngredient[]) => {
    const ingredientsCost = getRecipeItemsCost(ingredients, state.ingredients);
    const packagingCost = getRecipeItemsCost(packaging, state.ingredients);
    return ingredientsCost + packagingCost;
  };

  const resetForm = () => {
    setRecipeForm(EMPTY_RECIPE);
    setEditingId(null);
    setShowForm(false);
    setTempIng({ ingredientId: '', quantity: '' });
    setTempPackaging({ ingredientId: '', quantity: '1' });
    setActiveTab('ingredients');
  };

  const addItemToRecipe = (type: 'ingredients' | 'packaging') => {
    const source = type === 'ingredients' ? tempIng : tempPackaging;

    if (!source.ingredientId || !source.quantity) {
      return;
    }

    setRecipeForm(current => ({
      ...current,
      [type]: [...current[type], { ingredientId: source.ingredientId, quantity: parseFloat(source.quantity) }],
    }));

    if (type === 'ingredients') {
      setTempIng({ ingredientId: '', quantity: '' });
      return;
    }

    setTempPackaging({ ingredientId: '', quantity: '1' });
  };

  const removeItem = (type: 'ingredients' | 'packaging', index: number) => {
    setRecipeForm(current => ({
      ...current,
      [type]: current[type].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const saveRecipe = () => {
    if (!recipeForm.name || !recipeForm.salePrice) {
      return;
    }

    const recipe: Recipe = {
      id: editingId ?? crypto.randomUUID(),
      name: recipeForm.name,
      flavor: recipeForm.flavor || recipeForm.name,
      salePrice: parseFloat(recipeForm.salePrice),
      cost: calculateCost(recipeForm.ingredients, recipeForm.packaging),
      ingredients: recipeForm.ingredients,
      packaging: recipeForm.packaging,
    };

    setState(prev => ({
      ...prev,
      recipes: editingId
        ? prev.recipes.map(item => (item.id === editingId ? recipe : item))
        : [...prev.recipes, recipe],
      readyStock: prev.readyStock.map(item =>
        item.recipeId === recipe.id ? { ...item, recipeName: recipe.name } : item
      ),
      sales: prev.sales.map(item =>
        item.recipeId === recipe.id ? { ...item, recipeName: recipe.name, price: recipe.salePrice } : item
      ),
      reservations: prev.reservations.map(item =>
        item.recipeId === recipe.id ? { ...item, recipeName: recipe.name, price: recipe.salePrice } : item
      ),
      productions: prev.productions.map(item =>
        item.recipeId === recipe.id ? { ...item, recipeName: recipe.name } : item
      ),
    }));

    resetForm();
  };

  const startEditing = (recipe: Recipe) => {
    setEditingId(recipe.id);
    setRecipeForm({
      name: recipe.name,
      flavor: recipe.flavor,
      salePrice: recipe.salePrice.toString(),
      ingredients: recipe.ingredients,
      packaging: recipe.packaging,
    });
    setShowForm(true);
  };

  const deleteRecipe = (id: string) => {
    setState(prev => ({
      ...prev,
      recipes: prev.recipes.filter(item => item.id !== id),
      readyStock: prev.readyStock.filter(item => item.recipeId !== id),
      reservations: prev.reservations.filter(item => item.recipeId !== id),
    }));

    if (editingId === id) {
      resetForm();
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const ingredientsList = state.ingredients.filter(i => i.category === 'ingredient');
  const packagingList = state.ingredients.filter(i => i.category === 'packaging');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Sabores & Receitas</h2>
        <button
          type="button"
          onClick={() => {
            if (showForm && !editingId) {
              resetForm();
              return;
            }

            setShowForm(true);
            setEditingId(null);
            setRecipeForm(EMPTY_RECIPE);
          }}
          className="bg-rose-500 text-white p-2 rounded-full shadow-lg hover:bg-rose-600 transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 space-y-4">
          <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Dica rapida: se mudar nome ou preco do sabor, o sistema atualiza os registros ligados a ele para evitar duplicidade.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Sabor</label>
              <input
                className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                placeholder="Ex: Ninho com Nutella"
                value={recipeForm.name}
                onChange={e => setRecipeForm({ ...recipeForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Descricao / Sabor</label>
              <input
                className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                placeholder="Ex: creme de ninho com recheio de nutella"
                value={recipeForm.flavor}
                onChange={e => setRecipeForm({ ...recipeForm, flavor: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Preço de Venda</label>
              <input
                type="number"
                className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                placeholder="R$ 0,00"
                value={recipeForm.salePrice}
                onChange={e => setRecipeForm({ ...recipeForm, salePrice: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Custo Unitário</label>
              <div className="w-full p-2 rounded-lg bg-slate-100 text-slate-600 font-medium">
                R$ {formatCurrency(calculateCost(recipeForm.ingredients, recipeForm.packaging))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('ingredients')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'ingredients' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-500'}`}
            >
              Ingredientes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('packaging')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'packaging' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-500'}`}
            >
              Embalagens
            </button>
          </div>

          {activeTab === 'ingredients' ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Ingrediente</label>
                  <select
                    className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                    value={tempIng.ingredientId}
                    onChange={e => setTempIng({ ...tempIng, ingredientId: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {ingredientsList.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Qtd.</label>
                  <input
                    type="number"
                    className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                    placeholder="0"
                    value={tempIng.quantity}
                    onChange={e => setTempIng({ ...tempIng, quantity: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => addItemToRecipe('ingredients')}
                className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Adicionar Ingrediente
              </button>
              <p className="text-xs text-slate-500">
                Se o item tiver rendimento cadastrado no estoque, a quantidade aqui pode ser por bolo.
              </p>
              {recipeForm.ingredients.length > 0 && (
                <div className="space-y-1">
                  {recipeForm.ingredients.map((item, index) => {
                    const ingredient = state.ingredients.find(current => current.id === item.ingredientId);
                    return (
                      <div key={`${item.ingredientId}-${index}`} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-700">
                          {ingredient?.name} - {item.quantity} {ingredient?.unit}
                        </span>
                        <button type="button" onClick={() => removeItem('ingredients', index)} className="text-rose-500 hover:text-rose-700">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Embalagem</label>
                  <select
                    className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                    value={tempPackaging.ingredientId}
                    onChange={e => setTempPackaging({ ...tempPackaging, ingredientId: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {packagingList.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Qtd.</label>
                  <input
                    type="number"
                    className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                    placeholder="1"
                    value={tempPackaging.quantity}
                    onChange={e => setTempPackaging({ ...tempPackaging, quantity: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => addItemToRecipe('packaging')}
                className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Adicionar Embalagem
              </button>
              <p className="text-xs text-slate-500">
                Embalagens tambem devem ser cadastradas no estoque para o custo fechar corretamente.
              </p>
              {recipeForm.packaging.length > 0 && (
                <div className="space-y-1">
                  {recipeForm.packaging.map((item, index) => {
                    const ingredient = state.ingredients.find(current => current.id === item.ingredientId);
                    return (
                      <div key={`${item.ingredientId}-${index}`} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-700">
                          {ingredient?.name} - {item.quantity} {ingredient?.unit}
                        </span>
                        <button type="button" onClick={() => removeItem('packaging', index)} className="text-rose-500 hover:text-rose-700">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={saveRecipe}
              className="flex-1 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium"
            >
              {editingId ? 'Salvar Edicao' : 'Salvar Receita'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {state.recipes.map(recipe => {
          const cost = calculateCost(recipe.ingredients, recipe.packaging);
          const profit = recipe.salePrice - cost;
          const margin = recipe.salePrice > 0 ? (profit / recipe.salePrice) * 100 : 0;

          return (
            <div key={recipe.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 rounded-xl">
                    <ChefHat size={20} className="text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{recipe.name}</h3>
                    <p className="text-xs text-slate-500">{recipe.flavor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => startEditing(recipe)} className="text-slate-400 hover:text-sky-500 transition-colors">
                    <Pencil size={18} />
                  </button>
                  <button type="button" onClick={() => deleteRecipe(recipe.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                <div>
                  <div className="text-xs text-slate-500">Custo</div>
                  <div className="font-bold text-slate-700">R$ {formatCurrency(cost)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Venda</div>
                  <div className="font-bold text-emerald-600">R$ {formatCurrency(recipe.salePrice)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Lucro</div>
                  <div className={`font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    R$ {formatCurrency(profit)} ({margin.toFixed(0)}%)
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
