const express=require('express')
const app=express()
const cors=require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const port=process.env.PORT || 5000
// bosto_boss_resturents
// 9PXGtMiKxZR3ljkN

// middleware
app.use(express.json())
app.use(cors())


// mongodb database

const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.rzyh2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const menuCollection=client.db('bistro_DB').collection('menus')
    const reviewCollection=client.db('bistro_DB').collection('review')
    const cardsCollection=client.db('bistro_DB').collection('cards')
    const userCollection=client.db('bistro_DB').collection('users')
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // get all menu data
    app.get('/menus', async(req,res)=>{
      const result=await menuCollection.find().toArray()
      res.send(result)
    })
    // get card all data
    app.get('/cards/:email',async(req,res)=>{
      const email=req.params.email
      const query={email:email}
      const result=await cardsCollection.find(query).toArray()
      res.send(result)
    })

    // post users data
    app.post('/users',async(req,res)=>{
      const info=req.body
      const email=req.body.email
      const isEmail=await userCollection.findOne({email:email})
      if(isEmail){
        return res.send({status:'user is alerady save'})
      }
      const result=await userCollection.insertOne(info)
      res.send(result)
    })
    // post card data
    app.post('/cards', async(req,res)=>{
      const info=req.body
      const result =await cardsCollection.insertOne(info)
      res.send(result)
    })
    // get all review
    app.get('/review',async(req,res)=>{
      const result=await reviewCollection.find().toArray()
      res.send(result)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req,res)=>{
    res.send('Hello world')
})
app.listen(port,(req,res)=>{
    console.log(`Server is running on port ${port}`);
})
