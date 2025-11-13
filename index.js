const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    // Get products by user
    app.get("/my-products", async (req, res) => {
      const email = req.query.email;
      const result = await productCollection
        .find({ created_by: email })
        .toArray();
      res.send(result);
    });

    // Get product by ID
    app.get("/products/:id", async (req, res) => {
      const { id } = req.params;
      const result = await productCollection.findOne({ _id: new ObjectId(id) });
      res.send({ success: true, result });
    });

    // Add new product (safe for price & quantity)
    app.post("/products", async (req, res) => {
      const data = req.body;
      data.quantity = Number(data.quantity) || 0;
      data.price = Number(data.price) || 0;

      const result = await productCollection.insertOne(data);
      res.send({ success: true, result });
    });

    // Update product (PUT)
    app.put("/products/:id", async (req, res) => {
      const { id } = req.params;
      const data = {
        ...req.body,
        price: Number(req.body.price) || 0,
        quantity: Number(req.body.quantity) || 0,
      };

      const result = await productCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: data }
      );

      res.send({ success: true, result });
    });

    // Patch product quantity 
    app.patch("/products/:id", async (req, res) => {
      const { id } = req.params;
      let { quantity } = req.body;

      quantity = Number(quantity); // Convert to number
      if (isNaN(quantity)) {
        return res
          .status(400)
          .send({ success: false, message: "Quantity must be a number" });
      }

      const result = await productCollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { quantity } }
      );

      res.send({ success: true, result });
    });

    // Delete product
    app.delete("/products/:id", async (req, res) => {
      const { id } = req.params;
      const result = await productCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send({ success: true, result });
    });

    // Search product
    app.get("/search", async (req, res) => {
      const search_text = req.query.search;
      const result = await productCollection
        .find({ name: { $regex: search_text, $options: "i" } })
        .toArray();
      res.send(result);
    });

    // Imports collection routes
    app.get("/my-imports", async (req, res) => {
      const email = req.query.email;
      const result = await importsCollection
        .find({ userEmail: email })
        .toArray();
      res.send(result);
    });

    app.post("/imports", async (req, res) => {
      const data = req.body;
      const result = await importsCollection.insertOne(data);
      res.send({ success: true, result });
    });

    app.delete("/imports/:id", async (req, res) => {
      const { id } = req.params;
      const result = await importsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send({ success: true, result });
    });

    // Latest products
    app.get("/latest-products", async (req, res) => {
      const result = await productCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB connected successfully!");
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
