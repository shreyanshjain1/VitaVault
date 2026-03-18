import { db } from "@/lib/db";
import { enqueueAlertScheduledScan } from "@/lib/jobs/enqueue";

async function main() {
  const users = await db.user.findMany({
    select: { id: true },
  });

  for (const user of users) {
    await enqueueAlertScheduledScan(user.id);
  }

  console.log(`Queued scheduled alert scans for ${users.length} users.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
