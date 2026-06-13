"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type PointerEvent,
  type SetStateAction,
} from "react";
import styles from "@/app/jumbotron/jumbotron.module.css";
import type { RacingEntrySnapshot } from "@/lib/jumbotron/contracts";
import type { Point, TrackProfile } from "@/lib/jumbotron/track-profile";
import {
  buildTrackRuntime,
  calculateHorsePoses,
  sampleLanePath,
  validateTrackProfile,
} from "@/lib/jumbotron/track-runtime";

export function TrackProfileCalibrator({
  initialProfile,
}: {
  initialProfile: TrackProfile;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [profile, setProfile] = useState<TrackProfile>(initialProfile);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [horseCount, setHorseCount] = useState(4);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0.42);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [speed, setSpeed] = useState(1);

  const report = useMemo(() => validateTrackProfile(profile), [profile]);
  const jsonDiff = useMemo(
    () => buildJsonDiff(initialProfile, profile),
    [initialProfile, profile],
  );
  const runtime = useMemo(() => {
    try {
      return buildTrackRuntime(profile);
    } catch {
      return null;
    }
  }, [profile]);
  const previewEntries = useMemo(
    () => createPreviewEntries(profile, progress, horseCount),
    [horseCount, profile, progress],
  );
  const previewPoses = runtime
    ? calculateHorsePoses(runtime, previewEntries, new Date("2026-06-09T12:00:00.000Z"))
    : [];

  useEffect(() => {
    if (!playing) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setProgress((value) => (value + 0.006 * speed) % 1);
    }, 80);

    return () => window.clearInterval(intervalId);
  }, [playing, speed]);

  function updateCenterline(points: Point[]): void {
    setProfile((current) => ({
      ...current,
      centerline: {
        ...current.centerline,
        points,
      },
    }));
  }

  function handleCanvasClick(event: PointerEvent<SVGSVGElement>): void {
    if (event.target !== svgRef.current) {
      return;
    }

    const point = toSvgPoint(event, svgRef.current);
    updateCenterline([...profile.centerline.points, point]);
    setSelectedPoint(profile.centerline.points.length);
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>): void {
    if (dragIndex === null || !svgRef.current) {
      return;
    }

    const point = toSvgPoint(event, svgRef.current);
    updateCenterline(
      profile.centerline.points.map((item, index) =>
        index === dragIndex ? point : item,
      ),
    );
  }

  function deleteSelectedPoint(): void {
    if (selectedPoint === null || profile.centerline.points.length <= 2) {
      return;
    }

    updateCenterline(profile.centerline.points.filter((_, index) => index !== selectedPoint));
    setSelectedPoint(null);
  }

  function reversePath(): void {
    setProfile((current) => ({
      ...current,
      centerline: {
        ...current.centerline,
        points: [...current.centerline.points].reverse(),
      },
      direction:
        current.direction === "clockwise" ? "counterclockwise" : "clockwise",
    }));
  }

  function updateLaneOffset(laneId: string, offset: number): void {
    setProfile((current) => ({
      ...current,
      lanes: current.lanes.map((lane) =>
        lane.laneId === laneId ? { ...lane, offset } : lane,
      ),
    }));
  }

  function addCheckpoint(): void {
    setProfile((current) => ({
      ...current,
      checkpoints: [
        ...current.checkpoints,
        {
          checkpointId: `checkpoint-${current.checkpoints.length + 1}`,
          label: `Checkpoint ${current.checkpoints.length + 1}`,
          s: progress,
        },
      ],
    }));
  }

  function addMessageZone(): void {
    setProfile((current) => ({
      ...current,
      messageZones: [
        ...current.messageZones,
        {
          dx: 24,
          dy: -78,
          priority: current.messageZones.length + 1,
          sEnd: clampProgress(progress + 0.08),
          sStart: clampProgress(progress - 0.05),
          zoneId: `message-zone-${current.messageZones.length + 1}`,
        },
      ],
    }));
  }

  function addNoBubbleZone(): void {
    setProfile((current) => ({
      ...current,
      noBubbleZones: [
        ...current.noBubbleZones,
        {
          sEnd: clampProgress(progress + 0.06),
          sStart: clampProgress(progress - 0.04),
          zoneId: `no-bubble-${current.noBubbleZones.length + 1}`,
        },
      ],
    }));
  }

  function addRiskZone(): void {
    setProfile((current) => ({
      ...current,
      riskZones: [
        ...current.riskZones,
        {
          label: `Risk Zone ${current.riskZones.length + 1}`,
          sEnd: clampProgress(progress + 0.08),
          sStart: clampProgress(progress - 0.06),
          severity: "medium",
          zoneId: `risk-zone-${current.riskZones.length + 1}`,
        },
      ],
    }));
  }

  return (
    <main className={`${styles.screen} ${styles.calibratorScreen}`}>
      <header className={styles.calibratorToolbar}>
        <div>
          <p className={styles.eyebrow}>Track Profile Calibrator</p>
          <h1>{profile.name}</h1>
        </div>
        <div className={styles.toolbarActions}>
          <label className={styles.fileButton}>
            Import Background
            <input accept="image/*" onChange={handleBackgroundImport} type="file" />
          </label>
          <label className={styles.fileButton}>
            Import Profile
            <input accept="application/json" onChange={handleProfileImport} type="file" />
          </label>
          <button onClick={reversePath} type="button">Reverse</button>
          <button onClick={() => toggleClosed(setProfile)} type="button">
            {profile.centerline.closed ? "Open Path" : "Close Path"}
          </button>
          <button onClick={downloadDebugPreview} type="button">Export Debug SVG</button>
          <button onClick={downloadProfile} type="button">Export JSON</button>
          <Link href="/jumbotron?debug=1">Live Preview</Link>
        </div>
      </header>

      <section className={styles.calibratorLayout}>
        <section className={styles.calibratorCanvas}>
          <svg
            className={styles.calibratorSvg}
            onPointerMove={handlePointerMove}
            onPointerUp={() => setDragIndex(null)}
            onPointerDown={handleCanvasClick}
            ref={svgRef}
            viewBox={`0 0 ${profile.viewBox.width} ${profile.viewBox.height}`}
          >
            <image
              height={profile.viewBox.height}
              href={profile.background.href}
              opacity={profile.background.opacity}
              width={profile.viewBox.width}
            />
            {runtime
              ? profile.lanes.map((lane) => (
                  <polyline
                    className={styles.calibratorLane}
                    fill="none"
                    key={lane.laneId}
                    points={sampleLanePath(runtime, lane.laneId).map(formatPoint).join(" ")}
                  />
                ))
              : null}
            {runtime
              ? profile.messageZones.map((zone) => (
                  <ZoneLine
                    className={styles.messageZoneLine}
                    key={zone.zoneId}
                    runtime={runtime}
                    sEnd={zone.sEnd}
                    sStart={zone.sStart}
                  />
                ))
              : null}
            {runtime
              ? profile.noBubbleZones.map((zone) => (
                  <ZoneLine
                    className={styles.noBubbleZoneLine}
                    key={zone.zoneId}
                    runtime={runtime}
                    sEnd={zone.sEnd}
                    sStart={zone.sStart}
                  />
                ))
              : null}
            {runtime
              ? profile.riskZones.map((zone) => (
                  <ZoneLine
                    className={styles.riskZoneLine}
                    key={zone.zoneId}
                    runtime={runtime}
                    sEnd={zone.sEnd}
                    sStart={zone.sStart}
                  />
                ))
              : null}
            <polyline
              className={styles.calibratorCenterline}
              fill="none"
              points={profile.centerline.points.map(formatPoint).join(" ")}
            />
            {profile.checkpoints.map((checkpoint) => {
              const point = runtime?.sampledPoints[Math.round(checkpoint.s * ((runtime.sampledPoints.length - 1) || 0))];
              return point ? (
                <g className={styles.calibratorCheckpoint} key={checkpoint.checkpointId}>
                  <circle cx={point.x} cy={point.y} r="12" />
                  <text x={point.x + 16} y={point.y + 5}>{checkpoint.label}</text>
                </g>
              ) : null;
            })}
            {profile.centerline.points.map((point, index) => (
              <circle
                className={index === selectedPoint ? styles.controlPointSelected : styles.controlPoint}
                cx={point.x}
                cy={point.y}
                key={`${index}-${point.x}-${point.y}`}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  setDragIndex(index);
                  setSelectedPoint(index);
                }}
                r="11"
              />
            ))}
            {previewPoses.map((pose) => (
              <g
                className={styles.previewHorse}
                key={pose.entryId}
                transform={`translate(${pose.x} ${pose.y}) rotate(${pose.rotation})`}
              >
                <path d="M24 0 L-18 -15 L-8 0 L-18 15 Z" />
              </g>
            ))}
          </svg>
        </section>

        <aside className={styles.inspector}>
          <section>
            <p className={styles.sectionLabel}>Track Info</p>
            <label>
              Name
              <input
                onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                value={profile.name}
              />
            </label>
            <label>
              Direction
              <select
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    direction: event.target.value as TrackProfile["direction"],
                  })
                }
                value={profile.direction}
              >
                <option value="clockwise">clockwise</option>
                <option value="counterclockwise">counterclockwise</option>
              </select>
            </label>
          </section>

          <section>
            <p className={styles.sectionLabel}>Geometry</p>
            <div className={styles.inspectorRow}>
              <span>Points</span>
              <strong>{profile.centerline.points.length}</strong>
            </div>
            <div className={styles.inspectorRow}>
              <span>Path length</span>
              <strong>{Math.round(report.metrics.pathLength)}</strong>
            </div>
            <button onClick={deleteSelectedPoint} type="button">Delete Point</button>
          </section>

          <section>
            <p className={styles.sectionLabel}>Lanes</p>
            {profile.lanes.map((lane) => (
              <label key={lane.laneId}>
                {lane.label}
                <input
                  onChange={(event) => updateLaneOffset(lane.laneId, Number(event.target.value))}
                  type="number"
                  value={lane.offset}
                />
              </label>
            ))}
          </section>

          <section>
            <p className={styles.sectionLabel}>Checkpoints</p>
            <button onClick={addCheckpoint} type="button">Add at Scrubber</button>
            {profile.checkpoints.map((checkpoint) => (
              <div className={styles.inspectorRow} key={checkpoint.checkpointId}>
                <span>{checkpoint.label}</span>
                <strong>{Math.round(checkpoint.s * 100)}%</strong>
              </div>
            ))}
          </section>

          <section>
            <p className={styles.sectionLabel}>Message Zones</p>
            <button onClick={addMessageZone} type="button">Add at Scrubber</button>
            {profile.messageZones.map((zone) => (
              <div className={styles.zoneCard} key={zone.zoneId}>
                <strong>{zone.zoneId}</strong>
                <div className={styles.zoneGrid}>
                  <label>
                    sStart
                    <input
                      max={1}
                      min={0}
                      onChange={(event) =>
                        updateMessageZone(zone.zoneId, { sStart: Number(event.target.value) })
                      }
                      step={0.01}
                      type="number"
                      value={zone.sStart}
                    />
                  </label>
                  <label>
                    sEnd
                    <input
                      max={1}
                      min={0}
                      onChange={(event) =>
                        updateMessageZone(zone.zoneId, { sEnd: Number(event.target.value) })
                      }
                      step={0.01}
                      type="number"
                      value={zone.sEnd}
                    />
                  </label>
                  <label>
                    dx
                    <input
                      onChange={(event) =>
                        updateMessageZone(zone.zoneId, { dx: Number(event.target.value) })
                      }
                      type="number"
                      value={zone.dx}
                    />
                  </label>
                  <label>
                    dy
                    <input
                      onChange={(event) =>
                        updateMessageZone(zone.zoneId, { dy: Number(event.target.value) })
                      }
                      type="number"
                      value={zone.dy}
                    />
                  </label>
                </div>
              </div>
            ))}
          </section>

          <section>
            <p className={styles.sectionLabel}>No Bubble Zones</p>
            <button onClick={addNoBubbleZone} type="button">Add at Scrubber</button>
            {profile.noBubbleZones.map((zone) => (
              <div className={styles.zoneCard} key={zone.zoneId}>
                <strong>{zone.zoneId}</strong>
                <div className={styles.zoneGrid}>
                  <label>
                    sStart
                    <input
                      max={1}
                      min={0}
                      onChange={(event) =>
                        updateNoBubbleZone(zone.zoneId, { sStart: Number(event.target.value) })
                      }
                      step={0.01}
                      type="number"
                      value={zone.sStart}
                    />
                  </label>
                  <label>
                    sEnd
                    <input
                      max={1}
                      min={0}
                      onChange={(event) =>
                        updateNoBubbleZone(zone.zoneId, { sEnd: Number(event.target.value) })
                      }
                      step={0.01}
                      type="number"
                      value={zone.sEnd}
                    />
                  </label>
                </div>
              </div>
            ))}
          </section>

          <section>
            <p className={styles.sectionLabel}>Risk Zones</p>
            <button onClick={addRiskZone} type="button">Add at Scrubber</button>
            {profile.riskZones.map((zone) => (
              <div className={styles.zoneCard} key={zone.zoneId}>
                <label>
                  Label
                  <input
                    onChange={(event) =>
                      updateRiskZone(zone.zoneId, { label: event.target.value })
                    }
                    value={zone.label}
                  />
                </label>
                <div className={styles.zoneGrid}>
                  <label>
                    sStart
                    <input
                      max={1}
                      min={0}
                      onChange={(event) =>
                        updateRiskZone(zone.zoneId, { sStart: Number(event.target.value) })
                      }
                      step={0.01}
                      type="number"
                      value={zone.sStart}
                    />
                  </label>
                  <label>
                    sEnd
                    <input
                      max={1}
                      min={0}
                      onChange={(event) =>
                        updateRiskZone(zone.zoneId, { sEnd: Number(event.target.value) })
                      }
                      step={0.01}
                      type="number"
                      value={zone.sEnd}
                    />
                  </label>
                </div>
              </div>
            ))}
          </section>

          <section>
            <p className={styles.sectionLabel}>Validation Results</p>
            <div className={report.valid ? styles.validBadge : styles.invalidBadge}>
              {report.valid ? "VALID" : "INVALID"}
            </div>
            {[...report.errors, ...report.warnings].map((item) => (
              <p className={styles.validationLine} key={item}>{item}</p>
            ))}
          </section>

          <section>
            <p className={styles.sectionLabel}>JSON Diff Preview</p>
            <div className={styles.inspectorRow}>
              <span>Changed lines</span>
              <strong>{jsonDiff.changedCount}</strong>
            </div>
            <pre className={styles.diffPreview}>{jsonDiff.preview}</pre>
          </section>
        </aside>
      </section>

      <footer className={styles.previewBar}>
        <button onClick={() => setPlaying((value) => !value)} type="button">
          {playing ? "Pause" : "Play"}
        </button>
        <label>
          Progress
          <input
            max={1}
            min={0}
            onChange={(event) => setProgress(Number(event.target.value))}
            step={0.01}
            type="range"
            value={progress}
          />
        </label>
        <label>
          Horses
          <input
            max={8}
            min={1}
            onChange={(event) => setHorseCount(Number(event.target.value))}
            type="number"
            value={horseCount}
          />
        </label>
        <label>
          Speed
          <input
            max={4}
            min={0.25}
            onChange={(event) => setSpeed(Number(event.target.value))}
            step={0.25}
            type="number"
            value={speed}
          />
        </label>
      </footer>
    </main>
  );

  function handleBackgroundImport(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        return;
      }

      setProfile((current) => ({
        ...current,
        background: {
          ...current.background,
          href: reader.result as string,
        },
      }));
    });
    reader.readAsDataURL(file);
  }

  function handleProfileImport(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        return;
      }

      setProfile(JSON.parse(reader.result) as TrackProfile);
    });
    reader.readAsText(file);
  }

  function downloadProfile(): void {
    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "track.profile.json";
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  function downloadDebugPreview(): void {
    const svg = buildDebugPreviewSvg(profile);
    const blob = new Blob([svg], {
      type: "image/svg+xml",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "debug-preview.svg";
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  function updateMessageZone(
    zoneId: string,
    patch: Partial<TrackProfile["messageZones"][number]>,
  ): void {
    setProfile((current) => ({
      ...current,
      messageZones: current.messageZones.map((zone) =>
        zone.zoneId === zoneId ? { ...zone, ...patch } : zone,
      ),
    }));
  }

  function updateNoBubbleZone(
    zoneId: string,
    patch: Partial<TrackProfile["noBubbleZones"][number]>,
  ): void {
    setProfile((current) => ({
      ...current,
      noBubbleZones: current.noBubbleZones.map((zone) =>
        zone.zoneId === zoneId ? { ...zone, ...patch } : zone,
      ),
    }));
  }

  function updateRiskZone(
    zoneId: string,
    patch: Partial<TrackProfile["riskZones"][number]>,
  ): void {
    setProfile((current) => ({
      ...current,
      riskZones: current.riskZones.map((zone) =>
        zone.zoneId === zoneId ? { ...zone, ...patch } : zone,
      ),
    }));
  }
}

function ZoneLine({
  className,
  runtime,
  sEnd,
  sStart,
}: {
  className: string;
  runtime: ReturnType<typeof buildTrackRuntime>;
  sEnd: number;
  sStart: number;
}) {
  const start = runtime.sampledPoints[Math.round(sStart * (runtime.sampledPoints.length - 1))];
  const end = runtime.sampledPoints[Math.round(sEnd * (runtime.sampledPoints.length - 1))];
  if (!start || !end) {
    return null;
  }

  return (
    <line
      className={className}
      strokeWidth="18"
      x1={start.x}
      x2={end.x}
      y1={start.y}
      y2={end.y}
    />
  );
}

function createPreviewEntries(
  profile: TrackProfile,
  progress: number,
  horseCount: number,
): RacingEntrySnapshot[] {
  return Array.from({ length: horseCount }, (_, index) => {
    const lane = profile.lanes[index % profile.lanes.length];
    const offsetProgress = Math.max(0, Math.min(1, progress - index * 0.035));

    return {
      caProvider: index % 2 === 0 ? "codex" : "claude",
      entryId: `preview-${index + 1}`,
      laneId: lane?.laneId,
      obstacleCount: 0,
      overallProgress: offsetProgress,
      phaseProgress: offsetProgress,
      positionSource: "roundProgress",
      projectName: `Preview ${index + 1}`,
      rank: index + 1,
      riderName: `Horse ${index + 1}`,
      riskLevel: "none",
      roundProgress: offsetProgress,
      status: "running",
      updatedAt: "2026-06-09T12:00:00.000Z",
      violationCount: 0,
    };
  });
}

function toggleClosed(
  setProfile: Dispatch<SetStateAction<TrackProfile>>,
): void {
  setProfile((current) => ({
    ...current,
    centerline: {
      ...current.centerline,
      closed: !current.centerline.closed,
    },
  }));
}

function toSvgPoint(
  event: PointerEvent<SVGSVGElement>,
  svg: SVGSVGElement,
): Point {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;

  return {
    x: ((event.clientX - rect.left) / rect.width) * viewBox.width,
    y: ((event.clientY - rect.top) / rect.height) * viewBox.height,
  };
}

function formatPoint(point: Point): string {
  return `${point.x},${point.y}`;
}

function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function buildJsonDiff(
  initialProfile: TrackProfile,
  profile: TrackProfile,
): { changedCount: number; preview: string } {
  const before = JSON.stringify(initialProfile, null, 2).split("\n");
  const after = JSON.stringify(profile, null, 2).split("\n");
  const lines = after
    .map((line, index) => (line === before[index] ? `  ${line}` : `+ ${line}`))
    .filter((line) => line.startsWith("+ "))
    .slice(0, 18);

  return {
    changedCount: lines.length,
    preview: lines.length > 0 ? lines.join("\n") : "No profile changes.",
  };
}

function buildDebugPreviewSvg(profile: TrackProfile): string {
  const points = profile.centerline.points.map(formatPoint).join(" ");
  const checkpoints = profile.checkpoints
    .map((checkpoint) => `<text x="24" y="${48 + checkpoint.s * 160}" fill="#f8e7b0">${checkpoint.label}: ${Math.round(checkpoint.s * 100)}%</text>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${profile.viewBox.width} ${profile.viewBox.height}">
  <image href="${profile.background.href}" width="${profile.viewBox.width}" height="${profile.viewBox.height}" opacity="${profile.background.opacity}" />
  <polyline points="${points}" fill="none" stroke="#f2be5c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
  ${checkpoints}
</svg>`;
}
