import type { Metadata } from "next";
import { HeaderWrapper } from "@/app/_components/header-wrapper";
import { ParticleLayer } from "@/app/_components/particle-layer";
import { loadDatabaseUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARY — Agent Racing Yard",
  description: "ARY — Agent Racing Yard",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await loadDatabaseUser();

  const featuredUsers = await prisma.user.findMany({
    where: { rolesJson: { contains: "RIDER" }, profileCompleted: true },
    take: 12,
    select: {
      id: true, username: true, profileOrgLabel: true,
      registrations: { select: { id: true } },
    },
  });
  const riders = featuredUsers.map((u) => ({
    username: u.username, orgLabel: u.profileOrgLabel,
    riderSlug: `${u.id}--${u.username}`, workCount: 0, raceCount: u.registrations.length,
  }));

  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Noto+Serif+SC:wght@400;700&family=Playfair+Display:ital,wght@0,700;1,700&family=Cormorant+Garamond:ital,wght@0,700;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <HeaderWrapper roles={sessionUser?.roles ?? null} />
        <ParticleLayer riders={riders} />
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('wheel', function(e) {
            var el = e.target.closest('.h-scroll');
            if (!el) return;
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              el.scrollLeft += e.deltaY;
              e.preventDefault();
            }
          }, {passive:false});
        `}} />
      </body>
    </html>
  );
}
