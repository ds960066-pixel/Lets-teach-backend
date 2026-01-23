let admin = null;

try {
  admin = require("firebase-admin");

  // If already initialized, reuse it
  if (!admin.apps.length) {
    const projectId = process.env.FB_PROJECT_ID;
    const clientEmail = process.env.FB_CLIENT_EMAIL;
    const privateKey = process.env.FB_PRIVATE_KEY
      ? process.env.FB_PRIVATE_KEY.replace(/\\n/g, "\n")
      : null;

    // Initialize only when all envs exist
    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
      console.log("✅ Firebase Admin initialized");
    } else {
      console.log("⚠️ Firebase Admin not initialized (missing env vars)");
    }
  }
} catch (e) {
  console.log("⚠️ firebase-admin not installed on this server. OTP disabled.");
}

module.exports = admin;
