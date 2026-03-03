// Global variable to store the Socket.IO instance
let ioInstance = null;

// Function to set the Socket.IO instance
const setSocketIO = (io) => {
    ioInstance = io;
};

// Function to get the Socket.IO instance
const getSocketIO = () => {
    return ioInstance;
};

// Function to emit notifications
const emitNotification = (room, event, data) => {
    if (ioInstance) {
        ioInstance.to(room).emit(event, data);
    }
};

// Function to emit booking notifications
const emitBookingNotification = (bookingId, event, data) => {
    if (ioInstance) {
        ioInstance.to(`booking_${bookingId}`).emit(event, data);
    }
};

// Function to emit user-specific notifications
const emitUserNotification = (userId, event, data) => {
    if (ioInstance) {
        ioInstance.to(`customer_${userId}`).emit(event, data);
        ioInstance.to(`provider_${userId}`).emit(event, data);
    }
};

module.exports = {
    setSocketIO,
    getSocketIO,
    emitNotification,
    emitBookingNotification,
    emitUserNotification
};