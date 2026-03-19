import { db } from "@/lib/db";
import {
  enqueueReminderGenerationJob,
  enqueueReminderOverdueEvaluationJob,
} from "@/lib/jobs/enqueue";

async function main() {
  const users = await db.user.findMany({
    select: { id: true },
  });

  for (const user of users) {
    await enqueueReminderGenerationJob({
      userId: user.id,
      requestedByUserId: null,
    });

    await enqueueReminderOverdueEvaluationJob({
      userId: user.id,
      requestedByUserId: null,
    });
  }

  console.log(`Queued reminder jobs for ${users.length} users.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });