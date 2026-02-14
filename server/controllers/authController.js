const User = require('../models/User');
const Club = require('../models/Club');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const {
        full_name,
        email,
        phone_number,
        password,
        club_id,
        gender,
        play_mixed,
        months_played,
        availability,
        mode_selection,
        role
    } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    if (!club_id) {
        return res.status(400).json({ message: 'Club ID is required' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        full_name,
        email,
        phone_number,
        password_hash: hashedPassword,
        club_id,
        gender,
        play_mixed,
        months_played,
        availability,
        mode_selection,
        role: role || 'PLAYER'
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            club_id: user.club_id,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password_hash))) {
        res.json({
            _id: user._id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            club_id: user.club_id,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

module.exports = { registerUser, loginUser };
