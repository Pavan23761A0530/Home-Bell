const mongoose = require('mongoose');

const serviceCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: String,
    icon: String // URL or icon name
});

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema);
