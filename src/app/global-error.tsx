"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <main className="auth-page">
          <section className="auth-entry-layout" style={{ paddingTop: 24 }}>
            <div className="card" style={{ padding: 32 }}>
              <div className="stack">
                <p className="eyebrow">Global Error</p>
                <h1 style={{ margin: 0, fontSize: "1.75rem" }}>页面暂时不可用</h1>
                <p className="muted">
                  系统已切换到全局错误兜底界面，当前不会继续向用户暴露原始异常内容。
                </p>
                {error?.digest ? (
                  <div className="public-link-card" style={{ padding: 14 }}>
                    <strong>错误标识</strong>
                    <span>{error.digest}</span>
                  </div>
                ) : null}
                <div className="button-row-inline">
                  <button type="button" onClick={reset}>
                    重新加载
                  </button>
                  <a className="button-secondary" href="/">
                    返回公开首页
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
