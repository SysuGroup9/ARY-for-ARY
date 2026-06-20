export function CooperationPageView() {
  return (
    <div className="stack" style={{ gap: 28 }}>
      <section className="hero">
        <div className="section-label"><span className="section-label__dot" />合作入口</div>
        <h1>与 <span className="gradient-text">ARY</span> 一起构建 Agent Racing 生态</h1>
        <p>无论你是想办赛、赞助还是技术合作，我们都欢迎你加入。</p>
      </section>

      <div className="grid-3">
        <div className="card card-accent">
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,var(--accent),var(--accent-secondary))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 22 }}>🏁</span>
          </div>
          <h3>办赛合作</h3>
          <p className="muted text-sm" style={{ marginTop: 8 }}>将你的赛事接入 ARY 平台。我们提供完整的赛事管理工具、大屏展示和骑手数据追踪。无论企业内赛、高校课程还是公开 Hackathon。</p>
        </div>
        <div className="card card-accent">
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,var(--accent),var(--accent-secondary))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 22 }}>🤝</span>
          </div>
          <h3>赞助合作</h3>
          <p className="muted text-sm" style={{ marginTop: 8 }}>通过冠名赛事、赛道赞助或奖品支持，让你的品牌与 Agentic Engineering 社区建立深度连接。多层次的品牌展示方案。</p>
        </div>
        <div className="card card-accent">
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,var(--accent),var(--accent-secondary))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 22 }}>🔧</span>
          </div>
          <h3>技术合作</h3>
          <p className="muted text-sm" style={{ marginTop: 8 }}>如果你在开发 Coding Agent、评测工具或数据集，可以一起探索 ARY 平台的集成方案。开放 API、Connector SDK 和数据标准供你接入。</p>
        </div>
      </div>

      <div className="section-dark">
        <h2 style={{ textAlign: "center", marginBottom: 32 }}>为什么选择 ARY</h2>
        <div className="grid-3" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: "var(--accent-secondary)", marginBottom: 8 }}>01</div>
            <h4 style={{ margin: "0 0 6px", fontFamily:"var(--font-body)", fontSize:"1.0625rem" }}>Agent-First 赛事平台</h4>
            <p style={{ fontSize: "0.875rem" }}>专为 Agent Riding 设计，追踪骑手与 AI 协作全过程。</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: "var(--accent-secondary)", marginBottom: 8 }}>02</div>
            <h4 style={{ margin: "0 0 6px", fontFamily:"var(--font-body)", fontSize:"1.0625rem" }}>Gallery-First 传播</h4>
            <p style={{ fontSize: "0.875rem" }}>赛事、作品、骑手档案公开可见，产生持续的社区传播资产。</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: "var(--accent-secondary)", marginBottom: 8 }}>03</div>
            <h4 style={{ margin: "0 0 6px", fontFamily:"var(--font-body)", fontSize:"1.0625rem" }}>开放生态</h4>
            <p style={{ fontSize: "0.875rem" }}>CA Connector SDK、开放 API、可定制赛道和大屏，一切都可以集成。</p>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <h2 style={{ marginBottom: 12 }}>准备好合作了吗？</h2>
        <p className="muted" style={{ maxWidth: 480, margin: "0 auto 20px" }}>发送邮件到 cooperation@ary.dev，或直接联系我们讨论你的合作方案。</p>
        <a className="button" href="mailto:cooperation@ary.dev" style={{ height: 52, padding: "0 32px" }}>联系合作 →</a>
      </div>
    </div>
  );
}
