export enum PaymentType {
  FULL = 'Full',
  SPLIT = 'Split'
}

export type PaymentMethod = 'Cash' | 'Fonepay' | 'eSewa' | 'Bank Transfer';

export interface PaymentDetails {
  type: PaymentType;
  totalAmount: number;
  depositAmount?: number;
  depositPaid: boolean;
  remainingPaid: boolean;
  method?: PaymentMethod;
}

export interface Expense {
  id: string;
  title: string;
  category: 'Rent' | 'Salary' | 'Maintenance' | 'Supplies' | 'Utilities' | 'Other';
  amount: number;
  date: string;
  notes: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Supplement' | 'Merchandise' | 'Beverage' | 'Other';
  quantity: number;
  price: number;
  purchasePrice: number;
}

export interface InventorySale {
  id: string;
  itemId: string;
  quantity: number;
  totalAmount: number;
  date: string;
  method: PaymentMethod;
}

export interface Subscription {
  id: string;
  planName: string; // e.g. "1 Month", "3 Months", "1 Year"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  payment: PaymentDetails;
  notes: string;
  createdAt: number;
  isActive: boolean;
}

export interface Member {
  id: string;
  memberNumber: string; // Unique identifier for gym access (app-assigned)
  name: string;
  gender: string;
  phone: string;
  email: string;
  dob: string; // YYYY-MM-DD
  address: string;
  joinedDate: string; // YYYY-MM-DD
  emergencyContact: string; // Contact 1
  emergencyContact2: string; // Contact 2
  bloodGroup: string;
  accessLevel: string; // 'Gym', 'Gym + Cardio', 'Gym + Cardio + PT'
  notes: string;
  subscriptions: Subscription[];
  profilePicture?: string; // 1080x1080 compressed JPEG (base64)
  thumbnail?: string; // 128x128 compressed JPEG (base64)
  isDeleted?: boolean;
  createdAt: number;
}
