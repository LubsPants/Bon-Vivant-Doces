import { useState } from 'react';
import { ProductionRecord, Recipe, ReadyStock, Ingredient, AppState } from '../types';
import { Package, Plus, Calendar, ChefHat, Trash2 } from 'lucide-react';
import { getRecipeItemsCost } from '../utils/costs';

interface ProductionPageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export function ProductionPage({ state, setState }: ProductionPageProps) {
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [productionQuantity, setProductionQuantity] = useState(1);
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);

  const recipes: Recipe[] = state.recipes || [];
  const productions: ProductionRecord[] = state.productions || [];
  const readyStock: ReadyStock[] = state.readyStock || [];
  const ingredients: Ingredient[] = state.ingredients || [];

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getRecipeCost = (recipe: Recipe) => {
    const ingredientsCost = getRecipeItemsCost(recipe.ingredients, ingredients);
    const packagingCost = getRecipeItemsCost(recipe.packaging, ingredients);

    return ingredientsCost + packagingCost;
  };

  const handleAddProduction = () => {
    if (!selectedRecipe || productionQuantity <= 0) return;
    
    const recipe = recipes.find(r => r.id === selectedRecipe);
    if (!recipe) return;

    const newProduction: ProductionRecord = {
      id: crypto.randomUUID(),
      recipeId: recipe.id,
      recipeName: recipe.name,
      quantity: productionQuantity,
      date: productionDate,
      createdAt: new Date().toISOString()
    };

    setState(prev => {
      const consumptionMap = new Map<string, number>();

      recipe.ingredients.forEach(ri => {
        consumptionMap.set(
          ri.ingredientId,
          (consumptionMap.get(ri.ingredientId) || 0) + (ri.quantity * productionQuantity)
        );
      });

      recipe.packaging.forEach(ri => {
        consumptionMap.set(
          ri.ingredientId,
          (consumptionMap.get(ri.ingredientId) || 0) + (ri.quantity * productionQuantity)
        );
      });

      const updatedIngredients = prev.ingredients.map(ing => {
        const consumedQuantity = consumptionMap.get(ing.id) || 0;

        if (consumedQuantity === 0) {
          return ing;
        }

        return {
          ...ing,
          currentStock: Math.max(0, ing.currentStock - consumedQuantity),
        };
      });

      const existingStock = prev.readyStock.find(rs => rs.recipeId === recipe.id);
      let newReadyStock: ReadyStock[];
      
      if (existingStock) {
        newReadyStock = prev.readyStock.map(rs => 
          rs.recipeId === recipe.id 
            ? { ...rs, quantity: rs.quantity + productionQuantity }
            : rs
        );
      } else {
        newReadyStock = [...prev.readyStock, { recipeId: recipe.id, recipeName: recipe.name, quantity: productionQuantity }];
      }

      return {
        ...prev,
        ingredients: updatedIngredients,
        productions: [newProduction, ...prev.productions],
        readyStock: newReadyStock
      };
    });

    setShowProductionForm(false);
    setSelectedRecipe('');
    setProductionQuantity(1);
  };

  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const getProductionByDate = (date: string) => {
    return productions.filter(p => p.date === date);
  };

  const getTotalProduced = () => {
    return productions.reduce((sum, p) => sum + p.quantity, 0);
  };

  const getTotalReadyStock = () => {
    return readyStock.reduce((sum, rs) => sum + rs.quantity, 0);
  };

  const handleDeleteReadyStock = (recipeId: string) => {
    setState(prev => ({
      ...prev,
      readyStock: prev.readyStock.filter(rs => rs.recipeId !== recipeId),
    }));
  };

  const handleDeleteProduction = (productionId: string) => {
    setState(prev => {
      const production = prev.productions.find(item => item.id === productionId);

      if (!production) {
        return prev;
      }

      const recipe = prev.recipes.find(item => item.id === production.recipeId);
      const restoredStock = prev.readyStock
        .map(item =>
          item.recipeId === production.recipeId
            ? { ...item, quantity: Math.max(0, item.quantity - production.quantity) }
            : item
        )
        .filter(item => item.quantity > 0);

      if (!recipe) {
        return {
          ...prev,
          productions: prev.productions.filter(item => item.id !== productionId),
          readyStock: restoredStock,
        };
      }

      const restoreMap = new Map<string, number>();

      recipe.ingredients.forEach(item => {
        restoreMap.set(
          item.ingredientId,
          (restoreMap.get(item.ingredientId) || 0) + (item.quantity * production.quantity)
        );
      });

      recipe.packaging.forEach(item => {
        restoreMap.set(
          item.ingredientId,
          (restoreMap.get(item.ingredientId) || 0) + (item.quantity * production.quantity)
        );
      });

      const restoredIngredients = prev.ingredients.map(item => {
        const restoredQuantity = restoreMap.get(item.id) || 0;

        if (!restoredQuantity) {
          return item;
        }

        return {
          ...item,
          currentStock: item.currentStock + restoredQuantity,
        };
      });

      return {
        ...prev,
        ingredients: restoredIngredients,
        productions: prev.productions.filter(item => item.id !== productionId),
        readyStock: restoredStock,
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Produção Semanal</h1>
          <p className="text-slate-500 text-sm">Controle de bolos prontos e insumos</p>
        </div>
        <button
          onClick={() => setShowProductionForm(!showProductionForm)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
        >
          <Plus size={18} />
          <span>Nova Produção</span>
        </button>
      </div>

      {showProductionForm && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ChefHat size={20} className="text-rose-500" />
            Registrar Produção
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sabor</label>
              <select 
                className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={selectedRecipe}
                onChange={e => setSelectedRecipe(e.target.value)}
              >
                <option value="">Selecione...</option>
                {recipes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Quantidade</label>
              <input 
                type="number"
                className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={productionQuantity}
                onChange={e => setProductionQuantity(parseInt(e.target.value) || 0)}
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
              <input 
                type="date"
                className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={productionDate}
                onChange={e => setProductionDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddProduction}
              className="flex-1 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium"
            >
              Confirmar Produção
            </button>
            <button
              onClick={() => setShowProductionForm(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-3xl shadow-sm border border-amber-100">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Package size={18} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide">Estoque Pronto</span>
          </div>
          <div className="text-3xl font-black text-amber-700">{getTotalReadyStock()}</div>
          <div className="text-xs text-amber-600 mt-1">bolos disponíveis</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-3xl shadow-sm border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <div className="p-1.5 bg-emerald-100 rounded-lg">
              <Calendar size={18} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide">Produzido (Semana)</span>
          </div>
          <div className="text-3xl font-black text-emerald-700">{getTotalProduced()}</div>
          <div className="text-xs text-emerald-600 mt-1">bolos produzidos</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Package size={20} className="text-rose-500" />
          Estoque de Bolos Prontos
        </h2>
        {readyStock.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Nenhum bolo pronto no estoque</p>
        ) : (
          <div className="space-y-2">
            {readyStock.map(rs => {
              const recipe = recipes.find(r => r.id === rs.recipeId);
              return (
                <div key={rs.recipeId} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <div>
                    <div className="font-semibold text-slate-800">{rs.recipeName}</div>
                    <div className="text-xs text-slate-500">
                      Custo unitário: R$ {recipe ? formatCurrency(getRecipeCost(recipe)) : '0,00'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xl font-bold text-rose-600">{rs.quantity}</div>
                      <div className="text-xs text-slate-500">unidades</div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Excluir estoque de ${rs.recipeName}`}
                      onClick={() => handleDeleteReadyStock(rs.recipeId)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-rose-500" />
          Produção da Semana
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map(date => {
            const dayProds = getProductionByDate(date);
            const dayDate = new Date(date + 'T00:00:00');
            const dayName = dayDate.toLocaleDateString('pt-BR', { weekday: 'short' });
            const dayNum = dayDate.getDate();
            
            return (
              <div key={date} className="text-center p-2 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 uppercase">{dayName}</div>
                <div className="text-lg font-bold text-slate-700">{dayNum}</div>
                {dayProds.length > 0 && (
                  <div className="mt-1">
                    <div className="text-xs font-semibold text-rose-600">
                      {dayProds.reduce((sum, p) => sum + p.quantity, 0)} un
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Histórico de Produção</h2>
        {productions.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Nenhuma produção registrada</p>
        ) : (
          <div className="space-y-2">
            {productions.slice(0, 10).map(prod => (
              <div key={prod.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-800">{prod.recipeName}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(prod.date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-rose-600">+{prod.quantity}</div>
                    <div className="text-xs text-slate-500">unidades</div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Excluir producao de ${prod.recipeName}`}
                    onClick={() => handleDeleteProduction(prod.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
