const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const postRoutes = require('./routes/PostRoutes');
const userRoutes = require('./routes/userRoutes');
const friendRoutes = require('./routes/friendRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); 

const uri = process.env.MONGODB_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });


app.use('/api', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
