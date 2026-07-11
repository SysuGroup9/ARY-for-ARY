import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import {
  buildGitHubReferenceDigest,
  buildRaceEvaluationConfigDigest,
  buildRemoteAssetReferenceDigest,
  buildChallengeMaterialSourceRef,
  buildFileBufferDigest,
  buildSubmissionBindingJson,
  buildWorkSourceRef,
  captureGitHubReferenceSnapshot,
  captureRemoteAssetSnapshot,
  parseGitHubReferenceUrl,
  verifyGitHubReferenceSnapshot,
  verifyRemoteAssetSnapshot,
  verifyRaceEvaluationConfigIntegrity,
  verifyWorkReadIntegrity,
  verifyRaceChallengeIntegrity,
  verifyWorkIntegrity,
} from "./material-integrity-helpers";
import { buildPayloadDigest } from "./ca-integrity-helpers";

async function writeUploadFixture(relativePath: string, content: string) {
  const absolutePath = join(process.cwd(), "public", "uploads", relativePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  const buffer = Buffer.from(content, "utf8");
  await writeFile(absolutePath, buffer);
  return {
    fileHash: buildFileBufferDigest(buffer),
    filePath: `/uploads/${relativePath.replace(/\\/g, "/")}`,
  };
}

test("buildFileBufferDigest returns a stable sha256 digest", () => {
  const digest = buildFileBufferDigest(Buffer.from("hello world", "utf8"));

  assert.match(digest, /^[a-f0-9]{64}$/);
  assert.equal(digest, buildFileBufferDigest(Buffer.from("hello world", "utf8")));
});

test("buildChallengeMaterialSourceRef captures task package and proposal hashes", () => {
  const ref = buildChallengeMaterialSourceRef({
    proposal: {
      fileHash: "proposal_hash",
      fileName: "brief.pdf",
      filePath: "/uploads/cooperation/proposals/brief.pdf",
    },
    taskPackage: {
      fileHash: "task_hash",
      fileName: "task.zip",
      filePath: "/uploads/cooperation/taskpackages/task.zip",
    },
  });

  assert.equal(ref.taskPackage?.fileHash, "task_hash");
  assert.equal(ref.proposal?.fileHash, "proposal_hash");
});

test("verifyRaceChallengeIntegrity accepts a race without configured challenge materials", async () => {
  const integrity = await verifyRaceChallengeIntegrity({
    race: {
      challengeContentHash: "",
      challengeSourceRefJson: "{}",
    },
  });

  assert.equal(integrity.ok, true);
});

test("verifyRaceChallengeIntegrity accepts matching stored challenge materials", async () => {
  const taskPackage = await writeUploadFixture(
    `tests/grs004-p1j-${Date.now()}-task.zip`,
    "task-package-v1",
  );
  const proposal = await writeUploadFixture(
    `tests/grs004-p1j-${Date.now()}-proposal.pdf`,
    "proposal-v1",
  );
  const sourceRef = buildChallengeMaterialSourceRef({
    proposal: {
      fileHash: proposal.fileHash,
      fileName: "proposal.pdf",
      filePath: proposal.filePath,
    },
    taskPackage: {
      fileHash: taskPackage.fileHash,
      fileName: "task.zip",
      filePath: taskPackage.filePath,
    },
  });

  const integrity = await verifyRaceChallengeIntegrity({
    race: {
      challengeContentHash: buildPayloadDigest(sourceRef),
      challengeSourceRefJson: JSON.stringify(sourceRef),
    },
  });

  assert.equal(integrity.ok, true);
});

test("verifyRaceChallengeIntegrity rejects invalid challenge sourceRef json", async () => {
  const integrity = await verifyRaceChallengeIntegrity({
    race: {
      challengeContentHash: "",
      challengeSourceRefJson: "{",
    },
  });

  assert.equal(integrity.ok, false);
  assert.equal(integrity.reason, "race_challenge_source_ref_invalid_json");
});

test("verifyRaceChallengeIntegrity rejects challenge content hash mismatches", async () => {
  const sourceRef = buildChallengeMaterialSourceRef({
    proposal: null,
    taskPackage: {
      fileHash: "task_hash",
      fileName: "task.zip",
      filePath: "/uploads/tests/task.zip",
    },
  });

  const integrity = await verifyRaceChallengeIntegrity({
    race: {
      challengeContentHash: "not-the-right-hash",
      challengeSourceRefJson: JSON.stringify(sourceRef),
    },
  });

  assert.equal(integrity.ok, false);
  assert.equal(integrity.reason, "race_challenge_content_hash_mismatch");
});

test("verifyRaceChallengeIntegrity rejects tampered task package files", async () => {
  const relativePath = `tests/grs004-p1j-${Date.now()}-tampered-task.zip`;
  const taskPackage = await writeUploadFixture(relativePath, "task-package-v1");
  const sourceRef = buildChallengeMaterialSourceRef({
    proposal: null,
    taskPackage: {
      fileHash: taskPackage.fileHash,
      fileName: "task.zip",
      filePath: taskPackage.filePath,
    },
  });

  await writeFile(
    join(process.cwd(), "public", "uploads", relativePath),
    Buffer.from("task-package-tampered", "utf8"),
  );

  const integrity = await verifyRaceChallengeIntegrity({
    race: {
      challengeContentHash: buildPayloadDigest(sourceRef),
      challengeSourceRefJson: JSON.stringify(sourceRef),
    },
  });

  assert.equal(integrity.ok, false);
  assert.equal(integrity.reason, "task_package_hash_mismatch");
});

test("buildRaceEvaluationConfigDigest returns a stable digest for runner-consumed config", () => {
  const digest = buildRaceEvaluationConfigDigest({
    harnessWeightKeyword: 0.4,
    harnessWeightReasoning: 0.6,
    keywordsJson: JSON.stringify(["hash", "runner"]),
    taskDescription: "desc",
    taskPackageLabel: "pkg.zip",
    tokenLimit: 4000,
    weightCodeReview: 0.2,
    weightKeywords: 0.3,
    weightReasoning: 0.7,
    weightTaskPassRate: 0.8,
    weightTotalDialogue: 0.2,
    weightTotalTask: 0.5,
    weightTotalToken: 0.3,
  });

  assert.match(digest, /^[a-f0-9]{64}$/);
  assert.equal(
    digest,
    buildRaceEvaluationConfigDigest({
      harnessWeightKeyword: 0.4,
      harnessWeightReasoning: 0.6,
      keywordsJson: JSON.stringify(["hash", "runner"]),
      taskDescription: "desc",
      taskPackageLabel: "pkg.zip",
      tokenLimit: 4000,
      weightCodeReview: 0.2,
      weightKeywords: 0.3,
      weightReasoning: 0.7,
      weightTaskPassRate: 0.8,
      weightTotalDialogue: 0.2,
      weightTotalTask: 0.5,
      weightTotalToken: 0.3,
    }),
  );
});

test("verifyRaceEvaluationConfigIntegrity rejects mismatched hashes while preserving legacy empty hashes", () => {
  const legacyIntegrity = verifyRaceEvaluationConfigIntegrity({
    race: {
      evaluationConfigHash: "",
      evaluationConfigVersion: 1,
      harnessWeightKeyword: 0.4,
      harnessWeightReasoning: 0.6,
      keywordsJson: JSON.stringify(["hash"]),
      taskDescription: "desc",
      taskPackageLabel: "pkg.zip",
      tokenLimit: 4000,
      weightCodeReview: 0.2,
      weightKeywords: 0.3,
      weightReasoning: 0.7,
      weightTaskPassRate: 0.8,
      weightTotalDialogue: 0.2,
      weightTotalTask: 0.5,
      weightTotalToken: 0.3,
    },
  });
  assert.equal(legacyIntegrity.ok, true);

  const integrity = verifyRaceEvaluationConfigIntegrity({
    race: {
      evaluationConfigHash: "stale_hash",
      evaluationConfigVersion: 2,
      harnessWeightKeyword: 0.4,
      harnessWeightReasoning: 0.6,
      keywordsJson: JSON.stringify(["hash"]),
      taskDescription: "desc changed",
      taskPackageLabel: "pkg.zip",
      tokenLimit: 4000,
      weightCodeReview: 0.2,
      weightKeywords: 0.3,
      weightReasoning: 0.7,
      weightTaskPassRate: 0.8,
      weightTotalDialogue: 0.2,
      weightTotalTask: 0.5,
      weightTotalToken: 0.3,
    },
  });

  assert.equal(integrity.ok, false);
  assert.equal(integrity.reason, "race_evaluation_config_hash_mismatch");
});

test("parseGitHubReferenceUrl recognizes commit, tag, and release urls", () => {
  assert.deepEqual(
    parseGitHubReferenceUrl("https://github.com/demo/work/commit/ABC1234"),
    {
      owner: "demo",
      ref: "abc1234",
      refKind: "commit",
      repo: "work",
    },
  );
  assert.deepEqual(
    parseGitHubReferenceUrl("https://github.com/demo/work/tree/v1.2.0"),
    {
      owner: "demo",
      ref: "v1.2.0",
      refKind: "tag",
      repo: "work",
    },
  );
  assert.deepEqual(
    parseGitHubReferenceUrl("https://github.com/demo/work/releases/tag/v1.2.0"),
    {
      owner: "demo",
      ref: "v1.2.0",
      refKind: "release",
      repo: "work",
    },
  );
});

test("captureGitHubReferenceSnapshot resolves commit urls without remote fetch", async () => {
  const snapshot = await captureGitHubReferenceSnapshot({
    repoUrl: "https://github.com/demo/work/commit/ABC1234",
  });

  assert.deepEqual(snapshot, {
    owner: "demo",
    provider: "github",
    ref: "abc1234",
    refKind: "commit",
    referenceDigest: buildGitHubReferenceDigest({
      owner: "demo",
      provider: "github",
      ref: "abc1234",
      refKind: "commit",
      repo: "work",
      resolvedCommitSha: "abc1234",
    }),
    repo: "work",
    resolvedCommitSha: "abc1234",
  });
});

test("captureGitHubReferenceSnapshot resolves tag and release urls through mocked GitHub API", async () => {
  const fetchCalls: string[] = [];
  const fetchImpl = async (input: string) => {
    fetchCalls.push(input);
    if (input.includes("/git/ref/tags/v1.2.0")) {
      return new Response(
        JSON.stringify({
          object: {
            sha: "TAG_OBJECT_SHA",
            type: "tag",
          },
        }),
        { status: 200 },
      );
    }

    if (input.includes("/git/tags/TAG_OBJECT_SHA")) {
      return new Response(
        JSON.stringify({
          object: {
            sha: "COMMIT_SHA_V120",
            type: "commit",
          },
        }),
        { status: 200 },
      );
    }

    if (input.includes("/releases/tags/v2.0.0")) {
      return new Response(
        JSON.stringify({
          tag_name: "v2.0.0",
        }),
        { status: 200 },
      );
    }

    if (input.includes("/git/ref/tags/v2.0.0")) {
      return new Response(
        JSON.stringify({
          object: {
            sha: "TAG_OBJECT_SHA_V2",
            type: "tag",
          },
        }),
        { status: 200 },
      );
    }

    if (input.includes("/git/tags/TAG_OBJECT_SHA_V2")) {
      return new Response(
        JSON.stringify({
          object: {
            sha: "COMMIT_SHA_V120",
            type: "commit",
          },
        }),
        { status: 200 },
      );
    }

    return new Response("not found", { status: 404 });
  };

  const tagSnapshot = await captureGitHubReferenceSnapshot({
    fetchImpl,
    repoUrl: "https://github.com/demo/work/tree/v1.2.0",
  });
  const releaseSnapshot = await captureGitHubReferenceSnapshot({
    fetchImpl,
    repoUrl: "https://github.com/demo/work/releases/tag/v2.0.0",
  });

  assert.equal(tagSnapshot?.resolvedCommitSha, "commit_sha_v120");
  assert.equal(releaseSnapshot?.resolvedCommitSha, "commit_sha_v120");
  assert.equal(fetchCalls.some((call) => call.includes("/releases/tags/v2.0.0")), true);
});

test("verifyGitHubReferenceSnapshot rejects commit mismatch without remote fetch", async () => {
  const snapshot = await captureGitHubReferenceSnapshot({
    repoUrl: "https://github.com/demo/work/commit/aaaaaaaa",
  });

  const integrity = await verifyGitHubReferenceSnapshot({
    githubRef: snapshot,
    repoUrl: "https://github.com/demo/work/commit/bbbbbbbb",
  });

  assert.equal(integrity.ok, false);
  assert.equal(integrity.reason, "work_github_ref_mismatch");
});

test("verifyWorkReadIntegrity preserves legacy works without githubRef and rejects stale githubRef snapshots", async () => {
  const legacyIntegrity = await verifyWorkReadIntegrity({
    work: {
      contentHash: buildPayloadDigest({
        demoUrl: "https://demo.example/work-1",
        repoUrl: "https://github.com/demo/work-1",
        summary: "summary",
        techNotes: "notes",
        title: "Work 1",
        videoUrl: "https://video.example/work-1",
      }),
      demoUrl: "https://demo.example/work-1",
      repoUrl: "https://github.com/demo/work-1",
      sourceRefJson: JSON.stringify(
        buildWorkSourceRef({
          demoUrl: "https://demo.example/work-1",
          repoUrl: "https://github.com/demo/work-1",
          techNotes: "notes",
          videoUrl: "https://video.example/work-1",
        }),
      ),
      summary: "summary",
      techNotes: "notes",
      title: "Work 1",
      videoUrl: "https://video.example/work-1",
    },
  });

  assert.equal(legacyIntegrity.ok, true);

  const staleSnapshot = await captureGitHubReferenceSnapshot({
    repoUrl: "https://github.com/demo/work/commit/aaaaaaaa",
  });
  const githubIntegrity = await verifyWorkReadIntegrity({
    work: {
      contentHash: buildPayloadDigest({
        demoUrl: "https://demo.example/work-1",
        repoUrl: "https://github.com/demo/work/commit/bbbbbbbb",
        summary: "summary",
        techNotes: "notes",
        title: "Work 1",
        videoUrl: "https://video.example/work-1",
      }),
      demoUrl: "https://demo.example/work-1",
      repoUrl: "https://github.com/demo/work/commit/bbbbbbbb",
      sourceRefJson: JSON.stringify(
        buildWorkSourceRef({
          demoUrl: "https://demo.example/work-1",
          githubRef: staleSnapshot,
          repoUrl: "https://github.com/demo/work/commit/bbbbbbbb",
          techNotes: "notes",
          videoUrl: "https://video.example/work-1",
        }),
      ),
      summary: "summary",
      techNotes: "notes",
      title: "Work 1",
      videoUrl: "https://video.example/work-1",
    },
  });

  assert.equal(githubIntegrity.ok, false);
  assert.equal(githubIntegrity.reason, "work_github_ref_mismatch");
});

test("captureRemoteAssetSnapshot records remote body digest and metadata", async () => {
  const snapshot = await captureRemoteAssetSnapshot({
    assetKind: "demo",
    fetchImpl: async () =>
      new Response("<html>demo</html>", {
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
        status: 200,
      }),
    url: "https://demo.example/work-1",
  });

  assert.deepEqual(snapshot, {
    assetKind: "demo",
    contentDigest: buildFileBufferDigest(Buffer.from("<html>demo</html>", "utf8")),
    contentLength: Buffer.byteLength("<html>demo</html>", "utf8"),
    contentType: "text/html; charset=utf-8",
    provider: "remote",
    referenceDigest: buildRemoteAssetReferenceDigest({
      assetKind: "demo",
      contentDigest: buildFileBufferDigest(Buffer.from("<html>demo</html>", "utf8")),
      contentLength: Buffer.byteLength("<html>demo</html>", "utf8"),
      contentType: "text/html; charset=utf-8",
      provider: "remote",
      url: "https://demo.example/work-1",
    }),
    url: "https://demo.example/work-1",
  });
});

test("verifyRemoteAssetSnapshot rejects stale remote body digests", async () => {
  const snapshot = await captureRemoteAssetSnapshot({
    assetKind: "video",
    fetchImpl: async () =>
      new Response("video-v1", {
        headers: {
          "content-type": "video/mp4",
        },
        status: 200,
      }),
    url: "https://video.example/work-1",
  });

  const integrity = await verifyRemoteAssetSnapshot({
    assetKind: "video",
    fetchImpl: async () =>
      new Response("video-v2", {
        headers: {
          "content-type": "video/mp4",
        },
        status: 200,
      }),
    snapshot,
    url: "https://video.example/work-1",
  });

  assert.equal(integrity.ok, false);
  assert.equal(integrity.reason, "work_video_ref_mismatch");
});

test("verifyWorkReadIntegrity rejects stale demo/video snapshots", async () => {
  const demoRef = await captureRemoteAssetSnapshot({
    assetKind: "demo",
    fetchImpl: async () =>
      new Response("<html>demo-v1</html>", {
        headers: {
          "content-type": "text/html",
        },
        status: 200,
      }),
    url: "https://demo.example/work-1",
  });
  const videoRef = await captureRemoteAssetSnapshot({
    assetKind: "video",
    fetchImpl: async () =>
      new Response("video-v1", {
        headers: {
          "content-type": "video/mp4",
        },
        status: 200,
      }),
    url: "https://video.example/work-1",
  });

  const integrity = await verifyWorkReadIntegrity({
    fetchImpl: async (input: string) =>
      new Response(
        input.includes("demo.example") ? "<html>demo-v2</html>" : "video-v1",
        {
          headers: {
            "content-type": input.includes("demo.example")
              ? "text/html"
              : "video/mp4",
          },
          status: 200,
        },
      ),
    work: {
      contentHash: buildPayloadDigest({
        demoUrl: "https://demo.example/work-1",
        repoUrl: "https://github.com/demo/work-1",
        summary: "summary",
        techNotes: "notes",
        title: "Work 1",
        videoUrl: "https://video.example/work-1",
      }),
      demoUrl: "https://demo.example/work-1",
      repoUrl: "https://github.com/demo/work-1",
      sourceRefJson: JSON.stringify(
        buildWorkSourceRef({
          demoRef,
          demoUrl: "https://demo.example/work-1",
          repoUrl: "https://github.com/demo/work-1",
          techNotes: "notes",
          videoRef,
          videoUrl: "https://video.example/work-1",
        }),
      ),
      summary: "summary",
      techNotes: "notes",
      title: "Work 1",
      videoUrl: "https://video.example/work-1",
    },
  });

  assert.equal(integrity.ok, false);
  assert.equal(integrity.reason, "work_demo_ref_mismatch");
});

test("buildWorkSourceRef tracks current public asset references", () => {
  const ref = buildWorkSourceRef({
    demoRef: {
      assetKind: "demo",
      contentDigest: "demo_digest",
      contentLength: 12,
      contentType: "text/html",
      provider: "remote",
      referenceDigest: "demo_ref_digest",
      url: "https://demo.example/work-1",
    },
    demoUrl: "https://demo.example/work-1",
    githubRef: {
      owner: "demo",
      provider: "github",
      ref: "abc1234",
      refKind: "commit",
      referenceDigest: "digest",
      repo: "work-1",
      resolvedCommitSha: "abc1234",
    },
    repoUrl: "https://github.com/demo/work-1",
    techNotes: "notes",
    videoRef: {
      assetKind: "video",
      contentDigest: "video_digest",
      contentLength: 34,
      contentType: "video/mp4",
      provider: "remote",
      referenceDigest: "video_ref_digest",
      url: "https://video.example/work-1",
    },
    videoUrl: "https://video.example/work-1",
  });

  assert.deepEqual(ref, {
    demoRef: {
      assetKind: "demo",
      contentDigest: "demo_digest",
      contentLength: 12,
      contentType: "text/html",
      provider: "remote",
      referenceDigest: "demo_ref_digest",
      url: "https://demo.example/work-1",
    },
    demoUrl: "https://demo.example/work-1",
    githubRef: {
      owner: "demo",
      provider: "github",
      ref: "abc1234",
      refKind: "commit",
      referenceDigest: "digest",
      repo: "work-1",
      resolvedCommitSha: "abc1234",
    },
    repoUrl: "https://github.com/demo/work-1",
    techNotesIncluded: true,
    videoRef: {
      assetKind: "video",
      contentDigest: "video_digest",
      contentLength: 34,
      contentType: "video/mp4",
      provider: "remote",
      referenceDigest: "video_ref_digest",
      url: "https://video.example/work-1",
    },
    videoUrl: "https://video.example/work-1",
  });
});

test("buildSubmissionBindingJson ties material to race, registration, and user", () => {
  const binding = buildSubmissionBindingJson({
    raceId: "race_1",
    registrationId: "reg_1",
    submittedAt: new Date("2026-07-10T10:00:00.000Z"),
    userId: "user_1",
  });

  assert.equal(
    binding,
    JSON.stringify({
      raceId: "race_1",
      registrationId: "reg_1",
      submittedAt: "2026-07-10T10:00:00.000Z",
      userId: "user_1",
    }),
  );
});

test("verifyWorkIntegrity accepts matching work content and source ref", () => {
  const integrity = verifyWorkIntegrity({
    work: {
      contentHash: buildPayloadDigest({
        demoUrl: "https://demo.example/work-1",
        repoUrl: "https://github.com/demo/work-1",
        summary: "summary",
        techNotes: "notes",
        title: "Work 1",
        videoUrl: "https://video.example/work-1",
      }),
      demoUrl: "https://demo.example/work-1",
      repoUrl: "https://github.com/demo/work-1",
      sourceRefJson: JSON.stringify(
        buildWorkSourceRef({
          demoUrl: "https://demo.example/work-1",
          repoUrl: "https://github.com/demo/work-1",
          techNotes: "notes",
          videoUrl: "https://video.example/work-1",
        }),
      ),
      summary: "summary",
      techNotes: "notes",
      title: "Work 1",
      videoUrl: "https://video.example/work-1",
    },
  });

  assert.equal(integrity.ok, true);
});

test("verifyWorkIntegrity rejects tampered work content", () => {
  const integrity = verifyWorkIntegrity({
    work: {
      contentHash: buildPayloadDigest({
        demoUrl: "https://demo.example/work-1",
        repoUrl: "https://github.com/demo/work-1",
        summary: "summary",
        techNotes: "notes",
        title: "Work 1",
        videoUrl: "https://video.example/work-1",
      }),
      demoUrl: "https://demo.example/work-1",
      repoUrl: "https://github.com/demo/work-1",
      sourceRefJson: JSON.stringify(
        buildWorkSourceRef({
          demoUrl: "https://demo.example/work-1",
          repoUrl: "https://github.com/demo/work-1",
          techNotes: "notes",
          videoUrl: "https://video.example/work-1",
        }),
      ),
      summary: "tampered-summary",
      techNotes: "notes",
      title: "Work 1",
      videoUrl: "https://video.example/work-1",
    },
  });

  assert.equal(integrity.ok, false);
  assert.equal(integrity.reason, "work_content_hash_mismatch");
});
