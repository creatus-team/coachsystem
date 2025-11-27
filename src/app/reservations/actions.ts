'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { whattimeApi } from "@/lib/whattime";

// 서버 액션: 동기화 트리거
export async function syncReservations() {
    console.log('🔄 Sync started...');

    try {
        const me = await whattimeApi.getMe();
        let reservations;

        // 조직 코드가 있으면 조직 전체 예약 가져오기
        if (me.organization && me.organization.code) {
            console.log(`🏢 Fetching organization reservations for ${me.organization.code}`);
            reservations = await whattimeApi.getOrganizationReservations(me.organization.code);
        } else {
            console.log(`👤 Fetching user reservations for ${me.code}`);
            reservations = await whattimeApi.getReservations(me.code);
        }

        console.log(`✅ Fetched ${reservations.length} reservations.`);

        for (const item of reservations) {
            // API 응답 구조가 중첩되어 있음 (schedule, product, calendar 객체 내부)
            const schedule = item.schedule;
            const product = item.product;
            const calendar = item.calendar;

            // 이메일이 없으면 가짜 이메일 생성 (데이터 누락 방지)
            const email = schedule?.email || `no-email-${item.code}@example.com`;
            const name = schedule?.name || '이름 없음';
            const status = schedule?.status || 'confirm'; // 기본값 confirm (또는 unknown)

            // 상품명: product.name 또는 calendar.name 사용
            const productName = product?.name || calendar?.name || 'Unknown Product';

            // 고객 정보 업데이트
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

            // 예약 정보 업데이트
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
        }

        revalidatePath('/reservations');
    } catch (error) {
        console.error('❌ Sync failed:', error);
        throw error;
    }
}
