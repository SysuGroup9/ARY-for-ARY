"use client";

import { useRef, useState, type ChangeEvent } from "react";

interface Props {
  action: (formData: FormData) => void | Promise<void>;
  raceId: string;
  raceSlug?: string;
  returnTo?: string;
  saveDraftAction?: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
  workDefaults?: {
    demoUrl?: string;
    repoUrl?: string;
    techNotes?: string;
    workSummary?: string;
    workTitle?: string;
    videoUrl?: string;
  };
}

const defaultCode =
  "export function solve(input: number[]) {\n  return [...input].sort((a, b) => a - b);\n}";

export default function SubmissionFormClient({
  action,
  raceId,
  raceSlug,
  returnTo,
  saveDraftAction,
  submitLabel = "提交代码并进入待评测队列",
  workDefaults,
}: Props) {
  const [codeLabel, setCodeLabel] = useState("solution.ts");
  const [codeContent, setCodeContent] = useState(defaultCode);
  const codeInputRef = useRef<HTMLInputElement>(null);

  async function loadTextFile(
    event: ChangeEvent<HTMLInputElement>,
    onName: (name: string) => void,
    onContent: (content: string) => void,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    onName(file.name);
    onContent(await file.text());
    event.target.value = "";
  }

  return (
    <form action={action} className="form-grid">
      <input name="raceId" type="hidden" value={raceId} />
      {raceSlug ? <input name="raceSlug" type="hidden" value={raceSlug} /> : null}
      {returnTo ? <input name="returnTo" type="hidden" value={returnTo} /> : null}
      <label>
        作品名称
        <input
          defaultValue={workDefaults?.workTitle ?? ""}
          name="workTitle"
          required
        />
      </label>
      <label className="full">
        作品简介
        <textarea
          defaultValue={workDefaults?.workSummary ?? ""}
          name="workSummary"
          required
          rows={3}
        />
      </label>
      <label>
        Demo URL
        <input defaultValue={workDefaults?.demoUrl ?? ""} name="demoUrl" />
      </label>
      <label>
        代码仓库 URL
        <input defaultValue={workDefaults?.repoUrl ?? ""} name="repoUrl" />
      </label>
      <label>
        演示视频 URL
        <input defaultValue={workDefaults?.videoUrl ?? ""} name="videoUrl" />
      </label>
      <label className="full">
        技术说明
        <textarea
          defaultValue={workDefaults?.techNotes ?? ""}
          name="techNotes"
          rows={4}
        />
      </label>
      <div className="full local-picker-grid">
        <div className="picker-card">
          <strong>本地代码文件</strong>
          <p className="muted">现在就可以主动提交代码；Riding Record 只在比赛结束后的最终提交里单独补交。</p>
          <input
            ref={codeInputRef}
            accept=".js,.jsx,.ts,.tsx,.mjs,.cjs"
            className="sr-only"
            type="file"
            onChange={(event) => loadTextFile(event, setCodeLabel, setCodeContent)}
          />
          <div className="button-row-inline">
            <button type="button" className="button-secondary" onClick={() => codeInputRef.current?.click()}>
              选择本地代码
            </button>
            <span className="file-chip">{codeLabel}</span>
          </div>
        </div>
      </div>

      <label>
        代码文件名
        <input name="codeLabel" required value={codeLabel} onChange={(event) => setCodeLabel(event.target.value)} />
      </label>
      <label>
        Agent 类型
        <select defaultValue="OPENAI" name="agentType">
          <option value="CLAUDE">Claude</option>
          <option value="COPILOT">Copilot</option>
          <option value="DEEPSEEK">DeepSeek</option>
          <option value="ZHIPU">Zhipu</option>
          <option value="OPENAI">OpenAI</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </label>
      <label>
        Token 消耗
        <input defaultValue={1200} min={0} name="tokenUsed" type="number" />
      </label>
      <label className="full">
        代码内容
        <textarea name="codeContent" required rows={8} value={codeContent} onChange={(event) => setCodeContent(event.target.value)} />
      </label>
      <div className="button-row-inline">
        {saveDraftAction ? (
          <button formAction={saveDraftAction} formNoValidate type="submit">
            保存作品草稿
          </button>
        ) : null}
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
