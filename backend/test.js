const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require("./firebase-admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Use the named Firestore database: "default"
const db = getFirestore(admin.app(), "default");

(async () => {
  try {
    await db.collection("answers").doc("ping").set({ ok: true });
    console.log("✅ Firestore connection OK to database: default");
  } catch (e) {
    console.error("❌ Firestore connection failed:", e);
  }
})();
