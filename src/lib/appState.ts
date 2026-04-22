import { AppState, Ingredient } from '../types';

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export const INITIAL_STATE: AppState = {
  ingredients: [],
  recipes: [],
  sales: [],
  reservations: [],
  productions: [],
  readyStock: [],
  monthlyGoal: { value: 5000, month: getCurrentMonth() },
};

function normalizeIngredient(item: Ingredient): Ingredient {
  return {
    ...item,
    yieldQuantity: item.yieldQuantity ?? undefined,
  };
}

export function normalizeAppState(value: unknown): AppState {
  const raw = (value && typeof value === 'object' ? value : {}) as Partial<AppState>;

  return {
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients.map(item => normalizeIngredient(item as Ingredient)) : [],
    recipes: Array.isArray(raw.recipes) ? raw.recipes : [],
    sales: Array.isArray(raw.sales) ? raw.sales : [],
    reservations: Array.isArray(raw.reservations) ? raw.reservations : [],
    productions: Array.isArray(raw.productions) ? raw.productions : [],
    readyStock: Array.isArray(raw.readyStock) ? raw.readyStock : [],
    monthlyGoal: raw.monthlyGoal && typeof raw.monthlyGoal === 'object'
      ? {
          value: typeof raw.monthlyGoal.value === 'number' ? raw.monthlyGoal.value : INITIAL_STATE.monthlyGoal.value,
          month: typeof raw.monthlyGoal.month === 'string' ? raw.monthlyGoal.month : getCurrentMonth(),
        }
      : INITIAL_STATE.monthlyGoal,
  };
}
