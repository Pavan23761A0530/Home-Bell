// Native fetch is available in Node 18+
const BASE_URL = 'http://localhost:5002/api';


async function testAuth() {
    console.log('--- Starting Auth Test ---');

    // 1. Register Customer
    const customerEmail = `cust_${Date.now()}@test.com`;
    console.log(`Registering Customer: ${customerEmail}`);
    const resCust = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test Customer',
            email: customerEmail,
            password: 'password123',
            role: 'customer'
        })
    });
    const dataCust = await resCust.json();
    console.log('Customer Register:', dataCust.success ? 'PASS' : 'FAIL', dataCust.error || '');

    // 2. Register Provider
    const providerEmail = `prov_${Date.now()}@test.com`;
    console.log(`Registering Provider: ${providerEmail}`);
    const resProv = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test Provider',
            email: providerEmail,
            password: 'password123',
            role: 'provider'
        })
    });
    const dataProv = await resProv.json();
    console.log('Provider Register:', dataProv.success ? 'PASS' : 'FAIL', dataProv.error || '');

    // 3. Login Provider to check Token
    // Actually register returns token, but let's test login
    const resLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: providerEmail, password: 'password123' })
    });
    const dataLogin = await resLogin.json();
    console.log('Provider Login:', dataLogin.success ? 'PASS' : 'FAIL');

    return {
        customerToken: dataCust.token,
        providerToken: dataProv.token,
        providerId: dataProv.user.id
    };
}

// Run if called directly
if (require.main === module) {
    testAuth();
}

module.exports = { testAuth };
