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

        // 2. 예약 변경(Reschedule) 연결 로직 (Heuristic Matching)
        // 방금 처리한 예약들 중 'confirm' 상태인 것들을 대상으로 검사
        for (const item of reservations) {
            const schedule = item.schedule;
            if (schedule?.status !== 'confirm') continue;

            // 현재 예약 (DB에서 최신 정보 가져오기)
            const currentRes = await prisma.reservation.findUnique({
                where: { code: item.code },
                include: { previous: true }
            });

            // 이미 연결된 예약이면 패스
            if (!currentRes || currentRes.previous) continue;

            // 매칭 후보 찾기: 동일 고객, 동일 상품, 'cancel' 상태, 아직 연결 안 된 것
            // 시간 범위: 최근 24시간 내에 DB에 생성/수정된 취소 건 (넉넉하게 잡음)
            const candidate = await prisma.reservation.findFirst({
                where: {
                    clientId: currentRes.clientId,
                    productName: currentRes.productName,
                    status: 'cancel',
                    next: null, // 아직 다른 예약의 '이전'으로 연결되지 않은 것
                    code: { not: currentRes.code }, // 자기 자신 제외
                    // 간단한 휴리스틱: 최근에 업데이트된 취소 건을 찾음
                    updatedAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24시간 이내
                    }
                },
                orderBy: { updatedAt: 'desc' } // 가장 최근 취소 건
            });

            if (candidate) {
                console.log(`🔗 Linking Reschedule: ${candidate.code} (Cancel) -> ${currentRes.code} (New)`);
                await prisma.reservation.update({
                    where: { code: currentRes.code },
                    data: { previousCode: candidate.code }
                });
            }
        }

        revalidatePath('/reservations');
    } catch (error) {
        console.error('❌ Sync failed:', error);
        throw error;
    }
}
