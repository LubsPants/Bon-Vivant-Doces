import { Ingredient, RecipeIngredient } from '../types';

export function getIngredientCost(ingredient: Ingredient, quantity: number) {
  const costBase =
    ingredient.yieldQuantity && ingredient.yieldQuantity > 0
      ? ingredient.yieldQuantity
      : ingredient.purchaseQuantity;

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
