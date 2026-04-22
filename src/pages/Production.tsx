import { useState } from 'react';
import { ProductionRecord, Recipe, ReadyStock, Ingredient, AppState, SellerStock } from '../types';
import { Package, Plus, Calendar, ChefHat, Trash2, Pencil } from 'lucide-react';
import { getRecipeItemsCost } from '../utils/costs';

interface ProductionPageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export function ProductionPage({ state, setState }: ProductionPageProps) {
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [editingProductionId, setEditingProductionId] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [productionQuantity, setProductionQuantity] = useState(1);
  const [luizaQuantity, setLuizaQuantity] = useState(0);
  const [priscilaQuantity, setPriscilaQuantity] = useState(0);
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);

  const recipes: Recipe[] = state.recipes || [];
  const productions: ProductionRecord[] = state.productions || [];
  const readyStock: ReadyStock[] = state.readyStock || [];
  const sellerStock: SellerStock[] = state.sellerStock || [];
  const ingredients: Ingredient[] = state.ingredients || [];
  const totalAllocated = luizaQuantity + priscilaQuantity;
  const remainingReadyStock = Math.max(0, productionQuantity - totalAllocated);

  const resetProductionForm = () => {
    setShowProductionForm(false);
    setEditingProductionId(null);
    setSelectedRecipe('');
    setProductionQuantity(1);
    setLuizaQuantity(0);
    setPriscilaQuantity(0);
    setProductionDate(new Date().toISOString().split('T')[0]);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getRecipeCost = (recipe: Recipe) => {
    const ingredientsCost = getRecipeItemsCost(recipe.ingredients, ingredients);
    const packagingCost = getRecipeItemsCost(recipe.packaging, ingredients);

    return ingredientsCost + packagingCost;
  };

  const handleAddProduction = () => {
    if (!selectedRecipe || productionQuantity <= 0 || totalAllocated > productionQuantity) return;
    
    const recipe = recipes.find(r => r.id === selectedRecipe);
    if (!recipe) return;

    const newProduction: ProductionRecord = {
      id: crypto.randomUUID(),
      recipeId: recipe.id,
      recipeName: recipe.name,
      quantity: productionQuantity,
      luizaQuantity,
      priscilaQuantity,
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
      const newReadyStock: ReadyStock[] = existingStock
        ? prev.readyStock.map(rs =>
            rs.recipeId === recipe.id
              ? { ...rs, quantity: rs.quantity + productionQuantity }
              : rs
          )
        : [...prev.readyStock, { recipeId: recipe.id, recipeName: recipe.name, quantity: productionQuantity }];

      const nextSellerStock = [...prev.sellerStock];

      if (luizaQuantity > 0) {
        const luizaIndex = nextSellerStock.findIndex(item => item.recipeId === recipe.id && item.seller === 'Luiza');
        if (luizaIndex >= 0) {
          nextSellerStock[luizaIndex] = { ...nextSellerStock[luizaIndex], quantity: nextSellerStock[luizaIndex].quantity + luizaQuantity };
        } else {
          nextSellerStock.push({ recipeId: recipe.id, recipeName: recipe.name, seller: 'Luiza', quantity: luizaQuantity });
        }
      }

      if (priscilaQuantity > 0) {
        const priscilaIndex = nextSellerStock.findIndex(item => item.recipeId === recipe.id && item.seller === 'Priscila');
        if (priscilaIndex >= 0) {
          nextSellerStock[priscilaIndex] = { ...nextSellerStock[priscilaIndex], quantity: nextSellerStock[priscilaIndex].quantity + priscilaQuantity };
        } else {
          nextSellerStock.push({ recipeId: recipe.id, recipeName: recipe.name, seller: 'Priscila', quantity: priscilaQuantity });
        }
      }

      return {
        ...prev,
        ingredients: updatedIngredients,
        productions: [newProduction, ...prev.productions],
        readyStock: newReadyStock,
        sellerStock: nextSellerStock,
      };
    });

    resetProductionForm();
  };

  const startEditingProduction = (production: ProductionRecord) => {
    setEditingProductionId(production.id);
    setShowProductionForm(true);
    setSelectedRecipe(production.recipeId);
    setProductionQuantity(production.quantity);
    setLuizaQuantity(production.luizaQuantity);
    setPriscilaQuantity(production.priscilaQuantity);
    setProductionDate(production.date);
  };

  const handleSaveProductionEdit = () => {
    if (!editingProductionId || totalAllocated > productionQuantity) {
      return;
    }

    setState(prev => {
      const production = prev.productions.find(item => item.id === editingProductionId);

      if (!production) {
        return prev;
      }

      const luizaDelta = luizaQuantity - production.luizaQuantity;
      const priscilaDelta = priscilaQuantity - production.priscilaQuantity;

      let nextSellerStock = [...prev.sellerStock];

      const updateSellerStock = (seller: 'Luiza' | 'Priscila', delta: number) => {
        if (delta === 0) {
          return;
        }

        const index = nextSellerStock.findIndex(
          item => item.recipeId === production.recipeId && item.seller === seller
        );

        if (index >= 0) {
          const nextQuantity = nextSellerStock[index].quantity + delta;

          if (nextQuantity > 0) {
            nextSellerStock[index] = { ...nextSellerStock[index], quantity: nextQuantity };
          } else {
            nextSellerStock = nextSellerStock.filter((_, itemIndex) => itemIndex !== index);
          }
          return;
        }

        if (delta > 0) {
          nextSellerStock.push({
            recipeId: production.recipeId,
            recipeName: production.recipeName,
            seller,
            quantity: delta,
          });
        }
      };

      updateSellerStock('Luiza', luizaDelta);
      updateSellerStock('Priscila', priscilaDelta);

      return {
        ...prev,
        productions: prev.productions.map(item =>
          item.id === editingProductionId
            ? {
                ...item,
                luizaQuantity,
                priscilaQuantity,
              }
            : item
        ),
        sellerStock: nextSellerStock,
      };
    });

    resetProductionForm();
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

  const getSellerTotal = (seller: 'Luiza' | 'Priscila') => {
    return sellerStock
      .filter(item => item.seller === seller)
      .reduce((sum, item) => sum + item.quantity, 0);
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

      const restoredSellerStock = prev.sellerStock
        .map(item => {
          if (item.recipeId !== production.recipeId) {
            return item;
          }

          if (item.seller === 'Luiza') {
            return { ...item, quantity: Math.max(0, item.quantity - production.luizaQuantity) };
          }

          if (item.seller === 'Priscila') {
            return { ...item, quantity: Math.max(0, item.quantity - production.priscilaQuantity) };
          }

          return item;
        })
        .filter(item => item.quantity > 0);

      if (!recipe) {
        return {
          ...prev,
          productions: prev.productions.filter(item => item.id !== productionId),
          readyStock: restoredStock,
          sellerStock: restoredSellerStock,
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
        sellerStock: restoredSellerStock,
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
          onClick={() => {
            if (showProductionForm) {
              resetProductionForm();
              return;
            }

            setShowProductionForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
        >
          <Plus size={18} />
          <span>{editingProductionId ? 'Editando Produção' : 'Nova Produção'}</span>
        </button>
      </div>

      {showProductionForm && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ChefHat size={20} className="text-rose-500" />
            {editingProductionId ? 'Editar Saída da Produção' : 'Registrar Produção'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sabor</label>
              <select 
                className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={selectedRecipe}
                onChange={e => setSelectedRecipe(e.target.value)}
                disabled={Boolean(editingProductionId)}
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
                disabled={Boolean(editingProductionId)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
              <input 
                type="date"
                className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={productionDate}
                onChange={e => setProductionDate(e.target.value)}
                disabled={Boolean(editingProductionId)}
              />
            </div>
          </div>
          {editingProductionId && (
            <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              Aqui voce edita somente quanto a Luiza e a Priscila levaram dessa producao. A quantidade total produzida permanece a mesma.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Luiza levou</label>
              <input
                type="number"
                min="0"
                className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={luizaQuantity}
                onChange={e => setLuizaQuantity(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Priscila levou</label>
              <input
                type="number"
                min="0"
                className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={priscilaQuantity}
                onChange={e => setPriscilaQuantity(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Fica no estoque geral</label>
              <div className="w-full p-2 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                Continua {productionQuantity} no estoque pronto total
              </div>
            </div>
          </div>
          {totalAllocated > productionQuantity && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              A soma do que Luiza e Priscila levaram nao pode ser maior que a quantidade produzida.
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button
              onClick={editingProductionId ? handleSaveProductionEdit : handleAddProduction}
              disabled={totalAllocated > productionQuantity}
              className="flex-1 py-2 bg-rose-500 disabled:bg-slate-300 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium"
            >
              {editingProductionId ? 'Salvar Edicao' : 'Confirmar Produção'}
            </button>
            <button
              onClick={resetProductionForm}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="bg-gradient-to-br from-fuchsia-50 to-pink-50 p-5 rounded-3xl shadow-sm border border-fuchsia-100">
          <div className="text-xs font-semibold uppercase tracking-wide text-fuchsia-600 mb-2">Com Luiza</div>
          <div className="text-3xl font-black text-fuchsia-700">{getSellerTotal('Luiza')}</div>
          <div className="text-xs text-fuchsia-600 mt-1">unidades para vender</div>
        </div>
        <div className="bg-gradient-to-br from-cyan-50 to-sky-50 p-5 rounded-3xl shadow-sm border border-cyan-100">
          <div className="text-xs font-semibold uppercase tracking-wide text-cyan-600 mb-2">Com Priscila</div>
          <div className="text-3xl font-black text-cyan-700">{getSellerTotal('Priscila')}</div>
          <div className="text-xs text-cyan-600 mt-1">unidades para vender</div>
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
        <h2 className="text-lg font-bold text-slate-800 mb-4">Bolos com Cada Uma</h2>
        {sellerStock.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Nenhum bolo separado para venda.</p>
        ) : (
          <div className="space-y-2">
            {sellerStock.map(item => (
              <div key={`${item.recipeId}-${item.seller}`} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-800">{item.recipeName}</div>
                  <div className="text-xs text-slate-500">{item.seller}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-rose-600">{item.quantity}</div>
                  <div className="text-xs text-slate-500">unidades</div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                  <div className="text-xs text-slate-500">
                    Luiza: {prod.luizaQuantity} • Priscila: {prod.priscilaQuantity} • Estoque geral: {prod.quantity - prod.luizaQuantity - prod.priscilaQuantity}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-rose-600">+{prod.quantity}</div>
                    <div className="text-xs text-slate-500">unidades</div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Editar producao de ${prod.recipeName}`}
                    onClick={() => startEditingProduction(prod)}
                    className="p-2 text-slate-400 hover:text-sky-500 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
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
