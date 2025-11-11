const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require('dotenv').config()
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@sagorkumar.isv1anl.mongodb.net/?appName=SagorKumar`;

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
    await client.connect();
    const db = client.db("product-db");
    const productCollection = db.collection("products");


     // products api
 app.get("/products", async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });


      app.get('/products/:id',async(req,res)=>{
      const {id} = req.params
      console.log(id) //ai id ta string
       const result = await productCollection.findOne({_id:new ObjectId(id)}) //ata ke amra object banailam karon database e object akare ache

      res.send({
        success:true,
        result
      })
    })


    app.post('/products',async (req,res)=>{
      const data = req.body
      // console.log(data)
      const result = await productCollection.insertOne(data) //database e models post 
      res.send({
        success:true,
        result
      })
    });





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

app.get("/", (req, res) => {
  res.send("server is running!");
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
