"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";

type FormAction = (formData: FormData) => void | Promise<void>;

type TrackOption = {
  trackId: string;
  name: string;
  startFinish: { s: number };
  checkpoints: Array<{ id: string; name: string; s: number }>;
};

const TRACK_OPTIONS: TrackOption[] = [
  {
    trackId: "oval-track",
    name: "oval-track",
    startFinish: { s: 0 },
    checkpoints: [
      { id: "cp-start", name: "起跑线", s: 0 },
      { id: "cp-mid", name: "中段", s: 0.5 },
      { id: "cp-finish", name: "终点前", s: 0.92 },
    ],
  },
];

function serializeCheckpoints(
  checkpoints: Array<{ id: string; name: string; s: number }>,
) {
  return JSON.stringify(checkpoints);
}

export default function CreateRaceFormClient({
  action,
  organizerOptions,
  returnTo,
}: {
  action: FormAction;
  organizerOptions: Array<{ id: string; label: string }>;
  returnTo?: string;
}) {
  const [trackId, setTrackId] = useState("oval-track");
  const [taskPackageLabel, setTaskPackageLabel] = useState("sort-task-v1.zip");
  const [backgroundName, setBackgroundName] = useState("background.png");
  const [backgroundPreview, setBackgroundPreview] = useState(
    "/assets/tracks/oval-track/background.png",
  );
  const taskInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const activeTrack = useMemo(
    () => TRACK_OPTIONS.find((item) => item.trackId === trackId) ?? TRACK_OPTIONS[0],
    [trackId],
  );

  const [startFinishS, setStartFinishS] = useState(
    activeTrack.startFinish.s.toString(),
  );
  const [checkpointsText, setCheckpointsText] = useState(
    serializeCheckpoints(activeTrack.checkpoints),
  );

  function handleTrackChange(nextTrackId: string) {
    const nextTrack =
      TRACK_OPTIONS.find((item) => item.trackId === nextTrackId) ??
      TRACK_OPTIONS[0];
    setTrackId(nextTrack.trackId);
    setStartFinishS(nextTrack.startFinish.s.toString());
    setCheckpointsText(serializeCheckpoints(nextTrack.checkpoints));
    setBackgroundName("background.png");
    setBackgroundPreview(`/assets/tracks/${nextTrack.trackId}/background.png`);
  }

  async function handleTaskFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setTaskPackageLabel(file.name);
    event.target.value = "";
  }

  async function handleBackgroundFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBackgroundName(file.name);
    setBackgroundPreview(URL.createObjectURL(file));
    event.target.value = "";
  }

  return (
    <form action={action} className="form-grid">
      {returnTo ? <input name="returnTo" type="hidden" value={returnTo} /> : null}
      {organizerOptions.length > 0 ? (
        <label className="full">
          赛事主办方
          <select defaultValue={organizerOptions[0]?.id ?? ""} name="organizerId" required>
            {organizerOptions.map((organizer) => (
              <option key={organizer.id} value={organizer.id}>
                {organizer.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label>
        赛事名称
        <input defaultValue="排序算法挑战赛" name="title" required />
      </label>
      <label>
        赛事简介
        <input
          defaultValue="验证 Agent 在算法问题上的实现、推理与成本控制能力。"
          name="summary"
          required
        />
      </label>
      <label>
        题目包名称
        <input
          name="taskPackageLabel"
          required
          value={taskPackageLabel}
          onChange={(event) => setTaskPackageLabel(event.target.value)}
        />
      </label>
      <label>
        任务入口 URL
        <input defaultValue="https://cloudstudio.net/" name="cloudStudioUrl" />
      </label>

      <div className="full local-picker-grid">
        <div className="picker-card">
          <strong>本地题目包</strong>
          <p className="muted">
            选择本地题目包后，会自动回填题目包名称。
          </p>
          <input
            ref={taskInputRef}
            className="sr-only"
            type="file"
            onChange={handleTaskFile}
          />
          <div className="button-row-inline">
            <button
              type="button"
              className="button-secondary"
              onClick={() => taskInputRef.current?.click()}
            >
              选择本地题目包
            </button>
            <span className="file-chip">{taskPackageLabel}</span>
          </div>
        </div>
        <div className="picker-card">
          <strong>底图预览</strong>
          <p className="muted">
            当前默认底图为 oval-track，也可以临时选择本地图像做预览。
          </p>
          <input
            ref={backgroundInputRef}
            accept="image/*"
            className="sr-only"
            type="file"
            onChange={handleBackgroundFile}
          />
          <div className="button-row-inline">
            <button
              type="button"
              className="button-secondary"
              onClick={() => backgroundInputRef.current?.click()}
            >
              选择本地底图
            </button>
            <span className="file-chip">{backgroundName}</span>
          </div>
          <div className="track-preview">
            <img src={backgroundPreview} alt="当前底图预览" />
          </div>
        </div>
      </div>

      <label>
        Jumbotron 赛道
        <select
          name="trackId"
          value={trackId}
          onChange={(event) => handleTrackChange(event.target.value)}
        >
          {TRACK_OPTIONS.map((item) => (
            <option key={item.trackId} value={item.trackId}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        起终点位置 s
        <input
          name="trackStartFinishS"
          max={1}
          min={0}
          step="0.01"
          type="number"
          value={startFinishS}
          onChange={(event) => setStartFinishS(event.target.value)}
        />
      </label>
      <label className="full">
        检查点配置（JSON）
        <textarea
          name="trackCheckpointsJson"
          rows={5}
          value={checkpointsText}
          onChange={(event) => setCheckpointsText(event.target.value)}
        />
      </label>

      <label className="full">
        题目描述
        <textarea
          defaultValue="实现一个稳定排序模块，支持整数数组升序输出，并在边界输入下保持正确性。"
          name="taskDescription"
          required
          rows={4}
        />
      </label>
      <label className="full">
        训练数据说明
        <textarea
          defaultValue="训练数据包含小规模样例、重复元素、逆序输入和空数组。"
          name="trainingDataSummary"
          rows={3}
        />
      </label>
      <label className="full">
        评测说明
        <textarea
          defaultValue="Runner 根据通过率、代码质量、推理过程和关键词覆盖度综合评分。"
          name="evaluationNotes"
          required
          rows={3}
        />
      </label>
      <label className="full">
        关键词
        <textarea
          defaultValue="需求分析, 时间复杂度, 边界条件, 稳定性, 测试验证"
          name="keywordsText"
          required
          rows={3}
        />
      </label>
      <label>
        报名开始
        <input
          defaultValue="2026-06-05T08:00"
          name="signupStart"
          required
          type="datetime-local"
        />
      </label>
      <label>
        报名结束
        <input
          defaultValue="2026-06-06T08:00"
          name="signupEnd"
          required
          type="datetime-local"
        />
      </label>
      <label>
        比赛开始
        <input
          defaultValue="2026-06-06T09:00"
          name="raceStart"
          required
          type="datetime-local"
        />
      </label>
      <label>
        比赛结束
        <input
          defaultValue="2026-06-08T18:00"
          name="raceEnd"
          required
          type="datetime-local"
        />
      </label>
      <label>
        Token 上限
        <input defaultValue={4000} min={0} name="tokenLimit" type="number" />
      </label>
      <label>
        榜单刷新粒度（分钟）
        <input
          defaultValue={30}
          min={1}
          name="updateGranularityMinutes"
          type="number"
        />
      </label>
      <label>
        每组人数上限
        <input defaultValue={5} min={1} name="maxTeamSize" type="number" />
      </label>
      <label>
        提交间隔（小时）
        <input
          defaultValue={24}
          min={1}
          name="submissionIntervalHours"
          type="number"
        />
      </label>
      <label>
        封榜提前量（分钟）
        <input
          defaultValue={30}
          min={0}
          name="freezeMinutesBeforeEnd"
          type="number"
        />
      </label>
      <label>
        Highlight 数量
        <input defaultValue={3} min={0} name="displayHighlightCount" type="number" />
      </label>

      <div className="full check-grid">
        <label className="checkbox">
          <input defaultChecked name="hasTrainingData" type="checkbox" />
          有训练数据
        </label>
        <label className="checkbox">
          <input defaultChecked name="enableFreeze" type="checkbox" />
          启用封榜
        </label>
        <label className="checkbox">
          <input
            defaultChecked
            name="displayShowTrainingData"
            type="checkbox"
          />
          赛后公开训练数据
        </label>
        <label className="checkbox">
          <input
            defaultChecked
            name="displayShowOrganizerComment"
            type="checkbox"
          />
          赛后公开主办方评语
        </label>
        <label className="checkbox">
          <input
            defaultChecked
            name="displayShowTopHighlights"
            type="checkbox"
          />
          显示 Top Highlights
        </label>
        <label className="checkbox">
          <input defaultChecked name="displayShowRiderCode" type="checkbox" />
          赛后公开骑手代码
        </label>
      </div>

      <div className="full weights-grid">
        <label>
          passRate 权重
          <input
            defaultValue={0.5}
            min={0.1}
            name="weightTaskPassRate"
            step="0.1"
            type="number"
          />
        </label>
        <label>
          codeReview 权重
          <input
            defaultValue={0.5}
            min={0.1}
            name="weightCodeReview"
            step="0.1"
            type="number"
          />
        </label>
        <label>
          reasoning 权重
          <input
            defaultValue={0.7}
            min={0.1}
            name="weightReasoning"
            step="0.1"
            type="number"
          />
        </label>
        <label>
          keyword 权重
          <input
            defaultValue={0.3}
            min={0.1}
            name="weightKeywords"
            step="0.1"
            type="number"
          />
        </label>
        <label>
          totalTask 权重
          <input
            defaultValue={0.5}
            min={0.1}
            name="weightTotalTask"
            step="0.1"
            type="number"
          />
        </label>
        <label>
          totalToken 权重
          <input
            defaultValue={0.3}
            min={0.1}
            name="weightTotalToken"
            step="0.1"
            type="number"
          />
        </label>
        <label>
          totalDialogue 权重
          <input
            defaultValue={0.2}
            min={0.1}
            name="weightTotalDialogue"
            step="0.1"
            type="number"
          />
        </label>
        <label>
          Harness reasoning 权重
          <input
            defaultValue={0.6}
            min={0.1}
            name="harnessWeightReasoning"
            step="0.1"
            type="number"
          />
        </label>
        <label>
          Harness keyword 权重
          <input
            defaultValue={0.4}
            min={0.1}
            name="harnessWeightKeyword"
            step="0.1"
            type="number"
          />
        </label>
      </div>

      <button type="submit">创建赛事</button>
    </form>
  );
}
