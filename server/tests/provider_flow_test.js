const BASE_URL = 'http://localhost:5000/api';

async function testProviderJobFlow() {
    console.log('--- Starting Provider Job Flow Test ---');

    // 1. We need a booking first. Re-use logic or create new.
    // For speed, let's create a fresh flow
    // A. Register Provider
    const providerEmail = `prov_job_${Date.now()}@test.com`;
    const resProvReg = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Job Provider', email: providerEmail, password: 'password123', role: 'provider' })
    });
    const dataProvReg = await resProvReg.json();
    const provToken = dataProvReg.token;
    const provId = dataProvReg.user.id;

    // B. Get Service
    const resServices = await fetch(`${BASE_URL}/services`);
    const dataServices = await resServices.json();
    const service = dataServices.data[0];

    // C. Update Provider Profile (Location + Service)
    await fetch(`${BASE_URL}/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provToken}` },
        body: JSON.stringify({
            lat: 40.7128, lng: -74.0060, address: 'NY', availability: true, isVerified: true,
            servicesOffered: [{ service: service._id, category: service.category, pricingType: 'fixed', fixedRate: 100 }]
        })
    });

    // D. Customer Booking
    const customerEmail = `cust_job_${Date.now()}@test.com`;
    const resCustReg = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Job Customer', email: customerEmail, password: 'password123', role: 'customer' })
    });
    const dataCustReg = await resCustReg.json();
    const custToken = dataCustReg.token;

    const resBooking = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${custToken}` },
        body: JSON.stringify({
            serviceId: service._id, scheduledDate: new Date().toISOString(),
            address: { street: '123 Broadway', city: 'NY', state: 'NY', zip: '10001' },
            description: 'Please accept', lat: 40.7130, lng: -74.0065
        })
    });
    const dataBooking = await resBooking.json();
    const bookingId = dataBooking.data._id;
    console.log(`Booking Created: ${bookingId}, Status: ${dataBooking.data.status}`);

    // FLOW TEST STARTS HERE

    // 2. Provider Gets Bookings (Dashboard check)
    // Provider should see this booking where provider == their Id
    console.log('Fetching Provider Bookings...');
    const resProvBookings = await fetch(`${BASE_URL}/bookings`, {
        headers: { 'Authorization': `Bearer ${provToken}` }
    });
    const dataProvBookings = await resProvBookings.json();

    const myBooking = dataProvBookings.data.find(b => b._id === bookingId);
    if (myBooking) {
        console.log('Provider sees booking: PASS');
    } else {
        console.log('Provider sees booking: FAIL');
        return;
    }

    // 3. Provider Accepts Booking (Status: assigned -> accepted)
    // Note: In our logic, 'assigned' means auto-assigned. Provider "Accepting" confirms it.
    // If they reject, we'd need re-assignment (not testing here).
    console.log('Provider Accepting Job...');
    const resAccept = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provToken}` },
        body: JSON.stringify({ status: 'accepted' })
    });
    const dataAccept = await resAccept.json();

    if (dataAccept.success && dataAccept.data.status === 'accepted') {
        console.log('Job Accepted: PASS');
    } else {
        console.log('Job Accepted: FAIL', dataAccept.error);
    }

    // 4. Provider Completes Job
    console.log('Provider Completing Job...');
    const resComplete = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provToken}` },
        body: JSON.stringify({ status: 'completed' })
    });
    const dataComplete = await resComplete.json();

    if (dataComplete.success && dataComplete.data.status === 'completed') {
        console.log('Job Completed: PASS');
    } else {
        console.log('Job Completed: FAIL', dataComplete.error);
    }
}

if (require.main === module) {
    testProviderJobFlow();
}
