require('dotenv').config();
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const jwt = require('jsonwebtoken');  // Added missing jwt import

// Load env vars

dotenv.config({ path: path.resolve(__dirname, '.env') });
console.log('Groq key loaded:', !!process.env.GROQ_API_KEY);

const { initEmailTransporter } = require('./services/sendOTP');
initEmailTransporter();

// Connect to database
connectDB().catch(() => {
    console.error('Database connection failed');
});

const app = express();
const User = require('./models/User');

// Body parser
app.use(express.json());
app.use(cookieParser());

// Enable CORS with credentials support
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        // Check against environment variable and default dev origins
        const allowedOrigins = [
            process.env.CLIENT_URL,
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174"
        ];
        
        if (
            allowedOrigins.includes(origin) ||
            (process.env.NODE_ENV === 'development' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))
        ) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route files
const auth = require('./routes/auth');
const providers = require('./routes/providers');
const services = require('./routes/services');
const bookings = require('./routes/bookings');
const admin = require('./routes/admin');
const users = require('./routes/users');
const reviews = require('./routes/reviews');
const notifications = require('./routes/notifications');
const workers = require('./routes/workers');
const addresses = require('./routes/addressRoutes');

// Mount routers
app.use('/api/auth', auth);
app.use('/api/providers', providers);
app.use('/api/services', services);
app.use('/api/bookings', bookings);
app.use('/api/users', users);
app.use('/api/reviews', reviews);
app.use('/api/notifications', notifications);
app.use('/api/workers', workers);
app.use('/api/addresses', addresses);
app.use('/api/ai', require('./routes/ai'));

app.use('/api/admin/auth', require('./routes/adminAuth'));
app.use('/api/admin', admin);

const PORT = process.env.PORT || 5000;

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Socket.IO connection handler
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return next(new Error("Authentication error"));
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return next(new Error("User not found"));
        }
        
        socket.user = user;
        next();
    } catch (err) {
        return next(new Error("Authentication error"));
    }
});

io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected to socket`);
    
    // Join rooms based on user role
    if (socket.user.role === 'provider') {
        socket.join(`provider_${socket.user._id}`);
        socket.join('providers');
    } else if (socket.user.role === 'customer') {
        socket.join(`customer_${socket.user._id}`);
        socket.join('customers');
    } else if (socket.user.role === 'admin') {
        socket.join('admin');
    } else if (socket.user.role === 'worker') {
        socket.join(`worker_${socket.user._id}`);
        socket.join('workers');
    }
    
    // Listen for booking updates
    socket.on('join_booking_room', (bookingId) => {
        socket.join(`booking_${bookingId}`);
        console.log(`User joined booking room: ${bookingId}`);
    });
    
    socket.on('disconnect', () => {
        console.log(`User ${socket.user.name} disconnected`);
    });
});

server.listen(PORT, () => {
    const env = process.env.NODE_ENV || 'development';
    console.log(`Server running in ${env} mode on port ${PORT}`);
});

// Initialize socket utility
const { setSocketIO } = require('./utils/socketUtil');
setSocketIO(io);

// Export io for use in other modules
module.exports.io = io;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
