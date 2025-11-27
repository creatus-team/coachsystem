import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { whattimeApi } from '../src/lib/whattime';

async function main() {
    console.log("🚀 Starting sync process...");

    try {
        // 1. 내 정보 가져오기
        const me = await whattimeApi.getMe();
        console.log(`✅ Authenticated as: ${me.name} (${me.code})`);

        // 2. 예약 내역 가져오기
        console.log("📥 Fetching reservations...");
        let reservations;

        if (me.organization && me.organization.code) {
            console.log(`🏢 Fetching organization reservations for ${me.organization.code}`);
            reservations = await whattimeApi.getOrganizationReservations(me.organization.code);
        } else {
            console.log(`👤 Fetching user reservations for ${me.code}`);
            reservations = await whattimeApi.getReservations(me.code);
        }

        console.log(`✅ Fetched ${reservations.length} reservations.`);

        // 3. 데이터베이스 동기화
        for (const res of reservations) {
            console.log(`Processing ${res.code} (${res.schedule?.name})...`);
            const schedule = res.schedule;
            const product = res.product;
            const calendar = res.calendar;

            const email = schedule?.email;
            const name = schedule?.name || '이름 없음';
            const status = schedule?.status || 'confirm';
            const productName = product?.name || calendar?.name || 'Unknown Product';

            // 3-1. 고객 정보 저장 (User & ClientProfile)
            // 이메일이 없는 경우 처리 (예: 전화번호로 대체하거나 스킵)
            if (!email) {
                console.warn(`⚠️ Skipping reservation ${res.code}: No email provided.`);
                continue;
            }

            const client = await prisma.user.upsert({
                where: { email: email },
                update: { name: name },
                create: {
                    email: email,
                    name: name,
                    role: 'CLIENT',
                    clientProfile: {
                        create: { totalSessions: 0, remainingSessions: 0 },
                    },
                },
            });

            // 3-2. 예약 정보 저장 (Reservation)
            await prisma.reservation.upsert({
                where: { code: res.code },
                update: {
                    status: status,
                    productName: productName,
                    startAt: new Date(res.start_at),
                    endAt: new Date(res.end_at),
                },
                create: {
                    code: res.code,
                    clientId: client.id,
                    productName: productName,
                    startAt: new Date(res.start_at),
                    endAt: new Date(res.end_at),
                    status: status,
                },
            });
        }

        console.log("✅ Sync completed successfully.");
    } catch (error) {
        console.error("❌ Sync failed:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
