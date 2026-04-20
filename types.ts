export enum PaymentType {
  FULL = 'Full',
  SPLIT = 'Split'
}

export interface PaymentDetails {
  type: PaymentType;
  totalAmount: number;
  depositAmount?: number;
  depositPaid: boolean;
  remainingPaid: boolean;
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
  memberNumber: string; // Unique identifier for gym access
  name: string;
  phone: string;
  email: string;
  address: string;
  joinedDate: string; // YYYY-MM-DD
  emergencyContact: string;
  bloodGroup: string;
  notes: string;
  subscriptions: Subscription[];
  profilePicture?: string; // 1080x1080 compressed JPEG (base64)
  thumbnail?: string; // 128x128 compressed JPEG (base64)
  isDeleted?: boolean;
  createdAt: number;
}
