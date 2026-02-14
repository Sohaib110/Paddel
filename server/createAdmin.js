const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Club = require('./models/Club');

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        // Find or create a club first
        let club = await Club.findOne({ name: 'Lahore Padel Centre' });
        if (!club) {
            club = await Club.create({
                name: 'Lahore Padel Centre',
                location: 'Gulberg III, Lahore'
            });
        }

        const adminEmail = 'admin@padel.com';
        const adminPassword = 'admin123';

        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin already exists:', adminEmail);
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        await User.create({
            full_name: 'System Admin',
            email: adminEmail,
            password_hash: hashedPassword,
            role: 'ADMIN',
            club_id: club._id,
            phone_number: '+92000000000',
            gender: 'MALE'
        });

        console.log('Admin user created successfully!');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);

        process.exit();
    } catch (err) {
        console.error('Error creating admin:', err);
        process.exit(1);
    }
};

createAdmin();
