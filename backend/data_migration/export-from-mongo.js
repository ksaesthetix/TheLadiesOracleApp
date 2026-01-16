
const { MongoClient } = require('mongodb');
const fs = require('fs');

const uri = "mongodb+srv://Admin_theladiesoracle:MQA64yYiSn8PCpTT@theladiesoracle.yfjgelf.mongodb.net/TheLadiesOracle?retryWrites=true&w=majority&appName=TheLadiesOracle";
const client = new MongoClient(uri);

async function exportCollection(collectionName) {
  try {
    await client.connect();
    const database = client.db('TheLadiesOracle');
    const collection = database.collection(collectionName);
    const data = await collection.find({}).toArray();
    fs.writeFileSync(`${collectionName}.json`, JSON.stringify(data, null, 2));
    console.log(`Successfully exported ${data.length} documents from ${collectionName}`);
  } finally {
    await client.close();
  }
}

async function exportAll() {
    await exportCollection('answers');
    await exportCollection('questions');
    await exportCollection('icons');
    await exportCollection('quotes');
    await exportCollection('users');
    await exportCollection('question_answer_icon_mapping')
    console.log('All collections exported.');
    process.exit(0);
}

exportAll();
