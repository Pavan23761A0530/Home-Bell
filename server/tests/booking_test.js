const BASE_URL = 'http://localhost:5000/api';

async function testBookingFlow() {
    console.log('--- Starting Booking Flow Test ---');

    // 1. Get a Service ID
    const resServices = await fetch(`${BASE_URL}/services`);
    const dataServices = await resServices.json();
    if (!dataServices.success || dataServices.data.length === 0) {
        console.log('FAIL: No services found. Seed DB first.');
        return;
    }
    const service = dataServices.data[0];
    console.log(`Target Service: ${service.name} (ID: ${service._id})`);

    // 2. Register/Login a Provider and Update their Location + Services
    const providerEmail = `prov_book_${Date.now()}@test.com`;
    // Register
    const resProvReg = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Nearby Provider',
            email: providerEmail,
            password: 'password123',
            role: 'provider'
        })
    });
    const dataProvReg = await resProvReg.json();
    const provToken = dataProvReg.token;

    // Update Provider Profile: Set Location to NYC (Test Point) and Add Service
    // Location: 40.7128° N, 74.0060° W
    const updatePayload = {
        lat: 40.7128,
        lng: -74.0060,
        address: 'New York, NY',
        servicesOffered: [{
            service: service._id,
            category: service.category,
            hourlyRate: 50,
            pricingType: 'hourly'
        }],
        availability: true,
        isVerified: true // Important: Auto-assignment requires verification
    };

    console.log('Updating Provider Profile...');
    const resProvUpdate = await fetch(`${BASE_URL}/providers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provToken}`
        },
        body: JSON.stringify(updatePayload)
    });
    const dataProvUpdate = await resProvUpdate.json();
    if (!dataProvUpdate.success) {
        console.log('FAIL: Provider Update Failed', dataProvUpdate.error);
        return;
    }
    console.log('Provider Authenticated & Located in NYC.');

    // 3. Register/Login Customer
    const customerEmail = `cust_book_${Date.now()}@test.com`;
    const resCustReg = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Booking Customer',
            email: customerEmail,
            password: 'password123',
            role: 'customer'
        })
    });
    const dataCustReg = await resCustReg.json();
    const custToken = dataCustReg.token;

    // 4. Customer Creates Booking (Nearby)
    const bookingPayload = {
        serviceId: service._id,
        scheduledDate: new Date().toISOString(),
        address: {
            street: '123 Broadway',
            city: 'New York',
            state: 'NY',
            zip: '10001'
        },
        description: 'Need help asap',
        lat: 40.7130, // Very close to provider
        lng: -74.0065
    };

    console.log('Creating Booking...');
    const resBooking = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${custToken}`
        },
        body: JSON.stringify(bookingPayload)
    });
    const dataBooking = await resBooking.json();

    if (dataBooking.success) {
        console.log('Booking Created: PASS');
        console.log(`Booking ID: ${dataBooking.data._id}`);
        console.log(`Assigned Provider ID: ${dataBooking.data.provider}`);
        console.log(`Status: ${dataBooking.data.status}`);

        if (dataBooking.data.status === 'assigned') {
            console.log('Auto-Assignment: SUCCESS');
        } else {
            console.log('Auto-Assignment: CHECK STATUS (Expected assigned)');
        }
    } else {
        console.log('FAIL: Booking Creation Failed', dataBooking.error);
    }
}

if (require.main === module) {
    testBookingFlow();
}
