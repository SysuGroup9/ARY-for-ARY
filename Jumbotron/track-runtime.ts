import type { TrackProfile, HorsePose } from "./types";

interface Vec2 {
  x: number;
  y: number;
}

interface ArcEntry {
  x: number;
  y: number;
  segIndex: number;
  localT: number;
  arcLen: number;
}

const SAMPLES_PER_SEGMENT = 80;

function catmullRomPoint(
  p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number
): Vec2 {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 0.5 * (2*p1.x + (-p0.x+p2.x)*t + (2*p0.x-5*p1.x+4*p2.x-p3.x)*t2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
    y: 0.5 * (2*p1.y + (-p0.y+p2.y)*t + (2*p0.y-5*p1.y+4*p2.y-p3.y)*t2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*t3),
  };
}

function catmullRomTangent(
  p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number
): Vec2 {
  const t2 = t * t;
  return {
    x: 0.5 * ((-p0.x+p2.x) + (4*p0.x-10*p1.x+8*p2.x-2*p3.x)*t + (-3*p0.x+9*p1.x-9*p2.x+3*p3.x)*t2),
    y: 0.5 * ((-p0.y+p2.y) + (4*p0.y-10*p1.y+8*p2.y-2*p3.y)*t + (-3*p0.y+9*p1.y-9*p2.y+3*p3.y)*t2),
  };
}

function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len < 1e-9) return { x: 1, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export class TrackRuntime {
  readonly profile: TrackProfile;
  private readonly pts: Vec2[];
  private readonly arcTable: ArcEntry[] = [];
  readonly totalLength: number;

  constructor(profile: TrackProfile) {
    this.profile = profile;
    this.pts = profile.centerline.points.map(([x, y]) => ({ x, y }));
    this.arcTable = [];
    this.totalLength = this.buildArcTable();
  }

  private buildArcTable(): number {
    const { pts } = this;
    const n = pts.length;
    const closed = this.profile.centerline.closed;
    const segCount = closed ? n : n - 1;
    let cumLen = 0;

    for (let seg = 0; seg < segCount; seg++) {
      const p0 = pts[(seg - 1 + n) % n];
      const p1 = pts[seg % n];
      const p2 = pts[(seg + 1) % n];
      const p3 = pts[(seg + 2) % n];

      if (seg === 0) {
        const first = catmullRomPoint(p0, p1, p2, p3, 0);
        this.arcTable.push({ ...first, segIndex: 0, localT: 0, arcLen: 0 });
      }

      let prev = catmullRomPoint(p0, p1, p2, p3, 0);
      for (let i = 1; i <= SAMPLES_PER_SEGMENT; i++) {
        const localT = i / SAMPLES_PER_SEGMENT;
        const cur = catmullRomPoint(p0, p1, p2, p3, localT);
        const dx = cur.x - prev.x;
        const dy = cur.y - prev.y;
        cumLen += Math.sqrt(dx * dx + dy * dy);
        this.arcTable.push({ ...cur, segIndex: seg, localT, arcLen: cumLen });
        prev = cur;
      }
    }

    return cumLen;
  }

  sampleAt(s: number): { pos: Vec2; tangent: Vec2; normal: Vec2 } {
    s = Math.max(0, Math.min(1, s));
    const targetLen = s * this.totalLength;

    let lo = 0;
    let hi = this.arcTable.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (this.arcTable[mid].arcLen < targetLen) lo = mid;
      else hi = mid;
    }

    const a = this.arcTable[lo];
    const b = this.arcTable[hi];
    const span = b.arcLen - a.arcLen;
    const frac = span < 1e-9 ? 0 : (targetLen - a.arcLen) / span;
    const localT = a.localT + frac * (b.localT - a.localT);
    const seg = b.segIndex;

    const n = this.pts.length;
    const p0 = this.pts[(seg - 1 + n) % n];
    const p1 = this.pts[seg % n];
    const p2 = this.pts[(seg + 1) % n];
    const p3 = this.pts[(seg + 2) % n];

    const pos = catmullRomPoint(p0, p1, p2, p3, localT);
    const tang = normalize(catmullRomTangent(p0, p1, p2, p3, localT));
    const norm: Vec2 = { x: -tang.y, y: tang.x };

    return { pos, tangent: tang, normal: norm };
  }

  computeHorsePose(
    entryId: string,
    s: number,
    laneOffset: number,
    zIndex: number
  ): HorsePose {
    const { pos, tangent, normal } = this.sampleAt(s);
    return {
      entryId,
      x: pos.x + normal.x * laneOffset,
      y: pos.y + normal.y * laneOffset,
      rotation: Math.atan2(tangent.y, tangent.x) * (180 / Math.PI),
      s,
      laneOffset,
      zIndex,
    };
  }

  /**
   * Returns an SVG path string for the centerline (or an offset curve).
   * offset = 0 → centerline; positive = outside normal; negative = inside.
   */
  getPathD(offset = 0, samples = 300): string {
    const parts: string[] = [];
    for (let i = 0; i <= samples; i++) {
      const { pos, normal } = this.sampleAt(i / samples);
      const x = (pos.x + normal.x * offset).toFixed(1);
      const y = (pos.y + normal.y * offset).toFixed(1);
      parts.push(`${i === 0 ? "M" : "L"}${x},${y}`);
    }
    if (this.profile.centerline.closed) parts.push("Z");
    return parts.join(" ");
  }

  /** Returns the world position + normal at a checkpoint given its s value. */
  checkpointGeometry(s: number): { pos: Vec2; normal: Vec2 } {
    const { pos, normal } = this.sampleAt(s);
    return { pos, normal };
  }
}
