import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    // Push notifications removed with Firebase removal.
    // In a real app, you would integrate a different push service here.
  }, [user]);
}

export async function sendNotificationToUser(userId: string, title: string, body: string, data?: any) {
  try {
    const res = await fetch('/api/notify-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, body, data })
    });
    if (!res.ok) {
      const errorData = await res.json();
      console.error('Notification Server Error:', errorData);
    }
  } catch (error) {
    console.error('Error sending notification to user:', error);
  }
}

export async function notifyProvidersInArea(category: string, title: string, body: string, data?: any) {
  try {
    const res = await fetch('/api/notify-providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, title, body, data })
    });
    if (!res.ok) {
      const errorData = await res.json();
      console.error('Notification Server Error:', errorData);
    }
  } catch (error) {
    console.error('Error notifying providers:', error);
  }
}

export async function notifyAdmin(title: string, body: string, data?: any) {
  try {
    const res = await fetch('/api/notify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, data })
    });
    if (!res.ok) {
      const errorData = await res.json();
      console.error('Notification Server Error:', errorData);
    }
  } catch (error) {
    console.error('Error notifying admin:', error);
  }
}
