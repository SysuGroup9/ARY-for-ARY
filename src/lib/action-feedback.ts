import { isRedirectError } from "next/dist/client/components/redirect-error";

export type ActionFeedbackScope =
  | "admin_race_requests"
  | "admin_roles"
  | "cooperation_request"
  | "create_race"
  | "judge_review"
  | "organizer_announcements"
  | "organizer_awards"
  | "organizer_ca_status"
  | "organizer_feedback"
  | "organizer_judging"
  | "organizer_judges"
  | "organizer_maintenance"
  | "organizer_reports"
  | "organizer_settings"
  | "organizer_registration"
  | "organizer_works"
  | "public_register"
  | "rider_ca_setup"
  | "rider_console"
  | "rider_review"
  | "rider_registration"
  | "rider_submission"
  | "screen_console";

export function buildActionFeedbackHref(input: {
  error: unknown;
  returnTo: string;
  scope: ActionFeedbackScope;
}) {
  const params = new URLSearchParams();
  params.set("feedbackScope", input.scope);
  params.set(
    "feedbackMessage",
    resolveActionFeedbackMessage(input.error, input.scope),
  );
  return `${input.returnTo}?${params.toString()}`;
}

export function getActionFeedbackContent(input: {
  message?: string;
  scope?: string;
}) {
  const scope = normalizeActionFeedbackScope(input.scope);
  if (!scope || !input.message) {
    return null;
  }

  return {
    message: input.message,
    title: getActionFeedbackTitle(scope),
  };
}

export function shouldRethrowActionFeedback(error: unknown) {
  return isRedirectError(error);
}

function normalizeActionFeedbackScope(scope: string | undefined) {
  if (
    scope === "admin_race_requests" ||
    scope === "admin_roles" ||
    scope === "cooperation_request" ||
    scope === "create_race" ||
    scope === "judge_review" ||
    scope === "organizer_announcements" ||
    scope === "organizer_awards" ||
    scope === "organizer_ca_status" ||
    scope === "organizer_feedback" ||
    scope === "organizer_judging" ||
    scope === "organizer_judges" ||
    scope === "organizer_maintenance" ||
    scope === "organizer_reports" ||
    scope === "organizer_settings" ||
    scope === "organizer_registration" ||
    scope === "organizer_works" ||
    scope === "public_register" ||
    scope === "rider_ca_setup" ||
    scope === "rider_console" ||
    scope === "rider_review" ||
    scope === "rider_registration" ||
    scope === "rider_submission" ||
    scope === "screen_console"
  ) {
    return scope;
  }

  return null;
}

function getActionFeedbackTitle(scope: ActionFeedbackScope) {
  switch (scope) {
    case "admin_race_requests":
      return "申请审核未完成";
    case "admin_roles":
      return "角色更新未完成";
    case "cooperation_request":
      return "合作申请未提交";
    case "create_race":
      return "赛事创建未完成";
    case "judge_review":
      return "评审提交未完成";
    case "organizer_announcements":
      return "公告处理未完成";
    case "organizer_awards":
      return "奖项处理未完成";
    case "organizer_ca_status":
      return "CA 状态操作未完成";
    case "organizer_feedback":
      return "反馈处理未完成";
    case "organizer_judging":
      return "评审进度操作未完成";
    case "organizer_judges":
      return "评委分配未完成";
    case "organizer_maintenance":
      return "维护操作未完成";
    case "organizer_reports":
      return "报告处理未完成";
    case "organizer_settings":
      return "赛事设置未完成";
    case "organizer_registration":
      return "报名处理未完成";
    case "organizer_works":
      return "作品处理未完成";
    case "public_register":
    case "rider_registration":
      return "报名未完成";
    case "rider_ca_setup":
      return "CA 接入未完成";
    case "rider_console":
      return "骑手操作未完成";
    case "rider_review":
      return "结果反馈未完成";
    case "rider_submission":
      return "作品提交未完成";
    case "screen_console":
      return "大屏设置未完成";
    default:
      return "当前操作未完成";
  }
}

function resolveActionFeedbackMessage(
  error: unknown,
  scope: ActionFeedbackScope,
) {
  const message =
    error instanceof Error ? error.message.trim() : String(error ?? "").trim();

  switch (message) {
    case "Race not found":
    case "赛事不存在":
      return "当前赛事不可用，请返回赛事页后重试。";
    case "Registration is only open during the registration phase":
      return "当前赛事已不在报名阶段，暂不能提交报名。";
    case "User not found":
      return "当前账号状态异常，请重新登录后重试。";
    case "Registration could not be created":
      return "报名创建失败，请稍后再试。";
    case "Record to update not found.":
    case "No record was found for an update.":
      return "当前记录不存在或已被删除，请刷新页面后重试。";
    case "无权批准这条报名":
    case "无权拒绝这条报名":
    case "无权撤回这条报名":
      return "当前账号没有权限处理这条报名，请检查当前赛事和身份后重试。";
    case "已撤回的报名不能直接批准":
      return "这条报名已经撤回，当前不能直接批准。";
    case "已通过的报名不能直接拒绝":
      return "这条报名已经通过审核，当前不能直接拒绝。";
    case "已撤回的报名不能再拒绝":
      return "这条报名已经撤回，不能再次拒绝。";
    case "这条报名已经撤回":
      return "这条报名已经撤回，无需重复处理。";
    case "已拒绝的报名不能再撤回":
      return "这条报名已经拒绝，不能再标记退赛。";
    case "报名锁定后不能自行撤回":
      return "报名锁定后不能自行撤回，请联系主办方处理。";
    case "只有草稿赛事可以发布":
      return "当前赛事不是草稿状态，暂不能发布。";
    case "比赛结束后不能再修改题目与训练数据":
      return "比赛结束后不能再修改题目与训练数据。";
    case "只能在比赛结束后归档":
      return "当前赛事还不能归档，请在比赛结束后再操作。";
    case "RaceProject not found for current rider":
      return "当前 CA 接入上下文不可用，请刷新页面后重试。";
    case "CAConnection not found for current rider":
      return "当前 CA 连接不可用，请刷新页面后重试。";
    case "CAConnection not found for current operator":
      return "当前连接器不存在，或你已经无权继续操作它。";
    case "CAConnection is not eligible for snapshot fetch":
      return "当前 CA 连接暂不能抓取快照，请先检查连接状态。";
    case "CAConnection has no connectorBaseUrl":
      return "当前连接器缺少可用地址，请先完善连接配置。";
    case "Snapshot payload scope mismatch":
      return "快照返回内容与当前连接不匹配，请重新握手后重试。";
    case "Snapshot credential required":
      return "当前连接器缺少快照凭据，请先完成配置。";
    case "Snapshot signature missing":
      return "快照签名缺失，请检查连接器配置后重试。";
    case "Snapshot signature version mismatch":
      return "快照签名版本不匹配，请重新握手后重试。";
    case "Snapshot signature invalid":
      return "快照签名校验失败，请检查连接器配置后重试。";
    case "无权公开这份作品":
    case "无权隐藏这份作品":
    case "无权锁定这份作品":
      return "当前账号没有权限处理这份作品，请检查当前赛事和身份后重试。";
    case "只有草稿作品才能由骑手自行隐藏":
      return "当前作品不是草稿，不能按骑手草稿路径隐藏。";
    case "草稿作品不能直接公开":
      return "草稿作品不能直接公开，请先完成正式提交。";
    case "无权操作这场比赛的公告":
    case "无权操作这条公告":
      return "当前账号没有权限处理这条公告，请检查当前赛事和身份后重试。";
    case "已发布公告不能直接编辑，请先隐藏":
      return "已发布公告不能直接编辑，请先隐藏后再修改。";
    case "无权操作这场比赛的正式榜单":
    case "无权编辑这份 Award 草稿":
      return "当前账号没有权限处理这份奖项数据，请检查当前赛事和身份后重试。";
    case "当前还没有已提交的 JudgingRecord，无法生成正式榜单":
      return "当前还没有已提交的评审记录，暂不能生成正式榜单。";
    case "已发布 Award 不能直接编辑，请先撤回回草稿态":
      return "已发布奖项不能直接编辑，请先撤回到草稿状态。";
    case "award draft slot already exists":
      return "相同奖项名称和排名的草稿已经存在，请调整后重试。";
    case "无权操作这场比赛的报告":
    case "无权操作这份报告":
      return "当前账号没有权限处理这份报告，请检查当前赛事和身份后重试。";
    case "rider_report 默认保持私有，当前不支持公开发布":
      return "骑手报告默认保持私有，当前不支持公开发布。";
    case "只能发布 reviewed 状态的公开报告":
      return "只有 reviewed 状态的公开报告才能发布。";
    case "已发布报告不能再编辑":
      return "已发布报告不能再编辑。";
    case "已发布报告不能再标记 reviewed":
      return "已发布报告不能再标记 reviewed。";
    case "Judge assignment actor must be organizer or admin":
      return "当前账号没有权限分配评委，请检查当前身份后重试。";
    case "Judge assignment not allowed for current actor":
      return "当前账号不能操作这份评委分配，请检查当前赛事权限后重试。";
    case "Judge assignment not found for current user":
      return "当前评审任务不存在，或你已经无权继续提交评审。";
    case "无权操作这场比赛的大屏显示状态":
      return "当前账号没有权限操作这场比赛的大屏设置，请检查当前赛事权限后重试。";
    case "Cooperation material missing: taskPackage":
      return "题目包附件不存在或已失效，请重新上传后再审批。";
    case "Cooperation material missing: proposal":
      return "方案附件不存在或已失效，请重新上传后再审批。";
    case "Invalid cooperation upload path: taskPackage":
      return "题目包附件路径无效，请重新上传后再审批。";
    case "Invalid cooperation upload path: proposal":
      return "方案附件路径无效，请重新上传后再审批。";
    case "Cooperation material hash mismatch: taskPackage":
      return "题目包附件校验失败，请重新上传后再审批。";
    case "Cooperation material hash mismatch: proposal":
      return "方案附件校验失败，请重新上传后再审批。";
  }

  if (message.startsWith("Snapshot fetch failed with status")) {
    return "快照抓取失败，请稍后重试或检查连接器服务。";
  }

  if (isReadableChineseMessage(message)) {
    return message;
  }

  switch (scope) {
    case "admin_race_requests":
      return "当前申请审核操作暂时失败，请稍后再试。";
    case "admin_roles":
      return "当前角色更新操作暂时失败，请稍后再试。";
    case "cooperation_request":
      return "当前合作申请暂未提交成功，请检查联系信息和赛程配置后重试。";
    case "create_race":
      return "当前赛事创建暂未完成，请检查赛事标题、时间和评测配置后重试。";
    case "judge_review":
      return "当前评审提交操作暂时失败，请稍后再试。";
    case "organizer_announcements":
      return "当前公告处理操作暂时失败，请稍后再试。";
    case "organizer_awards":
      return "当前奖项处理操作暂时失败，请稍后再试。";
    case "organizer_ca_status":
      return "当前 CA 状态操作暂时失败，请稍后再试。";
    case "organizer_feedback":
      return "当前反馈处理操作暂时失败，请稍后再试。";
    case "organizer_judging":
      return "当前评审进度操作暂时失败，请稍后再试。";
    case "organizer_judges":
      return "当前评委分配操作暂时失败，请稍后再试。";
    case "organizer_maintenance":
      return "当前维护操作暂时失败，请稍后再试。";
    case "organizer_reports":
      return "当前报告处理操作暂时失败，请稍后再试。";
    case "organizer_settings":
      return "当前赛事设置操作暂时失败，请稍后再试。";
    case "organizer_registration":
      return "当前报名处理操作暂时失败，请稍后再试。";
    case "organizer_works":
      return "当前作品处理操作暂时失败，请稍后再试。";
    case "public_register":
    case "rider_registration":
      return "当前报名操作暂时失败，请稍后再试。";
    case "rider_ca_setup":
      return "当前 CA 接入操作暂时失败，请稍后再试。";
    case "rider_review":
      return "当前结果反馈操作暂时失败，请稍后再试。";
    case "rider_submission":
      return "当前作品提交操作暂时失败，请稍后再试。";
    case "screen_console":
      return "当前大屏设置操作暂时失败，请稍后再试。";
    default:
      return "当前操作暂时失败，请稍后再试。";
  }
}

function isReadableChineseMessage(message: string) {
  return /[\u4e00-\u9fff]/.test(message) && !/[A-Z]{2,}|[a-z]{4,}.*[A-Z]{2,}/.test(message);
}
