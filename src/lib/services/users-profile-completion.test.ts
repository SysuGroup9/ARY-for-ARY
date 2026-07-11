import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { completeUserProfile } from "@/lib/services/users";
import { hashPassword } from "@/lib/auth";

test("completeUserProfile writes profile fields and marks the user as completed", async () => {
  const user = await prisma.user.create({
    data: {
      passwordHash: await hashPassword(randomUUID()),
      profileCompleted: false,
      profileName: "",
      profileOrgLabel: "",
      rolesJson: '["RIDER"]',
      username: `profile_${randomUUID().slice(0, 8)}`,
    },
  });

  const updated = await completeUserProfile({
    profileName: "Alice Rider",
    profileOrgLabel: "ARY Lab",
    userId: user.id,
  });

  assert.equal(updated.profileCompleted, true);
  assert.equal(updated.profileName, "Alice Rider");
  assert.equal(updated.profileOrgLabel, "ARY Lab");
});
