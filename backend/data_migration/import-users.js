const admin = require('firebase-admin');
const { getFirestore } = require("firebase-admin/firestore");
const fs = require('fs');
const path = require('path');

// Verify that the service account key file exists
const serviceAccountPath = path.join(__dirname, 'firebase-admin-key.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!! FATAL ERROR: Firebase service account key file not found.');
    console.error(`!!! Make sure 'firebase-admin-key.json' is in the 'backend' directory.`);
    console.error('!!! You can download this file from your Firebase project settings.');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    process.exit(1);
}

// Initialize Firebase Admin SDK
const serviceAccount = require(serviceAccountPath);

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (error) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!! FATAL ERROR: Firebase Admin SDK initialization failed.');
    console.error('!!! This can happen if your service account key is invalid or expired.');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('Underlying error:', error);
    process.exit(1);
}

const auth = admin.auth();

// 🔥 IMPORTANT: use the named Firestore database "default"
const db = getFirestore(admin.app(), "default");
db.settings({ ignoreUndefinedProperties: true });

const importUsers = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, filePath);
     if (!fs.existsSync(fullPath)) {
        console.warn(`- WARNING: Source file not found: ${fullPath}. Skipping user import.`);
        return;
    }
    const users = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

    if (!Array.isArray(users) || users.length === 0) {
        console.log('- INFO: No users to import. Skipping.');
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      const { email, dateOfBirth, location, selectedIcon, name } = user;

      try {
        let userRecord;
        // Check if user already exists
        try {
            userRecord = await auth.getUserByEmail(email);
            console.log(`- User with email ${email} already exists. UID: ${userRecord.uid}. Skipping auth creation.`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log(`- Creating new auth user for: ${email}...`);
                userRecord = await auth.createUser({
                    email: email,
                    password: Math.random().toString(36).slice(-10),
                    displayName: name,
                });
                console.log(`  ✔ Auth user created with UID: ${userRecord.uid}`);
            } else {
                throw error; // Re-throw other auth errors
            }
        }

        // Now create the Firestore document
        const userDocRef = db.collection('users').doc(userRecord.uid);
        await userDocRef.set({
            email,
            name,
            dateOfBirth: dateOfBirth ? admin.firestore.Timestamp.fromDate(new Date(dateOfBirth)) : null,
            location,
            selectedIcon
        });

        console.log(`  ✔ Firestore record created/updated for: ${email}`);
        successCount++;

      } catch (error) {
        console.error(`  ✘ Error migrating user ${email}:`, error.message);
        errorCount++;
      }
    }

    console.log('--------------------------------------------------');
    console.log(`User migration finished.`);
    console.log(`Successfully migrated: ${successCount} users.`);
    console.log(`Failed to migrate: ${errorCount} users.`);
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('✘ FATAL ERROR reading user file or parsing JSON:', error.message);
  }
};

const migrateUsers = async () => {
    console.log('--- Starting User Migration ---');
    await importUsers('users.json');
    console.log('--- User Migration Complete ---');
    process.exit(0);
}

migrateUsers();
