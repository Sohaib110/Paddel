const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
    club_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    name: { type: String, required: true }, // Unique index to be applied
    experience_level: {
        type: String,
        enum: ['0-1 Months', '2-4 Months', '5-9 Months', '10+ Months', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'VERY_COMPETITIVE'],
        required: true
    },
    mixed_gender_preference: {
        type: String,
        enum: ['YES', 'NO', 'DOES_NOT_MATTER'],
        default: 'DOES_NOT_MATTER'
    },
    captain_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    player_2_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Null until accepted

    mode: {
        type: String,
        enum: ['COMPETITIVE', 'FRIENDLY'],
        default: 'COMPETITIVE'
    },
    type: {
        type: String,
        enum: ['1v1', '2v2'],
        default: '2v2'
    },

    // Invite System
    invite_token: { type: String },
    invite_email: { type: String },

    status: {
        type: String,
        enum: ['PENDING_PARTNER', 'AVAILABLE', 'IN_MATCH', 'COOLDOWN', 'UNAVAILABLE', 'INACTIVE'],
        default: 'PENDING_PARTNER'
    },

    // Cooldown & Availability
    cooldown_expires_at: { type: Date },
    unavailable_until: { type: Date },
    unavailable_return_date: { type: Date }, // Optional return date for unavailable teams
    last_match_completed_at: { type: Date },

    // Matchmaking Safeguards
    last_opponent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },

    // Stats
    points: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    matches_played: { type: Number, default: 0 },
    solo_pool: { type: Boolean, default: false }, // Friendly mode toggle
    is_queued: { type: Boolean, default: false }, // Spec 2.1: queue next match during cooldown
}, { timestamps: true });

// Ensure unique team name per club
TeamSchema.index({ club_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Team', TeamSchema);
