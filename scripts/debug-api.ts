import 'dotenv/config';
import axios from 'axios';

const API_KEY = process.env.WHATTIME_API_KEY;
const client = axios.create({
    baseURL: 'https://api.whattime.co.kr/v1',
    headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
    },
});

async function main() {
    console.log('🔍 Debugging WhatTime API...');

    try {
        // 1. Try default /schedules/recent (kind=confirm by default)
        console.log('\n1️⃣ Testing /schedules/recent (default)...');
        const res1 = await client.get('/schedules/recent');
        console.log(`   Status: ${res1.status}`);
        console.log(`   Count: ${Array.isArray(res1.data) ? res1.data.length : 'Not an array'}`);
        if (Array.isArray(res1.data) && res1.data.length > 0) {
            console.log(`   First item: ${res1.data[0].name} (${res1.data[0].status})`);
        }

        // 2. Try kind=cancel
        console.log('\n2️⃣ Testing /schedules/recent?kind=cancel...');
        const res2 = await client.get('/schedules/recent', { params: { kind: 'cancel' } });
        console.log(`   Status: ${res2.status}`);
        console.log(`   Count: ${Array.isArray(res2.data) ? res2.data.length : 'Not an array'}`);

        // 0. Get Me (Full)
        console.log('\n0️⃣ Fetching User Info...');
        const meRes = await client.get('/users/me');
        console.log(`   Role: ${meRes.data.resource.role}`);
        console.log(JSON.stringify(meRes.data, null, 2));

        // 1. Try to list ALL users (to get other coaches)
        console.log('\n1️⃣ Testing /users (List all users)...');
        try {
            const usersRes = await client.get('/users'); // 추측: 유저 리스트 조회
            console.log(`   Status: ${usersRes.status}`);
            console.log(`   Count: ${usersRes.data.collection?.length}`);

            if (usersRes.data.collection?.length > 0) {
                // 1. Find a confirmed reservation
                const confirmed = usersRes.data.collection.find((i: any) => i.schedule?.status === 'confirm' || i.status === 'confirm');
                if (confirmed) {
                    console.log('\n   ✅ Confirmed Item Structure:');
                    console.log(JSON.stringify(confirmed, null, 2));
                }

                // 2. Find a cancelled reservation
                const cancelled = usersRes.data.collection.find((i: any) => i.schedule?.status === 'cancel' || i.status === 'cancel');
                if (cancelled) {
                    console.log('\n   ❌ Cancelled Item Structure:');
                    console.log(JSON.stringify(cancelled, null, 2));
                } else {
                    console.log('\n   ⚠️ No cancelled reservations found in the first batch.');
                    // Try to find ANY item that is NOT confirm
                    const other = usersRes.data.collection.find((i: any) => (i.schedule?.status && i.schedule?.status !== 'confirm'));
                    if (other) {
                        console.log('\n   ❓ Other Status Item:', JSON.stringify(other, null, 2));
                    }
                }
            }
            if (usersRes.data.collection) {
                usersRes.data.collection.forEach((u: any) => {
                    console.log(`   - [${u.role}] ${u.name} (${u.email}) code: ${u.code}`);
                });
            }
        } catch (e: any) {
            console.log(`   Error: ${e.response?.status} ${e.response?.statusText}`);
        }

        // 2. Try /reservations without params again (check error message detail)
        console.log('\n2️⃣ Testing /reservations (no params)...');
        try {
            const res = await client.get('/reservations');
        } catch (e: any) {
            console.log(`   Error: ${e.response?.status}`);
            console.log(`   Message: ${JSON.stringify(e.response?.data)}`);
        }

        // 3. Try /reservations with organization param
        console.log('\n3️⃣ Testing /reservations with organization param...');
        try {
            // me 변수가 상위 스코프에 정의되어 있어야 함.
            // 만약 위에서 정의되지 않았다면 다시 가져옴.
            const meRes2 = await client.get('/users/me');
            const me = meRes2.data.resource;

            const orgUri = `https://api.whattime.co.kr/v1/organizations/${me.organization.code}`;
            console.log(`   Org URI: ${orgUri}`);
            const res3 = await client.get('/reservations', {
                params: { organization: orgUri }
            });
            console.log(`   Status: ${res3.status}`);
            console.log(`   Count: ${res3.data.collection?.length}`);

            if (res3.data.collection?.length > 0) {
                // Check for specific items
                const unknownProductCode = '77cy1qSP6r';
                const missingCancelledCode = '14YPd3XNak';

                const unknownItem = res3.data.collection.find((i: any) => i.code === unknownProductCode);
                if (unknownItem) {
                    console.log(`\n   ❓ Unknown Product Item (${unknownProductCode}):`);
                    console.log(JSON.stringify(unknownItem, null, 2));
                } else {
                    console.log(`\n   ⚠️ Item ${unknownProductCode} NOT found in API response.`);
                }

                const missingItem = res3.data.collection.find((i: any) => i.code === missingCancelledCode);
                if (missingItem) {
                    console.log(`\n   ❓ Missing Cancelled Item (${missingCancelledCode}):`);
                    console.log(JSON.stringify(missingItem, null, 2));
                } else {
                    console.log(`\n   ⚠️ Item ${missingCancelledCode} NOT found in API response.`);
                }
                // 1. Find a confirmed reservation
                const confirmed = res3.data.collection.find((i: any) => i.schedule?.status === 'confirm' || i.status === 'confirm');
                if (confirmed) {
                    console.log('\n   ✅ Confirmed Item Structure:');
                    console.log(JSON.stringify(confirmed, null, 2));
                }

                // 2. Find a cancelled reservation
                const cancelled = res3.data.collection.find((i: any) => i.schedule?.status === 'cancel' || i.status === 'cancel');
                if (cancelled) {
                    console.log('\n   ❌ Cancelled Item Structure:');
                    console.log(JSON.stringify(cancelled, null, 2));
                } else {
                    console.log('\n   ⚠️ No cancelled reservations found in the first batch.');
                    // Try to find ANY item that is NOT confirm
                    const other = res3.data.collection.find((i: any) => (i.schedule?.status && i.schedule?.status !== 'confirm'));
                    if (other) {
                        console.log('\n   ❓ Other Status Item:', JSON.stringify(other, null, 2));
                    }
                }
            }
        } catch (e: any) {
            console.log(`   Error: ${e.response?.status} ${e.response?.statusText}`);
            console.log(`   Data: ${JSON.stringify(e.response?.data)}`);
        }
    } catch (error) {
        console.error('❌ Fatal error:', error);
    }
}

main();
