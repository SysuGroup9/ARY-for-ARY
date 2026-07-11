type FrozenRegistrationRef = {
  id: string;
  userId: string;
};

type FrozenWorkRef = {
  contentHash: string;
  id: string;
  title: string;
};

type FrozenJudgingWorkRef = FrozenWorkRef & {
  sourceRefJson: string;
};

type FrozenEvidenceRef = {
  id: string;
  sourceDigest: string;
  type: string;
};

type FrozenJudgingEvidenceRef = FrozenEvidenceRef & {
  integrityStatus: string;
  title: string;
};

type FrozenProjectionRef = {
  asOfAt: string;
  payloadDigest: string;
  type: string;
};

type FrozenAwardRef = {
  awardName: string;
  id: string;
  rank: number;
};

export function buildJudgingRecordSourceRef(input: {
  evidences: FrozenJudgingEvidenceRef[];
  registration: FrozenRegistrationRef;
  work: FrozenJudgingWorkRef;
}) {
  return {
    evidences: input.evidences,
    registration: input.registration,
    work: input.work,
  };
}

export function buildAwardSourceRef(input: {
  evidences: FrozenEvidenceRef[];
  registration: FrozenRegistrationRef;
  work: FrozenWorkRef | null;
}) {
  return {
    evidences: input.evidences,
    registration: input.registration,
    work: input.work,
  };
}

export function buildReportSourceRef(input: {
  awards: FrozenAwardRef[];
  evidences: Array<FrozenEvidenceRef & { registrationId: string }>;
  projections: FrozenProjectionRef[];
  raceId: string;
  reportType: string;
  subjectRegistrationId: null | string;
  works: Array<FrozenWorkRef & { registrationId: string }>;
}) {
  return {
    awards: input.awards,
    evidences: input.evidences,
    projections: input.projections,
    raceId: input.raceId,
    reportType: input.reportType,
    subjectRegistrationId: input.subjectRegistrationId,
    works: input.works,
  };
}
