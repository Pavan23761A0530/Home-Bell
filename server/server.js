require('dotenv').config();
const cors = require('cors');
const express = require('express');
const dotenv = require('dotenv');

const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const http = require('http');
const fs = require('fs');
const { Server } = require('socket.io');
const path = require('path');
const jwt = require('jsonwebtoken');  // Added missing jwt import

// Load env vars

dotenv.config({ path: path.resolve(__dirname, '.env') });
console.log('[System] Groq key loaded:', !!process.env.GROQ_API_KEY);
console.log('[System] Razorpay Key ID loaded:', !!process.env.RAZORPAY_KEY_ID);
console.log('[System] Razorpay Key Secret loaded:', !!process.env.RAZORPAY_KEY_SECRET);

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
const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        // Trim trailing slashes for safe comparison
        const cleanOrigin = origin.replace(/\/$/, "");
        const allowedCleanOrigins = allowedOrigins.map(url => url ? url.replace(/\/$/, "") : url);
        
        if (
            allowedCleanOrigins.includes(cleanOrigin) ||
            process.env.NODE_ENV === 'production' || 
            cleanOrigin.endsWith('.onrender.com') || // Explicitly allow Render frontends
            (process.env.NODE_ENV === 'development' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))
        ) {
            return callback(null, true);
        }
        
        console.error(`[CORS Blocked] Origin missing from whitelist: ${origin}`);
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
const payments = require('./routes/payments');
const coupons = require('./routes/coupons');

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
app.use('/api/payment', payments);
app.use('/api/coupons', coupons);
app.use('/api/ai', require('./routes/ai'));

app.use('/api/admin/auth', require('./routes/adminAuth'));
app.use('/api/admin', admin);

// Static serving for frontend build
const buildPath = path.join(__dirname, "../client/dist");
const rootBuildPath = path.join(process.cwd(), "client/dist");

// Check which path exists and use it
const finalBuildPath = fs.existsSync(buildPath) ? buildPath : rootBuildPath;
console.log(`[Static] Serving frontend from: ${finalBuildPath}`);
app.use(express.static(finalBuildPath));

// Catch-all route to serve index.html for SPA (React Router)
app.get("*", (req, res) => {
    // Do NOT interfere with API routes (keep /api/* untouched)
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API route not found' });
    }
    
    const indexPath = path.resolve(finalBuildPath, "index.html");
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error(`[Static Error] Failed to send index.html from ${indexPath}: ${err.message}`);
            res.status(404).send("Frontend build not found. If using separate services on Render, please configure Redirects/Rewrites in the dashboard.");
        }
    });
});

const PORT = process.env.PORT || 5000;

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? true : (process.env.CLIENT_URL || "http://localhost:3000"),
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
