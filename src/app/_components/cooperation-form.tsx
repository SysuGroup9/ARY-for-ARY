"use client";

import { useState } from "react";
import { cooperationRequestAction } from "@/app/actions";

const STEPS = ["企业信息", "赛事信息", "赛程设置"];

export function CooperationForm() {
  const [step, setStep] = useState(0);
  const [taskPkg, setTaskPkg] = useState("");
  const [propFile, setPropFile] = useState("");

  return (
    <form action={cooperationRequestAction}>
      <input name="returnTo" type="hidden" value="/cooperation" />

      {/* Step indicator */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
        {STEPS.map((label, i) => (
          <button key={i} type="button" onClick={() => setStep(i)}
            style={{
              padding: "8px 20px", borderRadius: "var(--radius-full)", border: 0, cursor: "pointer",
              fontWeight: 600, fontSize: "0.9375rem",
              background: i === step ? "linear-gradient(135deg,var(--accent),var(--accent-secondary))" : "var(--muted)",
              color: i === step ? "#fff" : "var(--muted-foreground)",
              transition: "all 0.2s",
            }}>
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 28 }}>
        <div className="form-grid" style={{ gap: 16 }}>

          {/* ══════ STEP 1: 企业信息 ══════ */}
          {step === 0 && (
            <>
              <div className="section-label"><span className="section-label__dot" />企业身份</div>
              <div className="grid-2">
                <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem"}}>
                  企业 / 组织名称
                  <input name="companyName" placeholder="如：XX大学计算机学院" required />
                </label>
                <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem"}}>
                  联系人
                  <input name="contactName" placeholder="你的姓名" required />
                </label>
                <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem"}}>
                  联系邮箱
                  <input name="contactEmail" type="email" placeholder="your@email.com" required />
                </label>
                <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem"}}>
                  联系电话
                  <input name="contactPhone" placeholder="选填" />
                </label>
              </div>
            </>
          )}

          {/* ══════ STEP 2: 赛事信息 ══════ */}
          {step === 1 && (
            <>
              <div className="section-label"><span className="section-label__dot" />赛事信息</div>
              <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem"}}>
                赛事名称
                <input name="raceTitle" placeholder="如：排序算法挑战赛" required />
              </label>
              <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem"}}>
                赛事简介
                <input name="raceSummary" placeholder="一句话描述赛事主题" required />
              </label>
              <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem",gridColumn:"1/-1"}}>
                题目描述
                <textarea name="taskDescription" rows={3} placeholder="描述赛事题目的具体内容与要求…" required />
              </label>
              <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem",gridColumn:"1/-1"}}>
                评测说明
                <textarea name="evaluationNotes" rows={2} placeholder="Runner 的评分依据与评测维度…" required />
              </label>
              <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem",gridColumn:"1/-1"}}>
                关键词
                <textarea name="keywordsText" rows={2} placeholder="用逗号分隔，如：排序, 时间复杂度, 边界条件" required />
              </label>
              <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem"}}>
                训练数据说明
                <textarea name="trainingDataSummary" rows={2} placeholder="如有训练数据，请说明格式与内容" />
              </label>
              <FileUpload accept=".zip" fileName={taskPkg} id="task-pkg" label="题目包（.zip）" name="taskPackageFile" setter={setTaskPkg} />
              <FileUpload accept=".pdf,.doc,.docx,.md,.txt" fileName={propFile} id="proposal-file" label="方案文档" name="proposalFile" setter={setPropFile} />
            </>
          )}

          {/* ══════ STEP 3: 赛程设置 ══════ */}
          {step === 2 && (
            <>
              <div className="section-label"><span className="section-label__dot" />赛程与设置</div>
              <div className="grid-2">
                <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem"}}>
                  报名开始
                  <input name="signupStart" type="datetime-local" required />
                </label>
                <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem"}}>
                  报名结束
                  <input name="signupEnd" type="datetime-local" required />
                </label>
                <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem"}}>
                  比赛开始
                  <input name="raceStart" type="datetime-local" required />
                </label>
                <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem"}}>
                  比赛结束
                  <input name="raceEnd" type="datetime-local" required />
                </label>
              </div>

              <div className="grid-2" style={{ marginTop: 8 }}>
                <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem"}}>
                  Token 上限
                  <input defaultValue={4000} min={0} name="tokenLimit" type="number" />
                </label>
                <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem"}}>
                  每组人数上限
                  <input defaultValue={5} min={1} name="maxTeamSize" type="number" />
                </label>
                <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem"}}>
                  提交间隔（小时）
                  <input defaultValue={24} min={1} name="submissionIntervalHours" type="number" />
                </label>
                <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem"}}>
                  封榜提前量（分钟）
                  <input defaultValue={30} min={0} name="freezeMinutesBeforeEnd" type="number" />
                </label>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
                <Check label="有训练数据" name="hasTrainingData" />
                <Check label="启用封榜" name="enableFreeze" />
                <Check label="赛后公开训练数据" name="displayShowTrainingData" />
                <Check label="赛后公开主办方评语" name="displayShowOrganizerComment" />
                <Check label="显示 Top Highlights" name="displayShowTopHighlights" />
                <Check label="赛后公开骑手代码" name="displayShowRiderCode" />
              </div>

              <label style={{display:"grid",gap:6,fontWeight:600,fontSize:"0.9375rem",gridColumn:"1/-1"}}>
                补充说明（选填）
                <textarea name="notes" rows={2} placeholder="特殊需求或补充信息…" />
              </label>
            </>
          )}

          {/* Navigation */}
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            {step > 0 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="button-secondary">
                ← 上一步
              </button>
            ) : <span />}
            {step < 2 ? (
              <button type="button" onClick={() => setStep(step + 1)} className="button">
                下一步 →
              </button>
            ) : (
              <button type="submit" style={{ width: "auto", padding: "0 48px" }}>提交办赛申请</button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

function Check({ label, name }: { label: string; name: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: "0.9375rem", cursor: "pointer" }}>
      <input defaultChecked name={name} type="checkbox" style={{ width: "auto" }} />
      {label}
    </label>
  );
}

function FileUpload({ label, id, name, accept, fileName, setter }: {
  label: string; id: string; name: string; accept: string; fileName: string; setter: (v: string) => void;
}) {
  return (
    <label style={{ cursor: "pointer", display: "grid", gap: 6, fontWeight: 600, fontSize: "0.9375rem" }}>
      {label}
      <div style={{
        border: "2px dashed var(--border)", borderRadius: "var(--radius-sm)", padding: "20px 16px",
        textAlign: "center", background: "var(--muted)", transition: "border-color 0.2s",
      }}>
        <input id={id} name={name} type="file" accept={accept} style={{ display: "none" }}
          onChange={(e) => setter(e.target.files?.[0]?.name ?? "")} />
        {fileName
          ? <span style={{ color: "var(--accent)", fontWeight: 600 }}>📄 {fileName}</span>
          : <span className="muted" style={{ fontSize: "0.875rem" }}>📁 点击选择文件</span>}
      </div>
    </label>
  );
}
