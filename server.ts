import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Admin accounts
const ADMIN_EMAILS = [
  "manikanta10516@gmail.com",
  "admin@cleanease.in"
];

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  let db: any;

  // Initialize Firebase Admin
  try {
    const envProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const envDatabaseId = process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;
    
    // Attempt to read from config file if env is missing
    let configContents: any = {};
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        configContents = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } catch (e) {
      console.warn("Could not read firebase-applet-config.json");
    }

    const projectId = envProjectId || configContents.projectId || process.env.GOOGLE_CLOUD_PROJECT;
    const configDatabaseId = configContents.firestoreDatabaseId || "ai-studio-70fd6d7d-d835-4637-9307-b8e78af7df5a";
    const databaseId = (envDatabaseId || configDatabaseId || "(default)").trim();
    
    console.log("Firebase Discovery Details:", { 
      projectId, 
      databaseId, 
      envProjectId, 
      envDatabaseId, 
      gcpProject: process.env.GOOGLE_CLOUD_PROJECT 
    });

    if (admin.apps.length === 0) {
      if (projectId) {
        admin.initializeApp({ projectId });
        console.log(`Firebase Admin initialized with Project ID: ${projectId}`);
      } else {
        admin.initializeApp();
        console.log("Firebase Admin initialized with default application credentials.");
      }
    }
    
    const firebaseApp = admin.app();

    const tryInitDb = async (dbId: string | undefined) => {
      let testDb: any;
      if (dbId && dbId !== "(default)" && dbId !== "default") {
        testDb = getFirestore(firebaseApp, dbId);
        console.log(`Checking named database: ${dbId}`);
      } else {
        testDb = getFirestore(firebaseApp);
        console.log("Checking (default) database");
      }

      try {
        // Probe with a timeout
        const probePromise = testDb.collection('profiles').limit(1).get();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Firestore probe timeout")), 5000)
        );
        await Promise.race([probePromise, timeoutPromise]);
        console.log(`Firestore database [${dbId || '(default)'}] is accessible.`);
        return testDb;
      } catch (e: any) {
        console.warn(`Database [${dbId || '(default)'}] check failed:`, e.message);
        return null;
      }
    };

    console.log(`Attempting to initialize Firestore with primary database ID: ${databaseId}`);
    db = await tryInitDb(databaseId);
    
    if (!db && databaseId !== "(default)" && databaseId !== "default") {
      console.warn("Primary database initialization failed. Falling back to (default) database retry...");
      db = await tryInitDb("(default)");
    }

    if (!db) {
      console.error("All explicit database verification probes failed. Using default getFirestore() instance.");
      db = getFirestore(admin.app());
    } else {
      console.log("Firestore successfully initialized and verified.");
    }

  } catch (err) {
    console.error("FATAL Firebase Admin initialization error:", err);
  }

  let isUsingFallback = false;

  // Helper to run firestore operations
  const withDb = async (operation: (database: any) => Promise<any>) => {
    return await operation(db);
  };

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Razorpay Initialization
  let razorpay: Razorpay | null = null;
  try {
    const keyId = process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keyId && keySecret) {
      razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      console.log("Razorpay initialized successfully");
    } else {
      console.warn("Razorpay keys missing from environment.");
    }
  } catch (err) {
    console.error("Error initializing Razorpay:", err);
  }

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: Create Razorpay Order
  app.post("/api/payment/create-order", async (req, res) => {
    if (!razorpay) {
      return res.status(503).json({ error: "Payment gateway not configured" });
    }
    const { amount, currency = "INR", receipt } = req.body;
    try {
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency,
        receipt,
      });
      res.json({ success: true, orderId: order.id, amount: order.amount });
    } catch (err) {
      console.error("Razorpay order creation error:", err);
      res.status(500).json({ error: "Failed to create payment order" });
    }
  });

  app.post("/api/payment/verify", async (req, res) => {
    res.json({ success: true });
  });

  // Notifications API (Real implementation with Firestore)
  app.post("/api/notify-user", async (req, res) => {
    const { userId, title, body, data } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      await withDb(async (currentDb) => {
        await currentDb.collection('notifications').add({
          userId,
          title,
          body,
          data: data || {},
          read: false,
          type: 'info',
          createdAt: new Date().toISOString()
        });
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Error sending notification:", err);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  app.post("/api/notify-providers", async (req, res) => {
    const { category, title, body, data } = req.body;
    try {
      await withDb(async (currentDb) => {
        const snapshot = await currentDb.collection('profiles')
          .where('role', '==', 'provider')
          .where('isOnline', '==', true)
          .get();
        
        const batch = currentDb.batch();
        snapshot.forEach((doc: any) => {
          const profile = doc.data();
          if (!category || (profile.skills && profile.skills.includes(category))) {
            const notifRef = currentDb.collection('notifications').doc();
            batch.set(notifRef, {
              userId: doc.id,
              title,
              body,
              data: data || {},
              read: false,
              type: 'alert',
              createdAt: new Date().toISOString()
            });
          }
        });
        await batch.commit();
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Error notifying providers:", err);
      res.status(500).json({ error: "Failed to notify providers" });
    }
  });

  app.post("/api/notify-admin", async (req, res) => {
    const { title, body, data } = req.body;
    console.log("Notify Admin requested:", { title, body });
    
    try {
      if (!db) {
        throw new Error("Firestore database is not initialized");
      }
      
      let snapshotSize = 0;

      await withDb(async (currentDb) => {
        // Query for admin users safely
        try {
          const snapshot = await currentDb.collection('profiles').get();
          
          const admins = snapshot.docs.filter((doc: any) => {
            const profile = doc.data();
            return profile.role === 'admin' || ADMIN_EMAILS.includes(profile.email);
          });

          console.log(`Found ${admins.length} admin users`);
          snapshotSize = admins.length;
          
          if (admins.length > 0) {
            const batch = currentDb.batch();
            admins.forEach((doc: any) => {
              const notifRef = currentDb.collection('notifications').doc();
              batch.set(notifRef, {
                userId: doc.id,
                title,
                body,
                data: data || {},
                read: false,
                type: 'message',
                createdAt: new Date().toISOString()
              });
            });
            await batch.commit();
            console.log("Batch committed successfully");
          }
        } catch (queryErr) {
          console.error("Error querying profiles for admin notification:", queryErr);
        }
        
        // Always add a systemic log notification even if admin lookup fails
        await currentDb.collection('notifications').add({
          userId: 'SYSTEM',
          title: `[ADMIN NOTIF] ${title}`,
          body,
          data: data || {},
          read: false,
          type: 'alert',
          createdAt: new Date().toISOString()
        });
      });

      res.json({ success: true, count: snapshotSize });
    } catch (err: any) {
      console.error("Detailed error in notify-admin:", {
        message: err.message,
        code: err.code
      });
      res.status(500).json({ 
        error: "Failed to process admin notification", 
        message: err.message
      });
    }
  });

  // AI Chat Bot Integration
  app.post("/api/chat-bot", async (req, res) => {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    console.log("Chat Bot request:", { message, context });

    try {
      if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is missing");
        return res.status(503).json({ error: "AI Assistant is not configured" });
      }

      // Use the generative model properly
      const model = (ai as any).getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `You are CleanEase Support Bot, a friendly and helpful assistant for CleanEase Home Services in Hyderabad.
      Current Booking Context: ${JSON.stringify(context || {})}.
      Instructions:
      - Be professional, empathetic, and polite.
      - Help the user with status updates, service questions, or general help.
      - If the status is 'pending', reassure them that we are assigning the best professional in their area.
      - If the user asks about price, refer to the booking total (current total: ₹${context?.totalPrice || 'N/A'}).
      - Keep responses concise (under 2 sentences).
      
      User Message: ${message}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("Chat Bot response generated successfully");
      res.json({ text });
    } catch (err: any) {
      console.error("Gemini AI error:", err);
      res.status(500).json({ error: "AI Assistant is resting. Please try again later." });
    }
  });

  // Static files/Vite
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on port ${PORT}`);
  });
}

startServer();
