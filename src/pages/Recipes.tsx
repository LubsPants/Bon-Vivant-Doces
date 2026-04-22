import React, { useState } from 'react';
import { ChefHat, Pencil, Plus, Trash2, Beaker } from 'lucide-react';
import {
  AppState,
  Ingredient,
  Preparation,
  Recipe,
  RecipeIngredient,
  RecipePreparation,
} from '../types';
import { getPreparationCost, getRecipeCost } from '../utils/costs';

interface RecipesPageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

type PreparationFormState = {
  name: string;
  yieldQuantity: string;
  ingredients: RecipeIngredient[];
};

type RecipeFormState = {
  name: string;
  flavor: string;
  salePrice: string;
  ingredients: RecipeIngredient[];
  preparations: RecipePreparation[];
  packaging: RecipeIngredient[];
};

type MeasureOption = {
  id: string;
  label: string;
  toBaseUnit: number;
};

const EMPTY_PREPARATION: PreparationFormState = {
  name: '',
  yieldQuantity: '12',
  ingredients: [],
};

const EMPTY_RECIPE: RecipeFormState = {
  name: '',
  flavor: '',
  salePrice: '',
  ingredients: [],
  preparations: [],
  packaging: [],
};

function getMeasureOptions(unit: Ingredient['unit']): MeasureOption[] {
  switch (unit) {
    case 'L':
      return [
        { id: 'L', label: 'L', toBaseUnit: 1 },
        { id: 'ml', label: 'ml', toBaseUnit: 0.001 },
        { id: 'cup_200ml', label: 'xicara (200 ml)', toBaseUnit: 0.2 },
        { id: 'half_cup_100ml', label: 'meia xicara (100 ml)', toBaseUnit: 0.1 },
        { id: 'tbsp_15ml', label: 'colher de sopa (15 ml)', toBaseUnit: 0.015 },
        { id: 'tsp_5ml', label: 'colher de cha (5 ml)', toBaseUnit: 0.005 },
      ];
    case 'ml':
      return [
        { id: 'ml', label: 'ml', toBaseUnit: 1 },
        { id: 'L', label: 'L', toBaseUnit: 1000 },
        { id: 'cup_200ml', label: 'xicara (200 ml)', toBaseUnit: 200 },
        { id: 'half_cup_100ml', label: 'meia xicara (100 ml)', toBaseUnit: 100 },
        { id: 'tbsp_15ml', label: 'colher de sopa (15 ml)', toBaseUnit: 15 },
        { id: 'tsp_5ml', label: 'colher de cha (5 ml)', toBaseUnit: 5 },
      ];
    case 'kg':
      return [
        { id: 'kg', label: 'kg', toBaseUnit: 1 },
        { id: 'g', label: 'g', toBaseUnit: 0.001 },
      ];
    case 'g':
      return [
        { id: 'g', label: 'g', toBaseUnit: 1 },
        { id: 'kg', label: 'kg', toBaseUnit: 1000 },
      ];
    case 'un':
      return [{ id: 'un', label: 'un', toBaseUnit: 1 }];
    case 'pct':
      return [{ id: 'pct', label: 'pct', toBaseUnit: 1 }];
    default:
      return [{ id: unit, label: unit, toBaseUnit: 1 }];
  }
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const RecipesPage: React.FC<RecipesPageProps> = ({ state, setState }) => {
  const [pageTab, setPageTab] = useState<'recipes' | 'preparations'>('recipes');
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [showPreparationForm, setShowPreparationForm] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [editingPreparationId, setEditingPreparationId] = useState<string | null>(null);
  const [recipeForm, setRecipeForm] = useState<RecipeFormState>(EMPTY_RECIPE);
  const [preparationForm, setPreparationForm] = useState<PreparationFormState>(EMPTY_PREPARATION);
  const [tempIng, setTempIng] = useState({ ingredientId: '', quantity: '', measureUnit: '', displayMeasure: '' });
  const [tempPackaging, setTempPackaging] = useState({ ingredientId: '', quantity: '1', measureUnit: '', displayMeasure: '' });
  const [tempPreparationIngredient, setTempPreparationIngredient] = useState({
    ingredientId: '',
    quantity: '',
    measureUnit: '',
    displayMeasure: '',
  });
  const [tempPreparationUse, setTempPreparationUse] = useState({ preparationId: '', quantity: '1', displayMeasure: '' });
  const [activeRecipeTab, setActiveRecipeTab] = useState<'ingredients' | 'preparations' | 'packaging'>('ingredients');

  const ingredientsList = state.ingredients.filter(item => item.category === 'ingredient');
  const packagingList = state.ingredients.filter(item => item.category === 'packaging');
  const selectedTempIngredient = state.ingredients.find(item => item.id === tempIng.ingredientId);
  const selectedTempPackaging = state.ingredients.find(item => item.id === tempPackaging.ingredientId);
  const selectedPreparationIngredient = state.ingredients.find(item => item.id === tempPreparationIngredient.ingredientId);
  const ingredientMeasureOptions = selectedTempIngredient ? getMeasureOptions(selectedTempIngredient.unit) : [];
  const packagingMeasureOptions = selectedTempPackaging ? getMeasureOptions(selectedTempPackaging.unit) : [];
  const preparationMeasureOptions = selectedPreparationIngredient ? getMeasureOptions(selectedPreparationIngredient.unit) : [];

  const resetRecipeForm = () => {
    setRecipeForm(EMPTY_RECIPE);
    setEditingRecipeId(null);
    setShowRecipeForm(false);
    setTempIng({ ingredientId: '', quantity: '', measureUnit: '', displayMeasure: '' });
    setTempPackaging({ ingredientId: '', quantity: '1', measureUnit: '', displayMeasure: '' });
    setTempPreparationUse({ preparationId: '', quantity: '1', displayMeasure: '' });
    setActiveRecipeTab('ingredients');
  };

  const resetPreparationForm = () => {
    setPreparationForm(EMPTY_PREPARATION);
    setEditingPreparationId(null);
    setShowPreparationForm(false);
    setTempPreparationIngredient({ ingredientId: '', quantity: '', measureUnit: '', displayMeasure: '' });
  };

  const calculatePreparationCost = (form: PreparationFormState) =>
    getPreparationCost(
      {
        id: editingPreparationId ?? 'temp',
        name: form.name,
        ingredients: form.ingredients,
        yieldQuantity: parseFloat(form.yieldQuantity) || 0,
        cost: 0,
      },
      state.ingredients
    );

  const calculateRecipeFormCost = (form: RecipeFormState) =>
    getRecipeCost(
      {
        id: editingRecipeId ?? 'temp',
        name: form.name,
        flavor: form.flavor || form.name,
        ingredients: form.ingredients,
        preparations: form.preparations,
        packaging: form.packaging,
        salePrice: parseFloat(form.salePrice) || 0,
        cost: 0,
      },
      state.ingredients,
      state.preparations
    );

  const addMeasuredIngredient = (
    source: { ingredientId: string; quantity: string; measureUnit: string; displayMeasure: string },
    onAdd: (item: RecipeIngredient) => void
  ) => {
    const ingredient = state.ingredients.find(item => item.id === source.ingredientId);

    if (!source.ingredientId || !source.quantity || !ingredient) {
      return;
    }

    const measureOptions = getMeasureOptions(ingredient.unit);
    const selectedMeasure = measureOptions.find(option => option.id === source.measureUnit) ?? measureOptions[0];
    const normalizedQuantity = parseFloat(source.quantity) * selectedMeasure.toBaseUnit;

    onAdd({
      ingredientId: source.ingredientId,
      quantity: normalizedQuantity,
      displayMeasure: source.displayMeasure.trim() || `${source.quantity} ${selectedMeasure.label}`,
    });
  };

  const savePreparation = () => {
    if (!preparationForm.name || !preparationForm.yieldQuantity || preparationForm.ingredients.length === 0) {
      return;
    }

    const preparation: Preparation = {
      id: editingPreparationId ?? crypto.randomUUID(),
      name: preparationForm.name,
      yieldQuantity: parseFloat(preparationForm.yieldQuantity),
      ingredients: preparationForm.ingredients,
      cost: calculatePreparationCost(preparationForm),
    };

    setState(prev => ({
      ...prev,
      preparations: editingPreparationId
        ? prev.preparations.map(item => (item.id === editingPreparationId ? preparation : item))
        : [...prev.preparations, preparation],
    }));

    resetPreparationForm();
  };

  const saveRecipe = () => {
    if (!recipeForm.name || !recipeForm.salePrice) {
      return;
    }

    const recipe: Recipe = {
      id: editingRecipeId ?? crypto.randomUUID(),
      name: recipeForm.name,
      flavor: recipeForm.flavor || recipeForm.name,
      ingredients: recipeForm.ingredients,
      preparations: recipeForm.preparations,
      packaging: recipeForm.packaging,
      salePrice: parseFloat(recipeForm.salePrice),
      cost: calculateRecipeFormCost(recipeForm),
    };

    setState(prev => ({
      ...prev,
      recipes: editingRecipeId
        ? prev.recipes.map(item => (item.id === editingRecipeId ? recipe : item))
        : [...prev.recipes, recipe],
      readyStock: prev.readyStock.map(item =>
        item.recipeId === recipe.id ? { ...item, recipeName: recipe.name } : item
      ),
      sellerStock: prev.sellerStock.map(item =>
        item.recipeId === recipe.id ? { ...item, recipeName: recipe.name } : item
      ),
      sales: prev.sales.map(item =>
        item.recipeId === recipe.id ? { ...item, recipeName: recipe.name } : item
      ),
      reservations: prev.reservations.map(item =>
        item.recipeId === recipe.id ? { ...item, recipeName: recipe.name } : item
      ),
      productions: prev.productions.map(item =>
        item.recipeId === recipe.id ? { ...item, recipeName: recipe.name } : item
      ),
    }));

    resetRecipeForm();
  };

  const startEditingPreparation = (preparation: Preparation) => {
    setEditingPreparationId(preparation.id);
    setPreparationForm({
      name: preparation.name,
      yieldQuantity: preparation.yieldQuantity.toString(),
      ingredients: preparation.ingredients,
    });
    setShowPreparationForm(true);
    setPageTab('preparations');
  };

  const startEditingRecipe = (recipe: Recipe) => {
    setEditingRecipeId(recipe.id);
    setRecipeForm({
      name: recipe.name,
      flavor: recipe.flavor,
      salePrice: recipe.salePrice.toString(),
      ingredients: recipe.ingredients,
      preparations: recipe.preparations || [],
      packaging: recipe.packaging,
    });
    setShowRecipeForm(true);
    setPageTab('recipes');
  };

  const deletePreparation = (id: string) => {
    setState(prev => ({
      ...prev,
      preparations: prev.preparations.filter(item => item.id !== id),
      recipes: prev.recipes.map(item => ({
        ...item,
        preparations: (item.preparations || []).filter(preparation => preparation.preparationId !== id),
      })),
    }));

    if (editingPreparationId === id) {
      resetPreparationForm();
    }
  };

  const deleteRecipe = (id: string) => {
    setState(prev => ({
      ...prev,
      recipes: prev.recipes.filter(item => item.id !== id),
      readyStock: prev.readyStock.filter(item => item.recipeId !== id),
      sellerStock: prev.sellerStock.filter(item => item.recipeId !== id),
      sales: prev.sales.filter(item => item.recipeId !== id),
      reservations: prev.reservations.filter(item => item.recipeId !== id),
      productions: prev.productions.filter(item => item.recipeId !== id),
    }));

    if (editingRecipeId === id) {
      resetRecipeForm();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Sabores & Receitas</h2>
          <p className="text-sm text-slate-500">Cadastre preparos-base e depois monte os sabores finais.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setPageTab('recipes')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${pageTab === 'recipes' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-500'}`}
        >
          Sabores finais
        </button>
        <button
          type="button"
          onClick={() => setPageTab('preparations')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${pageTab === 'preparations' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-500'}`}
        >
          Preparos-base
        </button>
      </div>

      {pageTab === 'preparations' ? (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (showPreparationForm && !editingPreparationId) {
                  resetPreparationForm();
                  return;
                }

                setShowPreparationForm(true);
                setEditingPreparationId(null);
                setPreparationForm(EMPTY_PREPARATION);
              }}
              className="bg-rose-500 text-white p-2 rounded-full shadow-lg hover:bg-rose-600 transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>

          {showPreparationForm && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 space-y-4">
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Exemplo: `Massa branca` ou `Recheio de ninho`. Informe os ingredientes do preparo e quantos bolos de pote esse preparo rende.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nome do preparo</label>
                  <input
                    className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                    placeholder="Ex: Recheio de Ninho"
                    value={preparationForm.name}
                    onChange={e => setPreparationForm({ ...preparationForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Rende quantos bolos?</label>
                  <input
                    type="number"
                    className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                    value={preparationForm.yieldQuantity}
                    onChange={e => setPreparationForm({ ...preparationForm, yieldQuantity: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Ingrediente</label>
                  <select
                    className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                    value={tempPreparationIngredient.ingredientId}
                    onChange={e => {
                      const ingredient = state.ingredients.find(item => item.id === e.target.value);
                      const defaultMeasure = ingredient ? getMeasureOptions(ingredient.unit)[0]?.id ?? '' : '';
                      setTempPreparationIngredient({
                        ...tempPreparationIngredient,
                        ingredientId: e.target.value,
                        measureUnit: defaultMeasure,
                      });
                    }}
                  >
                    <option value="">Selecione...</option>
                    {ingredientsList.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Qtd.</label>
                  <input
                    type="number"
                    className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                    value={tempPreparationIngredient.quantity}
                    onChange={e => setTempPreparationIngredient({ ...tempPreparationIngredient, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Medida</label>
                  <select
                    className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                    value={tempPreparationIngredient.measureUnit}
                    onChange={e => setTempPreparationIngredient({ ...tempPreparationIngredient, measureUnit: e.target.value })}
                    disabled={!selectedPreparationIngredient}
                  >
                    <option value="">Selecione...</option>
                    {preparationMeasureOptions.map(option => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Medida Caseira / Observacao</label>
                  <input
                    className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                    placeholder="Ex: 5 colheres de sopa"
                    value={tempPreparationIngredient.displayMeasure}
                    onChange={e => setTempPreparationIngredient({ ...tempPreparationIngredient, displayMeasure: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  addMeasuredIngredient(tempPreparationIngredient, item => {
                    setPreparationForm(current => ({
                      ...current,
                      ingredients: [...current.ingredients, item],
                    }));
                    setTempPreparationIngredient({ ingredientId: '', quantity: '', measureUnit: '', displayMeasure: '' });
                  })
                }
                className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Adicionar ingrediente ao preparo
              </button>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Custo do preparo: <strong>R$ {formatCurrency(calculatePreparationCost(preparationForm))}</strong>
                {' '}| Custo por bolo: <strong>R$ {formatCurrency((calculatePreparationCost(preparationForm) || 0) / (parseFloat(preparationForm.yieldQuantity) || 1))}</strong>
              </div>

              {preparationForm.ingredients.length > 0 && (
                <div className="space-y-1">
                  {preparationForm.ingredients.map((item, index) => {
                    const ingredient = state.ingredients.find(current => current.id === item.ingredientId);
                    return (
                      <div key={`${item.ingredientId}-${index}`} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-700">
                          {ingredient?.name} - {item.displayMeasure || `${item.quantity} ${ingredient?.unit}`}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setPreparationForm(current => ({
                              ...current,
                              ingredients: current.ingredients.filter((_, itemIndex) => itemIndex !== index),
                            }))
                          }
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={savePreparation}
                  className="flex-1 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium"
                >
                  {editingPreparationId ? 'Salvar preparo' : 'Salvar preparo-base'}
                </button>
                <button
                  type="button"
                  onClick={resetPreparationForm}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {state.preparations.map(preparation => {
              const totalCost = getPreparationCost(preparation, state.ingredients);
              const unitCost = preparation.yieldQuantity > 0 ? totalCost / preparation.yieldQuantity : 0;

              return (
                <div key={preparation.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-xl">
                        <Beaker size={20} className="text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{preparation.name}</h3>
                        <p className="text-xs text-slate-500">Rende {preparation.yieldQuantity} bolos de pote</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => startEditingPreparation(preparation)} className="text-slate-400 hover:text-sky-500 transition-colors">
                        <Pencil size={18} />
                      </button>
                      <button type="button" onClick={() => deletePreparation(preparation.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                    <div>
                      <div className="text-xs text-slate-500">Custo do preparo</div>
                      <div className="font-bold text-slate-700">R$ {formatCurrency(totalCost)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Custo por bolo</div>
                      <div className="font-bold text-amber-600">R$ {formatCurrency(unitCost)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (showRecipeForm && !editingRecipeId) {
                  resetRecipeForm();
                  return;
                }

                setShowRecipeForm(true);
                setEditingRecipeId(null);
                setRecipeForm(EMPTY_RECIPE);
              }}
              className="bg-rose-500 text-white p-2 rounded-full shadow-lg hover:bg-rose-600 transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>

          {showRecipeForm && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 space-y-4">
              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                Fluxo novo: primeiro cadastre `massa`, `recheio de ninho`, `recheio de chocolate` em preparos-base. Depois monte o sabor final usando esses preparos.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Sabor</label>
                  <input
                    className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                    placeholder="Ex: Ninho com Chocolate"
                    value={recipeForm.name}
                    onChange={e => setRecipeForm({ ...recipeForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Descricao / Sabor</label>
                  <input
                    className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                    placeholder="Ex: massa branca com recheio de ninho"
                    value={recipeForm.flavor}
                    onChange={e => setRecipeForm({ ...recipeForm, flavor: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Preço de Venda</label>
                  <input
                    type="number"
                    className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                    value={recipeForm.salePrice}
                    onChange={e => setRecipeForm({ ...recipeForm, salePrice: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Custo Unitário</label>
                  <div className="w-full p-2 rounded-lg bg-slate-100 text-slate-600 font-medium">
                    R$ {formatCurrency(calculateRecipeFormCost(recipeForm))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveRecipeTab('ingredients')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeRecipeTab === 'ingredients' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-500'}`}
                >
                  Ingredientes diretos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRecipeTab('preparations')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeRecipeTab === 'preparations' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-500'}`}
                >
                  Preparos-base
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRecipeTab('packaging')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeRecipeTab === 'packaging' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-500'}`}
                >
                  Embalagens
                </button>
              </div>

              {activeRecipeTab === 'ingredients' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Ingrediente</label>
                      <select
                        className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                        value={tempIng.ingredientId}
                        onChange={e => {
                          const ingredient = state.ingredients.find(item => item.id === e.target.value);
                          const defaultMeasure = ingredient ? getMeasureOptions(ingredient.unit)[0]?.id ?? '' : '';
                          setTempIng({ ...tempIng, ingredientId: e.target.value, measureUnit: defaultMeasure });
                        }}
                      >
                        <option value="">Selecione...</option>
                        {ingredientsList.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Qtd.</label>
                      <input
                        type="number"
                        className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                        value={tempIng.quantity}
                        onChange={e => setTempIng({ ...tempIng, quantity: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Medida da Receita</label>
                      <select
                        className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                        value={tempIng.measureUnit}
                        onChange={e => setTempIng({ ...tempIng, measureUnit: e.target.value })}
                        disabled={!selectedTempIngredient}
                      >
                        <option value="">Selecione...</option>
                        {ingredientMeasureOptions.map(option => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Medida Caseira / Observacao</label>
                      <input
                        className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                        placeholder="Ex: 150 ml ou 5 colheres de sopa"
                        value={tempIng.displayMeasure}
                        onChange={e => setTempIng({ ...tempIng, displayMeasure: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      addMeasuredIngredient(tempIng, item => {
                        setRecipeForm(current => ({ ...current, ingredients: [...current.ingredients, item] }));
                        setTempIng({ ingredientId: '', quantity: '', measureUnit: '', displayMeasure: '' });
                      })
                    }
                    className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Adicionar ingrediente direto
                  </button>

                  {recipeForm.ingredients.length > 0 && (
                    <div className="space-y-1">
                      {recipeForm.ingredients.map((item, index) => {
                        const ingredient = state.ingredients.find(current => current.id === item.ingredientId);
                        return (
                          <div key={`${item.ingredientId}-${index}`} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-700">
                              {ingredient?.name} - {item.displayMeasure || `${item.quantity} ${ingredient?.unit}`}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setRecipeForm(current => ({
                                  ...current,
                                  ingredients: current.ingredients.filter((_, itemIndex) => itemIndex !== index),
                                }))
                              }
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {activeRecipeTab === 'preparations' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Preparo-base</label>
                      <select
                        className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                        value={tempPreparationUse.preparationId}
                        onChange={e => setTempPreparationUse({ ...tempPreparationUse, preparationId: e.target.value })}
                      >
                        <option value="">Selecione...</option>
                        {state.preparations.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Porções usadas</label>
                      <input
                        type="number"
                        className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                        value={tempPreparationUse.quantity}
                        onChange={e => setTempPreparationUse({ ...tempPreparationUse, quantity: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Observacao</label>
                      <input
                        className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                        placeholder="Ex: 1 porcao de massa + 1 porcao de recheio"
                        value={tempPreparationUse.displayMeasure}
                        onChange={e => setTempPreparationUse({ ...tempPreparationUse, displayMeasure: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!tempPreparationUse.preparationId || !tempPreparationUse.quantity) {
                        return;
                      }

                      setRecipeForm(current => ({
                        ...current,
                        preparations: [
                          ...current.preparations,
                          {
                            preparationId: tempPreparationUse.preparationId,
                            quantity: parseFloat(tempPreparationUse.quantity),
                            displayMeasure: tempPreparationUse.displayMeasure.trim() || `${tempPreparationUse.quantity} porcao`,
                          },
                        ],
                      }));
                      setTempPreparationUse({ preparationId: '', quantity: '1', displayMeasure: '' });
                    }}
                    className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Adicionar preparo-base
                  </button>

                  <p className="text-xs text-slate-500">
                    Exemplo: para um sabor pronto, voce pode usar `1 porcao de massa` + `1 porcao de recheio de ninho`.
                  </p>

                  {recipeForm.preparations.length > 0 && (
                    <div className="space-y-1">
                      {recipeForm.preparations.map((item, index) => {
                        const preparation = state.preparations.find(current => current.id === item.preparationId);
                        return (
                          <div key={`${item.preparationId}-${index}`} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-700">
                              {preparation?.name} - {item.displayMeasure || `${item.quantity} porcao`}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setRecipeForm(current => ({
                                  ...current,
                                  preparations: current.preparations.filter((_, itemIndex) => itemIndex !== index),
                                }))
                              }
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {activeRecipeTab === 'packaging' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Embalagem</label>
                      <select
                        className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                        value={tempPackaging.ingredientId}
                        onChange={e => {
                          const ingredient = state.ingredients.find(item => item.id === e.target.value);
                          const defaultMeasure = ingredient ? getMeasureOptions(ingredient.unit)[0]?.id ?? '' : '';
                          setTempPackaging({ ...tempPackaging, ingredientId: e.target.value, measureUnit: defaultMeasure });
                        }}
                      >
                        <option value="">Selecione...</option>
                        {packagingList.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Qtd.</label>
                      <input
                        type="number"
                        className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                        value={tempPackaging.quantity}
                        onChange={e => setTempPackaging({ ...tempPackaging, quantity: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Medida</label>
                      <select
                        className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                        value={tempPackaging.measureUnit}
                        onChange={e => setTempPackaging({ ...tempPackaging, measureUnit: e.target.value })}
                        disabled={!selectedTempPackaging}
                      >
                        <option value="">Selecione...</option>
                        {packagingMeasureOptions.map(option => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Observacao</label>
                      <input
                        className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                        placeholder="Ex: 1 pote + 1 colher"
                        value={tempPackaging.displayMeasure}
                        onChange={e => setTempPackaging({ ...tempPackaging, displayMeasure: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      addMeasuredIngredient(tempPackaging, item => {
                        setRecipeForm(current => ({ ...current, packaging: [...current.packaging, item] }));
                        setTempPackaging({ ingredientId: '', quantity: '1', measureUnit: '', displayMeasure: '' });
                      })
                    }
                    className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Adicionar embalagem
                  </button>

                  {recipeForm.packaging.length > 0 && (
                    <div className="space-y-1">
                      {recipeForm.packaging.map((item, index) => {
                        const ingredient = state.ingredients.find(current => current.id === item.ingredientId);
                        return (
                          <div key={`${item.ingredientId}-${index}`} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-700">
                              {ingredient?.name} - {item.displayMeasure || `${item.quantity} ${ingredient?.unit}`}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setRecipeForm(current => ({
                                  ...current,
                                  packaging: current.packaging.filter((_, itemIndex) => itemIndex !== index),
                                }))
                              }
                              className="text-rose-500 hover:text-rose-700"
                            >
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
                  {editingRecipeId ? 'Salvar Edicao' : 'Salvar Receita'}
                </button>
                <button
                  type="button"
                  onClick={resetRecipeForm}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {state.recipes.map(recipe => {
              const cost = getRecipeCost(recipe, state.ingredients, state.preparations);
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
                      <button type="button" onClick={() => startEditingRecipe(recipe)} className="text-slate-400 hover:text-sky-500 transition-colors">
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
                      <div className="font-bold text-rose-600">R$ {formatCurrency(profit)}</div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-500">
                    Margem estimada: {margin.toFixed(1)}%
                    {(recipe.preparations || []).length > 0 && (
                      <span> | Preparos usados: {(recipe.preparations || []).length}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
