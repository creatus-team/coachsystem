'use client';

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function SyncButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            variant="outline"
            className="gap-2"
            disabled={pending}
            onClick={() => console.log("🖱️ Button clicked!")}
        >
            <RefreshCw className={cn("h-4 w-4", pending && "animate-spin")} />
            {pending ? "동기화 중..." : "지금 동기화"}
        </Button>
    );
}
