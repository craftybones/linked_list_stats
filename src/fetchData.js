const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGO_URL;
const client = new MongoClient(uri, { useNewUrlParser: true });

client.connect(err => {
  if (err) throw err;

  const collection = client
    .db(process.env.DB_NAME)
    .collection(process.env.COLLECTION_NAME);

  collection.find({}).toArray((err, result) => {
    if (err) throw err;
    fs.writeFileSync('./raw_data.json', JSON.stringify(result), 'utf8');
    client.close();
  });
});
