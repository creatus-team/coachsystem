import { prisma } from '../src/lib/prisma';

async function main() {
    const reservations = await prisma.reservation.findMany({
        orderBy: { startAt: 'desc' },
        include: { client: true }
    });

    console.log(`📊 Database Verification (${reservations.length} items):`);
    reservations.forEach(res => {
        console.log(`[${res.status}] ${res.productName} - ${res.client?.name || 'Unknown Client'} (${res.startAt.toISOString()}) Code: ${res.code}`);
    });

    // Check for specific cancelled item
    const cancelledCode = '14YPd3XNak';
    const cancelled = reservations.find(r => r.code === cancelledCode);
    if (cancelled) {
        console.log(`\n✅ Found Cancelled Item: ${cancelled.code}`);
        console.log(`   Status: ${cancelled.status}`);
        console.log(`   Product: ${cancelled.productName}`);
    } else {
        console.log(`\n❌ Cancelled Item ${cancelledCode} NOT FOUND in DB.`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
