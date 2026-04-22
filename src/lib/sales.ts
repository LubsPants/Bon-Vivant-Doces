import { SellerName } from '../types';

export const SELLER_PRICES: Record<SellerName, number> = {
  Luiza: 10,
  Priscila: 9,
};

export function getSellerPrice(seller: SellerName) {
  return SELLER_PRICES[seller];
}
