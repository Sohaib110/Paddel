const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Club = require('./models/Club');

dotenv.config();

const dummyClubs = [
    {
        name: 'Eddie Irvines',
        location: 'Bangor, Northern Ireland',
        phone_number: '+44 28 9145 1457',
        website_link: 'https://eddieirvinesports.com'
    },
    {
        name: 'Lahore Padel Centre',
        location: 'Gulberg III, Lahore',
        phone_number: '+92 300 1234567',
        website_link: 'https://lahorepadel.com'
    },
    {
        name: 'Islamabad Smash Oasis',
        location: 'F-7, Islamabad',
        phone_number: '+92 321 7654321',
        website_link: 'https://isbsmash.com'
    },
    {
        name: 'Karachi Court Masters',
        location: 'DHA Phase 6, Karachi',
        phone_number: '+92 333 9876543',
        website_link: 'https://kicm.pk'
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing clubs (optional, but good for clean dummy data)
        await Club.deleteMany({});
        console.log('Cleared existing clubs.');

        await Club.insertMany(dummyClubs);
        console.log('Successfully seeded dummy clubs!');

        process.exit();
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
};

seedDB();
