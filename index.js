const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express());

// ...........................................................................................................................................
// ...........................................................................................................................................
// ......................................................Mongodb Connection...................................................................

const uri = "mongodb+srv://<username>:<password>@cluster0.8ydx2m5.mongodb.net/?retryWrites=true&w=majority";

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
        app.post("/newAddedJobs", (req, res) => {
            
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