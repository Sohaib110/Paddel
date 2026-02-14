const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
    club_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    name: { type: String, required: true }, // Unique index to be applied
    captain_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    player_2_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Null until accepted

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
}, { timestamps: true });

// Ensure unique team name per club
TeamSchema.index({ club_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Team', TeamSchema);
