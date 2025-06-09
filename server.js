require("dotenv").config()
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const db = process.env.MONGODB_URI;
const path = require("path")

const postRoutes = require('./routes/PostRoutes');
const userRoutes = require('./routes/userRoutes');
const friendRoutes = require('./routes/friendRoutes');


const app = express();
app.use(cors());


app.use(express.json());
//app.use(express.urlencoded({ extended: true }));
app.use(express.static('uploads'));
app.use('/uploads/profile-pictures', express.static('uploads/profile-pictures'));



mongoose.connect(db)
    .then(() => console.log("MongoDB connected..."))
    .catch(err => {
        console.error("MongoDB connection error:", err);
    });

    //telling backend to look for frontend here in this folder
    app.use(express.static(path.resolve(__dirname, 'frontend', 'build')))

    app.get("/test",(req,res)=>{
    res.send("Express app is running")
    })

app.use('/api', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/profile', userRoutes);


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});


//serving frontend routes first
app.get('*', (req, res) => {
    res.sendFile(
        path.resolve(__dirname, 'frontend', 'build', 'index.html'),
        function (err) {
            if (err) {
                res.status(500).send(err)
            }
        }
    )
});

app.listen(5000, () => {
    //connect();
    console.log('Server is running on port 5000');
});
