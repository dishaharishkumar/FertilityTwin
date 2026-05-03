import { Router } from "express";
import { db } from "@workspace/db";
import { bodyMapLogsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const CreateBodyMapLogBody = z.object({
  region: z.string(),
  sensation: z.string(),
  intensity: z.number().int().min(1).max(3),
  notes: z.string().optional(),
});

router.get("/body-map", async (_req, res) => {
  const logs = await db
    .select()
    .from(bodyMapLogsTable)
    .orderBy(desc(bodyMapLogsTable.loggedAt))
    .limit(100);
  res.json(logs);
});

router.get("/body-map/heatmap", async (_req, res) => {
  const logs = await db.select().from(bodyMapLogsTable);
  const counts: Record<string, number> = {};
  for (const log of logs) {
    counts[log.region] = (counts[log.region] ?? 0) + 1;
  }
  res.json(counts);
});

router.post("/body-map", async (req, res) => {
  const parsed = CreateBodyMapLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const inserted = await db
    .insert(bodyMapLogsTable)
    .values(parsed.data)
    .returning();
  res.status(201).json(inserted[0]);
});

export default router;
