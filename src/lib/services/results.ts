import { buildWorkSlug } from "@/lib/public-site";
import { listPublishedAwardsForRace } from "@/lib/services/awards";
import { listJudgingRecordsForRace } from "@/lib/services/judging";

export async function buildPublicResultsModel(raceId: string) {
  const [awards, judgingRecords] = await Promise.all([
    listPublishedAwardsForRace(raceId),
    listJudgingRecordsForRace(raceId, { submittedOnly: true }),
  ]);

  const awardsWithWorkLinks = awards.map((award) => ({
    ...award,
    work: award.work
      ? {
          ...award.work,
          slug: buildWorkSlug(raceId, award.work.id, award.work.title),
        }
      : null,
  }));

  const ridingSkillHighlights = dedupeHighlights([
    ...awards
      .filter((award) => /cost|recovery|retrospective/i.test(award.awardName))
      .map((award) => ({
        label: mapAwardToSkillLabel(award.awardName),
        riderName: award.registration.user.username,
      })),
    ...judgingRecords
      .filter((record) => record.comments.length > 0)
      .map((record) => ({
        label: inferSkillLabelFromJudgingComment(record.comments),
        riderName: record.judgeAssignment.work.registration?.user?.username ?? "unknown",
      }))
      .filter((item) => item.label),
  ]);

  return {
    awards: awardsWithWorkLinks,
    ridingSkillHighlights,
  };
}

export function mapAwardToSkillLabel(awardName: string): string {
  if (/cost/i.test(awardName)) return "成本控制";
  if (/recovery/i.test(awardName)) return "风险处理";
  if (/retrospective/i.test(awardName)) return "复盘表达";
  return "综合表现";
}

export function inferSkillLabelFromJudgingComment(comment: string): string {
  if (/cost|efficiency/i.test(comment)) return "成本控制";
  if (/recovery|correction|risk/i.test(comment)) return "风险处理";
  return "复盘表达";
}

export function dedupeHighlights(
  items: Array<{ label: string; riderName: string }>,
): Array<{ label: string; riderName: string }> {
  const seen = new Set<string>();
  const result: Array<{ label: string; riderName: string }> = [];

  for (const item of items) {
    const key = `${item.riderName}:${item.label}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }

  return result;
}
