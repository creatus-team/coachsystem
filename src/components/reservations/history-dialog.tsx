'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface ReservationHistoryProps {
    reservation: any; // TODO: Define strict type
}

export function ReservationHistoryDialog({ reservation }: ReservationHistoryProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    상세보기
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>예약 상세 정보</DialogTitle>
                    <DialogDescription>
                        예약 코드: {reservation.code}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="mb-2 text-sm font-medium text-muted-foreground">고객 정보</h4>
                            <div className="text-sm font-semibold">{reservation.client?.name}</div>
                            <div className="text-sm text-muted-foreground">{reservation.client?.email}</div>
                        </div>
                        <div>
                            <h4 className="mb-2 text-sm font-medium text-muted-foreground">예약 상태</h4>
                            <Badge variant={reservation.status === "confirm" ? "default" : "destructive"}>
                                {reservation.status === "confirm" ? "확정" : "취소됨"}
                            </Badge>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">일정 정보</h4>
                        <div className="text-sm">
                            {format(new Date(reservation.startAt), "yyyy년 MM월 dd일 (eee)", { locale: ko })}
                        </div>
                        <div className="text-2xl font-bold">
                            {format(new Date(reservation.startAt), "HH:mm", { locale: ko })} -{" "}
                            {format(new Date(reservation.endAt), "HH:mm", { locale: ko })}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            {reservation.productName}
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <h4 className="mb-4 text-sm font-medium text-muted-foreground">히스토리 (History)</h4>
                        <div className="relative border-l border-muted pl-4 ml-2 space-y-6">
                            {/* 이전 예약 (Rescheduled From) */}
                            {reservation.previous && (
                                <div className="relative">
                                    <div className="absolute -left-[21px] h-2.5 w-2.5 rounded-full bg-gray-400" />
                                    <div className="text-sm font-medium text-gray-600">이전 예약 (취소됨)</div>
                                    <div className="text-xs text-muted-foreground">
                                        {format(new Date(reservation.previous.startAt), "yyyy-MM-dd HH:mm", { locale: ko })}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        ↓ 변경됨
                                    </div>
                                </div>
                            )}

                            {/* 현재 예약 생성 */}
                            <div className="relative">
                                <div className="absolute -left-[21px] h-2.5 w-2.5 rounded-full bg-primary" />
                                <div className="text-sm font-medium">
                                    {reservation.previous ? "새로운 예약으로 변경됨" : "예약이 생성되었습니다."}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {format(new Date(reservation.createdAt), "yyyy-MM-dd HH:mm", { locale: ko })}
                                </div>
                            </div>

                            {/* 현재 예약 취소 상태 */}
                            {reservation.status === 'cancel' && (
                                <div className="relative">
                                    <div className="absolute -left-[21px] h-2.5 w-2.5 rounded-full bg-red-500" />
                                    <div className="text-sm font-medium text-red-600">예약이 취소되었습니다.</div>
                                    <div className="text-xs text-muted-foreground">
                                        {format(new Date(reservation.updatedAt), "yyyy-MM-dd HH:mm", { locale: ko })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
