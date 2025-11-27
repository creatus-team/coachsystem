import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { RefreshCw } from "lucide-react";
import { revalidatePath } from "next/cache";
import { whattimeApi } from "@/lib/whattime";
import { ReservationHistoryDialog } from "@/components/reservations/history-dialog";
import { SyncButton } from "@/components/reservations/sync-button";
import { AutoRefresh } from "@/components/reservations/auto-refresh";

import { syncReservations } from "@/app/reservations/actions";

export default async function ReservationsPage() {
    // 1. DB에서 예약 내역 조회
    // next(다음 예약)가 없는 것만 조회 = 최신 예약이거나, 변경되지 않은 예약
    const reservations = await prisma.reservation.findMany({
        where: {
            next: null
        },
        orderBy: { startAt: 'desc' },
        include: {
            client: true, // 고객 정보 포함
            previous: true // 이전 예약 정보 포함 (변경 이력 표시용)
        }
    });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">예약 관리</h1>
                <div className="flex items-center gap-2">
                    <AutoRefresh />
                    <form action={syncReservations}>
                        <SyncButton />
                    </form>
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>예약일시</TableHead>
                            <TableHead>상품명</TableHead>
                            <TableHead>고객명</TableHead>
                            <TableHead>상태</TableHead>
                            <TableHead className="text-right">관리</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reservations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    예약 내역이 없습니다. 동기화 버튼을 눌러보세요.
                                </TableCell>
                            </TableRow>
                        ) : (
                            reservations.map((res) => (
                                <TableRow key={res.code}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {format(res.startAt, "yyyy-MM-dd (eee)", { locale: ko })}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(res.startAt, "HH:mm", { locale: ko })} -{" "}
                                                {format(res.endAt, "HH:mm", { locale: ko })}
                                            </span>
                                            {/* 변경된 예약인 경우 표시 */}
                                            {res.previous && (
                                                <span className="text-[10px] text-blue-600 mt-1">
                                                    (기존: {format(res.previous.startAt, "MM/dd HH:mm")}에서 변경됨)
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{res.productName}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{res.client?.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {res.client?.email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={res.status === "confirm" ? "default" : "destructive"}
                                        >
                                            {res.status === "confirm" ? "확정" : "취소됨"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ReservationHistoryDialog reservation={res} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
