"use client";

import { useRef, useState, type ChangeEvent } from "react";

interface Props {
  action: (formData: FormData) => void | Promise<void>;
  raceId: string;
}

const defaultCode =
  "export function solve(input: number[]) {\n  return [...input].sort((a, b) => a - b);\n}";
const defaultRecord =
  "先澄清输入边界，再验证复杂度，最后用正反例检查排序稳定性。";

export default function SubmissionFormClient({ action, raceId }: Props) {
  const [codeLabel, setCodeLabel] = useState("solution.ts");
  const [codeContent, setCodeContent] = useState(defaultCode);
  const [recordLabel, setRecordLabel] = useState("riding-record.txt");
  const [ridingRecord, setRidingRecord] = useState(defaultRecord);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const recordInputRef = useRef<HTMLInputElement>(null);

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
      <div className="full local-picker-grid">
        <div className="picker-card">
          <strong>本地代码文件</strong>
          <p className="muted">选择本地 JS / TS 文件后会自动回填文件名和代码内容。</p>
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
        <div className="picker-card">
          <strong>本地 Riding Record</strong>
          <p className="muted">支持 txt / md / json，选中后自动回填到记录文本框。</p>
          <input
            ref={recordInputRef}
            accept=".txt,.md,.json"
            className="sr-only"
            type="file"
            onChange={(event) => loadTextFile(event, setRecordLabel, setRidingRecord)}
          />
          <div className="button-row-inline">
            <button type="button" className="button-secondary" onClick={() => recordInputRef.current?.click()}>
              选择本地 Record
            </button>
            <span className="file-chip">{recordLabel || "未选择"}</span>
          </div>
        </div>
      </div>

      <label>
        代码文件名
        <input name="codeLabel" required value={codeLabel} onChange={(event) => setCodeLabel(event.target.value)} />
      </label>
      <label>
        Record 文件名
        <input name="recordLabel" value={recordLabel} onChange={(event) => setRecordLabel(event.target.value)} />
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
      <label className="full">
        Riding Record
        <textarea name="ridingRecord" rows={6} value={ridingRecord} onChange={(event) => setRidingRecord(event.target.value)} />
      </label>
      <button type="submit">进入待评测队列</button>
    </form>
  );
}
