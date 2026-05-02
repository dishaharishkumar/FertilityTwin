import { Router } from "express";
import { db } from "@workspace/db";
import { dailyLogsTable } from "@workspace/db";
import { CreateLogBody, GetLogsQueryParams, GetLogParams, UpdateLogParams, UpdateLogBody, DeleteLogParams } from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";

const router = Router();

router.get("/logs", async (req, res) => {
  const parsed = GetLogsQueryParams.safeParse(req.query);
  const limit = parsed.success ? parsed.data.limit : 30;
  const offset = parsed.success ? parsed.data.offset : 0;

  const logs = await db
    .select()
    .from(dailyLogsTable)
    .orderBy(desc(dailyLogsTable.date))
    .limit(limit)
    .offset(offset);

  res.json(logs);
});

router.get("/logs/today", async (req, res) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const logs = await db
    .select()
    .from(dailyLogsTable)
    .where(eq(dailyLogsTable.date, today));

  if (logs.length === 0) {
    res.status(404).json({ error: "No log for today" });
    return;
  }

  res.json(logs[0]);
});

router.get("/logs/:id", async (req, res) => {
  const parsed = GetLogParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const logs = await db
    .select()
    .from(dailyLogsTable)
    .where(eq(dailyLogsTable.id, parsed.data.id));

  if (logs.length === 0) {
    res.status(404).json({ error: "Log not found" });
    return;
  }

  res.json(logs[0]);
});

router.post("/logs", async (req, res) => {
  const parsed = CreateLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const dateStr = data.date instanceof Date
    ? format(data.date, "yyyy-MM-dd")
    : String(data.date);

  const inserted = await db
    .insert(dailyLogsTable)
    .values({
      date: dateStr,
      bbt: data.bbt ?? null,
      cervicalMucus: data.cervicalMucus ?? null,
      mood: data.mood ?? null,
      energyLevel: data.energyLevel ?? null,
      sleepHours: data.sleepHours ?? null,
      stressLevel: data.stressLevel ?? null,
      symptoms: data.symptoms ?? [],
      supplements: data.supplements ?? [],
      notes: data.notes ?? null,
    })
    .returning();

  res.status(201).json(inserted[0]);
});

router.put("/logs/:id", async (req, res) => {
  const paramsParsed = UpdateLogParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = UpdateLogBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const data = bodyParsed.data;
  const dateStr = data.date instanceof Date
    ? format(data.date, "yyyy-MM-dd")
    : String(data.date);

  const updated = await db
    .update(dailyLogsTable)
    .set({
      date: dateStr,
      bbt: data.bbt ?? null,
      cervicalMucus: data.cervicalMucus ?? null,
      mood: data.mood ?? null,
      energyLevel: data.energyLevel ?? null,
      sleepHours: data.sleepHours ?? null,
      stressLevel: data.stressLevel ?? null,
      symptoms: data.symptoms ?? [],
      supplements: data.supplements ?? [],
      notes: data.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(dailyLogsTable.id, paramsParsed.data.id))
    .returning();

  if (updated.length === 0) {
    res.status(404).json({ error: "Log not found" });
    return;
  }

  res.json(updated[0]);
});

router.delete("/logs/:id", async (req, res) => {
  const parsed = DeleteLogParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(dailyLogsTable).where(eq(dailyLogsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
