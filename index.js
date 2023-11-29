const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


//MONGODB SERVER CODE

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kwgfltq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)


    const shopCollection = client.db("technoDb").collection("userShop");
    const usersCollection = client.db("technoDb").collection("users");
    const addProductsCollection = client.db("technoDb").collection("addProducts");


    app.post('/addProducts', async(req, res) => {
       const item = req.body;
       const result = await addProductsCollection.insertOne(item);
       res.send(result);
    });

    app.get('/addProducts', async(req, res) => {
      const email = req.query.email;
      if (email) {
        const query = { email: email };
        const cursor = addProductsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } else {
        const allData = await shopCollection.find({}).toArray();
        res.send(allData);
      }
    })

    // create shop api
    app.post('/userShop', async(req, res) => {
        const shop = req.body;
        const result = await shopCollection.insertOne(shop);
        res.send(result)
    })

    app.get("/userShop", async (req, res) => {
        const email = req.query.email;
        if (email) {
          const query = { ownerEmail: email };
          const cursor = shopCollection.find(query);
          const result = await cursor.toArray();
          res.send(result);
        } else {
          const allData = await shopCollection.find({}).toArray();
          res.send(allData);
        }
    });

    // user collection api
    app.post('/users', async(req, res) => {
        const user = req.body;
        const query = {email: user.email}
        const existingUser = await usersCollection.findOne(query);
        if(existingUser){
            return res.send({message: 'user already exist', insertedId: null })
        }
        const result = await usersCollection.insertOne(user);
        res.send(result);
    })

    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





// SERVER RUNNING CODE
app.get('/', (req, res) => {
    res.send('srever is running')
})

app.listen(port, () => {
    console.log(`servr is running on port ${port}`);
})