const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin', // Assuming you have an Admin model
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const Gallery = mongoose.model('Gallery', gallerySchema);

module.exports = Gallery;