const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    phone_number: { type: String },
    website_link: { type: String },
    settings: {
        allow_mixed_gender: { type: Boolean, default: true },
        currency: { type: String, default: 'USD' }
    },
    admin_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Club', ClubSchema);
