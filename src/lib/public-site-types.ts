export type ReturnTypeOfBuildPublicSiteModel = {
  featuredRaces: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    phase: string;
    raceStart: Date;
    raceEnd: Date;
    teamCount: number;
    workCount: number;
    activeRiderCount: number;
    currentProgressPercent: number;
  }>;
  liveRaces: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    phase: string;
    raceStart: Date;
    raceEnd: Date;
    teamCount: number;
    workCount: number;
    activeRiderCount: number;
    currentProgressPercent: number;
  }>;
  latestResults: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
  }>;
  pastRaces: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
  }>;
  featuredWorks: Array<{
    id: string;
    raceId: string;
    raceSlug: string;
    raceTitle: string;
    title: string;
    author: string;
    excerpt: string;
    score: number;
    agentType: string;
  }>;
  featuredRiders: Array<{
    id: string;
    riderSlug: string;
    username: string;
    orgLabel: string;
    featuredRaceTitle: string | null;
    featuredWorkTitle: string | null;
    raceCount: number;
    workCount: number;
    publicWorkLinks: Array<{
      title: string;
      href: string;
    }>;
  }>;
};
