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
        credential: admin.credential.cert(serviceAccount),
        projectId: 'theladiesoracle'
    });
} catch (error) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!! FATAL ERROR: Firebase Admin SDK initialization failed.');
    console.error('!!! This can happen if your service account key is invalid or expired.');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('Underlying error:', error);
    process.exit(1);
}

// 🔥 IMPORTANT: connect to your *named* Firestore database "default"
const db = getFirestore(admin.app(), "default");
db.settings({ ignoreUndefinedProperties: true });

// Function to import data from a JSON file to a Firestore collection
const importData = async (filePath, collectionName) => {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        console.warn(`- WARNING: Source file not found: ${fullPath}. Skipping collection '${collectionName}'.`);
        return;
    }
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

    if (!Array.isArray(data) || data.length === 0) {
        console.log(`- INFO: No documents to import for '${collectionName}'. Skipping.`);
        return;
    }

    const collectionRef = db.collection(collectionName);
    let batch = db.batch();
    let counter = 0;

    for (const item of data) {
      const docId = item._id;
      if (docId) {
          const docRef = collectionRef.doc(docId.toString());
          delete item._id;
          batch.set(docRef, item);
          counter++;

          if (counter % 500 === 0) {
            console.log(`- Committing batch of 500 for '${collectionName}'...`);
            await batch.commit();
            batch = db.batch();
          }
      }
    }

    if (counter > 0 && counter % 500 !== 0) {
        console.log(`- Committing final batch of ${counter % 500} for '${collectionName}'...`);
        await batch.commit();
    }

    console.log(`✔ Successfully imported ${counter} documents into ${collectionName}`);
  } catch (error) {
    console.error(`✘ Error importing data into ${collectionName}:`, error.message);
    if (error.code === 5) { // 'NOT_FOUND' error code
        console.error('--------------------------------------------------------------------');
        console.error('>>> HINT: A "NOT_FOUND" error often means one of two things:');
        console.error('1. The Firestore database has not been created in your Firebase project yet.');
        console.error('   Please go to the Firebase Console, select your project, and click "Create database".');
        console.error('2. The service account key (`firebase-admin-key.json`) does not have permission.');
        console.error('--------------------------------------------------------------------');
    }
  }
};

// Import all collections
const migrate = async () => {
    console.log('--- Starting Data Migration ---');
    await importData('questions.json', 'questions');
    await importData('icons.json', 'icons');
    await importData('quotes.json', 'quotes');
    await importData('answers.json','answers');
    await importData('question_answer_icon_mapping.json', 'question_answer_icon_mapping');
    console.log('--- Data Migration Complete ---');
    process.exit(0);
}

migrate();
