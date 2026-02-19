const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone_number: { type: String }, // Required for WhatsApp
    password_hash: { type: String, required: true },
    role: {
        type: String,
        enum: ['ADMIN', 'CAPTAIN', 'PLAYER'],
        default: 'PLAYER'
    },
    club_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },

    // Profile Fields
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
    play_mixed: { type: String, enum: ['YES', 'NO', 'DOES_NOT_MATTER'] },
    months_played: { type: Number, default: 0 },
    experience_level: {
        type: String,
        enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'VERY_COMPETITIVE'],
        default: 'BEGINNER'
    },
    availability: [{ type: String }], // e.g. ['Weeknights', 'Weekends']
    mode_selection: { type: String, enum: ['COMPETITIVE', 'FRIENDLY'], default: 'COMPETITIVE' },

    // Friendly Mode Solo Pool Status
    solo_pool_status: {
        type: String,
        enum: ['IDLE', 'LOOKING', 'PAIRED'],
        default: 'IDLE'
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
