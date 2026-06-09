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
            <p className={styles.sectionLabel}>Validation Results</p>
            <div className={report.valid ? styles.validBadge : styles.invalidBadge}>
              {report.valid ? "VALID" : "INVALID"}
            </div>
            {[...report.errors, ...report.warnings].map((item) => (
              <p className={styles.validationLine} key={item}>{item}</p>
            ))}
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
