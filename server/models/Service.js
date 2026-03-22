const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceCategory',
        required: true
    },
    description: String,
    basePrice: Number,
    image: String
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

serviceSchema.virtual('price').get(function () {
    return this.basePrice;
});

serviceSchema.virtual('categoryId').get(function () {
    return this.category;
});

module.exports = mongoose.model('Service', serviceSchema);
