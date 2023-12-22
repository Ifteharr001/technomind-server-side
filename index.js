const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;
const corsOptions = {
  origin: "https://technominds-9a66d.web.app",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

//middleware
app.use(cors(corsOptions));
app.use(express.json());


//MONGODB SERVER CODE

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const checkOutProductsCollection = client.db("technoDb").collection("checkOut");
    const paymentProductsCollection = client.db("technoDb").collection("payments");


 app.post("/checkOut/:id", async (req, res) => {
   try {
     const id = req.params.id;
     const { productId, quantity, image, name, discount, cost, email } = req.body;
      const checkoutData = {
        productId: new ObjectId(productId),
        quantity: quantity,
        image: image,
        name: name,
        discount: discount,
        cost: cost,
        email: email,
      };

     const result = await checkOutProductsCollection.insertOne(checkoutData);

     res.send(result);
   } catch (error) {
     console.error("Error processing checkout:", error);
     res.status(500).send({ error: "Internal Server Error" });
   }
 });
 app.get("/checkOut", async(req, res) => {
  const email = req.query.email;
  if (email) {
    const query = { email: email };
    const cursor = checkOutProductsCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  } else {
    const allData = await shopCollection.find({}).toArray();
    res.send(allData);
  }
 });

  app.post("/payments", async (req, res) => {
    try {
      const payment = req.body;

      // Make sure payment object and cardIds property are present
      if (!payment || !payment.cardIds) {
        return res.status(400).send({ error: "Invalid payment data" });
      }

      const paymentResult = await paymentProductsCollection.insertOne(payment);

      const query = {
        _id: {
          $in: payment.cardIds.map((id) => new ObjectId(id)),
        },
      };

      const deleteResult = await checkOutProductsCollection.deleteMany(query);

      res.send({ paymentResult, deleteResult });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).send({ error: "Internal Server Error" });
    }
  });



 app.post('/create-payment-intent', async(req, res) =>{
  const {cost} = req.body;
  const amount = parseInt(cost * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd', 
    payment_method_types: ['card']

  });
  res.send({
    clientSecret: paymentIntent.client_secret
  })
 })

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
    });
    app.get('/addProducts', async(req, res) =>{
      const filter = req.query;
      const query = {
        _id: {$regex: filter.search}
      }
      const cursor = addProductsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result)
    })
   

    app.patch('/addProducts/:id', async(req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          name: item.name,
          image: item.image,
          quantity: parseFloat(item.quantity),
          location: item.location,
          cost: parseFloat(item.cost),
          profit: parseFloat(item.profit),
          discount: parseFloat(item.discount),
          description: item.description,
        },
      };
      const result = await addProductsCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    app.get('/addProducts/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await addProductsCollection.findOne(query);
      res.send(result);
    })

    app.delete('/addProducts/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await addProductsCollection.deleteOne(query);
      res.send(result);
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
    });
     app.get("/users/admin/:email", async (req, res) => {
       const email = req.params.email;
       const query = { email: email };
       const user = await usersCollection.findOne(query);
       let admin = false;
       if(user){
        admin = user?.role === 'admin';
       }
       res.send({admin});
     });
    app.get('/users', async(req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.patch('/users/admin/:id', async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result);
    })

    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
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