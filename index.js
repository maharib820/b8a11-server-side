const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://wavehire-5ee55.web.app',
        'https://wavehire-5ee55.firebaseapp.com'
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ...........................................................................................................................................
// ...........................................................................................................................................
// ......................................................Mongodb Connection...................................................................

const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_USER_PASS}@cluster0.8ydx2m5.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// Middleware////////////////////////////////////////////
const logger = async (req, res, next) => {
    // console.log(req.method, req.url);
    next();
}

const verifyToken = async (req, res, next) => {
    const token = req?.cookies?.settoken;
    // console.log(token);
    if(!token){
        return res.status(401).send({message: "unauthorized accessed"})
    }
    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err, decoded) => {
        if(err){
            return res.status(401).send({message: "unauthorized accessz"})
        }
        req.user = decoded;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        // ...........................start...........................................
        const jobsCollection = client.db('wavehire').collection('jobsCollection');
        const categoryCollection = client.db('wavehire').collection('categories');
        const bidsCollection = client.db('wavehire').collection('bidsCollection');


        // authentication api
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, {expiresIn: '1h'})
            res
            .cookie('settoken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', 
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            })
            .send({success: true});
        })

        // for logout
        app.post("/logout", async (req, res) => {
            const user = req.body;
            res
            .clearCookie('settoken', {maxAge: 0})
            .send({success: true})
        })


        // services api *******************************************************************************************************************************

        // get categories
        app.get("/categories", async (req, res) => {
            const result = await categoryCollection.find().toArray();
            res.send(result);
        })

        // insert added job in db
        app.post("/newAddedJobs", async (req, res) => {
            const newAddedJobsDetails = req.body;
            // if(req.user.email !==req.body.email){
            //     return res.status(401).send({message: "forbidden access"})
            // }
            console.log(req.body.email);
            // console.log(newAddedJobsDetails);
            const result = await jobsCollection.insertOne(newAddedJobsDetails);
            res.send(result);
        })

        // fetch all jobs by category
        app.get("/allAddedJobs/:category", async (req, res) => {
            const selectedCategory = req.params.category;
            // console.log(selectedCategory);
            const filter = { category: selectedCategory };
            const result = await jobsCollection.find(filter).toArray();
            res.send(result);
        })

        // fetch email wise added jobs for indivisual user
        app.get("/allAddedJobs", logger, verifyToken, async (req, res) => {
            if(req.user.email !==req.query.email){
                return res.status(401).send({message: "forbidden access"})
            }
            let query = [];
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await jobsCollection.find(query).toArray();
            res.send(result);
        })

        // fetch and send to update
        app.get("/updateaddedjob/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await jobsCollection.findOne(filter);
            res.send(result);
        })

        // update my job data
        app.put("/updateaddedjob/:id", async (req, res) => {
            const id = req.params.id;
            const datas = req.body;
            const filter = { _id: new ObjectId(id) }
            const option = { upsert: true }
            const updatedDoc = {
                $set: {
                    email: datas.email, title: datas.title, category: datas.category, date: datas.date, minprice: datas.minprice, maxprice: datas.maxprice, description: datas.description
                }
            }
            const result = await jobsCollection.updateOne(filter, updatedDoc, option);
            res.send(result);
        })

        // delete my added job indivisually
        app.delete("/deletejob/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await jobsCollection.deleteOne(filter);
            res.send(result);
        })

        // single job details using id
        app.get("/jobdetails/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const result = await jobsCollection.findOne(filter);
            res.send(result);
        })

        // new added bids
        app.post("/newAddedBids", async (req, res) => {
            const newAddedBidsDetails = req.body;
            console.log(newAddedBidsDetails);
            const result = await bidsCollection.insertOne(newAddedBidsDetails);
            res.send(result);
        })

        // get my all bids data
        app.get("/allBids", logger, verifyToken, async (req, res) => {
            if(req.user.email !==req.query.email){
                return res.status(401).send({message: "forbidden access"})
            }
            let query = [];
            console.log(req.query);
            if (req.query?.email) {
                query = {
                    bidby: req.query.email
                }
            }
            const result = await bidsCollection.find(query).sort({ status: 1 }).toArray();
            res.send(result);
        })

        // get showall my all bids data
        app.get("/allBidss/:status", logger, verifyToken, async (req, res) => {
            if(req.user.email !==req.query.email){
                return res.status(401).send({message: "forbidden access"})
            }
            const status = req.params.status;
            // console.log(status);
            let query = [];
            if (req.query?.email) {
                query = {
                    bidby: req.query.email
                }
            }
            const filter = { bidby: req.query?.email, status: status }
            const result = await bidsCollection.find(filter).toArray();
            res.send(result);
        })

        // get my all bids requested data
        app.get("/allRequestedBids", logger, verifyToken, async (req, res) => {
            if(req.user.email !==req.query.email){
                return res.status(401).send({message: "forbidden access"})
            }
            let query = [];
            if (req.query?.email) {
                query = { postedby: req.query.email }
            }
            const result = await bidsCollection.find(query).toArray();
            res.send(result);
        })

        // .......................................Patch.........................................................
        app.patch("/confirm/:id", async (req, res) => {
            const id = req.params.id;
            const updateConfirm = req.body;
            // console.log(updatedBooking);
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: updateConfirm.status
                },
            };
            const result = await bidsCollection.updateOne(filter, updateDoc);
            res.send(result);
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

// ...........................................................................................................................................
// ...........................................................................................................................................

app.get('/', (req, res) => {
    res.send('Server Hire Wave is currently running')
})

app.listen(port, () => {
    console.log(`Server Hire Wave is currently running on port ${port}`)
})