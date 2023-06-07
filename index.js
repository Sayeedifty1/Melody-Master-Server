const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 5000;

// ! Middleware
app.use(cors());
app.use(express.json());

// ! MongoDB Connection
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nsyuaxc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 50,
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect((err => {
            if (err) {
                console.log(err);
                return;
            }
        }));
        const userCollection = client.db("MelodyMaster").collection("user");
        const classCollection = client.db("MelodyMaster").collection("classes");


        //! users related apis
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });
        //storing user data in database
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: 'user already exists' })
            }

            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        // ! class related apis
        // for getting all the classes
        app.get('/classes', async (req, res) => {
            const result = await classCollection.find().toArray();
            res.send(result);
        });
        // getting the first 6 popular classes sort by number of enrolled students
        app.get('/popular-classes', async (req, res) => {
            try {
                const popularClasses = await classCollection.find().sort({ numberOfStudents: -1 }).limit(6).toArray();
                res.send(popularClasses);
            } catch (err) {
                console.error(err);
                res.status(500).send('Internal server error');
            }
        });









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
    res.send('Melody Master server is running')
})

app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})