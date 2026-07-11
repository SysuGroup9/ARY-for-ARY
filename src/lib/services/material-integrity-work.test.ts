import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";

test("seeded Work rows carry sourceRefJson and contentHash", async () => {
  const work = await prisma.work.findFirstOrThrow({
    where: {
      repoUrl: {
        contains: "github.com/demo/",
      },
    },
  });

  assert.match(work.sourceRefJson, /repoUrl/);
  assert.match(work.sourceRefJson, /demoUrl/);
  assert.match(work.contentHash, /^[a-f0-9]{64}$/);
});
