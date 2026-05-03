import { Router } from "express";
import { db } from "@workspace/db";
import { cycleProfilesTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const RegisterBody = z.object({
  anonymousId: z.string().min(8).max(64),
  cycleLengthBucket: z.string().max(20),
  topSymptoms: z.array(z.string().max(60)).max(10),
});

function getBucket(avgLen: number | null | undefined): string {
  if (!avgLen) return "27–29 days";
  if (avgLen < 24) return "Under 24 days";
  if (avgLen <= 26) return "24–26 days";
  if (avgLen <= 29) return "27–29 days";
  if (avgLen <= 32) return "30–32 days";
  if (avgLen <= 35) return "33–35 days";
  return "Over 35 days";
}

router.post("/cycle-twin/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { anonymousId, cycleLengthBucket, topSymptoms } = parsed.data;

  const existing = await db
    .select()
    .from(cycleProfilesTable)
    .where(eq(cycleProfilesTable.anonymousId, anonymousId));

  if (existing.length > 0) {
    await db
      .update(cycleProfilesTable)
      .set({ cycleLengthBucket, topSymptoms, updatedAt: new Date() })
      .where(eq(cycleProfilesTable.anonymousId, anonymousId));
  } else {
    await db.insert(cycleProfilesTable).values({ anonymousId, cycleLengthBucket, topSymptoms });
  }

  res.status(200).json({ ok: true, bucket: cycleLengthBucket });
});

router.get("/cycle-twin/matches", async (req, res) => {
  const { bucket, anonymousId } = req.query as { bucket?: string; anonymousId?: string };

  if (!bucket) {
    res.status(400).json({ error: "bucket required" });
    return;
  }

  const query = db
    .select()
    .from(cycleProfilesTable)
    .where(eq(cycleProfilesTable.cycleLengthBucket, bucket));

  const profiles = await query;

  const others = anonymousId
    ? profiles.filter((p) => p.anonymousId !== anonymousId)
    : profiles;

  const twinCount = others.length;

  const symptomCounts: Record<string, number> = {};
  for (const profile of others) {
    for (const s of profile.topSymptoms as string[]) {
      symptomCounts[s] = (symptomCounts[s] ?? 0) + 1;
    }
  }

  const commonSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([symptom, count]) => ({ symptom, count }));

  const totalUsers = profiles.length;

  res.json({ twinCount, commonSymptoms, bucket, totalUsers });
});

export { getBucket };
export default router;
