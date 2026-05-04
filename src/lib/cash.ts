import { CashMovement, CashMovementCategory, Sale } from '../types';

export const CASH_CATEGORY_LABELS: Record<CashMovementCategory, string> = {
  sale: 'Venda',
  market: 'Supermercado',
  ingredient: 'Ingrediente',
  packaging: 'Embalagem',
  withdrawal: 'Retirada',
  transport: 'Transporte',
  other: 'Outro',
};

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

export function getCashMovementSignedAmount(movement: CashMovement) {
  return movement.type === 'income' ? movement.amount : -movement.amount;
}

export function getCashBalance(movements: CashMovement[]) {
  return movements.reduce((sum, movement) => sum + getCashMovementSignedAmount(movement), 0);
}

export function getCashTotalByType(movements: CashMovement[], type: CashMovement['type']) {
  return movements
    .filter(movement => movement.type === type)
    .reduce((sum, movement) => sum + movement.amount, 0);
}

export function getCashTotalByCategory(movements: CashMovement[], category: CashMovementCategory) {
  return movements
    .filter(movement => movement.category === category)
    .reduce((sum, movement) => sum + movement.amount, 0);
}

export function getCashMovementsForMonth(movements: CashMovement[], month: string) {
  return movements.filter(movement => getMonthKey(movement.date) === month);
}

export function createSaleCashMovement(sale: Sale): CashMovement {
  return {
    id: crypto.randomUUID(),
    type: 'income',
    category: 'sale',
    description: `Venda - ${sale.recipeName} (${sale.quantity}x com ${sale.seller})`,
    amount: sale.price * sale.quantity,
    date: sale.date,
    sourceType: 'sale',
    sourceId: sale.id,
  };
}
