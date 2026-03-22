const mongoose = require('mongoose');

const contractTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    content: {
        type: String, // String with placeholders: {{customerName}}, {{providerName}}, etc.
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('ContractTemplate', contractTemplateSchema);
