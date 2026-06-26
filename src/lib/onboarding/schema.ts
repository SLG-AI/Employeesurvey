import { z } from "zod";
import { CARD_IDS } from "./content";

export const createOnboardingSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  employee_id: z.string().trim().min(1).max(50),
  job_title: z.string().trim().min(1).max(200),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD")
    .optional()
    .nullable(),
});

export type CreateOnboardingInput = z.infer<typeof createOnboardingSchema>;

export const onboardingRowSchema = z.array(z.string().max(2000)).max(20);

export const onboardingStateSchema = z.object({
  lang: z.enum(["fr", "en"]).default("fr"),
  // Checked items are referenced by stable item id (see content.ts), not by
  // positional index — so editing the questionnaire never corrupts progress.
  checked: z.array(z.string().min(1).max(64)).max(500).default([]),
  health: z.record(z.string(), z.number().int().min(0).max(5)).default({}),
  rows: z
    .record(z.string(), z.array(onboardingRowSchema).max(100))
    .default({}),
});

export type OnboardingState = z.infer<typeof onboardingStateSchema>;

export const patchOnboardingSchema = z.object({
  archived: z.boolean().optional(),
});

// Per-onboarding editable checklist content (questions only).
export const checklistItemSchema = z.object({
  id: z.string().min(1).max(64),
  fr: z.string().trim().min(1).max(500),
  en: z.string().trim().min(1).max(500),
  owner: z.enum(["rh", "n1", "manager", "it"]),
});

export const onboardingContentSchema = z
  .record(z.enum(CARD_IDS), z.array(checklistItemSchema).max(30))
  .refine(
    (c) => Object.values(c).flat().length <= 200,
    "too_many_items"
  );

export type OnboardingContentInput = z.infer<typeof onboardingContentSchema>;
