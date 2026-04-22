import React, { useState } from 'react';
import { Plus, Trash2, ChefHat } from 'lucide-react';
import { Recipe, RecipeIngredient, AppState } from '../types';
import { getRecipeItemsCost } from '../utils/costs';

interface RecipesPageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const RecipesPage: React.FC<RecipesPageProps> = ({ state, setState }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newRecipe, setNewRecipe] = useState({ 
    name: '', 
    flavor: '',
    salePrice: '',
    ingredients: [] as RecipeIngredient[],
    packaging: [] as RecipeIngredient[]
  });
  const [tempIng, setTempIng] = useState({ ingredientId: '', quantity: '' });
  const [tempPackaging, setTempPackaging] = useState({ ingredientId: '', quantity: '1' });
  const [activeTab, setActiveTab] = useState<'ingredients' | 'packaging'>('ingredients');

  const calculateCost = (ingredients: RecipeIngredient[], packaging: RecipeIngredient[]) => {
    const ingredientsCost = getRecipeItemsCost(ingredients, state.ingredients);
    const packagingCost = getRecipeItemsCost(packaging, state.ingredients);

    return ingredientsCost + packagingCost;
  };

  const addIngToRecipe = () => {
    if (!tempIng.ingredientId || !tempIng.quantity) return;
    setNewRecipe({
      ...newRecipe,
      ingredients: [...newRecipe.ingredients, { 
        ingredientId: tempIng.ingredientId, 
        quantity: parseFloat(tempIng.quantity) 
      }]
    });
    setTempIng({ ingredientId: '', quantity: '' });
  };

  const addPackagingToRecipe = () => {
    if (!tempPackaging.ingredientId || !tempPackaging.quantity) return;
    setNewRecipe({
      ...newRecipe,
      packaging: [...newRecipe.packaging, { 
        ingredientId: tempPackaging.ingredientId, 
        quantity: parseFloat(tempPackaging.quantity) 
      }]
    });
    setTempPackaging({ ingredientId: '', quantity: '1' });
  };

  const removeIngredient = (index: number) => {
    setNewRecipe({
      ...newRecipe,
      ingredients: newRecipe.ingredients.filter((_, i) => i !== index)
    });
  };

  const removePackaging = (index: number) => {
    setNewRecipe({
      ...newRecipe,
      packaging: newRecipe.packaging.filter((_, i) => i !== index)
    });
  };

  const saveRecipe = () => {
    if (!newRecipe.name || !newRecipe.salePrice) return;
    
    const cost = calculateCost(newRecipe.ingredients, newRecipe.packaging);
    
    const recipe: Recipe = {
      id: crypto.randomUUID(),
      name: newRecipe.name,
      flavor: newRecipe.flavor || newRecipe.name,
      salePrice: parseFloat(newRecipe.salePrice),
      cost: cost,
      ingredients: newRecipe.ingredients,
      packaging: newRecipe.packaging
    };

    setState(prev => ({ ...prev, recipes: [...prev.recipes, recipe] }));
    setNewRecipe({ name: '', flavor: '', salePrice: '', ingredients: [], packaging: [] });
    setShowAdd(false);
  };

  const deleteRecipe = (id: string) => {
    setState(prev => ({ ...prev, recipes: prev.recipes.filter(r => r.id !== id) }));
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
          onClick={() => setShowAdd(!showAdd)}
          className="bg-rose-500 text-white p-2 rounded-full shadow-lg hover:bg-rose-600 transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Sabor</label>
              <input 
                className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none" 
                placeholder="Ex: Ninho com Nutella"
                value={newRecipe.name}
                onChange={e => setNewRecipe({...newRecipe, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Preço de Venda</label>
              <input 
                type="number"
                className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none" 
                placeholder="R$ 0,00"
                value={newRecipe.salePrice}
                onChange={e => setNewRecipe({...newRecipe, salePrice: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Custo Unitário</label>
              <div className="w-full p-2 rounded-lg bg-slate-100 text-slate-600 font-medium">
                R$ {formatCurrency(calculateCost(newRecipe.ingredients, newRecipe.packaging))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'ingredients' 
                  ? 'text-rose-600 border-b-2 border-rose-600' 
                  : 'text-slate-500'
              }`}
            >
              Ingredientes
            </button>
            <button
              onClick={() => setActiveTab('packaging')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'packaging' 
                  ? 'text-rose-600 border-b-2 border-rose-600' 
                  : 'text-slate-500'
              }`}
            >
              Embalagens (Potes, Adesivos)
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
                    onChange={e => setTempIng({...tempIng, ingredientId: e.target.value})}
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
                    onChange={e => setTempIng({...tempIng, quantity: e.target.value})}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={addIngToRecipe}
                className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Adicionar Ingrediente
              </button>
              <p className="text-xs text-slate-500">
                Se o item tiver rendimento cadastrado no estoque, a quantidade aqui pode ser por bolo. Exemplo: `1` para um pote, um adesivo ou uma porcao padrao.
              </p>
              {newRecipe.ingredients.length > 0 && (
                <div className="space-y-1">
                  {newRecipe.ingredients.map((ri, idx) => {
                    const ing = state.ingredients.find(i => i.id === ri.ingredientId);
                    return (
                      <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-700">
                          {ing?.name} - {ri.quantity} {ing?.unit}
                        </span>
                        <button onClick={() => removeIngredient(idx)} className="text-rose-500 hover:text-rose-700">
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
                    onChange={e => setTempPackaging({...tempPackaging, ingredientId: e.target.value})}
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
                    onChange={e => setTempPackaging({...tempPackaging, quantity: e.target.value})}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={addPackagingToRecipe}
                className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Adicionar Embalagem
              </button>
              <p className="text-xs text-slate-500">
                Embalagens tambem devem ser cadastradas no estoque. Se um pacote de 50 potes rende 50 bolos, use `Rendeu Quantos Bolos = 50` no cadastro.
              </p>
              {newRecipe.packaging.length > 0 && (
                <div className="space-y-1">
                  {newRecipe.packaging.map((ri, idx) => {
                    const ing = state.ingredients.find(i => i.id === ri.ingredientId);
                    return (
                      <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-700">
                          {ing?.name} - {ri.quantity} {ing?.unit}
                        </span>
                        <button onClick={() => removePackaging(idx)} className="text-rose-500 hover:text-rose-700">
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
              onClick={saveRecipe}
              className="flex-1 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium"
            >
              Salvar Receita
            </button>
            <button
              onClick={() => setShowAdd(false)}
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
                <button onClick={() => deleteRecipe(recipe.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                  <Trash2 size={18} />
                </button>
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
