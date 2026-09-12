export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  itemCount: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string; // 'electronics' | 'fashion' | 'home-lifestyle'
  categoryName: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  image: string;
  galleryImages: string[];
  description: string;
  stock: number;
  specifications: Record<string, string>;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  discountTag?: string;
  tags?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface SavedAddress {
  id: string;
  _id?: string;
  isPrimary: boolean;
  label: string; // "Primary Address", "Address 2", "Address 3"
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  _id?: string;
  date: string;
  createdAt?: string;
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    username?: string;
  };
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  totalAmount: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'cod';
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentMethodDetails?: {
    method?: string;
    vpa?: string;
    bank?: string;
    wallet?: string;
    cardLast4?: string;
    cardNetwork?: string;
    cardType?: string;
    amountPaid?: number;
    currency?: string;
    email?: string;
    contact?: string;
    rrn?: string;
    capturedAt?: Date | string;
  };
  paymentDate?: string;
  paymentTime?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  estimatedDelivery: string;
}

export interface User {
  id: string;
  name: string;
  username?: string;
  gender?: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  avatarUrl?: string;
  role?: 'customer' | 'user' | 'admin';
}
