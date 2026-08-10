import {
  readDayValues, hasMetricValue, isMetricLogged, metricNumericValue,
  makeMetricId, seedDefaultMetrics, formatMetricDisplay
} from "../src/utils/metrics.js";

let pass = 0, fail = 0;
function t(name, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + "\n         got " + a + "\n         want " + e); }
}

console.log("== readDayValues: legacy day doc (pre-custom-metrics) ==");
const legacyDay = {
  id: "2026-08-01", date: "2026-08-01",
  mood: 7, energy: 5, brainFog: 3, stress: 4, congestion: 2,
  weight: 131, workout: true,
  sleep: 7.5, notes: "hi", takenToday: { m1: true }
};
t("pulls all 7 legacy fields", readDayValues(legacyDay),
  { mood:7, energy:5, brainFog:3, stress:4, congestion:2, weight:131, workout:true });

console.log("== readDayValues: modern day doc ==");
t("reads values map", readDayValues({ id:"x", values:{ mood:8, ibs:2 } }), { mood:8, ibs:2 });

console.log("== readDayValues: mixed (self-healing doc) ==");
t("values map wins over legacy",
  readDayValues({ mood: 3, values: { mood: 9, ibs: 1 } }), { mood:9, ibs:1 });

console.log("== readDayValues: edge cases ==");
t("null day", readDayValues(null), {});
t("skips null legacy fields", readDayValues({ mood: 5, weight: null, sleep: 7 }), { mood: 5 });

console.log("== hasMetricValue: THE count-zero bug ==");
const scale = { id:"mood", type:"scale" };
const count = { id:"water", type:"count" };
const toggle = { id:"workout", type:"toggle" };
t("scale 0 = not logged", hasMetricValue(scale, 0), false);
t("scale 7 = logged", hasMetricValue(scale, 7), true);
t("count 0 IS real data", hasMetricValue(count, 0), true);
t("count 5 = data", hasMetricValue(count, 5), true);
t("count null = no data", hasMetricValue(count, null), false);
t("toggle false IS data", hasMetricValue(toggle, false), true);
t("toggle true = data", hasMetricValue(toggle, true), true);

console.log("== isMetricLogged: completion ring (stricter) ==");
t("scale 0 not complete", isMetricLogged(scale, 0), false);
t("scale 7 complete", isMetricLogged(scale, 7), true);
t("count 0 counts as complete", isMetricLogged(count, 0), true);
t("toggle false NOT complete", isMetricLogged(toggle, false), false);
t("toggle true complete", isMetricLogged(toggle, true), true);

console.log("== metricNumericValue: charting ==");
t("toggle true -> 1", metricNumericValue(toggle, true), 1);
t("toggle false -> 0", metricNumericValue(toggle, false), 0);
t("scale 0 -> null (gap)", metricNumericValue(scale, 0), null);
t("count 0 -> 0 (plotted)", metricNumericValue(count, 0), 0);

console.log("== makeMetricId ==");
t("slugifies", makeMetricId("IBS / Digestion", []), "ibs-digestion");
t("avoids collision with existing", makeMetricId("Mood", [{id:"mood"}]), "mood-2");
t("avoids RESERVED day fields", makeMetricId("notes", []), "notes-2");
t("avoids reserved 'sleep'", makeMetricId("Sleep", []), "sleep-2");
t("garbage input falls back", makeMetricId("!!!", []), "metric");

console.log("== seedDefaultMetrics (existing-user backfill) ==");
const seeded = seedDefaultMetrics();
t("seeds 7 legacy metrics", seeded.length, 7);
t("ids match legacy field names",
  seeded.map(m=>m.id),
  ["mood","energy","brainFog","stress","congestion","weight","workout"]);
t("weight is a count w/ unit", seeded.find(m=>m.id==="weight").type + ":" + seeded.find(m=>m.id==="weight").unit, "count:lbs");
t("workout is a toggle", seeded.find(m=>m.id==="workout").type, "toggle");
t("order assigned", seeded.map(m=>m.order), [0,1,2,3,4,5,6]);

console.log("== formatMetricDisplay ==");
t("scale", formatMetricDisplay(scale, 7), "7/10");
t("toggle yes", formatMetricDisplay(toggle, true), "Yes");
t("toggle no", formatMetricDisplay(toggle, false), "No");
t("count w/ unit", formatMetricDisplay({type:"count",unit:"glasses"}, 3), "3 glasses");
t("count zero shows, not dash", formatMetricDisplay({type:"count",unit:"glasses"}, 0), "0 glasses");
t("unset scale", formatMetricDisplay(scale, 0), "—");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
