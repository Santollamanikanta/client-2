import express from "express";
import path from "path";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Initialize Firebase Admin
  let firebaseAdminReady = false;
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      if (admin.apps.length === 0) {
        try {
          const cert = JSON.parse(serviceAccount);
          admin.initializeApp({
            credential: admin.credential.cert(cert),
          });
          firebaseAdminReady = true;
          console.log("Firebase Admin initialized successfully");
        } catch (parseErr) {
          console.error("CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT JSON. Make sure it is a valid single-line JSON string.", parseErr);
        }
      } else {
        firebaseAdminReady = true;
      }
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT not found in environment. Notifications will be disabled.");
    }
  } catch (err) {
    console.error("Error during Firebase Admin setup:", err);
  }

  // API Route: Process Payment (Mock)
  app.post("/api/payment/mock", async (req, res) => {
    // This is a direct payment simulation
    const { amount, bookingId } = req.body;
    console.log(`Processing payment for booking ${bookingId} of amount ${amount}`);
    res.json({ success: true, transactionId: `TXN_${Date.now()}` });
  });

  // API Route: Send Notification
  app.post("/api/notify", async (req, res) => {
    if (!firebaseAdminReady) {
      return res.status(503).json({ error: "Notification service not configured" });
    }

    const { tokens, title, body, data } = req.body;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ error: "Missing recipient tokens" });
    }

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: data || {},
      });
      
      console.log(`${response.successCount} messages were sent successfully`);
      res.json({ success: true, successCount: response.successCount });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, server.cjs is executed from the workspace root or inside dist
    // Since we bundle to dist/server.cjs, and start is 'node dist/server.cjs'
    // process.cwd() should be the project root.
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`Serving static files from: ${distPath}`);
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Current working directory: ${process.cwd()}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
  process.exit(1);
});
