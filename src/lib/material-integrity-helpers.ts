import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";

type FetchImpl = (input: string, init?: RequestInit) => Promise<Response>;

export type GitHubReferenceKind = "commit" | "release" | "tag";

export type GitHubReferenceSnapshot = {
  owner: string;
  provider: "github";
  ref: string;
  refKind: GitHubReferenceKind;
  referenceDigest: string;
  repo: string;
  resolvedCommitSha: string;
};

export type RemoteAssetKind = "demo" | "video";

export type RemoteAssetSnapshot = {
  assetKind: RemoteAssetKind;
  contentDigest: string;
  contentLength: number;
  contentType: string;
  provider: "remote";
  referenceDigest: string;
  url: string;
};

type RaceEvaluationConfigShape = {
  evaluationConfigHash: string;
  evaluationConfigVersion: number;
  harnessWeightKeyword: number;
  harnessWeightReasoning: number;
  keywordsJson: string;
  taskDescription: string;
  taskPackageLabel: string;
  tokenLimit: number;
  weightCodeReview: number;
  weightKeywords: number;
  weightReasoning: number;
  weightTaskPassRate: number;
  weightTotalDialogue: number;
  weightTotalTask: number;
  weightTotalToken: number;
};

export function buildFileBufferDigest(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function buildChallengeMaterialSourceRef(input: {
  proposal?: {
    fileHash: string;
    fileName: string;
    filePath: string;
  } | null;
  taskPackage?: {
    fileHash: string;
    fileName: string;
    filePath: string;
  } | null;
}) {
  return {
    proposal: input.proposal ?? null,
    taskPackage: input.taskPackage ?? null,
  };
}

function getDefaultFetchImpl(): FetchImpl {
  return (input, init) => fetch(input, init);
}

function normalizeHex(value: string) {
  return value.trim().toLowerCase();
}

export function buildGitHubReferenceDigest(input: {
  owner: string;
  provider: "github";
  ref: string;
  refKind: GitHubReferenceKind;
  repo: string;
  resolvedCommitSha: string;
}) {
  return buildPayloadDigest({
    owner: input.owner,
    provider: input.provider,
    ref: input.ref,
    refKind: input.refKind,
    repo: input.repo,
    resolvedCommitSha: normalizeHex(input.resolvedCommitSha),
  });
}

export function buildRemoteAssetReferenceDigest(input: {
  assetKind: RemoteAssetKind;
  contentDigest: string;
  contentLength: number;
  contentType: string;
  provider: "remote";
  url: string;
}) {
  return buildPayloadDigest({
    assetKind: input.assetKind,
    contentDigest: input.contentDigest,
    contentLength: input.contentLength,
    contentType: input.contentType,
    provider: input.provider,
    url: input.url,
  });
}

export function buildRaceEvaluationConfigDigest(input: Omit<
  RaceEvaluationConfigShape,
  "evaluationConfigHash" | "evaluationConfigVersion"
>) {
  return buildPayloadDigest({
    harnessWeightKeyword: input.harnessWeightKeyword,
    harnessWeightReasoning: input.harnessWeightReasoning,
    keywordsJson: input.keywordsJson,
    taskDescription: input.taskDescription,
    taskPackageLabel: input.taskPackageLabel,
    tokenLimit: input.tokenLimit,
    weightCodeReview: input.weightCodeReview,
    weightKeywords: input.weightKeywords,
    weightReasoning: input.weightReasoning,
    weightTaskPassRate: input.weightTaskPassRate,
    weightTotalDialogue: input.weightTotalDialogue,
    weightTotalTask: input.weightTotalTask,
    weightTotalToken: input.weightTotalToken,
  });
}

export function verifyRaceEvaluationConfigIntegrity(input: {
  race: RaceEvaluationConfigShape;
}) {
  if (input.race.evaluationConfigHash.trim().length === 0) {
    return {
      actualValue: "",
      expectedValue: "",
      ok: true as const,
      reason: "ok" as const,
    };
  }

  const expectedHash = buildRaceEvaluationConfigDigest({
    harnessWeightKeyword: input.race.harnessWeightKeyword,
    harnessWeightReasoning: input.race.harnessWeightReasoning,
    keywordsJson: input.race.keywordsJson,
    taskDescription: input.race.taskDescription,
    taskPackageLabel: input.race.taskPackageLabel,
    tokenLimit: input.race.tokenLimit,
    weightCodeReview: input.race.weightCodeReview,
    weightKeywords: input.race.weightKeywords,
    weightReasoning: input.race.weightReasoning,
    weightTaskPassRate: input.race.weightTaskPassRate,
    weightTotalDialogue: input.race.weightTotalDialogue,
    weightTotalTask: input.race.weightTotalTask,
    weightTotalToken: input.race.weightTotalToken,
  });

  if (expectedHash !== input.race.evaluationConfigHash) {
    return {
      actualValue: expectedHash,
      expectedValue: input.race.evaluationConfigHash,
      ok: false as const,
      reason: "race_evaluation_config_hash_mismatch" as const,
    };
  }

  return {
    actualValue: "",
    expectedValue: "",
    ok: true as const,
    reason: "ok" as const,
  };
}

export function parseGitHubReferenceUrl(repoUrl: string): null | {
  owner: string;
  ref: string;
  refKind: GitHubReferenceKind;
  repo: string;
} {
  let url: URL;
  try {
    url = new URL(repoUrl);
  } catch {
    return null;
  }

  if (url.hostname !== "github.com") {
    return null;
  }

  const parts = url.pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);

  if (parts.length < 4) {
    return null;
  }

  const owner = parts[0] ?? "";
  const repo = (parts[1] ?? "").replace(/\.git$/i, "");

  if (!owner || !repo) {
    return null;
  }

  if (parts[2] === "commit" && parts[3]) {
    return {
      owner,
      ref: normalizeHex(parts[3]),
      refKind: "commit",
      repo,
    };
  }

  if (parts[2] === "tree" && parts[3]) {
    return {
      owner,
      ref: parts[3],
      refKind: "tag",
      repo,
    };
  }

  if (parts[2] === "releases" && parts[3] === "tag" && parts[4]) {
    return {
      owner,
      ref: parts[4],
      refKind: "release",
      repo,
    };
  }

  return null;
}

async function fetchGitHubJson<T>(
  url: string,
  fetchImpl: FetchImpl,
): Promise<T> {
  const response = await fetchImpl(url, {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "ARY-for-ARY",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(`github_fetch_failed:${response.status}`);
  }

  return (await response.json()) as T;
}

async function resolveGitHubTagCommitSha(input: {
  fetchImpl: FetchImpl;
  owner: string;
  repo: string;
  tag: string;
}) {
  const refPayload = await fetchGitHubJson<{
    object?: { sha?: string; type?: string };
  }>(
    `https://api.github.com/repos/${input.owner}/${input.repo}/git/ref/tags/${encodeURIComponent(input.tag)}`,
    input.fetchImpl,
  );

  const refObject = refPayload.object;
  if (!refObject?.sha || !refObject.type) {
    throw new Error("github_tag_ref_invalid");
  }

  if (refObject.type === "commit") {
    return normalizeHex(refObject.sha);
  }

  if (refObject.type !== "tag") {
    throw new Error("github_tag_ref_invalid");
  }

  const tagPayload = await fetchGitHubJson<{
    object?: { sha?: string; type?: string };
  }>(
    `https://api.github.com/repos/${input.owner}/${input.repo}/git/tags/${refObject.sha}`,
    input.fetchImpl,
  );

  if (tagPayload.object?.type !== "commit" || !tagPayload.object.sha) {
    throw new Error("github_tag_object_invalid");
  }

  return normalizeHex(tagPayload.object.sha);
}

export async function captureGitHubReferenceSnapshot(input: {
  fetchImpl?: FetchImpl;
  repoUrl: string;
}): Promise<GitHubReferenceSnapshot | null> {
  const parsed = parseGitHubReferenceUrl(input.repoUrl);
  if (!parsed) {
    return null;
  }

  const fetchImpl = input.fetchImpl ?? getDefaultFetchImpl();
  let resolvedCommitSha = parsed.ref;

  if (parsed.refKind === "tag") {
    resolvedCommitSha = await resolveGitHubTagCommitSha({
      fetchImpl,
      owner: parsed.owner,
      repo: parsed.repo,
      tag: parsed.ref,
    });
  }

  if (parsed.refKind === "release") {
    const releasePayload = await fetchGitHubJson<{ tag_name?: string }>(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/releases/tags/${encodeURIComponent(parsed.ref)}`,
      fetchImpl,
    );

    const releaseTag = releasePayload.tag_name?.trim();
    if (!releaseTag) {
      throw new Error("github_release_invalid");
    }

    resolvedCommitSha = await resolveGitHubTagCommitSha({
      fetchImpl,
      owner: parsed.owner,
      repo: parsed.repo,
      tag: releaseTag,
    });
  }

  return {
    owner: parsed.owner,
    provider: "github",
    ref: parsed.ref,
    refKind: parsed.refKind,
    referenceDigest: buildGitHubReferenceDigest({
      owner: parsed.owner,
      provider: "github",
      ref: parsed.ref,
      refKind: parsed.refKind,
      repo: parsed.repo,
      resolvedCommitSha,
    }),
    repo: parsed.repo,
    resolvedCommitSha,
  };
}

function normalizeRemoteAssetSnapshot(
  value: unknown,
): null | RemoteAssetSnapshot {
  if (
    !value ||
    typeof value !== "object" ||
    (value as { provider?: unknown }).provider !== "remote" ||
    typeof (value as { assetKind?: unknown }).assetKind !== "string" ||
    typeof (value as { url?: unknown }).url !== "string" ||
    typeof (value as { contentDigest?: unknown }).contentDigest !== "string" ||
    typeof (value as { contentType?: unknown }).contentType !== "string" ||
    typeof (value as { contentLength?: unknown }).contentLength !== "number" ||
    typeof (value as { referenceDigest?: unknown }).referenceDigest !== "string"
  ) {
    return null;
  }

  const assetKind = (value as { assetKind: string }).assetKind;
  if (assetKind !== "demo" && assetKind !== "video") {
    return null;
  }

  return {
    assetKind,
    contentDigest: (value as { contentDigest: string }).contentDigest,
    contentLength: (value as { contentLength: number }).contentLength,
    contentType: (value as { contentType: string }).contentType,
    provider: "remote",
    referenceDigest: (value as { referenceDigest: string }).referenceDigest,
    url: (value as { url: string }).url,
  };
}

export async function captureRemoteAssetSnapshot(input: {
  assetKind: RemoteAssetKind;
  fetchImpl?: FetchImpl;
  url: string;
}): Promise<RemoteAssetSnapshot | null> {
  const normalizedUrl = input.url.trim();
  if (!normalizedUrl) {
    return null;
  }

  const fetchImpl = input.fetchImpl ?? getDefaultFetchImpl();
  const response = await fetchImpl(normalizedUrl, {
    cache: "no-store",
    headers: {
      "User-Agent": "ARY-for-ARY",
    },
  });

  if (!response.ok) {
    throw new Error(`remote_asset_fetch_failed:${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "";
  const contentLength = buffer.byteLength;
  const contentDigest = buildFileBufferDigest(buffer);

  return {
    assetKind: input.assetKind,
    contentDigest,
    contentLength,
    contentType,
    provider: "remote",
    referenceDigest: buildRemoteAssetReferenceDigest({
      assetKind: input.assetKind,
      contentDigest,
      contentLength,
      contentType,
      provider: "remote",
      url: normalizedUrl,
    }),
    url: normalizedUrl,
  };
}

function normalizeGitHubReferenceSnapshot(
  value: unknown,
): GitHubReferenceSnapshot | null {
  if (
    !value ||
    typeof value !== "object" ||
    (value as { provider?: unknown }).provider !== "github" ||
    typeof (value as { owner?: unknown }).owner !== "string" ||
    typeof (value as { repo?: unknown }).repo !== "string" ||
    typeof (value as { refKind?: unknown }).refKind !== "string" ||
    typeof (value as { ref?: unknown }).ref !== "string" ||
    typeof (value as { resolvedCommitSha?: unknown }).resolvedCommitSha !== "string" ||
    typeof (value as { referenceDigest?: unknown }).referenceDigest !== "string"
  ) {
    return null;
  }

  const refKind = (value as { refKind: string }).refKind;
  if (refKind !== "commit" && refKind !== "tag" && refKind !== "release") {
    return null;
  }

  return {
    owner: (value as { owner: string }).owner,
    provider: "github",
    ref: (value as { ref: string }).ref,
    refKind,
    referenceDigest: (value as { referenceDigest: string }).referenceDigest,
    repo: (value as { repo: string }).repo,
    resolvedCommitSha: normalizeHex(
      (value as { resolvedCommitSha: string }).resolvedCommitSha,
    ),
  };
}

export async function verifyGitHubReferenceSnapshot(input: {
  fetchImpl?: FetchImpl;
  githubRef: unknown;
  repoUrl: string;
}) {
  const snapshot = normalizeGitHubReferenceSnapshot(input.githubRef);
  if (!snapshot) {
    return {
      actualValue: JSON.stringify(input.githubRef),
      expectedValue: "",
      ok: false as const,
      reason: "work_github_ref_invalid_json" as const,
    };
  }

  const parsed = parseGitHubReferenceUrl(input.repoUrl);
  if (
    !parsed ||
    parsed.owner !== snapshot.owner ||
    parsed.repo !== snapshot.repo ||
    parsed.refKind !== snapshot.refKind ||
    parsed.ref !== snapshot.ref
  ) {
    return {
      actualValue: input.repoUrl,
      expectedValue: JSON.stringify({
        owner: snapshot.owner,
        ref: snapshot.ref,
        refKind: snapshot.refKind,
        repo: snapshot.repo,
      }),
      ok: false as const,
      reason: "work_github_ref_mismatch" as const,
    };
  }

  const fetchImpl = input.fetchImpl ?? getDefaultFetchImpl();
  let resolvedCommitSha = snapshot.resolvedCommitSha;

  if (snapshot.refKind === "commit") {
    resolvedCommitSha = normalizeHex(parsed.ref);
  } else {
    try {
      const currentSnapshot = await captureGitHubReferenceSnapshot({
        fetchImpl,
        repoUrl: input.repoUrl,
      });

      if (!currentSnapshot) {
        return {
          actualValue: input.repoUrl,
          expectedValue: JSON.stringify(snapshot),
          ok: false as const,
          reason: "work_github_ref_mismatch" as const,
        };
      }

      resolvedCommitSha = currentSnapshot.resolvedCommitSha;
    } catch (error) {
      return {
        actualValue: String(error),
        expectedValue: JSON.stringify(snapshot),
        ok: false as const,
        reason: "work_github_ref_fetch_failed" as const,
      };
    }
  }

  if (resolvedCommitSha !== snapshot.resolvedCommitSha) {
    return {
      actualValue: resolvedCommitSha,
      expectedValue: snapshot.resolvedCommitSha,
      ok: false as const,
      reason: "work_github_ref_mismatch" as const,
    };
  }

  const expectedDigest = buildGitHubReferenceDigest({
    owner: snapshot.owner,
    provider: "github",
    ref: snapshot.ref,
    refKind: snapshot.refKind,
    repo: snapshot.repo,
    resolvedCommitSha,
  });

  if (expectedDigest !== snapshot.referenceDigest) {
    return {
      actualValue: expectedDigest,
      expectedValue: snapshot.referenceDigest,
      ok: false as const,
      reason: "work_github_ref_digest_mismatch" as const,
    };
  }

  return {
    actualValue: "",
    expectedValue: "",
    ok: true as const,
    reason: "ok" as const,
  };
}

function getRemoteAssetReason(
  assetKind: RemoteAssetKind,
  suffix:
    | "digest_mismatch"
    | "fetch_failed"
    | "invalid_json"
    | "mismatch",
) {
  return `work_${assetKind}_ref_${suffix}` as const;
}

export async function verifyRemoteAssetSnapshot(input: {
  assetKind: RemoteAssetKind;
  fetchImpl?: FetchImpl;
  snapshot: unknown;
  url: string;
}) {
  const snapshot = normalizeRemoteAssetSnapshot(input.snapshot);
  if (!snapshot || snapshot.assetKind !== input.assetKind) {
    return {
      actualValue: JSON.stringify(input.snapshot),
      expectedValue: "",
      ok: false as const,
      reason: getRemoteAssetReason(input.assetKind, "invalid_json"),
    };
  }

  const normalizedUrl = input.url.trim();
  if (snapshot.url !== normalizedUrl) {
    return {
      actualValue: normalizedUrl,
      expectedValue: snapshot.url,
      ok: false as const,
      reason: getRemoteAssetReason(input.assetKind, "mismatch"),
    };
  }

  let currentSnapshot: null | RemoteAssetSnapshot;
  try {
    currentSnapshot = await captureRemoteAssetSnapshot({
      assetKind: input.assetKind,
      fetchImpl: input.fetchImpl,
      url: normalizedUrl,
    });
  } catch (error) {
    return {
      actualValue: String(error),
      expectedValue: JSON.stringify(snapshot),
      ok: false as const,
      reason: getRemoteAssetReason(input.assetKind, "fetch_failed"),
    };
  }

  if (!currentSnapshot) {
    return {
      actualValue: normalizedUrl,
      expectedValue: snapshot.url,
      ok: false as const,
      reason: getRemoteAssetReason(input.assetKind, "mismatch"),
    };
  }

  if (currentSnapshot.contentDigest !== snapshot.contentDigest) {
    return {
      actualValue: currentSnapshot.contentDigest,
      expectedValue: snapshot.contentDigest,
      ok: false as const,
      reason: getRemoteAssetReason(input.assetKind, "mismatch"),
    };
  }

  if (currentSnapshot.referenceDigest !== snapshot.referenceDigest) {
    return {
      actualValue: currentSnapshot.referenceDigest,
      expectedValue: snapshot.referenceDigest,
      ok: false as const,
      reason: getRemoteAssetReason(input.assetKind, "digest_mismatch"),
    };
  }

  return {
    actualValue: "",
    expectedValue: "",
    ok: true as const,
    reason: "ok" as const,
  };
}

function normalizeChallengeMaterialEntry(
  value: unknown,
): null | {
  fileHash: string;
  fileName: string;
  filePath: string;
} {
  if (value === undefined || value === null) {
    return null;
  }

  if (
    typeof value !== "object" ||
    typeof (value as { fileHash?: unknown }).fileHash !== "string" ||
    typeof (value as { fileName?: unknown }).fileName !== "string" ||
    typeof (value as { filePath?: unknown }).filePath !== "string"
  ) {
    return null;
  }

  return {
    fileHash: (value as { fileHash: string }).fileHash,
    fileName: (value as { fileName: string }).fileName,
    filePath: (value as { filePath: string }).filePath,
  };
}

export function resolvePublicUploadAbsolutePath(publicPath: string) {
  const normalizedPublicPath = publicPath.trim();
  if (!normalizedPublicPath.startsWith("/uploads/")) {
    return null;
  }

  const relativePathWithinUploads = normalizedPublicPath.slice("/uploads/".length);
  const allowedRoot = normalize(
    join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads"),
  );
  const absolutePath = normalize(
    join(
      /*turbopackIgnore: true*/ process.cwd(),
      "public",
      "uploads",
      relativePathWithinUploads,
    ),
  );

  if (!absolutePath.startsWith(allowedRoot)) {
    return null;
  }

  return absolutePath;
}

export async function verifyStoredUploadHash(input: {
  expectedHash: string;
  publicPath: string;
}) {
  const absolutePath = resolvePublicUploadAbsolutePath(input.publicPath);
  if (!absolutePath) {
    return {
      actualHash: "",
      ok: false,
      reason: "invalid_upload_path" as const,
    };
  }

  try {
    const buffer = await readFile(absolutePath);
    const actualHash = buildFileBufferDigest(buffer);
    return {
      actualHash,
      ok: actualHash === input.expectedHash,
      reason:
        actualHash === input.expectedHash
          ? ("ok" as const)
          : ("hash_mismatch" as const),
    };
  } catch {
    return {
      actualHash: "",
      ok: false,
      reason: "missing" as const,
    };
  }
}

export async function verifyRaceChallengeIntegrity(input: {
  race: {
    challengeContentHash: string;
    challengeSourceRefJson: string;
  };
}) {
  let parsedSourceRef: unknown;
  try {
    parsedSourceRef = JSON.parse(input.race.challengeSourceRefJson);
  } catch {
    return {
      actualValue: input.race.challengeSourceRefJson,
      expectedValue: "",
      ok: false as const,
      reason: "race_challenge_source_ref_invalid_json" as const,
    };
  }

  if (!parsedSourceRef || typeof parsedSourceRef !== "object") {
    return {
      actualValue: JSON.stringify(parsedSourceRef),
      expectedValue: "",
      ok: false as const,
      reason: "race_challenge_source_ref_invalid_json" as const,
    };
  }

  const normalizedSourceRef = buildChallengeMaterialSourceRef({
    proposal: normalizeChallengeMaterialEntry(
      (parsedSourceRef as { proposal?: unknown }).proposal,
    ),
    taskPackage: normalizeChallengeMaterialEntry(
      (parsedSourceRef as { taskPackage?: unknown }).taskPackage,
    ),
  });

  if (
    (parsedSourceRef as { proposal?: unknown }).proposal !== undefined &&
    (parsedSourceRef as { proposal?: unknown }).proposal !== null &&
    !normalizedSourceRef.proposal
  ) {
    return {
      actualValue: JSON.stringify((parsedSourceRef as { proposal?: unknown }).proposal),
      expectedValue: "",
      ok: false as const,
      reason: "race_challenge_source_ref_invalid_json" as const,
    };
  }

  if (
    (parsedSourceRef as { taskPackage?: unknown }).taskPackage !== undefined &&
    (parsedSourceRef as { taskPackage?: unknown }).taskPackage !== null &&
    !normalizedSourceRef.taskPackage
  ) {
    return {
      actualValue: JSON.stringify((parsedSourceRef as { taskPackage?: unknown }).taskPackage),
      expectedValue: "",
      ok: false as const,
      reason: "race_challenge_source_ref_invalid_json" as const,
    };
  }

  if (
    !normalizedSourceRef.proposal &&
    !normalizedSourceRef.taskPackage &&
    input.race.challengeContentHash.trim().length === 0
  ) {
    return {
      actualValue: "",
      expectedValue: "",
      ok: true as const,
      reason: "ok" as const,
    };
  }

  const expectedChallengeContentHash = buildPayloadDigest(normalizedSourceRef);
  if (expectedChallengeContentHash !== input.race.challengeContentHash) {
    return {
      actualValue: expectedChallengeContentHash,
      expectedValue: input.race.challengeContentHash,
      ok: false as const,
      reason: "race_challenge_content_hash_mismatch" as const,
    };
  }

  for (const material of [
    {
      entry: normalizedSourceRef.taskPackage,
      mismatchReason: "task_package_hash_mismatch" as const,
      missingReason: "task_package_missing" as const,
    },
    {
      entry: normalizedSourceRef.proposal,
      mismatchReason: "proposal_hash_mismatch" as const,
      missingReason: "proposal_missing" as const,
    },
  ]) {
    if (!material.entry) {
      continue;
    }

    const verification = await verifyStoredUploadHash({
      expectedHash: material.entry.fileHash,
      publicPath: material.entry.filePath,
    });

    if (verification.ok) {
      continue;
    }

    return {
      actualValue:
        verification.reason === "invalid_upload_path"
          ? material.entry.filePath
          : verification.actualHash,
      expectedValue:
        verification.reason === "invalid_upload_path"
          ? "/uploads/..."
          : material.entry.fileHash,
      fileName: material.entry.fileName,
      filePath: material.entry.filePath,
      ok: false as const,
      reason:
        verification.reason === "missing"
          ? material.missingReason
          : verification.reason === "invalid_upload_path"
            ? ("invalid_upload_path" as const)
            : material.mismatchReason,
    };
  }

  return {
    actualValue: "",
    expectedValue: "",
    ok: true as const,
    reason: "ok" as const,
  };
}

export function buildWorkSourceRef(input: {
  demoRef?: RemoteAssetSnapshot | null;
  demoUrl: string;
  githubRef?: GitHubReferenceSnapshot | null;
  repoUrl: string;
  techNotes: string;
  videoRef?: RemoteAssetSnapshot | null;
  videoUrl: string;
}) {
  return {
    ...(input.demoRef ? { demoRef: input.demoRef } : {}),
    demoUrl: input.demoUrl,
    ...(input.githubRef ? { githubRef: input.githubRef } : {}),
    repoUrl: input.repoUrl,
    techNotesIncluded: input.techNotes.trim().length > 0,
    ...(input.videoRef ? { videoRef: input.videoRef } : {}),
    videoUrl: input.videoUrl,
  };
}

export function verifyWorkIntegrity(input: {
  work: {
    contentHash: string;
    demoUrl: string;
    repoUrl: string;
    sourceRefJson: string;
    summary: string;
    techNotes: string;
    title: string;
    videoUrl: string;
  };
}) {
  const expectedContentHash = buildPayloadDigest({
    demoUrl: input.work.demoUrl,
    repoUrl: input.work.repoUrl,
    summary: input.work.summary,
    techNotes: input.work.techNotes,
    title: input.work.title,
    videoUrl: input.work.videoUrl,
  });

  if (expectedContentHash !== input.work.contentHash) {
    return {
      actualValue: expectedContentHash,
      expectedValue: input.work.contentHash,
      ok: false as const,
      reason: "work_content_hash_mismatch" as const,
    };
  }

  let parsedSourceRef: unknown;
  try {
    parsedSourceRef = JSON.parse(input.work.sourceRefJson);
  } catch {
    return {
      actualValue: input.work.sourceRefJson,
      expectedValue: "",
      ok: false as const,
      reason: "work_source_ref_invalid_json" as const,
    };
  }

  const expectedSourceRef = buildWorkSourceRef({
    demoUrl: input.work.demoUrl,
    repoUrl: input.work.repoUrl,
    techNotes: input.work.techNotes,
    videoUrl: input.work.videoUrl,
  });

  if (
    buildPayloadDigest({
      demoUrl:
        typeof (parsedSourceRef as { demoUrl?: unknown }).demoUrl === "string"
          ? (parsedSourceRef as { demoUrl: string }).demoUrl
          : "",
      repoUrl:
        typeof (parsedSourceRef as { repoUrl?: unknown }).repoUrl === "string"
          ? (parsedSourceRef as { repoUrl: string }).repoUrl
          : "",
      techNotesIncluded:
        typeof (parsedSourceRef as { techNotesIncluded?: unknown }).techNotesIncluded ===
        "boolean"
          ? (parsedSourceRef as { techNotesIncluded: boolean }).techNotesIncluded
          : null,
      videoUrl:
        typeof (parsedSourceRef as { videoUrl?: unknown }).videoUrl === "string"
          ? (parsedSourceRef as { videoUrl: string }).videoUrl
          : "",
    }) !==
      buildPayloadDigest(expectedSourceRef)
  ) {
    return {
      actualValue: JSON.stringify(parsedSourceRef),
      expectedValue: JSON.stringify(expectedSourceRef),
      ok: false as const,
      reason: "work_source_ref_mismatch" as const,
    };
  }

  return {
    actualValue: "",
    expectedValue: "",
    ok: true as const,
    reason: "ok" as const,
  };
}

export async function verifyWorkReadIntegrity(input: {
  fetchImpl?: FetchImpl;
  work: {
    contentHash: string;
    demoUrl: string;
    repoUrl: string;
    sourceRefJson: string;
    summary: string;
    techNotes: string;
    title: string;
    videoUrl: string;
  };
}) {
  const localIntegrity = verifyWorkIntegrity({ work: input.work });
  if (!localIntegrity.ok) {
    return localIntegrity;
  }

  let parsedSourceRef: unknown;
  try {
    parsedSourceRef = JSON.parse(input.work.sourceRefJson);
  } catch {
    return {
      actualValue: input.work.sourceRefJson,
      expectedValue: "",
      ok: false as const,
      reason: "work_source_ref_invalid_json" as const,
    };
  }

  const githubRef = (parsedSourceRef as { githubRef?: unknown }).githubRef;
  if (githubRef) {
    const githubIntegrity = await verifyGitHubReferenceSnapshot({
      fetchImpl: input.fetchImpl,
      githubRef,
      repoUrl: input.work.repoUrl,
    });

    if (!githubIntegrity.ok) {
      return githubIntegrity;
    }
  }

  const demoRef = (parsedSourceRef as { demoRef?: unknown }).demoRef;
  if (demoRef) {
    const demoIntegrity = await verifyRemoteAssetSnapshot({
      assetKind: "demo",
      fetchImpl: input.fetchImpl,
      snapshot: demoRef,
      url: input.work.demoUrl,
    });

    if (!demoIntegrity.ok) {
      return demoIntegrity;
    }
  }

  const videoRef = (parsedSourceRef as { videoRef?: unknown }).videoRef;
  if (videoRef) {
    const videoIntegrity = await verifyRemoteAssetSnapshot({
      assetKind: "video",
      fetchImpl: input.fetchImpl,
      snapshot: videoRef,
      url: input.work.videoUrl,
    });

    if (!videoIntegrity.ok) {
      return videoIntegrity;
    }
  }

  return {
    actualValue: "",
    expectedValue: "",
    ok: true as const,
    reason: "ok" as const,
  };
}

export function buildSubmissionBindingJson(input: {
  raceId: string;
  registrationId: string;
  submittedAt: Date;
  teamId: string;
  userId: string;
}) {
  return JSON.stringify({
    raceId: input.raceId,
    registrationId: input.registrationId,
    submittedAt: input.submittedAt.toISOString(),
    teamId: input.teamId,
    userId: input.userId,
  });
}

export function parseSubmissionBindingJson(
  submitterBindingJson: string,
): null | {
  raceId: string;
  registrationId: string;
  submittedAt: string;
  teamId: string;
  userId: string;
} {
  try {
    const parsed = JSON.parse(submitterBindingJson);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.raceId === "string" &&
      typeof parsed.registrationId === "string" &&
      typeof parsed.submittedAt === "string" &&
      typeof parsed.userId === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function verifySubmissionArtifactIntegrity(input: {
  artifact: {
    codeContent: string;
    codeContentHash: string;
    ridingRecord: null | string;
    ridingRecordHash: string;
    submitterBindingJson: string;
  };
  expectedRaceId: string;
  expectedRegistrationId: null | string;
  expectedUserId: null | string;
}) {
  const codeContentHash = buildPayloadDigest(input.artifact.codeContent);
  if (codeContentHash !== input.artifact.codeContentHash) {
    return {
      actualValue: codeContentHash,
      expectedValue: input.artifact.codeContentHash,
      ok: false as const,
      reason: "code_content_hash_mismatch" as const,
    };
  }

  const ridingRecordHash = buildPayloadDigest(input.artifact.ridingRecord ?? "");
  if (ridingRecordHash !== input.artifact.ridingRecordHash) {
    return {
      actualValue: ridingRecordHash,
      expectedValue: input.artifact.ridingRecordHash,
      ok: false as const,
      reason: "riding_record_hash_mismatch" as const,
    };
  }

  const parsedBinding = parseSubmissionBindingJson(input.artifact.submitterBindingJson);
  if (!parsedBinding) {
    return {
      actualValue: input.artifact.submitterBindingJson,
      expectedValue: "",
      ok: false as const,
      reason: "submitter_binding_invalid_json" as const,
    };
  }

  if (
    parsedBinding.raceId !== input.expectedRaceId ||
    parsedBinding.registrationId !== input.expectedRegistrationId ||
    parsedBinding.userId !== input.expectedUserId
  ) {
    return {
      actualValue: JSON.stringify(parsedBinding),
      expectedValue: JSON.stringify({
        raceId: input.expectedRaceId,
        registrationId: input.expectedRegistrationId,
        userId: input.expectedUserId,
      }),
      ok: false as const,
      reason: "submitter_binding_mismatch" as const,
    };
  }

  return {
    actualValue: "",
    expectedValue: "",
    ok: true as const,
    reason: "ok" as const,
  };
}
