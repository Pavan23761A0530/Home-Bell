const { testAuth } = require('./auth_test');

const BASE_URL = 'http://localhost:5002/api';

async function testAddresses() {
    console.log('--- Starting Address Test ---');

    // 1. Get Authentication Tokens
    const { customerToken } = await testAuth();
    if (!customerToken) {
        console.error('Failed to get customer token');
        return;
    }

    const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
    };

    let addressId;

    // 2. Add Address
    console.log('Adding new address...');
    const addRes = await fetch(`${BASE_URL}/addresses`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
            fullName: 'John Doe',
            phone: '1234567890',
            street: '123 Main St',
            city: 'Anytown',
            state: 'Any State',
            pincode: '123456',
            landmark: 'Near the park',
            isDefault: true
        })
    });
    const addData = await addRes.json();
    console.log('Add Address:', addData.success ? 'PASS' : 'FAIL', addData.error || '');
    if (addData.success) {
        addressId = addData.data._id;
    }

    // 3. Fetch Addresses
    console.log('Fetching addresses...');
    const getRes = await fetch(`${BASE_URL}/addresses`, {
        method: 'GET',
        headers: authHeaders
    });
    const getData = await getRes.json();
    console.log('Fetch Addresses:', getData.success && getData.count > 0 ? 'PASS' : 'FAIL', getData.error || '');

    // 4. Update Address
    if (addressId) {
        console.log(`Updating address ${addressId}...`);
        const updateRes = await fetch(`${BASE_URL}/addresses/${addressId}`, {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify({
                fullName: 'John Updated',
                city: 'Updated City'
            })
        });
        const updateData = await updateRes.json();
        console.log('Update Address:', updateData.success && updateData.data.fullName === 'John Updated' ? 'PASS' : 'FAIL', updateData.error || '');
    }

    // 5. Unauthorized request (no token)
    console.log('Testing unauthorized request...');
    const unauthRes = await fetch(`${BASE_URL}/addresses`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    const unauthData = await unauthRes.json();
    console.log('Unauthorized Request (401):', unauthRes.status === 401 ? 'PASS' : 'FAIL', unauthData.error || '');

    // 6. Delete Address
    if (addressId) {
        console.log(`Deleting address ${addressId}...`);
        const deleteRes = await fetch(`${BASE_URL}/addresses/${addressId}`, {
            method: 'DELETE',
            headers: authHeaders
        });
        const deleteData = await deleteRes.json();
        console.log('Delete Address:', deleteData.success ? 'PASS' : 'FAIL', deleteData.error || '');
    }

    console.log('--- Address Test Completed ---');
}

testAddresses();
