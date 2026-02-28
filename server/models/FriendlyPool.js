const mongoose = require('mongoose');

/**
 * Solo player pool for friendly matchmaking
 * This model tracks individual players waiting for a casual (non-competitive) partner.
 * Team-vs-team friendlies use the existing Match model with mode='FRIENDLY'.
 */
const FriendlyPoolSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    club_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true,
    },
    experience_level: {
        type: String,
        required: true,
    },
    availability: [{ type: String }],     // e.g. ['EVENINGS', 'WEEKENDS']
    play_mixed: {
        type: String,
        enum: ['YES', 'NO', 'DOES_NOT_MATTER'],
        default: 'DOES_NOT_MATTER',
    },
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE', 'OTHER'],
    },
    status: {
        type: String,
        enum: ['WAITING', 'MATCHED', 'COMPLETED'],
        default: 'WAITING',
    },
    // Populated once paired
    matched_with_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    matched_at: { type: Date, default: null },

    // Optional result after the casual game
    result: {
        type: String,
        enum: ['WIN', 'LOSS', null],
        default: null,
    },
}, { timestamps: true });

// One active entry per user (at most)
FriendlyPoolSchema.index({ user_id: 1 }, { unique: true });
// Fast lookup of waiting players in a club
FriendlyPoolSchema.index({ club_id: 1, status: 1 });

module.exports = mongoose.model('FriendlyPool', FriendlyPoolSchema);
