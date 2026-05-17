import { User } from 'firebase/auth';

export type UserRole = 'homeowner' | 'provider' | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  phoneNumber?: string;
  address?: string;
  location?: { lat: number; lng: number };
  rating?: number;
  skills?: string[];
  isOnline?: boolean;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  iconName: string;
}

export type BookingStatus = 'pending-approval' | 'pending' | 'assigned' | 'arriving' | 'at-location' | 'in-progress' | 'completed' | 'cancelled' | 'rejected';

export interface Booking {
  id: string;
  customerId: string;
  providerId?: string;
  serviceId: string;
  serviceName: string;
  category: string;
  status: BookingStatus;
  scheduledAt: string;
  location: { lat: number; lng: number; address?: string };
  providerLocation?: { lat: number; lng: number };
  totalPrice: number;
  paymentMethod: 'online' | 'cash';
  paymentStatus: 'pending' | 'paid';
  notes?: string;
  reviewId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  text: string;
  createdAt: string;
}
