const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Club = require('./models/Club');
const Team = require('./models/Team');
const Match = require('./models/Match');

dotenv.config();

const fullSeed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        // 1. Clear All Data
        await Promise.all([
            User.deleteMany({}),
            Club.deleteMany({}),
            Team.deleteMany({}),
            Match.deleteMany({})
        ]);
        console.log('Database cleared.');

        // 2. Create Clubs
        const club1 = await Club.create({
            name: 'Lahore Padel Centre',
            location: 'Gulberg III, Lahore',
            phone_number: '+92 300 1111111'
        });

        const club2 = await Club.create({
            name: 'Islamabad Smash Oasis',
            location: 'F-7, Islamabad',
            phone_number: '+92 300 2222222'
        });
        console.log('Clubs seeded.');

        // 3. Helper to create users
        const salt = await bcrypt.genSalt(10);
        const pass = await bcrypt.hash('pass123', salt);

        const createUser = async (name, email, role, clubId) => {
            return await User.create({
                full_name: name,
                email: email,
                password_hash: pass,
                role: role,
                club_id: clubId,
                phone_number: '+92000000000',
                gender: 'MALE',
                months_played: 12
            });
        };

        // 4. Create Admin
        await createUser('System Admin', 'admin@padel.com', 'ADMIN', club1._id);

        // 5. Create Captains and Players for Club 1
        const cap1 = await createUser('Captain Lahore A', 'cap_lhr_a@test.com', 'CAPTAIN', club1._id);
        const p1 = await createUser('Player Lahore A', 'p_lhr_a@test.com', 'PLAYER', club1._id);

        const cap2 = await createUser('Captain Lahore B', 'cap_lhr_b@test.com', 'CAPTAIN', club1._id);
        const p2 = await createUser('Player Lahore B', 'p_lhr_b@test.com', 'PLAYER', club1._id);

        // 6. Create Captains and Players for Club 2
        const cap3 = await createUser('Captain Isb A', 'cap_isb_a@test.com', 'CAPTAIN', club2._id);
        const p3 = await createUser('Player Isb A', 'p_isb_a@test.com', 'PLAYER', club2._id);

        const cap4 = await createUser('Captain Isb B', 'cap_isb_b@test.com', 'CAPTAIN', club2._id);
        const p4 = await createUser('Player Isb B', 'p_isb_b@test.com', 'PLAYER', club2._id);

        // 7. Create Teams
        const createTeam = async (name, capId, p2Id, clubId) => {
            return await Team.create({
                name: name,
                captain_id: capId,
                player_2_id: p2Id,
                club_id: clubId,
                status: 'ELIGIBLE'
            });
        };

        await createTeam('Lahore Lions', cap1._id, p1._id, club1._id);
        await createTeam('Lahore Eagles', cap2._id, p2._id, club1._id);
        await createTeam('Islamabad Tigers', cap3._id, p3._id, club2._id);
        await createTeam('Islamabad Wolves', cap4._id, p4._id, club2._id);

        console.log('Full reset and seeding complete!');
        console.log('\n--- Test Accounts ---');
        console.log('All passwords are: pass123');
        console.log('ADMIN: admin@padel.com');
        console.log('LAHORE CAPTAINS: cap_lhr_a@test.com, cap_lhr_b@test.com');
        console.log('ISB CAPTAINS: cap_isb_a@test.com, cap_isb_b@test.com');

        process.exit();
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

fullSeed();
