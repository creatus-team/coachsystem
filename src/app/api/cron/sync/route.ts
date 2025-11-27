import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { whattimeApi } from '@/lib/whattime';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic'; // 캐싱 방지

export async function GET(request: Request) {
    try {
        // 1. 보안 검증 (간단한 API Key 방식)
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        // 환경변수 CRON_SECRET과 비교 (없으면 기본값 사용 - 개발용)
        const secret = process.env.CRON_SECRET || 'dev-secret-key';

        if (key !== secret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('⏰ Cron sync started...');

        // 2. 동기화 로직 (actions.ts와 동일한 로직 재사용)
        const me = await whattimeApi.getMe();
        let reservations;

        if (me.organization && me.organization.code) {
            reservations = await whattimeApi.getOrganizationReservations(me.organization.code);
        } else {
            reservations = await whattimeApi.getReservations(me.code);
        }

        let syncedCount = 0;

        for (const item of reservations) {
            const schedule = item.schedule;
            const product = item.product;
            const calendar = item.calendar;

            const email = schedule?.email || `no-email-${item.code}@example.com`;
            const name = schedule?.name || '이름 없음';
            const status = schedule?.status || 'confirm';
            const productName = product?.name || calendar?.name || 'Unknown Product';

            const client = await prisma.user.upsert({
                where: { email: email },
                update: { name: name },
                create: {
                    email: email,
                    name: name,
                    role: 'CLIENT',
                    clientProfile: {
                        create: { totalSessions: 0, remainingSessions: 0 }
                    }
                }
            });

            await prisma.reservation.upsert({
                where: { code: item.code },
                update: {
                    status: status,
                    productName: productName,
                    startAt: new Date(item.start_at),
                    endAt: new Date(item.end_at),
                },
                create: {
                    code: item.code,
                    clientId: client.id,
                    productName: productName,
                    startAt: new Date(item.start_at),
                    endAt: new Date(item.end_at),
                    status: status,
                }
            });
            syncedCount++;
        }

        // 3. 캐시 갱신
        revalidatePath('/reservations');

        return NextResponse.json({
            success: true,
            message: `Synced ${syncedCount} reservations`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Cron sync failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
