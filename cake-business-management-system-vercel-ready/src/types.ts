export interface Ingredient {
  id: string;
  name: string;
  unit: 'g' | 'ml' | 'un' | 'kg' | 'L' | 'pct';
  purchasePrice: number;
  purchaseQuantity: number;
  currentStock: number;
  minStock: number;
  category: 'ingredient' | 'packaging';
  yieldQuantity?: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  flavor: string;
  ingredients: RecipeIngredient[];
  packaging: RecipeIngredient[];
  salePrice: number;
  cost: number;
}

export interface ProductionRecord {
  id: string;
  recipeId: string;
  recipeName: string;
  quantity: number;
  date: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  recipeId: string;
  recipeName: string;
  seller: 'Luiza' | 'Priscila';
  date: string;
  price: number;
  quantity: number;
}

export interface ReadyStock {
  recipeId: string;
  recipeName: string;
  quantity: number;
}

export interface MonthlyGoal {
  value: number;
  month: string;
}

export interface AppState {
  ingredients: Ingredient[];
  recipes: Recipe[];
  sales: Sale[];
  productions: ProductionRecord[];
  readyStock: ReadyStock[];
  monthlyGoal: MonthlyGoal;
}
