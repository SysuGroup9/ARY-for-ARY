import { formatDateTime } from "../lib/time";
import { getRacePhase, getRacePhaseLabel } from "../lib/domain";
import type { Race } from "../types";

interface RaceCardProps {
  race: Race;
  selected: boolean;
  onSelect: (raceId: string) => void;
}

export function RaceCard({ race, selected, onSelect }: RaceCardProps) {
  const phase = getRacePhase(race);

  return (
    <button
      className={`race-card${selected ? " race-card--selected" : ""}`}
      onClick={() => onSelect(race.id)}
      type="button"
    >
      <div className="race-card__header">
        <span className={`phase-badge phase-badge--${phase}`}>
          {getRacePhaseLabel(phase)}
        </span>
        <span className="race-card__granularity">
          {race.updateGranularityMinutes} 分钟更新
        </span>
      </div>
      <h3>{race.title}</h3>
      <p>{race.summary}</p>
      <dl className="race-card__times">
        <div>
          <dt>报名</dt>
          <dd>
            {formatDateTime(race.signupStart)} - {formatDateTime(race.signupEnd)}
          </dd>
        </div>
        <div>
          <dt>比赛</dt>
          <dd>
            {formatDateTime(race.raceStart)} - {formatDateTime(race.raceEnd)}
          </dd>
        </div>
      </dl>
    </button>
  );
}
