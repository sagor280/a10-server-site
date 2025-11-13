const express = require("express");
const { MongoClient, ServerApiVersion,  ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@sagorkumar.isv1anl.mongodb.net/?appName=SagorKumar`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("product-db");
    const productCollection = db.collection("products");
    const importsCollection = db.collection("imports");

    // Get all products
    app.get("/products", async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });

    app.get("/my-products", async (req, res) => {
      const email = req.query.email;
      const result = await productCollection
        .find({ created_by: email })
        .toArray();
      res.send(result);
    });

    app.get("/my-imports", async (req, res) => {
      const email = req.query.email;
      const result = await importsCollection
        .find({
          userEmail: email,
        })
        .toArray();
      res.send(result);
    });

    // Get product by ID
    app.get("/products/:id", async (req, res) => {
      const { id } = req.params;
      const result = await productCollection.findOne({ _id: new ObjectId(id) });
      res.send({ success: true, result });
    });

    // Add new product
    app.post("/products", async (req, res) => {
      const data = req.body;
      const result = await productCollection.insertOne(data);
      res.send({ success: true, result });
    });

    // Add import
    app.post("/imports", async (req, res) => {
      const data = req.body;
      const result = await importsCollection.insertOne(data);
      res.send({ success: true, result });
    });

    // Update product quantity
    app.patch("/products/:id", async (req, res) => {
      const { id } = req.params;
      const update = req.body;
      const result = await productCollection.updateOne(
        { _id: new ObjectId(id) },
        update
      );
      res.send({ success: true, result });
    });

     // Update existing product
  app.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const filter = { _id: new ObjectId(id) };
  const update = { $set: data };

  const result = await productCollection.updateOne(filter, update);

  res.send({
    success: true,
    result,
  });
});


    // Latest 6 products
    app.get("/latest-products", async (req, res) => {
      const result = await productCollection
        .find()
        .sort({ createdAt: -1 }) // newest first
        .limit(6)
        .toArray();
      res.send(result);
    });

    // search product
    app.get('/search',async(req,res)=>{
      const search_text =req.query.search
      const result =await  productCollection.find({name:{$regex:search_text,$options:"i"}}).toArray()
      res.send(result)
    })

    // Delete import by ID
    app.delete("/imports/:id", async (req, res) => {
      const { id } = req.params;
      const result = await importsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send({
        success: true,
        result,
      });
    });

    // delete product
    app.delete("/products/:id", async (req, res) => {
      const { id } = req.params;
      const result = await productCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send({
        success: true,
        result,
      });
    });



    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
