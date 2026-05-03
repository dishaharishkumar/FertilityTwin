import { Router } from "express";
import { db } from "@workspace/db";
import { timeCapsulesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const CreateBody = z.object({
  title: z.string().max(100).optional(),
  message: z.string().min(1).max(5000),
  unlockDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.get("/time-capsules", async (_req, res) => {
  const capsules = await db
    .select()
    .from(timeCapsulesTable)
    .orderBy(asc(timeCapsulesTable.unlockDate));
  res.json(capsules);
});

router.post("/time-capsules", async (req, res) => {
  const parsed = CreateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { title, message, unlockDate } = parsed.data;
  const [row] = await db
    .insert(timeCapsulesTable)
    .values({ title: title ?? null, message, unlockDate })
    .returning();
  res.status(201).json(row);
});

router.patch("/time-capsules/:id/open", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }
  const [row] = await db
    .update(timeCapsulesTable)
    .set({ isOpened: true })
    .where(eq(timeCapsulesTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "not found" }); return; }
  res.json(row);
});

router.delete("/time-capsules/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }
  await db.delete(timeCapsulesTable).where(eq(timeCapsulesTable.id, id));
  res.json({ ok: true });
});

export default router;
