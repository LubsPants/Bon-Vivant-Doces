import { AppState, Ingredient, ReadyStock, SellerStock } from '../types';
import { getSellerPrice } from './sales';

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export const INITIAL_STATE: AppState = {
  ingredients: [],
  preparations: [],
  recipes: [],
  sales: [],
  reservations: [],
  productions: [],
  readyStock: [],
  sellerStock: [],
  monthlyGoal: { value: 5000, month: getCurrentMonth() },
};

function normalizeIngredient(item: Ingredient): Ingredient {
  return {
    ...item,
    yieldQuantity: item.yieldQuantity ?? undefined,
  };
}

function normalizeRecipe(raw: AppState['recipes'][number]): AppState['recipes'][number] {
  return {
    ...raw,
    preparations: Array.isArray(raw.preparations) ? raw.preparations : [],
  };
}

function reconcileStocks(state: AppState) {
  const readyStockMap = new Map<string, ReadyStock>();
  const sellerStockMap = new Map<string, SellerStock>();

  state.productions.forEach(item => {
    const currentReady = readyStockMap.get(item.recipeId);
    readyStockMap.set(item.recipeId, {
      recipeId: item.recipeId,
      recipeName: item.recipeName,
      quantity: (currentReady?.quantity || 0) + item.quantity,
    });

    if (item.luizaQuantity > 0) {
      const key = `${item.recipeId}:Luiza`;
      const currentSeller = sellerStockMap.get(key);
      sellerStockMap.set(key, {
        recipeId: item.recipeId,
        recipeName: item.recipeName,
        seller: 'Luiza',
        quantity: (currentSeller?.quantity || 0) + item.luizaQuantity,
      });
    }

    if (item.priscilaQuantity > 0) {
      const key = `${item.recipeId}:Priscila`;
      const currentSeller = sellerStockMap.get(key);
      sellerStockMap.set(key, {
        recipeId: item.recipeId,
        recipeName: item.recipeName,
        seller: 'Priscila',
        quantity: (currentSeller?.quantity || 0) + item.priscilaQuantity,
      });
    }
  });

  state.sales.forEach(item => {
    const currentReady = readyStockMap.get(item.recipeId);
    if (currentReady) {
      readyStockMap.set(item.recipeId, {
        ...currentReady,
        quantity: Math.max(0, currentReady.quantity - item.quantity),
      });
    }

    const sellerKey = `${item.recipeId}:${item.seller}`;
    const currentSeller = sellerStockMap.get(sellerKey);
    if (currentSeller) {
      sellerStockMap.set(sellerKey, {
        ...currentSeller,
        quantity: Math.max(0, currentSeller.quantity - item.quantity),
      });
    }
  });

  return {
    readyStock: Array.from(readyStockMap.values()).filter(item => item.quantity > 0),
    sellerStock: Array.from(sellerStockMap.values()).filter(item => item.quantity > 0),
  };
}

export function reconcileAppState(state: AppState): AppState {
  const { readyStock, sellerStock } = reconcileStocks(state);

  return {
    ...state,
    sales: state.sales.map(item => ({
      ...item,
      price: getSellerPrice(item.seller),
    })),
    reservations: state.reservations.map(item => ({
      ...item,
      price: getSellerPrice(item.seller),
    })),
    readyStock,
    sellerStock,
  };
}

export function normalizeAppState(value: unknown): AppState {
  const raw = (value && typeof value === 'object' ? value : {}) as Partial<AppState>;

  return reconcileAppState({
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients.map(item => normalizeIngredient(item as Ingredient)) : [],
    preparations: Array.isArray(raw.preparations) ? raw.preparations : [],
    recipes: Array.isArray(raw.recipes) ? raw.recipes.map(item => normalizeRecipe(item as AppState['recipes'][number])) : [],
    sales: Array.isArray(raw.sales) ? raw.sales : [],
    reservations: Array.isArray(raw.reservations) ? raw.reservations : [],
    productions: Array.isArray(raw.productions) ? raw.productions : [],
    readyStock: Array.isArray(raw.readyStock) ? raw.readyStock : [],
    sellerStock: Array.isArray(raw.sellerStock) ? raw.sellerStock : [],
    monthlyGoal: raw.monthlyGoal && typeof raw.monthlyGoal === 'object'
      ? {
          value: typeof raw.monthlyGoal.value === 'number' ? raw.monthlyGoal.value : INITIAL_STATE.monthlyGoal.value,
          month: typeof raw.monthlyGoal.month === 'string' ? raw.monthlyGoal.month : getCurrentMonth(),
        }
      : INITIAL_STATE.monthlyGoal,
  });
}
