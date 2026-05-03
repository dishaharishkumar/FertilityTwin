import { Router } from "express";
import { db } from "@workspace/db";
import { cycleMarkersTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

router.get("/cycle-markers", async (_req, res) => {
  const markers = await db
    .select()
    .from(cycleMarkersTable)
    .orderBy(asc(cycleMarkersTable.cycleDay));
  res.json(markers);
});

router.post("/cycle-markers", async (req, res) => {
  const { cycleDay, markerType, label, notes } = req.body;
  if (!cycleDay || !markerType) {
    res.status(400).json({ error: "cycleDay and markerType are required" });
    return;
  }
  const inserted = await db
    .insert(cycleMarkersTable)
    .values({ cycleDay: Number(cycleDay), markerType, label: label ?? null, notes: notes ?? null })
    .returning();
  res.json(inserted[0]);
});

router.delete("/cycle-markers/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(cycleMarkersTable).where(eq(cycleMarkersTable.id, id));
  res.json({ ok: true });
});

export default router;
