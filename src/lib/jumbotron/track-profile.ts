import { z } from "zod";

const finiteNumber = z.number().finite();
const progressValue = finiteNumber.min(0).max(1);

export const pointSchema = z.object({
  x: finiteNumber,
  y: finiteNumber,
});

export const trackProfileSchema = z.object({
  schemaVersion: z.literal("jumbotron.track-profile.v1"),
  trackId: z.string().min(1),
  name: z.string().min(1),
  viewBox: z.object({
    width: finiteNumber.positive(),
    height: finiteNumber.positive(),
  }),
  background: z.object({
    href: z.string().min(1),
    opacity: finiteNumber.min(0).max(1).default(1),
    type: z.enum(["image", "css"]).default("image"),
  }),
  centerline: z.object({
    type: z.literal("polyline"),
    closed: z.boolean(),
    points: z.array(pointSchema).min(2),
    smoothing: finiteNumber.min(0).max(1).default(0),
  }),
  direction: z.enum(["clockwise", "counterclockwise"]),
  startFinish: z.object({
    label: z.string().default("START / FINISH"),
    s: progressValue,
  }),
  lanes: z.array(
    z.object({
      laneId: z.string().min(1),
      label: z.string().min(1),
      offset: finiteNumber,
    }),
  ).min(1),
  checkpoints: z.array(
    z.object({
      checkpointId: z.string().min(1),
      label: z.string().min(1),
      s: progressValue,
    }),
  ).default([]),
  messageZones: z.array(
    z.object({
      dx: finiteNumber,
      dy: finiteNumber,
      priority: z.number().int().min(0).default(0),
      sEnd: progressValue,
      sStart: progressValue,
      zoneId: z.string().min(1),
    }),
  ).default([]),
  noBubbleZones: z.array(
    z.object({
      sEnd: progressValue,
      sStart: progressValue,
      zoneId: z.string().min(1),
    }),
  ).default([]),
});

export type Point = z.infer<typeof pointSchema>;
export type TrackProfile = z.infer<typeof trackProfileSchema>;
export type TrackDirection = TrackProfile["direction"];
export type TrackLane = TrackProfile["lanes"][number];
export type TrackCheckpoint = TrackProfile["checkpoints"][number];
export type TrackMessageZone = TrackProfile["messageZones"][number];

export interface TrackValidationReport {
  errors: string[];
  metrics: {
    pathLength: number;
    sampleCount: number;
  };
  valid: boolean;
  warnings: string[];
}

export function parseTrackProfile(input: unknown): TrackProfile {
  return trackProfileSchema.parse(input);
}

export function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "profile";
    return `${path}: ${issue.message}`;
  });
}
