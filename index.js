const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const stripe = require("stripe")(process.env.STIPE_TOKEN)
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
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
    const menuCollection = client.db('bistro_DB').collection('menus')
    const reviewCollection = client.db('bistro_DB').collection('review')
    const cardsCollection = client.db('bistro_DB').collection('cards')
    const userCollection = client.db('bistro_DB').collection('users')
    const prementCollection = client.db('bistro_DB').collection('prements')
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // varify token
    const varifyToken=(req,res,next)=>{
      // console.log('token is',req.headers.authorization);
      if(!req.headers.authorization){
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token=req.headers.authorization.split(' ')[1]
      // console.log(token);
      jwt.verify(token,process.env.USER_TOKEN,(err,decoded)=>{
        if(err){
          return res.status(401).send({massage:'unauthorized person'})
        }
        req.decoded=decoded
        next()
      })
    }
    // addmin varify token
    const adminVarify=async(req,res,next)=>{
      const email=req.decoded.email
      const filter={email: email}
      const isAdmin= await userCollection.findOne(filter)
      if(isAdmin.role === 'admin'){
        next()
      }
    }
    // jwt token
    app.post('/jwt', async(req, res) => {
      const user=req.body
      const token = jwt.sign(user, process.env.USER_TOKEN, { expiresIn: '1h'});
      res.send({token})

    })




    // get all menu data
    app.get('/menus', async (req, res) => {
      const result = await menuCollection.find().toArray()
      res.send(result)
    })
    // get card all data
    app.get('/cards/:email', async (req, res) => {
      const email = req.params.email
      const query = { email: email }
      const result = await cardsCollection.find(query).toArray()
      res.send(result)
    })

    // get all users
    app.get('/users',varifyToken, adminVarify, async (req, res) => {
      const result = await userCollection.find().toArray()
      res.send(result)
    })
    // get addmin data
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email
      const filter = { email: email }
      const result = await userCollection.findOne(filter)
      res.send(result)
    })
     // get all review
     app.get('/review', async (req, res) => {
      const result = await reviewCollection.find().toArray()
      res.send(result)
    })
    // get a menu data
    app.get('/menu/:id',async(req,res)=>{
      const id=req.params.id
      const query={_id: new ObjectId(id)}
      const result=await menuCollection.findOne(query)
      res.send(result)
    })
    app.get('/payment/:email',async(req,res)=>{
      const email=req.params.email
      const query={email: email}
      const result=await prementCollection.find(query).toArray()
      res.send(result)
    })

    // post users data
    app.post('/users', async (req, res) => {
      const info = req.body
      const email = req.body.email
      const isEmail = await userCollection.findOne({ email: email })
      if (isEmail) {
        return res.send({ status: 'user is alerady save' })
      }
      const result = await userCollection.insertOne(info)
      res.send(result)
    })
    // post a item
    app.post('/menu',async(req,res)=>{
      const info=req.body
      const result =await menuCollection.insertOne(info)
      res.send(result)
    })
    // upadate a admin role
    app.patch('/users', async (req, res) => {
      const email = req.body.email
      const filter = { email: email }
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options)
      res.send(result)
    })
    // update menu itmem
    app.put('/menu/:id',async(req,res)=>{
      const id=req.params.id
      const filter={_id: new ObjectId(id)}
      const options = { upsert: true };
      const updateData=req.body
      const updateDoc={
        $set:{
          ...updateData
        }
      }
      const result=await menuCollection.updateOne(filter,updateDoc,options)
      res.send(result)
    })
    // delete a user
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(filter)
      res.send(result)
    })
    // delete payments history
    app.delete('/payments/:id',async(req,res)=>{
      const id=req.params.id
      const query={_id: new ObjectId(id)}
      const result=await prementCollection.deleteOne(query)
      res.send(result)
    })
    // delete a menu
    app.delete('/menu/:id',async(req,res)=>{
      const id =req.params.id
      const query={_id: new ObjectId(id)}
      const result=await menuCollection.deleteOne(query)
      res.send(result)
    })
    app.delete('/cards/:id',async(req,res)=>{
      const id=req.params.id
      const query={_id: new ObjectId(id)}
      const result=await cardsCollection.deleteOne(query)
      res.send(result)
    })
    // delete cards menu
    app.post('/prements',async(req,res)=>{
      const ids=req.body.ids
      const info=req.body
      // console.log(req.body);
      const query={_id:  {
        $in:ids.map(id=> new ObjectId(id))
      }}
      const deleteItem=await cardsCollection.deleteMany(query)
      const prementItem=await prementCollection.insertOne(info)
      res.send({deleteItem,prementItem})
    })
    // post card data
    app.post('/cards', async (req, res) => {
      const info = req.body
      const result = await cardsCollection.insertOne(info)
      res.send(result)
    })
    // payments methods
    app.post("/create-payment-intent", async (req, res)=>{
      const {totalAmount}=req.body
      const amount=parseInt(totalAmount *100)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    } )
   
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
  res.send('Hello world')
})
app.listen(port, (req, res) => {
  console.log(`Server is running on port ${port}`);
})
