const mongoose = require('mongoose');

const DisputeSchema = new mongoose.Schema({
    club_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true,
        index: true
    },
    match_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true,
        unique: true // One dispute per match
    },

    disputed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    disputing_team_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },

    reason: {
        type: String,
        required: true,
        maxlength: 500
    },

    status: {
        type: String,
        enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'],
        default: 'PENDING'
    },

    // Admin resolution
    resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    admin_notes: { type: String },
    resolution: {
        type: String,
        enum: ['UPHOLD_ORIGINAL', 'REVERSE_RESULT', 'VOID_MATCH', 'OTHER']
    },
    resolved_at: { type: Date },

    // Final decision data
    final_result: { type: String, enum: ['WIN', 'LOSS'] }, // From Team A perspective
    final_score: { type: String },

}, { timestamps: true });

// Indexes
DisputeSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Dispute', DisputeSchema);
