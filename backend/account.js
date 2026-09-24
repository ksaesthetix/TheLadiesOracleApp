/**
 * DELETE /account — the person deletes their own account (App Store guideline 5.1.1(v)).
 *
 *   require("./account")(app, db, admin);
 *
 * Authorization: Bearer <Firebase ID token>. Removes, in order:
 *   1. users/{uid} and every subcollection (following, daily, journal, pattern, billing, usage)
 *   2. profiles/{uid}
 *   3. this person from other people's `following` lists (docs written since the accounts batch carry a `uid` field;
 *      needs a collection-group index on `following.uid` — the first run logs the console link if it's missing)
 *   4. the Firebase Auth user
 * Responds { ok: true, removedFromFollowers: n }. Idempotent: running it twice is harmless.
 */
module.exports = function registerAccount(app, db, admin) {
  app.delete("/account", async (req, res) => {
    const match = (req.headers.authorization || "").match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ error: "Log in to delete your account" });
    let uid;
    try {
      uid = (await admin.auth().verifyIdToken(match[1], true)).uid; // checkRevoked: a fresh token, not a stale one
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const t0 = Date.now();
    try {
      await db.recursiveDelete(db.collection("users").doc(uid));
      await db.collection("profiles").doc(uid).delete();

      let removedFromFollowers = 0;
      try {
        const snap = await db.collectionGroup("following").where("uid", "==", uid).get();
        const batch = db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        if (snap.size) await batch.commit();
        removedFromFollowers = snap.size;
      } catch (err) {
        // Most likely the collection-group index doesn't exist yet; the message contains a link to create it.
        console.warn("[account] could not clean following lists:", err.message);
      }

      await admin.auth().deleteUser(uid).catch(err => {
        if (err.code !== "auth/user-not-found") throw err;
      });

      console.log(`[account] deleted ${uid} in ${Date.now() - t0} ms (removed from ${removedFromFollowers} following lists)`);
      res.json({ ok: true, removedFromFollowers });
    } catch (err) {
      console.error("[account] delete failed:", err);
      res.status(500).json({ error: "Could not delete the account. Please try again." });
    }
  });

  console.log("🗑️  DELETE /account ready");
};
