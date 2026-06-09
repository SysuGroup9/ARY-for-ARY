import { TrackProfileCalibrator } from "@/app/jumbotron/calibrator/_components/track-profile-calibrator";
import { devcompassOvalTrack } from "@/lib/jumbotron/mock-racing-data";

export default function CalibratorPage() {
  return <TrackProfileCalibrator initialProfile={devcompassOvalTrack} />;
}
