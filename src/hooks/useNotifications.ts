import { useEffect } from 'react';
import { messaging, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const VAPID_KEY = (import.meta as any).env?.VITE_FCM_VAPID_KEY;

export function useNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !messaging || !VAPID_KEY) return;

    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, { vapidKey: VAPID_KEY });
          if (token) {
            // Save token to user profile
            const userRef = doc(db, 'users', user.uid);
            try {
              await updateDoc(userRef, {
                fcmTokens: arrayUnion(token),
                lastTokenUpdate: new Date().toISOString()
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
            }
          }
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    };

    requestPermission();

    const unsub = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      const notification = new Notification(payload.notification?.title || 'New Notification', {
        body: payload.notification?.body,
        data: payload.data,
        icon: '/logo.png'
      });

      notification.onclick = (event) => {
        event.preventDefault();
        const link = payload.data?.link;
        if (link) {
          window.focus();
          // Use react-router navigate if possible, or just location
          window.location.href = link;
        }
        notification.close();
      };
    });

    return () => unsub();
  }, [user]);
}

export async function sendNotificationToUser(userId: string, title: string, body: string, data?: any) {
  try {
    const q = query(collection(db, 'users'), where('uid', '==', userId));
    let userDoc;
    try {
      userDoc = await getDocs(q);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
      return;
    }

    if (userDoc.empty) return;
    
    const userData = userDoc.docs[0].data();
    const tokens = userData.fcmTokens || [];

    if (tokens.length === 0) return;

    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens, title, body, data })
    });
  } catch (error) {
    console.error('Error sending notification to user:', error);
  }
}

export async function notifyProvidersInArea(category: string, title: string, body: string, data?: any) {
  try {
    // Filter providers who have the category in their skills
    const q = query(
      collection(db, 'users'), 
      where('role', '==', 'provider'),
      where('skills', 'array-contains', category)
    );
    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
      return;
    }

    const allTokens: string[] = [];
    querySnapshot.forEach((doc) => {
      const tokens = doc.data().fcmTokens || [];
      allTokens.push(...tokens);
    });

    if (allTokens.length === 0) {
      console.log('No providers found with category:', category);
      // Fallback: Notify all online providers if no one matches specifically (optional)
      // For now, just rely on skill matching as it's cleaner.
    }

    if (allTokens.length === 0) return;

    const chunks = [];
    for (let i = 0; i < allTokens.length; i += 500) {
      chunks.push(allTokens.slice(i, i + 500));
    }

    for (const chunk of chunks) {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tokens: chunk, 
          title, 
          body, 
          data: {
            ...data,
            link: data?.bookingId ? `/booking/${data.bookingId}` : '/'
          }
        })
      });
    }
  } catch (error) {
    console.error('Error matching providers:', error);
  }
}

export async function notifyAdmin(title: string, body: string, data?: any) {
  try {
    const adminEmail = 'manikanta10516@gmail.com';
    const q = query(collection(db, 'users'), where('email', '==', adminEmail));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return;
    
    const adminTokens: string[] = [];
    querySnapshot.forEach((doc) => {
      const tokens = doc.data().fcmTokens || [];
      adminTokens.push(...tokens);
    });

    if (adminTokens.length === 0) return;

    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens: adminTokens, title, body, data })
    });
  } catch (error) {
    console.error('Error notifying admin:', error);
  }
}
