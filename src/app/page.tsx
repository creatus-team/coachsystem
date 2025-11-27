import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";

async function getDashboardStats() {
  // 1. 오늘의 예약 건수
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayReservations = await prisma.reservation.count({
    where: {
      startAt: {
        gte: today,
        lt: tomorrow,
      },
      status: 'confirm',
    },
  });

  // 2. 소멸 임박 고객 (잔여 횟수 > 0 이고 만료일이 3일 이내)
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  const expiringClients = await prisma.clientProfile.count({
    where: {
      remainingSessions: { gt: 0 },
      expiresAt: {
        lte: threeDaysLater,
        gte: new Date(), // 이미 만료된 건 제외
      },
    },
  });

  // 3. 이번 달 확정된 세션 수 (매출 추정용)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthlySessions = await prisma.reservation.count({
    where: {
      startAt: { gte: startOfMonth },
      status: 'confirm',
    },
  });

  return {
    todayReservations,
    expiringClients,
    monthlySessions,
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">대시보드</h2>
        <p className="text-muted-foreground">
          코칭 시스템의 현재 상황을 한눈에 확인하세요.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘의 예약</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayReservations}건</div>
            <p className="text-xs text-muted-foreground">
              오늘 진행 예정인 코칭
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">소멸 임박 고객</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.expiringClients}명
            </div>
            <p className="text-xs text-muted-foreground">
              3일 내 세션 소멸 예정
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 진행</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlySessions}회</div>
            <p className="text-xs text-muted-foreground">
              11월 누적 코칭 횟수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 고객</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--명</div>
            <p className="text-xs text-muted-foreground">
              등록된 활성 고객 수
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>최근 예약 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              최근 예약 내역 리스트가 여기에 표시됩니다.
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>승인 대기 요청</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              승인 대기 중인 요청이 없습니다.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
