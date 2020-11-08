const express = require('express');
const connectDB = require('./config/db');
const path = require('path');

const app = express();

//Connect DataBase
connectDB();

//Init Malware
app.use(express.json({ extended: false }));

//To use build folder as static
app.use(express.static(path.join(__dirname, '/client/build')));

app.get('/', (req, res) => {
    res.render('index');
});

//Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/auth', require('./routes/api/auth'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server started on ${PORT}`);
});
