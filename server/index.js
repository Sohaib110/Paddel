const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); // Keep this if connectDB is still used for something else, but the instruction replaces its main use.
// The instruction implies these are imported, but then doesn't show their usage in app.use.
// For consistency with the original file's app.use structure, I will keep the require statements directly in app.use.
// const authRoutes = require('./routes/authRoutes');
// const teamRoutes = require('./routes/teamRoutes');
// const clubRoutes = require('./routes/clubRoutes');
// const matchRoutes = require('./routes/matchRoutes');
// const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes'); // New import
const { startCronJobs } = require('./cronJobs'); // Changed from setupCronJobs

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully');
        // Start cron jobs after DB connection
        startCronJobs();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Route Middlewares
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clubs', require('./routes/clubRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/notifications', notificationRoutes); // New route

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
