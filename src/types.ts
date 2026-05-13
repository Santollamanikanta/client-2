import { User } from 'firebase/auth';

export type UserRole = 'homeowner' | 'provider';

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

export type BookingStatus = 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  customerId: string;
  providerId?: string;
  serviceId: string;
  status: BookingStatus;
  scheduledAt: string;
  location: { lat: number; lng: number; address?: string };
  totalPrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  text: string;
  createdAt: string;
}
