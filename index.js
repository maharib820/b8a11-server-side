const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ...........................................................................................................................................
// ...........................................................................................................................................
// ......................................................Mongodb Connection...................................................................

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8ydx2m5.mongodb.net/?retryWrites=true&w=majority`;

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // ...........................start...........................................
        const jobsCollection = client.db('wavehire').collection('jobsCollection');

        // insert added job in db
        app.post("/newAddedJobs", async (req, res) => {
            const newAddedJobsDetails = req.body;
            console.log(newAddedJobsDetails);
            const result = await jobsCollection.insertOne(newAddedJobsDetails);
            res.send(result);
        })

        // fetch all jobs by category
        app.get("/allAddedJobs/:category", async (req, res) => {
            const selectedCategory = req.params.category;
            console.log(selectedCategory);
            const filter = { category: selectedCategory };
            const result = await jobsCollection.find(filter).toArray();
            res.send(result);
        })

        // fetch email wise added jobs for indivisual user
        app.get("/allAddedJobs", async (req, res) => {
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
            const filter = {_id : new ObjectId(id)};
            const result = await jobsCollection.findOne(filter);
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