// Crafts / Skills Matrix for effective work-order assignment.

export type SkillType = "mechanical" | "electrical" | "instrumentation" | "welding";
export type SkillLevel = "junior" | "intermediate" | "senior";

export interface Craft {
  workerUsername: string;
  skill: SkillType;
  level: SkillLevel;
  costPerHourUSD: number;
}

export const SKILL_LABELS: Record<SkillType, string> = {
  mechanical: "Mechanical",
  electrical: "Electrical",
  instrumentation: "Instrumentation",
  welding: "Welding",
};

export const LEVEL_LABELS: Record<SkillLevel, string> = {
  junior: "Junior",
  intermediate: "Intermediate",
  senior: "Senior",
};

export const BASE_RATES: Record<`${SkillType}-${SkillLevel}`, number> = {
  "mechanical-junior": 4,
  "mechanical-intermediate": 8,
  "mechanical-senior": 15,
  "electrical-junior": 5,
  "electrical-intermediate": 10,
  "electrical-senior": 16,
  "instrumentation-junior": 5,
  "instrumentation-intermediate": 10,
  "instrumentation-senior": 16,
  "welding-junior": 4,
  "welding-intermediate": 8,
  "welding-senior": 14,
};

export const crafts: Craft[] = [
  // Mechanical
  { workerUsername: "Suubi", skill: "mechanical", level: "senior", costPerHourUSD: 15 },
  { workerUsername: "Ahaisibwe", skill: "mechanical", level: "senior", costPerHourUSD: 15 },
  { workerUsername: "Nakimbugwe", skill: "mechanical", level: "senior", costPerHourUSD: 15 },
  { workerUsername: "Odeke", skill: "mechanical", level: "intermediate", costPerHourUSD: 8 },
  { workerUsername: "Wagoli", skill: "mechanical", level: "intermediate", costPerHourUSD: 8 },
  { workerUsername: "Mutebi", skill: "mechanical", level: "junior", costPerHourUSD: 4 },
  // Electrical
  { workerUsername: "Mukisa", skill: "electrical", level: "intermediate", costPerHourUSD: 10 },
  { workerUsername: "Nakimbugwe", skill: "electrical", level: "senior", costPerHourUSD: 16 },
  { workerUsername: "Mutebi", skill: "electrical", level: "junior", costPerHourUSD: 5 },
  // Instrumentation
  { workerUsername: "Ouma", skill: "instrumentation", level: "intermediate", costPerHourUSD: 10 },
  { workerUsername: "Nakimbugwe", skill: "instrumentation", level: "senior", costPerHourUSD: 16 },
  // Welding
  { workerUsername: "Tabalaata", skill: "welding", level: "intermediate", costPerHourUSD: 8 },
  { workerUsername: "Odeke", skill: "welding", level: "junior", costPerHourUSD: 4 },
];

export function getCraftsByWorker(username: string): Craft[] {
  return crafts.filter((c) => c.workerUsername === username);
}

export function getCraftsBySkill(skill: SkillType): Craft[] {
  return crafts.filter((c) => c.skill === skill);
}

export function getWorkersForSkill(skill: SkillType, level?: SkillLevel): string[] {
  return crafts
    .filter((c) => c.skill === skill && (!level || c.level === level))
    .map((c) => c.workerUsername);
}

export function getCostFor(skill: SkillType, level: SkillLevel): number {
  return BASE_RATES[`${skill}-${level}`] ?? 0;
}

export function getPrimarySkill(username: string): { skill: SkillType; level: SkillLevel } | null {
  const userCrafts = getCraftsByWorker(username);
  if (userCrafts.length === 0) return null;
  // Prefer senior, then intermediate, then junior
  const senior = userCrafts.find((c) => c.level === "senior");
  if (senior) return { skill: senior.skill, level: senior.level };
  const intermediate = userCrafts.find((c) => c.level === "intermediate");
  if (intermediate) return { skill: intermediate.skill, level: intermediate.level };
  return { skill: userCrafts[0].skill, level: userCrafts[0].level };
}

export const allSkills: SkillType[] = ["mechanical", "electrical", "instrumentation", "welding"];
export const allLevels: SkillLevel[] = ["junior", "intermediate", "senior"];
