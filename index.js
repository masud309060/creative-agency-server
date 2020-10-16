const express = require('express')
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser')
const fs = require('fs-extra')
const cors = require('cors');
require('dotenv').config()
const { ObjectId } = require('mongodb');
const fileUpload = require('express-fileupload');


const app = express()

app.use(bodyParser.json())
app.use(cors())
app.use(express.static('services'))
app.use(fileUpload())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rrq7z.mongodb.net/CreativeAgency?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true});

client.connect(err => {
  const servicesCollection = client.db("CreativeAgency").collection("services");
  const ordersCollection = client.db("CreativeAgency").collection("orders");
  const reviewsCollection = client.db("CreativeAgency").collection("reviews");
  const adminsCollection = client.db("CreativeAgency").collection("admin");

  app.post('/addService',(req,res) => {
    const file = req.files.file;
    const name = req.body.name;
    const description = req.body.description;
    const filePath = `${__dirname}/services/${file.name}`
    file.mv(filePath, err => {
      if(err){
        res.status(500).send({msg: "Failed to upload image"});
      }
      const newImg = fs.readFileSync(filePath)
      const encImg = newImg.toString('base64')
      var image = {
          contentType: file.mimetype,
          size: file.size,
          img: Buffer(encImg, 'base64')
      };
      servicesCollection.insertOne({name, description, image})
      .then(result => {
        fs.remove(filePath, error => {
          if(error){
            res.status(500).send({msg: "Failed to upload image"});
          }
          res.send(result.insertedCount > 0)
        })
      })
        return res.send({name: file.name, path: `/${file.name}`})
    })
})


  app.get('/services',(req, res) => {
    servicesCollection.find({}).limit(6)
    .toArray((err, documents) => {
        res.send(documents)
    })
  })

  app.get('/getService/:id', (req,res) => {
    servicesCollection.find({_id: ObjectId(req.params.id)})
    .toArray((err, documents) => {
        res.send(documents[0])
    })
})


  app.post('/addOrder',(req,res) => {
      const file = req.files.file;
      const name = req.body.name;
      const email = req.body.email;
      const message = req.body.message;
      const serviceName = req.body.serviceName;
      const serviceDescripton = req.body.serviceDescription;
      const serviceImg = req.body.serviceImg;
      const serviceId = req.body.serviceId;
      const filePath = `${__dirname}/services/${file.name}`
      file.mv(filePath, err => {
        if(err){
          console.log(err)
          res.status(500).send({msg: "Failed to upload image"});
        }
        const newImg = fs.readFileSync(filePath)
        const encImg = newImg.toString('base64')
        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer(encImg, 'base64')
        };
        ordersCollection.insertOne({name, email, message, serviceName, serviceDescripton, serviceImg, serviceId, status: "pending", image})
        .then(result => {
          fs.remove(filePath, error => {
            if(error){
              console.log(error)
              res.status(500).send({msg: "Failed to upload image"});
            }
            res.send(result.insertedCount > 0)
          })
        })
          return res.send({name: file.name, path: `/${file.name}`})
      })
  })
 
  app.get('/serviceList/:email',(req,res) => {
    const email = req.params.email; 
    adminsCollection.find({email: email})
    .toArray((err, admins)=> {
      if(admins.length > 0){
        ordersCollection.find({})
        .toArray((err, documents)=> {
          res.send(documents)
        })
      } else
      ordersCollection.find({email: email})
      .toArray((err, documents)=> {
        res.send(documents)
      })
    })
  })

  app.post('/addReview',(req,res) => {
    const reveiw= req.body;
    reviewsCollection.insertOne(reveiw)
    .then(result=> {
      res.send(result.insertedCount > 0)
    })
  })

  app.get('/reviews',(req, res)=> {
    reviewsCollection.find({}).limit(6)
    .toArray((err, documents) => {
      res.send(documents)
    })
  })

  app.post('/addAdmin',(req,res) => {
    const admin = req.body;
    adminsCollection.insertOne(admin)
    .then(result => {
      res.send(result.insertedCount > 0)
    })
  })

  app.post('/isAdmin',(req,res) => {
    const email = req.body.email;
    adminsCollection.find({email: email})
    .toArray((err, admins) => {
      res.send(admins.length > 0)
    })
  })


});


app.get('/', (req, res) => {
    res.send("hello world")
})

app.listen(process.env.PORT || 5000)