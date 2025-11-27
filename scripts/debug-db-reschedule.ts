
import { prisma } from "@/lib/prisma";

async function main() {
    console.log("🔍 Inspecting reservations for 'test2'...");

    const users = await prisma.user.findMany({
        where: { name: { contains: 'test2' } },
        include: {
            reservations: {
                orderBy: { startAt: 'desc' },
                include: {
                    previous: true,
                    next: true
                }
            }
        }
    });

    for (const user of users) {
        console.log(`\nUser: ${user.name} (${user.email})`);
        for (const res of user.reservations) {
            console.log(`  - [${res.status}] ${res.startAt.toISOString()} ~ ${res.endAt.toISOString()} (Code: ${res.code})`);
            console.log(`    Product: ${res.productName}`);
            console.log(`    Updated: ${res.updatedAt.toISOString()}`);
            if (res.previous) console.log(`    -> Linked Previous: ${res.previous.code}`);
            if (res.next) console.log(`    -> Linked Next: ${res.next.code}`);
        }
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
