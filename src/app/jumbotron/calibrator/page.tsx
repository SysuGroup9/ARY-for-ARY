import type { Metadata } from "next";
import { CalibratorUI } from "./calibrator-ui";

export const metadata: Metadata = {
  title: "Calibrator — DevCompass Racing",
  description: "可视化赛道校准工具：绘制控制点、配置车道、预览马匹位置、导出 TrackProfile",
};

export default function CalibratorPage() {
  return <CalibratorUI />;
}
