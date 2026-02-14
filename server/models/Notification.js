const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    type: {
        type: String,
        enum: [
            'MATCH_CREATED',
            'RESULT_SUBMITTED',
            'RESULT_CONFIRMED',
            'RESULT_AUTO_CONFIRMED',
            'COOLDOWN_EXPIRED',
            'TEAM_INACTIVE',
            'UNAVAILABLE_REMINDER',
            'PARTNER_INVITED',
            'PARTNER_JOINED',
            'DISPUTE_CREATED',
            'DISPUTE_RESOLVED',
            'ADMIN_MESSAGE'
        ],
        required: true
    },

    title: { type: String, required: true },
    message: { type: String, required: true },

    // Optional references
    match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    team_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },

    read: { type: Boolean, default: false },

    // Optional action link
    action_url: { type: String },

}, { timestamps: true });

// Index for efficient queries
NotificationSchema.index({ user_id: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
