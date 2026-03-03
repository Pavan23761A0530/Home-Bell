const BASE_URL = 'http://localhost:5000/api';

async function testProviderProfile() {
    console.log('--- Starting Provider Profile Test ---');

    // 1. Register new Provider
    const providerEmail = `prov_prof_${Date.now()}@test.com`;
    console.log(`Registering Provider: ${providerEmail}`);
    const resProv = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Profile Test Provider',
            email: providerEmail,
            password: 'password123',
            role: 'provider'
        })
    });
    const dataProv = await resProv.json();

    if (!dataProv.success) {
        console.log('Registration Failed:', dataProv.error);
        return;
    }

    const token = dataProv.token;
    const userId = dataProv.user.id;

    // 2. Check if Profile exists (We need an endpoint or check DB indirectly via login/me if it returns profile)
    // The current /auth/me only returns User. 
    // Let's try to fetch via a provider endpoint or just assume if no error in register, it might be there.
    // Better: Add an endpoint to get my profile in provider.js or use existing one.
    // Existing provider.js has `getProviders`. We can fetch all and find ours.

    console.log(`Fetching all providers to find ${userId}`);
    const resProfiles = await fetch(`${BASE_URL}/providers`);
    const dataProfiles = await resProfiles.json();

    if (dataProfiles.success) {
        const myProfile = dataProfiles.data.find(p => p.user._id === userId || p.user === userId);
        if (myProfile) {
            console.log('Provider Profile Found: PASS');
            console.log('Profile ID:', myProfile._id);
        } else {
            console.log('Provider Profile Found: FAIL - Not in list');
        }
    } else {
        console.log('Fetch Providers Failed:', dataProfiles.error);
    }
}

if (require.main === module) {
    testProviderProfile();
}
