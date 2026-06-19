import assert from "node:assert/strict";
import test from "node:test";
import { dedupeHighlights, inferSkillLabelFromJudgingComment, mapAwardToSkillLabel } from "@/lib/services/results";

test("[R-01] mapAwardToSkillLabel cost→成本控制", () => { assert.equal(mapAwardToSkillLabel("Best Cost Control"), "成本控制"); });
test("[R-02] mapAwardToSkillLabel recovery→风险处理", () => { assert.equal(mapAwardToSkillLabel("Best Recovery"), "风险处理"); });
test("[R-03] mapAwardToSkillLabel retrospective→复盘表达", () => { assert.equal(mapAwardToSkillLabel("Best Retrospective"), "复盘表达"); });
test("[R-04] mapAwardToSkillLabel 默认→综合表现", () => { assert.equal(mapAwardToSkillLabel("Best Overall"), "综合表现"); });
test("[R-05] inferSkillLabelFromJudgingComment cost→成本控制", () => { assert.equal(inferSkillLabelFromJudgingComment("Excellent cost management."), "成本控制"); });
test("[R-06] inferSkillLabelFromJudgingComment risk→风险处理", () => { assert.equal(inferSkillLabelFromJudgingComment("Good risk handling."), "风险处理"); });
test("[R-07] inferSkillLabelFromJudgingComment 默认→复盘表达", () => { assert.equal(inferSkillLabelFromJudgingComment("Good work."), "复盘表达"); });
test("[R-08] dedupeHighlights 去重正常", () => {
  const r = dedupeHighlights([{ riderName: "a", label: "x" }, { riderName: "a", label: "x" }, { riderName: "b", label: "x" }]);
  assert.equal(r.length, 2);
});
test("[R-09] dedupeHighlights 空→空", () => { assert.equal(dedupeHighlights([]).length, 0); });
