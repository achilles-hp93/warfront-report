const name=process.argv[2];
const r=require(process.env.WARFRONT_OUTPUT_DIR+"/battle_reports/"+name+"/report.json");
for (const s of r.snaps) {
  console.log("SNAP", s.label, "round", s.round, s.phase, "objectives", JSON.stringify(s.objectives));
  if (s.label!=="deployment") continue;
  console.log("players", JSON.stringify(s.players));
  for (const u of s.units) { const c={...u}; delete c.image; console.log(JSON.stringify(c)); }
}
console.log("deployment", r.meta.deployment, "initiative", r.meta.initiative, "formationOrder", JSON.stringify(r.meta.formationOrder));
