import type { ReactNode } from "react";

export function ScreenDisplayShell({
  children,
  modeLabel,
  raceTitle,
  theme = "default",
}: {
  children: ReactNode;
  modeLabel: string;
  raceTitle: string;
  theme?: string;
}) {
  const themeStyles = resolveScreenThemeStyles(theme);

  return (
    <main
      style={{
        ...shellStyles,
        ...themeStyles.shell,
      }}
    >
      <section style={headerStyles}>
        <p style={eyebrowStyles}>Screen Display</p>
        <h1 style={titleStyles}>{raceTitle}</h1>
        <p style={metaStyles}>
          {modeLabel} / theme: {theme || "default"}
        </p>
      </section>
      <section style={contentStyles}>{children}</section>
    </main>
  );
}

function resolveScreenThemeStyles(theme: string): {
  shell: React.CSSProperties;
} {
  const normalized = theme.trim().toLowerCase();

  if (normalized.includes("night") || normalized.includes("dark")) {
    return {
      shell: {
        background:
          "linear-gradient(160deg, rgba(18,23,36,1) 0%, rgba(24,42,70,1) 42%, rgba(177,80,45,1) 100%)",
        color: "#fff4ea",
      },
    };
  }

  return {
    shell: {
      background:
        "linear-gradient(160deg, rgba(247,239,228,1) 0%, rgba(241,223,199,1) 44%, rgba(208,108,58,1) 100%)",
      color: "#3c2819",
    },
  };
}

const shellStyles: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  gap: 20,
  padding: "28px",
  fontFamily: '"Segoe UI", "Microsoft YaHei", sans-serif',
};

const headerStyles: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const eyebrowStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  opacity: 0.84,
};

const titleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 4vw, 52px)",
  lineHeight: 1.08,
};

const metaStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  opacity: 0.82,
};

const contentStyles: React.CSSProperties = {
  display: "grid",
  gap: 20,
};
