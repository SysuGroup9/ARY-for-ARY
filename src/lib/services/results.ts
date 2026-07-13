/**
 * GRS004 协作功能 - Results 服务（Team 维度重构）
 *
 * 公开赛果展开 Team 成员列表，排除 REMOVED 成员。
 */

import { buildWorkSlug } from "@/lib/public-site";
import { listPublishedAwardsForRace } from "@/lib/services/awards";
import { listJudgingRecordsForRace } from "@/lib/services/judging";

export async function buildPublicResultsModel(raceId: string) {
  const [awards, judgingRecords] = await Promise.all([
    listPublishedAwardsForRace(raceId),
    listJudgingRecordsForRace(raceId, { submittedOnly: true }),
  ]);

  // GRS004: Award 归属 Team，展开成员列表
  const awardsWithTeamMembers = awards.map((award) => ({
    ...award,
    team: award.team
      ? {
          id: award.team.id,
          name: award.team.name,
          members: award.team.members.map((m) => ({
            id: m.id,
            userId: m.userId,
            username: m.user?.username ?? "未知",
            role: m.role,
          })),
        }
      : null,
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
      .flatMap((award) =>
        (award.team?.members ?? []).map((member) => ({
          label: mapAwardToSkillLabel(award.awardName),
          riderName: member.user?.username ?? "未知",
        })),
      ),
    ...judgingRecords
      .filter((record) => record.comments.length > 0)
      .map((record) => {
        const work = record.judgeAssignment.work;
        const team = (work as any)?.team;
        const members = team?.members ?? [];
        const firstMember = members[0];
        return {
          label: inferSkillLabelFromJudgingComment(record.comments),
          riderName: firstMember?.user?.username ?? "unknown",
        };
      })
      .filter((item) => item.label),
  ]);

  return {
    awards: awardsWithTeamMembers,
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
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}
