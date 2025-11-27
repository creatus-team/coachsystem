"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh() {
    const router = useRouter();

    useEffect(() => {
        // 1분(60초)마다 페이지 데이터 갱신
        const interval = setInterval(() => {
            router.refresh();
            console.log("Auto-refreshing data...");
        }, 60 * 1000);

        return () => clearInterval(interval);
    }, [router]);

    return null; // 화면에 아무것도 렌더링하지 않음
}
