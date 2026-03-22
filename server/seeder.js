const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ServiceCategory = require('./models/ServiceCategory');
const Service = require('./models/Service');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to DB
connectDB();

const categories = [
    {
        name: 'Cleaning',
        description: 'Home and office cleaning services',
        icon: 'Sparkles'
    },
    {
        name: 'Plumbing',
        description: 'Pipe repair and installation',
        icon: 'Wrench'
    },
    {
        name: 'Electrical',
        description: 'Wiring and electrical repairs',
        icon: 'Zap'
    },
    {
        name: 'Moving',
        description: 'Relocation and shifting services',
        icon: 'Truck'
    }
];

const importData = async () => {
    try {
        await ServiceCategory.deleteMany();
        await Service.deleteMany();

        console.log('Data Destroyed...');

        const createdCategories = await ServiceCategory.insertMany(categories);

        const services = [
            {
                name: 'Standard Home Cleaning',
                category: createdCategories[0]._id, // Cleaning
                description: 'Full house cleaning including dusting, mopping, and vacuuming.',
                basePrice: 80,
                image: 'cleaning.jpg'
            },
            {
                name: 'Deep Cleaning',
                category: createdCategories[0]._id, // Cleaning
                description: 'Intensive cleaning for move-in/move-out.',
                basePrice: 150,
                image: 'deep-clean.jpg'
            },
            {
                name: 'Pipe Leak Repair',
                category: createdCategories[1]._id, // Plumbing
                description: 'Fixing leaking pipes and joints.',
                basePrice: 60,
                image: 'plumbing.jpg'
            },
            {
                name: 'Switch Installation',
                category: createdCategories[2]._id, // Electrical
                description: 'Install or replace electrical switches.',
                basePrice: 40,
                image: 'electric.jpg'
            }
        ];

        await Service.insertMany(services);

        console.log('Data Imported!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await ServiceCategory.deleteMany();
        await Service.deleteMany();

        console.log('Data Destroyed!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
