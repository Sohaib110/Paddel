const Club = require('../models/Club');

// @desc    Create a new club
// @route   POST /api/clubs
// @access  Public (or Admin only later)
const createClub = async (req, res) => {
    const { name, location, phone_number, website_link } = req.body;

    const club = await Club.create({
        name,
        location,
        phone_number,
        website_link
    });

    res.status(201).json(club);
};

// @desc    Get all clubs
// @route   GET /api/clubs
// @access  Public
const getClubs = async (req, res) => {
    const clubs = await Club.find({});
    res.json(clubs);
};

module.exports = { createClub, getClubs };
