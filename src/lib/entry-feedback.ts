export type EntryFeedbackMode = "login" | "profile" | "register";

export type EntryFeedbackCode =
  | "invalid_credentials"
  | "local_auth_disabled"
  | "profile_validation_failed"
  | "unexpected"
  | "username_taken"
  | "validation_failed";

export class EntryFeedbackError extends Error {
  code: EntryFeedbackCode;

  constructor(code: EntryFeedbackCode) {
    super(code);
    this.name = "EntryFeedbackError";
    this.code = code;
  }
}

export function buildEntryFeedbackHref(input: {
  code: EntryFeedbackCode;
  mode: EntryFeedbackMode;
  returnTo?: string;
}) {
  const path = input.mode === "profile" ? "/profile" : "/login";
  const params = new URLSearchParams();

  params.set("feedbackCode", input.code);
  if (input.mode !== "profile") {
    params.set("feedbackMode", input.mode);
  }
  if (input.returnTo) {
    params.set("returnTo", input.returnTo);
  }

  return `${path}?${params.toString()}`;
}

export function getEntryFeedbackContent(input: {
  code: string | undefined;
  mode: EntryFeedbackMode;
}) {
  const code = normalizeEntryFeedbackCode(input.code);
  if (!code) {
    return null;
  }

  const title =
    input.mode === "login"
      ? "登录未成功"
      : input.mode === "register"
        ? "注册未成功"
        : "资料保存未成功";

  const message = resolveEntryFeedbackMessage({
    code,
    mode: input.mode,
  });

  return {
    code,
    message,
    title,
  };
}

export function resolveEntryFeedbackCode(
  error: unknown,
  mode: EntryFeedbackMode,
): EntryFeedbackCode {
  if (error instanceof EntryFeedbackError) {
    return error.code;
  }

  if (isSchemaValidationError(error)) {
    return mode === "profile" ? "profile_validation_failed" : "validation_failed";
  }

  return "unexpected";
}

function normalizeEntryFeedbackCode(code: string | undefined) {
  if (
    code === "invalid_credentials" ||
    code === "local_auth_disabled" ||
    code === "profile_validation_failed" ||
    code === "unexpected" ||
    code === "username_taken" ||
    code === "validation_failed"
  ) {
    return code;
  }

  return null;
}

function isSchemaValidationError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "issues" in error &&
      Array.isArray((error as { issues?: unknown }).issues),
  );
}

function resolveEntryFeedbackMessage(input: {
  code: EntryFeedbackCode;
  mode: EntryFeedbackMode;
}) {
  switch (input.code) {
    case "invalid_credentials":
      return "账号或密码错误，请检查后重试。";
    case "local_auth_disabled":
      return input.mode === "register"
        ? "当前环境已关闭本地账号注册，请改用 GitHub 登录。"
        : "当前环境已关闭本地账号登录，请改用 GitHub 登录。";
    case "profile_validation_failed":
      return "请检查显示名称和机构信息后重新提交。";
    case "username_taken":
      return "该用户名已被占用，请更换后重试。";
    case "validation_failed":
      return input.mode === "register"
        ? "请检查用户名和密码格式后重新注册。"
        : "请检查用户名和密码格式后重新登录。";
    case "unexpected":
    default:
      return input.mode === "profile"
        ? "资料保存暂时失败，请稍后再试。"
        : "当前操作暂时失败，请稍后再试。";
  }
}
