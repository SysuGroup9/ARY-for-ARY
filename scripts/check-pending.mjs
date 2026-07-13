import Database from "better-sqlite3";
const db = new Database("./dev.db");
const r = db.prepare(`
  SELECT u.username, tm.status, tm.role
  FROM TeamMember tm
  JOIN User u ON tm.userId = u.id
  JOIN Team t ON tm.teamId = t.id
  WHERE t.raceId = 'race_active_oval'
  ORDER BY tm.status, tm.userId
`).all();
console.log("race_active_oval team members:");
r.forEach(x => console.log(`  ${x.username}: ${x.status} (${x.role})`));
db.close();
