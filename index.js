const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

// ! Middleware
app.use(cors());
app.use(express.json());



// ! verify Jwt token
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ error: true, message: "Unauthorized access" });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ error: true, message: "Forbidden access" });
        }
        req.decoded = decoded;
        next();
    });
}

// ! MongoDB Connection
const { MongoClient, ServerApiVersion , ObjectId } = require('mongodb');
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
        const instructorCollection = client.db("MelodyMaster").collection("instructors");

       

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            // console.log(process.env.ACCESS_TOKEN_SECRET)
            res.send({ token })
        });


        //! users related apis
        app.get('/users',verifyJWT, async (req, res) => {
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
        // setting  a user role to admin
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };

            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);

        });
        // setting  a user role to instructor
        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'instructor'
                },
            };

            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);

        });

        // ! class related apis
        // for getting all the classes
        app.get('/classes', async (req, res) => {
            const result = await classCollection.find().toArray();
            res.send(result);
        });
        // show all the approved classes
        app.get('/approved-classes', async (req, res) => {
            const result = await classCollection.find({ status: 'approved' }).toArray();
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

        // TODO: change it
        // ! instructor related apis
        // for getting all the instructors
        app.get('/instructors', async (req, res) => {
            const result = await instructorCollection.find().toArray();
            res.send(result);
        });
        // getting the first 6 popular classes sort by number of class taken
        app.get('/popular-instructors', async (req, res) => {
            try {
                const popularInstructors = await instructorCollection.find().sort({ numberOfClasses: -1 }).limit(6).toArray();
                res.send(popularInstructors);
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