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
    const db = client.db("product-db");
    const productCollection = db.collection("products");
    const importsCollection = db.collection("imports");

  app.get("/products", async (req, res) => {
  try {
    const { search = "", origin = "", sort = "latest", page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { origin: { $regex: search, $options: "i" } }
      ];
    }
    if (origin) {
      query.origin = { $regex: `^${origin}$`, $options: "i" };
    }

    
    let sortStage = { $sort: { createdAt: -1 } }; // Default
    if (sort === "price_asc") sortStage = { $sort: { price_num: 1 } };
    if (sort === "price_desc") sortStage = { $sort: { price_num: -1 } };
    if (sort === "rating") sortStage = { $sort: { rating_num: -1 } };

    
    const pipeline = [
      { $match: query }, 
      {
        $addFields: {
          
          price_num: { $toDouble: "$price" },
          rating_num: { $toDouble: "$rating" }
        }
      },
      sortStage, 
      { $skip: skip },
      { $limit: limitNum }
    ];

    const products = await productCollection.aggregate(pipeline).toArray();
    const totalItems = await productCollection.countDocuments(query);

    res.send({
      success: true,
      products,
      totalPages: Math.ceil(totalItems / limitNum),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Sort Error:", error);
    res.status(500).send({ success: false, message: "Server Error" });
  }
});

// Dashboard Summary Data (GET)
app.get("/user-stats/:email", async (req, res) => {
  try {
    const email = req.params.email;

    
    const exportProducts = await productCollection.find({ created_by: email }).toArray();
    
    
    const importProducts = await importsCollection.find({ userEmail: email }).toArray();

    
    const totalExportValue = exportProducts.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 0)), 0);

    const totalImportCost = importProducts.reduce((sum, item) => sum + (Number(item.price) * Number(item.importQuantity || 0)), 0);

    res.send({
      success: true,
      stats: {
        totalExports: exportProducts.length,
        totalImports: importProducts.length,
        totalExportValue,
        totalImportCost
      }
    });
  } catch (error) {
    res.status(500).send({ success: false, message: "Error fetching stats" });
  }
});

   
    app.get("/products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await productCollection.findOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Invalid ID format" });
      }
    });

    app.get("/latest-products", async (req, res) => {
      const result = await productCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(8)
        .toArray();
      res.send({ success: true, products: result });
    });

    app.get("/my-products", async (req, res) => {
      const email = req.query.email;
      const result = await productCollection.find({ created_by: email }).toArray();
      res.send(result);
    });

    app.post("/products", async (req, res) => {
      const data = req.body;
      data.quantity = Number(data.quantity) || 0;
      data.price = Number(data.price) || 0;
      data.createdAt = new Date();
      const result = await productCollection.insertOne(data);
      res.send({ success: true, result });
    });

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




    app.delete("/products/:id", async (req, res) => {
      const { id } = req.params;
      const result = await productCollection.deleteOne({ _id: new ObjectId(id) });
      res.send({ success: true, result });
    });

    app.post("/imports", async (req, res) => {
      const result = await importsCollection.insertOne(req.body);
      res.send({ success: true, result });
    });

    app.get("/my-imports", async (req, res) => {
      const result = await importsCollection.find({ userEmail: req.query.email }).toArray();
      res.send(result);
    });

    console.log("MongoDB connected successfully!");
  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});