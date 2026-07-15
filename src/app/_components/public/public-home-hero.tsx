export function PublicHomeHero() {
  return (
    <section style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center",
      padding: "64px 48px 48px", minHeight: 480, overflow: "visible",
    }}>
      {/* Left */}
      <div>
        <div style={{ marginBottom: 8 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 500,
            letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)",
          }}>
            <span className="section-label__dot section-label__dot--live" />
            Agent Racing Yard
          </span>
        </div>
        <h1 style={{
          fontSize: "clamp(6rem, 14vw, 11rem)",
          fontFamily: "Georgia, serif", fontWeight: 600,
          fontStyle: "italic", lineHeight: 0.9,
          letterSpacing: "-0.01em", margin: "12px 0",
          padding: "0 0.15em", overflow: "visible", marginLeft: "-0.05em",
          color: "var(--accent)",
        }}>ARY</h1>
        <p style={{
          fontFamily: "var(--font-display)", fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
          color: "var(--muted-foreground)", marginBottom: 8,
        }}>智能体时代的竞技场</p>
        <p style={{
          fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "var(--muted-foreground)",
          letterSpacing: "0.04em",
        }}>Ride Agents. Build the Future.</p>
      </div>

      {/* Right: Ring animation only */}
      <div style={{
        position: "relative", width: "100%", aspectRatio: "1",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <style>{animStyles}</style>
        <div className="hero-ring" style={{position:"absolute",width:"75%",aspectRatio:"1",borderRadius:"50%",border:"2px dashed rgba(35,98,255,0.2)"}} />
        <div className="hero-ring-reverse" style={{position:"absolute",width:"55%",aspectRatio:"1",borderRadius:"50%",border:"1.5px solid rgba(35,98,255,0.15)"}} />
        <div style={{width:"35%",aspectRatio:"1",borderRadius:"50%",background:"radial-gradient(circle, rgba(35,98,255,0.15), rgba(79,140,255,0.05), transparent 70%)",filter:"blur(20px)"}} />
        <div className="hero-float-1" style={{position:"absolute",width:48,height:48,borderRadius:12,background:"linear-gradient(135deg, var(--accent), var(--accent-secondary))",opacity:0.5,top:"15%",right:"15%"}} />
        <div className="hero-float-2" style={{position:"absolute",width:32,height:32,borderRadius:8,background:"var(--accent)",opacity:0.25,bottom:"25%",left:"10%"}} />
        <div className="hero-float-3" style={{position:"absolute",width:20,height:20,borderRadius:6,background:"var(--accent-secondary)",opacity:0.3,top:"30%",left:"25%"}} />
      </div>
    </section>
  );
}

const animStyles = `
  .hero-ring { animation: spin 40s linear infinite; }
  .hero-ring-reverse { animation: spin-reverse 30s linear infinite; }
  .hero-float-1 { animation: float-hero 4s ease-in-out infinite; }
  .hero-float-2 { animation: float-hero 5s ease-in-out infinite 0.5s; }
  .hero-float-3 { animation: float-hero 3.5s ease-in-out infinite 1s; }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes spin-reverse { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
  @keyframes float-hero { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-12px) scale(1.05)} }
  @media (max-width: 768px) { .hero-ring,.hero-ring-reverse,.hero-float-1,.hero-float-2,.hero-float-3 { display:none; } }
`;
