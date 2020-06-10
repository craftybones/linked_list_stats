const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGO_URL;
const client = new MongoClient(uri, { useNewUrlParser: true });

client.connect((err) => {
  if (err) throw err;

  const configCollection = client
    .db(process.env.DB_NAME)
    .collection(process.env.CONFIG_COLLECTION);

  configCollection.find({ currentAssignment: true }).toArray((err, result) => {
    if (err || result.length == 0 || !result[0].collection) {
      console.log('unable to get collection name');
      throw err;
    }
    const { collection } = result[0];

    // const collection = process.env.COLLECTION_NAME;
    client
      .db(process.env.DB_NAME)
      .collection(collection)
      .find({})
      .project({ 'tests.sTrace': 0, 'tests.runnerName': 0 })
      .toArray((err, result) => {
        if (err) throw err;
        console.log('here....');
        fs.writeFileSync('./raw_data.json', JSON.stringify(result), 'utf8');
        client.close();
      });
  });
});
