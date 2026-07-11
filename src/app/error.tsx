"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="auth-page">
      <section className="auth-entry-layout" style={{ paddingTop: 24 }}>
        <div className="card" style={{ padding: 32 }}>
          <div className="stack">
            <p className="eyebrow">Error</p>
            <h1 style={{ margin: 0, fontSize: "1.75rem" }}>当前操作暂时无法完成</h1>
            <p className="muted">
              系统已拦截这次异常，页面没有继续暴露原始报错。你可以先重试一次，或返回公开首页继续浏览。
            </p>
            {error?.digest ? (
              <div className="public-link-card" style={{ padding: 14 }}>
                <strong>错误标识</strong>
                <span>{error.digest}</span>
              </div>
            ) : null}
            <div className="button-row-inline">
              <button type="button" onClick={reset}>
                重试当前页面
              </button>
              <a className="button-secondary" href="/">
                返回公开首页
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
