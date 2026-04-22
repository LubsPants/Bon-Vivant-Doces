export type SellerName = 'Luiza' | 'Priscila';

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
  displayMeasure?: string;
}

export interface RecipePreparation {
  preparationId: string;
  quantity: number;
  displayMeasure?: string;
}

export interface Preparation {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  yieldQuantity: number;
  cost: number;
}

export interface Recipe {
  id: string;
  name: string;
  flavor: string;
  ingredients: RecipeIngredient[];
  preparations: RecipePreparation[];
  packaging: RecipeIngredient[];
  salePrice: number;
  cost: number;
}

export interface ProductionRecord {
  id: string;
  recipeId: string;
  recipeName: string;
  quantity: number;
  luizaQuantity: number;
  priscilaQuantity: number;
  date: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  recipeId: string;
  recipeName: string;
  seller: SellerName;
  date: string;
  price: number;
  quantity: number;
}

export interface Reservation {
  id: string;
  customerName: string;
  recipeId: string;
  recipeName: string;
  seller: SellerName;
  date: string;
  price: number;
  quantity: number;
}

export interface ReadyStock {
  recipeId: string;
  recipeName: string;
  quantity: number;
}

export interface SellerStock {
  recipeId: string;
  recipeName: string;
  seller: SellerName;
  quantity: number;
}

export interface MonthlyGoal {
  value: number;
  month: string;
}

export interface AppState {
  ingredients: Ingredient[];
  preparations: Preparation[];
  recipes: Recipe[];
  sales: Sale[];
  reservations: Reservation[];
  productions: ProductionRecord[];
  readyStock: ReadyStock[];
  sellerStock: SellerStock[];
  monthlyGoal: MonthlyGoal;
}
