import { AppState, ReadyStock, SellerName, SellerStock } from '../types';

export function getAvailableReadyStock(state: AppState): ReadyStock[] {
  const reservedByRecipe = new Map<string, number>();

  state.reservations.forEach(item => {
    reservedByRecipe.set(
      item.recipeId,
      (reservedByRecipe.get(item.recipeId) || 0) + item.quantity
    );
  });

  return state.readyStock
    .map(item => ({
      ...item,
      quantity: Math.max(0, item.quantity - (reservedByRecipe.get(item.recipeId) || 0)),
    }))
    .filter(item => item.quantity > 0);
}

export function getAvailableReadyStockItem(state: AppState, recipeId: string) {
  return getAvailableReadyStock(state).find(item => item.recipeId === recipeId);
}

export function getAvailableSellerStock(state: AppState, seller: SellerName): SellerStock[] {
  const reservedByRecipe = new Map<string, number>();

  state.reservations
    .filter(item => item.seller === seller)
    .forEach(item => {
      reservedByRecipe.set(
        item.recipeId,
        (reservedByRecipe.get(item.recipeId) || 0) + item.quantity
      );
    });

  return state.sellerStock
    .filter(item => item.seller === seller)
    .map(item => ({
      ...item,
      quantity: Math.max(0, item.quantity - (reservedByRecipe.get(item.recipeId) || 0)),
    }))
    .filter(item => item.quantity > 0);
}

export function getAvailableSellerStockItem(state: AppState, seller: SellerName, recipeId: string) {
  return getAvailableSellerStock(state, seller).find(item => item.recipeId === recipeId);
}
