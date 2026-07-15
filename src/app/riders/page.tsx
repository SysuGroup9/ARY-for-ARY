import { aryStyles } from "@/app/_components/ary-shared";
import { buildPublicSiteModel } from "@/lib/public-site";
import { listPublicRaces } from "@/lib/services/public-routes";

export const dynamic = "force-dynamic";

const ROTATIONS = [-3, 2, -2, 4, -1, 3, -4, 1, -2, 3, -3, 2];

function displayName(u: string) { return u.replace(/^rider_/, ""); }

export default async function RidersIndexPage() {
  const races = await listPublicRaces();
  const model = buildPublicSiteModel(races);
  const riders = model.featuredRiders;

  return (
    <main>
      <section style={{ padding: "32px 0 16px", textAlign: "center" }}>
        <div className="section-label" style={{ margin: "0 auto 8px" }}>
          <span className="section-label__dot" />精选骑手
        </div>
        <h1 style={{ marginBottom: 8 }}>Riders</h1>
      </section>

      <div style={{
        display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 20,
        padding: "20px 0 80px", maxWidth: 900, margin: "0 auto",
      }}>
        <style>{polaroidStyles}</style>
        {riders.map((rider, i) => {
          const rot = ROTATIONS[i % ROTATIONS.length];
          return (
            <a
              key={rider.id}
              href={`/riders/${rider.riderSlug}`}
              className="polaroid"
              style={{ transform: `rotate(${rot}deg)` }}
            >
              <div className="polaroid__photo">
                <div className="polaroid__fallback">
                  <span>{displayName(rider.username).charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <div className="polaroid__caption">
                <strong style={{ fontSize: "0.9375rem" }}>{displayName(rider.username)}</strong>
                <span className="muted text-xs" style={{ display: "block", marginTop: 2 }}>
                  {rider.raceCount} 赛事 · {rider.workCount} 作品
                </span>
              </div>
            </a>
          );
        })}
      </div>

      <style>{aryStyles}</style>
    </main>
  );
}

const polaroidStyles = `
  .polaroid {
    display: flex; flex-direction: column;
    background: #fff; padding: 10px 10px 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06);
    border-radius: 2px; transition: all 0.3s ease;
    text-decoration: none; color: inherit;
  }
  .polaroid:hover {
    transform: rotate(0deg) translateY(-8px) scale(1.05) !important;
    box-shadow: 0 8px 24px rgba(0,0,0,0.16), 0 2px 6px rgba(0,82,255,0.1);
    z-index: 10;
  }
  .polaroid__photo {
    width: 140px; height: 120px; border-radius: 1px;
    overflow: hidden;
  }
  .polaroid__fallback {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #0052FF, #4D7CFF);
    color: #fff; font-size: 2.5rem; font-weight: 700;
  }
  .polaroid__caption {
    padding: 12px 4px 0; text-align: center;
  }
`;
