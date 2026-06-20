import { Panel } from "@/app/_components/ary-shared";

export function ConsoleHomeView({
  raceCount,
  sections,
}: {
  raceCount: number;
  sections: Array<"admin" | "races" | "screen">;
}) {
  const cards = sections.map((section) => {
    switch (section) {
      case "races":
        return {
          description: `进入赛事工作台（${raceCount}）`,
          href: "/console/races",
          label: "赛事控制台",
        };
      case "admin":
        return {
          description: "用户列表、资料状态、角色管理与办赛申请审核",
          href: "/console/admin/users",
          label: "管理控制台",
        };
      case "screen":
        return {
          description: "赛事选择与大屏模式控制",
          href: "/console/screen",
          label: "大屏控制台",
        };
    }
  });

  return (
    <>
      <Panel title="工作台入口" eyebrow="控制台首页">
        <p className="muted">
          这是独立的 `grs003` 控制台入口。公开浏览与工作台操作已经按路由拆分。
        </p>
      </Panel>

      <section className="console-card-grid">
        {cards.map((card) => (
          <a className="console-link-card" href={card.href} key={card.href}>
            <strong>{card.label}</strong>
            <span>{card.description}</span>
          </a>
        ))}
      </section>
    </>
  );
}
