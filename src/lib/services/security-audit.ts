import { buildSecurityAuditRecord } from "@/lib/security-audit-helpers";

type SecurityAuditInput = Parameters<typeof buildSecurityAuditRecord>[0];

export async function recordSecurityAudit<
  T extends {
    securityAudit: {
      create(args: { data: ReturnType<typeof buildSecurityAuditRecord> }): Promise<unknown>;
    };
  },
>(db: T, input: SecurityAuditInput) {
  return db.securityAudit.create({
    data: buildSecurityAuditRecord(input),
  });
}
