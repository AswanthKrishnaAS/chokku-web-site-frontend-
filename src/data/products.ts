import { Product } from '../types';

// Static products array cleared per user request.
// Dynamic products are managed via ProductContext & database API.
export const PRODUCTS: Product[] = [];
