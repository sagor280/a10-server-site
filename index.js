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

    // ১. অল-ইন-ওয়ান প্রোডাক্ট রাউট (Search, Filter, Sort, Pagination)
    app.get("/products", async (req, res) => {
      try {
        const {
          search = "",
          origin = "",
          sort = "createdAt-desc",
          page = 1,
          limit = 9,
        } = req.query;

        const query = {};
        if (search) query.name = { $regex: search, $options: "i" };
        if (origin) query.origin = origin;

        const [sortField, sortOrder] = sort.split("-");
        const order = sortOrder === "asc" ? 1 : -1;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Aggregation ব্যবহার করছি যাতে সর্টিং নিখুঁত হয় (বিশেষ করে প্রাইসের ক্ষেত্রে)
        let pipeline = [{ $match: query }];

        if (sortField === "price") {
          pipeline.push({
            $addFields: { priceNumber: { $toDouble: "$price" } }
          });
          pipeline.push({ $sort: { priceNumber: order } });
        } else {
          pipeline.push({ $sort: { [sortField]: order } });
        }

        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });

        const items = await productCollection.aggregate(pipeline).toArray();
        const totalItems = await productCollection.countDocuments(query);

        res.send({
          success: true,
          products: items,
          totalPages: Math.ceil(totalItems / parseInt(limit)),
          currentPage: parseInt(page),
          totalItems
        });
      } catch (error) {
        res.status(500).send({ success: false, message: "Internal server error" });
      }
    });

    // ২. অ্যাড প্রোডাক্ট (createdAt যোগ করা হয়েছে সর্টিং এর সুবিধার জন্য)
    app.post("/products", async (req, res) => {
      const data = req.body;
      data.quantity = Number(data.quantity) || 0;
      data.price = Number(data.price) || 0;
      data.createdAt = new Date(); // সর্টিং এর জন্য খুবই গুরুত্বপূর্ণ

      const result = await productCollection.insertOne(data);
      res.send({ success: true, result });
    });

    // ৩. গেট সিঙ্গেল প্রোডাক্ট
    app.get("/products/:id", async (req, res) => {
      const { id } = req.params;
      const result = await productCollection.findOne({ _id: new ObjectId(id) });
      res.send({ success: true, result });
    });

    // ৪. ডিলিট প্রোডাক্ট
    app.delete("/products/:id", async (req, res) => {
      const { id } = req.params;
      const result = await productCollection.deleteOne({ _id: new ObjectId(id) });
      res.send({ success: true, result });
    });

    // ৫. ইমপোর্ট কালেকশন রাউটস
    app.post("/imports", async (req, res) => {
      const result = await importsCollection.insertOne(req.body);
      res.send({ success: true, result });
    });

    app.get("/my-imports", async (req, res) => {
      const result = await importsCollection.find({ userEmail: req.query.email }).toArray();
      res.send(result);
    });

    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error(error);
  }
}

run().catch(console.dir);
app.get("/", (req, res) => res.send("Server is running!"));
app.listen(port, () => console.log(`Server listening on port ${port}`));