export function buildRankedLeaderboardEntries<
  T extends {
    createdAt: Date;
    totalScore: number;
  },
>(entries: T[]): Array<T & { rank: number }> {
  return [...entries]
    .sort((left, right) => {
      if (right.totalScore !== left.totalScore) {
        return right.totalScore - left.totalScore;
      }

      return left.createdAt.getTime() - right.createdAt.getTime();
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}
