import { setDoc, doc, getDocFromServer } from 'firebase/firestore';
import { db, auth } from './firebase';

export async function testConnection() {
  try {
    const testDoc = doc(db, 'system', 'connection-test');
    await getDocFromServer(testDoc);
    console.log("Firebase connection verified");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client is offline. Check configuration or internet.");
    }
    // Note: Permission denied is actually a good sign that we CONNECTED to Firebase
  }
}
