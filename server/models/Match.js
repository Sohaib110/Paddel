const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
    club_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    team_a_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    team_b_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },

    status: {
        type: String,
        enum: ['PROPOSED', 'ACCEPTED', 'SCHEDULED', 'AWAITING_CONFIRMATION', 'COMPLETED', 'DISPUTED'],
        default: 'PROPOSED'
    },

    mode: {
        type: String,
        enum: ['COMPETITIVE', 'FRIENDLY'],
        default: 'COMPETITIVE'
    },

    // Result Logic
    result: { type: String, enum: ['WIN', 'LOSS'] }, // From Team A perspective
    score: { type: String }, // Optional score string (e.g. "6-4 6-4")
    submitted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    confirmation_deadline: { type: Date }, // 48 hours from submission

    week_cycle: { type: Number, required: true }, // For "One match per 7-day cycle" tracking
    match_deadline: { type: Date }, // 7 days from match creation (spec 1.3 step 8)

}, { timestamps: true });

module.exports = mongoose.model('Match', MatchSchema);
