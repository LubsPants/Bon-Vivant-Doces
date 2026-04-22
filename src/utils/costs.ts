import { Ingredient, Preparation, Recipe, RecipeIngredient, RecipePreparation } from '../types';

export function getIngredientCost(ingredient: Ingredient, quantity: number) {
  const costBase = ingredient.purchaseQuantity;

  if (!costBase) {
    return 0;
  }

  return (ingredient.purchasePrice / costBase) * quantity;
}

export function getRecipeItemsCost(items: RecipeIngredient[], ingredients: Ingredient[]) {
  return items.reduce((total, item) => {
    const ingredient = ingredients.find(entry => entry.id === item.ingredientId);

    if (!ingredient) {
      return total;
    }

    return total + getIngredientCost(ingredient, item.quantity);
  }, 0);
}

export function getPreparationCost(preparation: Preparation, ingredients: Ingredient[]) {
  return getRecipeItemsCost(preparation.ingredients, ingredients);
}

export function getPreparationUnitCost(preparation: Preparation, ingredients: Ingredient[]) {
  if (preparation.yieldQuantity <= 0) {
    return 0;
  }

  return getPreparationCost(preparation, ingredients) / preparation.yieldQuantity;
}

export function getPreparationItemsCost(
  items: RecipePreparation[],
  preparations: Preparation[],
  ingredients: Ingredient[]
) {
  return items.reduce((total, item) => {
    const preparation = preparations.find(entry => entry.id === item.preparationId);

    if (!preparation) {
      return total;
    }

    return total + (getPreparationUnitCost(preparation, ingredients) * item.quantity);
  }, 0);
}

function mergeIngredientItems(items: RecipeIngredient[]) {
  const merged = new Map<string, RecipeIngredient>();

  items.forEach(item => {
    const current = merged.get(item.ingredientId);
    merged.set(item.ingredientId, {
      ingredientId: item.ingredientId,
      quantity: (current?.quantity || 0) + item.quantity,
      displayMeasure: current?.displayMeasure ?? item.displayMeasure,
    });
  });

  return Array.from(merged.values());
}

export function getPreparationIngredientConsumption(
  preparation: Preparation,
  quantity: number
) {
  if (preparation.yieldQuantity <= 0 || quantity <= 0) {
    return [];
  }

  return preparation.ingredients.map(item => ({
    ingredientId: item.ingredientId,
    quantity: (item.quantity / preparation.yieldQuantity) * quantity,
  }));
}

export function getRecipeIngredientConsumption(
  recipe: Recipe,
  preparations: Preparation[]
) {
  const expandedPreparationIngredients = (recipe.preparations || []).flatMap(item => {
    const preparation = preparations.find(entry => entry.id === item.preparationId);
    return preparation ? getPreparationIngredientConsumption(preparation, item.quantity) : [];
  });

  return mergeIngredientItems([
    ...recipe.ingredients,
    ...expandedPreparationIngredients,
    ...recipe.packaging,
  ]);
}

export function getRecipeCost(
  recipe: Recipe,
  ingredients: Ingredient[],
  preparations: Preparation[]
) {
  const ingredientsCost = getRecipeItemsCost(recipe.ingredients, ingredients);
  const preparationsCost = getPreparationItemsCost(recipe.preparations || [], preparations, ingredients);
  const packagingCost = getRecipeItemsCost(recipe.packaging, ingredients);

  return ingredientsCost + preparationsCost + packagingCost;
}
