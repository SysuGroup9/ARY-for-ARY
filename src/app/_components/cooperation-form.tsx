"use client";

import { useState } from "react";
import { cooperationRequestAction } from "@/app/actions";

export function CooperationForm() {
  const [taskPkg, setTaskPkg] = useState("");
  const [propFile, setPropFile] = useState("");

  return (
    <form action={cooperationRequestAction}>
      <div className="form-grid" style={{ gap: 20 }}>
        <input name="returnTo" type="hidden" value="/cooperation" />

        {/* ═══ 企业身份 ═══ */}
        <div className="card" style={{ gridColumn: "1 / -1", padding: 20, background: "var(--muted)", boxShadow: "var(--shadow-ring)" }}>
          <strong style={{ fontSize: "1rem" }}>企业信息</strong>
          <div className="grid-2" style={{ marginTop: 12 }}>
            <label>
              企业 / 组织名称
              <input name="companyName" placeholder="如：XX大学计算机学院" required />
            </label>
            <label>
              联系人
              <input name="contactName" placeholder="你的姓名" required />
            </label>
            <label>
              联系邮箱
              <input name="contactEmail" type="email" placeholder="your@email.com" required />
            </label>
            <label>
              联系电话
              <input name="contactPhone" placeholder="选填" />
            </label>
          </div>
        </div>

        {/* ═══ 赛事基本 ═══ */}
        <label>
          赛事名称
          <input name="raceTitle" placeholder="如：排序算法挑战赛" required />
        </label>
        <label>
          赛事简介
          <input name="raceSummary" placeholder="一句话描述赛事主题" required />
        </label>
        <label className="full">
          题目描述
          <textarea name="taskDescription" rows={3} placeholder="描述赛事题目的具体内容与要求…" required />
        </label>
        <label className="full">
          训练数据说明
          <textarea name="trainingDataSummary" rows={2} placeholder="如有训练数据，请说明格式与内容" />
        </label>
        <label className="full">
          评测说明
          <textarea name="evaluationNotes" rows={2} placeholder="Runner 的评分依据与评测维度…" required />
        </label>
        <label className="full">
          关键词
          <textarea name="keywordsText" rows={2} placeholder="用逗号分隔，如：排序, 时间复杂度, 边界条件" required />
        </label>

        {/* ═══ 文件上传 ═══ */}
        <FileUpload
          accept=".zip"
          fileName={taskPkg}
          id="task-pkg"
          label="题目包（选填，.zip）"
          name="taskPackageFile"
          setter={setTaskPkg}
        />
        <FileUpload
          accept=".pdf,.doc,.docx,.md,.txt"
          fileName={propFile}
          id="proposal-file"
          label="方案文档（选填）"
          name="proposalFile"
          setter={setPropFile}
        />

        {/* ═══ 赛程 ═══ */}
        <label>
          报名开始
          <input name="signupStart" type="datetime-local" required />
        </label>
        <label>
          报名结束
          <input name="signupEnd" type="datetime-local" required />
        </label>
        <label>
          比赛开始
          <input name="raceStart" type="datetime-local" required />
        </label>
        <label>
          比赛结束
          <input name="raceEnd" type="datetime-local" required />
        </label>

        {/* ═══ 赛事设置 ═══ */}
        <label>
          Token 上限
          <input defaultValue={4000} min={0} name="tokenLimit" type="number" />
        </label>
        <label>
          每组人数上限
          <input defaultValue={5} min={1} name="maxTeamSize" type="number" />
        </label>
        <label>
          提交间隔（小时）
          <input defaultValue={24} min={1} name="submissionIntervalHours" type="number" />
        </label>
        <label>
          封榜提前量（分钟）
          <input defaultValue={30} min={0} name="freezeMinutesBeforeEnd" type="number" />
        </label>

        {/* ═══ 显示选项 ═══ */}
        <div className="full" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <Check label="有训练数据" name="hasTrainingData" />
          <Check label="启用封榜" name="enableFreeze" />
          <Check label="赛后公开训练数据" name="displayShowTrainingData" />
          <Check label="赛后公开主办方评语" name="displayShowOrganizerComment" />
          <Check label="显示 Top Highlights" name="displayShowTopHighlights" />
          <Check label="赛后公开骑手代码" name="displayShowRiderCode" />
        </div>

        {/* ═══ 补充说明 ═══ */}
        <label className="full">
          补充说明（选填）
          <textarea name="notes" rows={2} placeholder="特殊需求或补充信息…" />
        </label>

        <div className="full">
          <button type="submit" style={{ width: "100%" }}>提交办赛申请</button>
        </div>
      </div>
    </form>
  );
}

/* ── 辅助组件 ── */
function Check({ label, name }: { label: string; name: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500, fontSize: "0.9375rem", cursor: "pointer" }}>
      <input defaultChecked name={name} type="checkbox" style={{ width: "auto" }} />
      {label}
    </label>
  );
}

function FileUpload({
  label,
  id,
  name,
  accept,
  fileName,
  setter,
}: {
  label: string;
  id: string;
  name: string;
  accept: string;
  fileName: string;
  setter: (v: string) => void;
}) {
  return (
    <label style={{ cursor: "pointer" }}>
      {label}
      <div style={{
        border: "2px dashed var(--border)", borderRadius: "var(--radius-sm)",
        padding: "20px 16px", textAlign: "center", background: "var(--muted)",
        transition: "border-color 0.2s", marginTop: 4,
      }}>
        <input id={id} name={name} type="file" accept={accept} style={{ display: "none" }}
          onChange={(e) => setter(e.target.files?.[0]?.name ?? "")} />
        {fileName
          ? <span style={{ color: "var(--accent)", fontWeight: 500 }}>📄 {fileName}</span>
          : <span className="muted" style={{ fontSize: "0.875rem" }}>📁 点击选择文件</span>}
      </div>
    </label>
  );
}
