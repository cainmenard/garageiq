import { useState, useReducer, useEffect, useRef } from "react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&family=JetBrains+Mono:wght@400;600;700&family=Instrument+Serif:ital@0;1&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#06080c;--bg2:#0d1017;--bg3:#141921;--bg4:#181e28;--bg5:#1f2735;
  --bdr:#1e2736;--bdr2:#2a3548;
  --t1:#e8edf5;--t2:#8896ab;--t3:#4d5b72;--t4:#333f52;
  --amber:#f0a832;--amber-d:rgba(240,168,50,.12);
  --red:#ef4444;--red-d:rgba(239,68,68,.10);
  --green:#22c55e;--green-d:rgba(34,197,94,.10);
  --blue:#3b82f6;--blue-d:rgba(59,130,246,.10);
  --orange:#f97316;--orange-d:rgba(249,115,22,.10);
  --cyan:#06b6d4;--cyan-d:rgba(6,182,212,.10);
  --fd:'Instrument Serif',Georgia,serif;--fb:'DM Sans',sans-serif;--fm:'JetBrains Mono',monospace;
}
body{background:var(--bg);color:var(--t1);font-family:var(--fb);-webkit-font-smoothing:antialiased}
input,select,textarea,button{font-family:inherit}
::selection{background:var(--amber);color:var(--bg)}
.fade{animation:f .35s ease-out}@keyframes f{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes p{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:p 2s ease-in-out infinite}
.scr::-webkit-scrollbar{width:4px}.scr::-webkit-scrollbar-track{background:transparent}.scr::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:2px}
`;


const INTERVAL_DEFS = {
  v_midnight: [
    { key:"oil", name:"Oil & Filter Change", miInt:7500, moInt:12, guideKey:"oil_change_midnight", note:"Enthusiast: 5-7.5k. Audi says 10k but EA888 turbo needs shorter intervals.", diyCost:38, dealerCost:185, time:"45 min" },
    { key:"spark", name:"Spark Plugs", miInt:40000, moInt:null, guideKey:"spark_plugs_midnight", note:"OEM says 40k. Bible says OVERDUE if not done at 40k.", diyCost:48, dealerCost:280, time:"1 hr" },
    { key:"engine_air", name:"Engine Air Filter", miInt:30000, moInt:36, guideKey:null, note:"Mann C30005 or Mahle. OEM 8R0133843K.", diyCost:22, dealerCost:85, time:"10 min" },
    { key:"cabin_air", name:"Cabin Air Filter", miInt:15000, moInt:12, guideKey:null, note:"Mann CUK 2450 charcoal. FCP Euro lifetime. OEM 8K0819439B.", diyCost:18, dealerCost:95, time:"10 min" },
    { key:"brake_fluid", name:"Brake Fluid Flush", miInt:20000, moInt:24, guideKey:null, note:"ATE TYP 200 DOT 4. ~2L for full flush.", diyCost:25, dealerCost:150, time:"45 min" },
    { key:"trans", name:"ZF 8HP Trans Fluid + Filter", miInt:50000, moInt:null, guideKey:"zf_8hp_service", note:"HIGHEST PRIORITY at 64k. ZF says 50-75k despite Audi 'lifetime' claim. Kit: 0BK398009A.", diyCost:180, dealerCost:950, time:"2-3 hrs" },
    { key:"diff_front", name:"Front Differential Fluid", miInt:60000, moInt:null, guideKey:null, note:"G 052 145 S2 synthetic gear oil, 1.0L. Due now.", diyCost:20, dealerCost:180, time:"30 min" },
    { key:"diff_rear", name:"Rear Differential Fluid", miInt:60000, moInt:null, guideKey:null, note:"G 052 145 S2 synthetic gear oil, 1.0L. Due now.", diyCost:20, dealerCost:180, time:"30 min" },
    { key:"transfer", name:"Transfer Case Fluid", miInt:60000, moInt:null, guideKey:null, note:"G 052 145 S2 — NOT G 055 145 A2 (factory fill friction modifier accumulates). Critical detail.", diyCost:20, dealerCost:180, time:"30 min" },
    { key:"coolant", name:"Coolant Flush", miInt:100000, moInt:60, guideKey:null, note:"G13 spec (TL-VW 774 J). Due by age at ~9 years. ~10.0L system capacity (mixed 50/50 with distilled water).", diyCost:40, dealerCost:250, time:"1 hr" },
    { key:"serpentine", name:"Serpentine Belt + Tensioner", miInt:70000, moInt:null, guideKey:null, note:"Continental 6PK1590 belt, INA/Litens tensioner. Inspect now, replace by 80k.", diyCost:65, dealerCost:350, time:"1 hr" },
    { key:"tires", name:"Tire Rotation", miInt:7500, moInt:6, guideKey:null, diyCost:0, dealerCost:50, time:"30 min" },
    { key:"brakes_f", name:"Front Brake Pads", miInt:40000, moInt:null, guideKey:null, note:"Akebono EUR1322A ceramic. FCP Euro lifetime warranty.", diyCost:55, dealerCost:450, time:"1.5 hrs" },
    { key:"brakes_r", name:"Rear Brake Pads", miInt:50000, moInt:null, guideKey:null, note:"Rear requires scan tool 'service mode' to retract pistons. Pistons push straight in (not screw).", diyCost:55, dealerCost:450, time:"1.5 hrs" },
    { key:"wiper", name:"Wiper Blades", miInt:15000, moInt:12, guideKey:null, note:"Bosch Aerotwin A297S. FCP Euro lifetime.", diyCost:30, dealerCost:75, time:"5 min" },
    { key:"water_pump", name:"Water Pump + Thermostat", miInt:80000, moInt:null, guideKey:null, note:"CRITICAL: Plastic impeller cracks. Revised metal impeller 06L121111H. Replace proactively by 80k. Always do thermostat housing simultaneously.", diyCost:275, dealerCost:1200, time:"4-5 hrs" },
    { key:"pcv", name:"PCV Valve", miInt:75000, moInt:null, guideKey:null, note:"Diaphragm tears 50-100k. Failed PCV causes whistling, CEL (P0171/P0507/P2187), oil consumption, rear main seal damage. RKXtech reinforced $25-35 vs OEM $80-130.", diyCost:30, dealerCost:250, time:"15 min" },
    { key:"control_arms", name:"Upper Control Arms (4-piece)", miInt:80000, moInt:null, guideKey:null, note:"B8 Achilles heel. Wear begins 50-70k. Meyle HD kit $170-235. Torque at ride height or premature failure.", diyCost:200, dealerCost:1400, time:"3-4 hrs" },
    { key:"battery", name:"Battery", miInt:50000, moInt:60, guideKey:null, note:"~9 years old at this point. Test annually after 3 years. B8 complex electronics drain battery.", diyCost:180, dealerCost:400, time:"30 min" },
    { key:"sunroof_drains", name:"Sunroof Drain Cleaning", miInt:15000, moInt:12, guideKey:null, note:"Clogged drains flood battery well and trunk electronics. Thin wire + warm soapy water.", diyCost:0, dealerCost:150, time:"20 min" },
  ],

};

const TORQUE_SPECS = [
  { fastener:"Oil drain plug", spec:"25 Nm (18.5 lb-ft)", tool:"19mm", note:"Aluminum pan — over-torquing is #1 DIY mistake" },
  { fastener:"Oil filter housing cap", spec:"25 Nm (18-19 lb-ft)", tool:"36mm socket", note:"Hand-start first" },
  { fastener:"Spark plugs", spec:"25-30 Nm (18-22 lb-ft)", tool:"5/8\" spark plug socket", note:"Aluminum head — thread by hand first" },
  { fastener:"Coil pack bolts", spec:"10 Nm (7.4 lb-ft)", tool:"T30 Torx", note:"" },
  { fastener:"Wheel lug bolts", spec:"120 Nm (89 lb-ft)", tool:"17mm socket", note:"M14x1.5, star pattern" },
  { fastener:"ZF 8HP pan bolts", spec:"10 Nm (7.4 lb-ft)", tool:"T40 Torx", note:"12-13 bolts, star pattern, single-use stretch bolts" },
  { fastener:"ZF 8HP drain plug", spec:"8 Nm (5.9 lb-ft)", tool:"10mm Allen", note:"O-ring seals, not clamping force. Plastic pan!" },
  { fastener:"ZF 8HP fill plug (8mm)", spec:"35 Nm (25.8 lb-ft)", tool:"8mm Allen", note:"Some AWD variants use 10mm → 30 Nm" },
  { fastener:"Belly pan screws", spec:"~5 Nm (hand-tight)", tool:"T25 Torx", note:"Plus quarter-turn plastic clips" },
  { fastener:"Trans splash shield", spec:"~10 Nm", tool:"8mm socket", note:"5 bolts" },
  { fastener:"Front caliper bracket", spec:"140 Nm (103 lb-ft)", tool:"18mm", note:"Use threadlocker" },
  { fastener:"Rear caliper bracket", spec:"90 Nm (66 lb-ft)", tool:"15mm", note:"" },
  { fastener:"Control arm pivot bolts", spec:"100 Nm + 90° (74 lb-ft + 90°)", tool:"18mm", note:"MUST torque at static ride height" },
  { fastener:"Subframe bolts", spec:"100 Nm + 90°", tool:"18mm", note:"TTY — replace if removed" },
  { fastener:"Axle bolt (front)", spec:"100 Nm + 90°", tool:"M10 Triple-square (XZN)", note:"TTY stretch bolt, always replace" },
  { fastener:"Water pump bolts", spec:"10 Nm (7.4 lb-ft)", tool:"Various", note:"Plastic housing, do not over-torque" },
];

const GUIDE_DB = {
  oil_change_midnight: {
    title:"Oil & Filter Change", vehicle:"2017 Audi Q5 2.0T", difficulty:"Beginner", time:"45 min", intervalKey:"oil",
    relatedCodes:["P0100"],
    overview:"Complete oil and filter change for the EA888 (CPMA/CNCD longitudinal variant, 220 hp). Uses a top-mount cartridge filter and requires VW 502 00 spec 5W-40 full synthetic. Capacity is 4.5 liters (4.8 US quarts) with filter per Audi's official 2017 Q5 fluid capacity chart.",
    specs:{ oil:"VW 502 00 — 5W-40 full synthetic (Liqui Moly Leichtlauf HT, Castrol EDGE Pro, Motul 8100 X-cess, Mobil 1 0W-40)", capacity:"4.5L (4.8 qt) with filter", filter:"Mann HU 719/6x (~$8-10 FCP Euro lifetime)", filterOEM:"06J115403Q", drainPlug:"19mm (may be T45 Torx or 6mm Allen if swapped)", drainTorque:"25 Nm (18.5 lb-ft) — aluminum pan, do NOT over-torque", filterCapTorque:"25 Nm (18-19 lb-ft)", crushWasher:"N0138157 (M14) — replace every change" },
    parts:[
      { name:"Liqui Moly Leichtlauf HT 5W-40 (5L + 1L)", pn:"2332+2331", cost:38.00, notes:"VW 502 00. Also: Castrol EDGE Pro 5W-40, Motul 8100 X-cess 5W-40, Mobil 1 0W-40" },
      { name:"Mann-Filter HU 719/6x", pn:"HU719/6x", cost:8.99, notes:"OEM equivalent. FCP Euro lifetime replacement. (OEM: 06J115403Q)" },
      { name:"Drain Plug Crush Washer M14", pn:"N0138157", cost:1.50, notes:"Replace every change. Copper or aluminum." },
    ],
    tools:["19mm socket (or T45 Torx / 6mm Allen depending on drain plug)","36mm socket (oil filter housing cap)","T25 Torx","Phillips #2","Torque wrench (critical — 25 Nm into aluminum)","Floor jack + stands or ramps","Drain pan (8+ qt capacity)","Funnel","Nitrile gloves"],
    steps:[
      { n:1, title:"Warm Engine", d:"Drive 5-10 min. Warm oil drains faster and carries more contaminants. Don't get fully hot." },
      { n:2, title:"Lift & Secure", d:"Flat surface, parking brake on. Jack at reinforced pinch welds, set stands. Push car firmly to confirm stability." },
      { n:3, title:"Remove Engine Cover", d:"Pull up at each of the 4 rubber grommets. Set aside." },
      { n:4, title:"Crack Filter Housing First", d:"36mm socket on oil filter housing cap (vertical cylinder, front-left). Break loose counterclockwise BEFORE draining — this breaks the vacuum and lets oil flow faster. Don't fully remove yet." },
      { n:5, title:"Remove Undertray", d:"Two-piece undertray: T25 Torx and Phillips screws. Work front-to-back, slide rearward." },
      { n:6, title:"Drain Oil", d:"Position drain pan. Drain plug is 19mm on bottom of oil pan (may be T45 Torx or 6mm Allen if previously swapped). Remove and drain fully — minimum 5 minutes. Inspect plug threads." },
      { n:7, title:"Replace Drain Plug", d:"New M14 crush washer (N0138157). Thread by hand first to avoid cross-threading the aluminum pan. Torque to 25 Nm (18.5 lb-ft). Over-torquing the drain plug into aluminum is the most common DIY mistake on this engine." },
      { n:8, title:"Replace Filter", d:"Fully remove filter housing cap from top. Lift out old cartridge. Check O-ring on cap. Install new Mann HU 719/6x. Reinstall cap, torque to 25 Nm." },
      { n:9, title:"Refill Oil", d:"Pour ~4.0L through fill cap with funnel. Start engine, idle 60 sec. Shut off, wait 2-3 min. Check level — add slowly until between min/max marks. Total is 4.5L (4.8 qt) with filter. Better to underfill and top off than overfill a turbo engine." },
      { n:10, title:"Reinstall Undertray", d:"Slide belly pan back, reinstall all fasteners." },
      { n:11, title:"Reset Service Indicator", d:"MMI: CAR > Service & Checks > Reset. Or OBDeleven: Engine module > Adaptations > Service Reset." },
      { n:12, title:"Final Check", d:"Run to operating temp. Shut off, wait 5 min, recheck level. Inspect underneath for drips at drain plug and filter housing. Record mileage and date." },
    ],
    tips:["The EA888 is sensitive to oil quality — never use conventional or non-spec oil. Short-changing oil accelerates timing chain stretch.","Enthusiast interval is 5,000-7,500 mi, not Audi's 10,000 mi. For a turbo engine, shorter intervals pay for themselves in longevity.","FCP Euro lifetime warranty on the Mann filter: return the used one, get a free replacement forever.","Oil consumption up to 1 qt per 5,000 mi is normal for this turbo engine. Check at every fuel stop.","Monitor your drained oil: dark/black = normal, milky = coolant mixing (head gasket), metallic sheen = internal wear.","Good time to combine with spark plugs since engine cover is already off."],
  },
  spark_plugs_midnight: {
    title:"Spark Plug Replacement", vehicle:"2017 Audi Q5 2.0T", difficulty:"Intermediate", time:"1 hour", intervalKey:"spark",
    relatedCodes:["P0300","P0301","P0302","P0303","P0304"],
    overview:"Replace all 4 spark plugs on the EA888. Accessed from top after removing engine cover and coil packs. OEM P/N 06H905601A. Use NGK PFR7S8EG (double platinum) or Bosch FR7NPP332S. Gap 0.028\" stock, or 0.024-0.026\" if Stage 1 tuned.",
    specs:{ plug:"NGK PFR7S8EG (OEM equiv, $10-15 ea) or Bosch FR7NPP332S ($10-14 ea)", oemPN:"06H905601A", gap:"0.028\" (0.7mm) stock / 0.024-0.026\" if tuned", torque:"25-30 Nm (18-22 lb-ft) — aluminum head", coilBolt:"T30 Torx, 10 Nm", coilPN:"07K905715G (Bosch OE supplier, $100-160/set of 4)" },
    parts:[
      { name:"NGK PFR7S8EG (set of 4)", pn:"PFR7S8EG", cost:48.00, notes:"Double-platinum. OEM Audi 06H905601A. Verify gap even if 'pre-gapped'." },
      { name:"Dielectric Grease", pn:"Various", cost:5.00, notes:"Inside coil boots for easier future removal — VW/Audi uses anaerobic sealant that bonds boots to wells." },
    ],
    tools:["T30 Torx bit (coil bolts)","Thin-wall 16mm spark plug socket","Extensions (6\" + 10\")","Ratchet","Torque wrench","Compressed air / vacuum (blow out wells before removal)","Gap gauge / feeler gauge"],
    steps:[
      { n:1, title:"Remove Engine Cover", d:"Pull up at 4 rubber grommets." },
      { n:2, title:"Warm Engine Slightly", d:"Brief warm-up helps loosen VW/Audi anaerobic sealant bonding the coil boots to plug wells." },
      { n:3, title:"Disconnect Coil Connectors", d:"Press release tab, pull straight up. One at a time." },
      { n:4, title:"Remove Coil Packs", d:"T30 Torx bolt each. Pull coil slowly — the sealant makes them stick. Wiggle gently." },
      { n:5, title:"Inspect Plug Wells", d:"Flashlight down each well. Check for oil (valve cover gasket seepage — common at this mileage). Blow out debris with compressed air BEFORE removing plugs to prevent debris falling into cylinder." },
      { n:6, title:"Remove Old Plugs", d:"16mm thin-wall socket. Break loose counterclockwise. Thread new plugs BY HAND first using a socket extension without a ratchet — aluminum head, cross-threading = very expensive." },
      { n:7, title:"Read Old Plugs", d:"Light tan/gray = good. Black/sooty = rich. White/blistered = lean. Oil-fouled = seal/ring issue. Gap will have widened from original spec." },
      { n:8, title:"Gap & Install New Plugs", d:"Verify 0.028\" (or 0.024-0.026\" if tuned). Torque to 25-30 Nm. Do not over-torque." },
      { n:9, title:"Reinstall Coils", d:"Dielectric grease on boot ribs for easier future removal. Push down until seated. T30 bolt to 10 Nm. Reconnect — listen for click." },
      { n:10, title:"Test", d:"Start engine — should fire immediately, smooth idle. If misfire, recheck that cylinder's coil and plug seating." },
    ],
    tips:["Oil in plug wells = valve cover gasket seep. Common at this mileage. ~$40 part, 2hr job.","R8/RS3 red-top coilpacks ($100-160/set) provide stronger spark — worthwhile upgrade if any misfires after tuning.","If Stage 1 tuned, go one step colder and gap to 0.024-0.026\".","Keep one old plug as a baseline for next comparison.","Bible says these are OVERDUE if not done at 40k — your service at 64k was right on time."],
  },
  maf_clean_midnight: {
    title:"MAF Sensor Clean / Replace", vehicle:"2017 Audi Q5 2.0T", difficulty:"Beginner", time:"20-30 min", intervalKey:null,
    relatedCodes:["P0100","P0101","P0102","P0103"],
    overview:"Clean or replace the MAF sensor to address P0100. Located in the intake duct between air filter box and turbo inlet. PCV oil vapors coat the element over time — fixing the PCV valve (if failed) prevents recurrence.",
    specs:{ sensorPn:"06J906461D (Bosch OEM)", cleaner:"CRC MAF Sensor Cleaner (05110) ONLY" },
    parts:[
      { name:"CRC MAF Sensor Cleaner", pn:"05110", cost:9.99, notes:"MAF-specific only. Other solvents destroy the element." },
      { name:"Bosch MAF Sensor (if replacing)", pn:"06J906461D", cost:95.00, notes:"OEM Bosch only — aftermarket VAG MAFs are unreliable." },
      { name:"Engine Air Filter (Mann)", pn:"C30005", cost:19.00, notes:"OEM 8R0133843K. Replace while you're in there if due." },
    ],
    tools:["T25 or T20 Torx","Phillips screwdriver","CRC MAF Cleaner","Lint-free cloth"],
    steps:[
      { n:1, title:"Locate MAF", d:"In the intake tube between air filter housing (driver side) and turbo inlet pipe. Small rectangular sensor with connector and 2 Torx screws." },
      { n:2, title:"Disconnect & Remove", d:"Unplug connector (press tab, pull). Remove 2 Torx screws. Pull sensor straight out." },
      { n:3, title:"Inspect", d:"Sensing element — tiny wire or film. Oily residue = PCV oil vapors coating it. Check connector pins for corrosion." },
      { n:4, title:"Clean", d:"Hold element-down. CRC MAF Cleaner from 6\" away, short bursts, multiple angles. Do NOT touch element. Air dry 10-15 min minimum." },
      { n:5, title:"Check Intake Duct", d:"While sensor is out, check for cracks or loose clamps. Check air filter condition." },
      { n:6, title:"Reinstall", d:"Note orientation arrow. Reinstall Torx screws. Reconnect connector." },
      { n:7, title:"Clear & Test", d:"Clear P0100 with BlueDriver/OBDeleven. Start, check idle. Drive 10-15 min. Re-scan." },
    ],
    tips:["On VAG engines, aftermarket MAFs are unreliable. OEM Bosch only.","If PCV valve is failed (whistling at idle), it's sending excess oil vapors to the MAF. Fix PCV first.","MAF should read 2-5 g/s at idle — monitor with OBDeleven.","Consider the Bible's advice: inspect PCV valve now at 64k — diaphragm tear is likely starting."],
  },
  zf_8hp_service: {
    title:"ZF 8HP Transmission Service", vehicle:"2017 Audi Q5 2.0T", difficulty:"Advanced", time:"2-3 hours", intervalKey:"trans",
    relatedCodes:["2505"],
    overview:"HIGHEST PRIORITY service at 64,716 miles. Your ZF 8HP55 (Audi code 0BK) is overdue for its first fluid service. Despite Audi's 'lifetime fill' marketing, ZF recommends service every 50,000-75,000 miles. A pan-drop service replaces ~5.0-5.5L of the 8.6L total capacity (about 60%). Fresh fluid restores shift quality, reduces clutch wear, and extends transmission life. The procedure requires precise temperature-controlled filling with VCDS or OBDeleven — no dipstick exists.",
    specs:{ fluid:"ZF Lifeguard 8 (S671 090 312) or Ravenol ATF 8HP or Liqui Moly Top Tec ATF 1800", fluidSpec:"VW G 060 162 A2 / ZF S671.090.312", totalCapacity:"8.6L total system", serviceVolume:"5.0-5.5L drained (pan drop)", filterKit:"0BK398009A (ZF 1087298348) — integrated pan/filter/magnets/O-ring/bolts", drainPlug:"WHT004072 (buy separately or get complete kit)", drainPlugTorque:"8 Nm (10mm Allen) — O-ring seals, not clamping force", panBoltTorque:"10 Nm (T40 Torx) — 12-13 bolts, star pattern, single-use stretch bolts", fillPlugTorque:"35 Nm (8mm Allen) or 30 Nm (10mm Allen on some AWD)", tempWindow:"35-45°C (95-113°F) — target 40°C" },
    parts:[
      { name:"FCP Euro ZF Lifeguard Kit", pn:"KIT-0BK398009KT", cost:265.00, notes:"BEST VALUE: ZF filter/pan + 7L ZF Lifeguard 8 + drain plug. FCP Euro lifetime replacement." },
      { name:"FCP Euro Liqui Moly Kit (budget)", pn:"KIT-0BK398009KT2", cost:131.00, notes:"Same filter/pan, Liqui Moly ATF instead of ZF-branded. Also approved." },
      { name:"Blauparts Ravenol Kit", pn:"Various", cost:165.00, notes:"Filter/pan + 6L Ravenol ATF 8HP. German-made, widely used by enthusiasts." },
      { name:"Fluid Transfer Pump", pn:"Various", cost:12.00, notes:"Mandatory — no dipstick. Blauparts hand pump ~$12, or ABN pressurized filler ~$35-50." },
    ],
    tools:["T25 Torx (belly pan, ~11 screws)","8mm socket (trans splash shield, 5 bolts)","8mm Allen / hex socket (fill plug — verify, some AWD use 10mm)","10mm Allen / hex socket (drain plug)","T40 Torx bit socket — long AND short versions (pan bolts, 12-13)","T40 short bit + 8mm wrench (tight spots)","Low-range torque wrench (must be accurate at 8-10 Nm)","Standard torque wrench (30-35 Nm for fill plug)","VCDS or OBDeleven (NON-NEGOTIABLE — temp monitoring + adaptation reset)","Fluid transfer pump","Large drain pan (8+ liter, wide-mouth)","Jack + stands or ramps/lift","Bubble level (critical for correct fill level)","Clean lint-free cloths (NO paper towels — lint contaminates valve body)","Nitrile gloves + safety glasses","Cardboard/absorbent pads (this job is messy)"],
    steps:[
      { n:1, title:"Start Cold", d:"Let vehicle sit overnight. Cold ATF is denser, maximizing drain volume. Want ATF below 35°C before draining." },
      { n:2, title:"Level the Vehicle", d:"Raise on jack stands, ramps, or lift. Bubble level across transmission pan or subframe. Vehicle MUST be perfectly level — incorrect level causes internal damage. Parking brake on, rear wheels chocked." },
      { n:3, title:"Remove Belly Pan", d:"Remove ~11 T25 Torx screws from main belly pan. Release ~9 quarter-turn plastic fasteners (3 per side, 3 at rear) — rotate 90° counterclockwise and pull down. Lower and set aside." },
      { n:4, title:"Remove Trans Splash Shield", d:"5 bolts with 8mm socket, mounted directly to transmission case. Now you have full access to pan, drain plug, and fill plug." },
      { n:5, title:"⚠️ CRITICAL: Crack Fill Plug First", d:"BEFORE touching the drain plug — break the fill plug loose first. 8mm Allen (possibly 10mm on some AWD variants — visually confirm) on the side of the transmission case, just above the pan, faces downward. If it turns freely, hand-tighten back in place. IF THE FILL PLUG IS SEIZED OR STRIPPED: STOP. Do NOT drain. A seized fill plug with drained trans = flatbed to shop." },
      { n:6, title:"Drain Fluid", d:"Position 8+ liter drain pan. Remove drain plug (10mm Allen, bottom of pan). ATF flows immediately. Let drain 15-20 minutes. Expect ~3.5-4.0L from drain plug alone. Inspect drain plug magnet — fine gray paste is normal at 65k. Metal chunks = investigate further." },
      { n:7, title:"Remove Pan/Filter Assembly", d:"T40 Torx, remove 12-13 pan bolts. Remove rear bolts first, front bolts last — pan tilts backward directing residual fluid (~1.0-1.5L) into drain pan. Carefully lower pan. Total drained: ~5.0-5.5L." },
      { n:8, title:"Check O-ring", d:"Verify old pan's O-ring came out with the pan. If stuck on transmission housing, remove it. Double O-ring (old + new) = leak." },
      { n:9, title:"Clean Mating Surface", d:"Clean lint-free cloth ONLY on transmission housing. NO scrapers, solvents, abrasives, or compressed air near valve body. ZF mechatronics is extremely sensitive to contamination. Let exposed valve body drip 5-10 min." },
      { n:10, title:"Install New Pan/Filter", d:"Unpack 0BK398009A. Apply thin film of fresh ATF to new O-ring. Align pan — filter neck must seat fully into valve body opening (improperly seated filter = catastrophic). Thread all 12 new bolts by hand first to confirm alignment." },
      { n:11, title:"Torque Pan Bolts", d:"Star/crosswise pattern, center outward: 10 Nm (7.4 lb-ft). These feel barely more than finger-tight — that's correct. Over-torquing cracks the composite pan. Use calibrated torque wrench." },
      { n:12, title:"Install Drain Plug", d:"New drain plug (WHT004072) with fresh O-ring. Torque to 8 Nm. Intentionally low — O-ring seals, not clamping force." },
      { n:13, title:"Initial Fluid Fill", d:"Remove fill plug. Pump fresh ATF through fill port until fluid streams out. Initial fill takes ~4.0L. Loosely thread fill plug back. Set aside remaining fluid — you need another 1.0-1.5L during level check." },
      { n:14, title:"Connect Scan Tool", d:"Connect VCDS or OBDeleven to OBD-II port. VCDS: [02 – Auto Trans] → Meas. Blocks → Group 005 (Field 1 = ATF temp). OBDeleven: Control Units → 02 – Transmission → Live Data → Channel 10. OBDeleven Pro/Plus required." },
      { n:15, title:"Start Engine & Cycle Gears", d:"Lower vehicle to ground (or confirm level on lift). Start engine. Hold 2,000 RPM for 30 seconds to fill torque converter. Return to idle. Shift through all positions holding each 10 sec: P → R → N → D → S → back to P. This activates all solenoids and distributes fluid." },
      { n:16, title:"Temperature-Controlled Level Check", d:"Engine idling in Park, monitor ATF temp. Wait for 35°C (idle to warm, or briefly drive around block). Once between 35-45°C: crawl under, remove fill plug. IF FLUID RUNS OUT: wait for single drops = level correct, reinstall plug. IF NO FLUID: pump more ATF until it streams, wait for drops, plug. IF STEADY STREAM: slightly overfull, let drain to trickle, plug." },
      { n:17, title:"Torque Fill Plug", d:"35 Nm (8mm hex) or 30 Nm (10mm hex variant). Do NOT exceed 45°C during check — if overshot, engine off, wait 20-30 min to cool." },
      { n:18, title:"Adaptation Reset (VCDS)", d:"Engine running, level ground. [02 – Auto Trans] → [Basic Settings – 04]. Select 'Resetting of all adaptation values' → Go. Then 'Erasing of system-specific adaptation values' → Go. Verify: Meas. Blocks groups 73-77 (clutches A-E) should all read 0." },
      { n:19, title:"Adaptation Reset (OBDeleven)", d:"Control Units → 02 – Auto Trans → Basic Settings. Select 'Erasing of system-specific adaptation values' → Execute. Verify clutch adaptation values = 0 in live data." },
      { n:20, title:"Adaptation Drive", d:"With ATF ~40°C: drive and brake to full stop, hold in D for 7 sec, repeat several times (slip adaptation). Then drive normally in D (not sport/manual) through 1-2-3-4-5-6-7, ensure 6→5 downshift on light deceleration (shift adaptation). Full adaptation completes over 300-500 miles of normal driving." },
      { n:21, title:"Post-Service Checks", d:"Wipe pan/drain/fill clean so new leaks are visible. First 100 miles: drive gently. Re-check level after 10-20 miles at 35-45°C. Inspect at 100 and 500 miles for slow seepage. Consider double drain-and-fill after 500-1,000 miles for 80%+ fluid replacement." },
    ],
    tips:[
      "MISTAKE #1: Draining before confirming fill plug access. Seized fill plug + empty trans = flatbed tow. ALWAYS crack fill plug first.",
      "MISTAKE #2: Over-torquing plastic pan. 10 Nm feels barely finger-tight — that's correct. Over-torque = cracked pan, slow leak days later.",
      "MISTAKE #3: Wrong temperature. Even 10°C outside the 35-45°C window produces meaningfully wrong fill level. Too cold = overfill (fluid foams). Too hot = underfill.",
      "MISTAKE #4: Level check with engine off. The ZF 8HP check is designed engine-running in Park. Engine off = fluid pools in pan = false high reading = underfill.",
      "MISTAKE #5: Skipping gear cycling. Must shift through all positions to fill torque converter and activate solenoids. Skipping = short by nearly a liter.",
      "MISTAKE #6: Reusing old pan bolts. OEM bolts are torque-to-yield (single-use). They lose clamping force. Always use new bolts from kit.",
      "MISTAKE #7: Double O-ring. If old O-ring stays stuck on housing and new pan goes on = leak. Always verify removal.",
      "MISTAKE #8: Wrong fluid. Generic ATF, Dexron, Mercon are NOT approved. ZF 8HP requires specific low-viscosity synthetic meeting ZF S671.090.312. Wrong fluid = harsh shifts, clutch glazing, premature failure.",
      "Most owners report noticeably smoother, crisper shifts within 50 miles — especially 2→3 and 3→4 upshifts. Described as 'transformative' at 64k with original fluid.",
      "Budget: $131-265 depending on kit choice. FCP Euro's lifetime replacement = free parts at next service. Vs $850-1,100 at dealer.",
      "A single pan-drop replaces ~60% of total fluid. For 80%+ replacement, do a second drain-and-fill after 500-1,000 miles with leftover fluid from a 7L kit.",
    ],
  },
};

const CODE_DB = {
  "P0100":{code:"P0100",name:"MAF Sensor Circuit Malfunction",system:"Engine",description:"ECM detected a problem with the MAF sensor circuit. On the EA888, PCV oil vapor contamination is the most common cause.",symptoms:["CEL","Rough idle","Hesitation","Reduced MPG","Possible limp mode"],causes:["Dirty MAF element (PCV oil vapor)","Damaged wiring","Vacuum leak","Cracked intake duct","Failed sensor"],repair_guide:"Clean MAF with CRC MAF Cleaner first. Check intake duct for cracks. Inspect PCV valve (diaphragm tears 50-100k mi, causes oil vapor contamination of MAF). If cleaning fails, replace with OEM Bosch 06J906461D.",parts:[{name:"Bosch MAF",partNum:"06J906461D",cost:"$85-120"},{name:"CRC MAF Cleaner",partNum:"05110",cost:"$8-12"}],est_difficulty:"Beginner",est_time:"20-30 min",est_cost:"$8-120",related_codes:["P0101","P0102","P0103","P0171"],guideKey:"maf_clean_midnight",sev:"high"},
  "U1113":{code:"U1113",name:"Function Limitation — Malfunction Value",system:"Network",description:"Module received bad data on CAN bus. Cascading code — fix primary faults first.",symptoms:["Multiple warning lights"],causes:["Primary ECM fault","CAN bus issue","Low battery"],repair_guide:"Fix P0100 and P261A first. Clear and re-scan. Battery is likely ~9 years old — test it (Bible says this is priority).",parts:[],est_difficulty:"Cascading",est_cost:"$0",related_codes:["P0100","P261A","P068A"],sev:"medium"},
  "P261A":{code:"P261A",name:"Coolant Pump 'B' Circuit/Open",system:"Cooling",description:"Auxiliary electric after-run coolant pump circuit fault. This pump cools the turbo after shutdown. RECALL 19N3/19N4 covers fire risk on this component for 2013-2017 Q5 2.0T — verify recall completion.",symptoms:["CEL","Potential turbo heat soak damage long-term"],causes:["Failed pump motor","Wiring","Blown fuse","Bad relay","Recall-related fire risk"],repair_guide:"FIRST: Verify recall 19N3/19N4 (electric after-run coolant pump fire risk) has been completed at your dealer or NHTSA.gov. Then check fuse, locate pump (front engine bay, low driver side), test with direct 12V. Replace if non-functional.",parts:[{name:"Aux Coolant Pump",partNum:"06H121601M",cost:"$55-90"}],est_difficulty:"Intermediate",est_time:"1-2 hrs",est_cost:"$35-90",related_codes:["U1113"],sev:"high"},
  "P1264":{code:"P1264",name:"Injector Cyl 2: Regulation Range Exceeded",system:"Fuel",description:"Cylinder 2 injector outside regulation range. Could indicate carbon buildup on intake valves (common on direct-injection EA888) or injector failure.",symptoms:["Rough idle","Possible misfire cyl 2","Reduced power"],causes:["Faulty injector","Carbon buildup on valves","Wiring","Low fuel pressure"],repair_guide:"Check injector correction values with VCDS/OBDeleven. Consider borescope inspection of intake valves — carbon buildup is inevitable on direct injection. B8.5 has a fifth port injector for cold-start that reduces but doesn't eliminate buildup. Walnut blast if significant deposits found.",parts:[{name:"Injector (Bosch)",partNum:"06H906036P",cost:"$60-90 ea"},{name:"Seal Kit",partNum:"06H998907A",cost:"$15-25"}],est_difficulty:"Advanced",est_time:"3-4 hrs",est_cost:"$75-385",related_codes:["P0302"],sev:"high"},
  "P068A":{code:"P068A",name:"ECM Power Relay De-Energized Too Early",system:"Electrical",description:"ECM lost power before shutdown completed. Bible says battery is likely ~9 years old at this point and should be priority tested/replaced.",symptoms:["CEL","Hard start","Adaptations may not save"],causes:["Weak/dying battery (likely at ~9 years)","Corroded terminals","Faulty relay","B8 parasitic drain"],repair_guide:"Battery is almost certainly original at ~9 years. Test immediately (12.4V+ / pass load test). B8/B8.5 complex electronics cause parasitic drain. Use CTEK/NOCO trickle charger if car sits >1 week. Replace battery if it fails load test. Then check ECM relay.",parts:[{name:"Battery",partNum:"Various",cost:"$150-220"},{name:"ECM Relay",partNum:"8K0951253",cost:"$8-15"}],est_difficulty:"Beginner",est_time:"30-60 min",est_cost:"$8-220",related_codes:["U1113","1314"],sev:"medium"},
  "464384":{code:"464384",name:"Parking Brake Motor Torque Signal",system:"EPB",description:"EPB receiving bad torque signal from ECM. Cascading from primary faults.",repair_guide:"Fix ECM codes first. Likely resolves.",parts:[],est_difficulty:"Cascading",est_cost:"$0",related_codes:["U1113"],sev:"medium"},
  "2505":{code:"2505",name:"Torque Management Feedback 'A'",system:"TCM",description:"TCM receiving bad torque data from ECM. Note: ZF 8HP transmission fluid service is OVERDUE at 64k — this should be first priority per Ownership Bible.",repair_guide:"Fix ECM codes first (cascading). Then perform ZF 8HP fluid service (highest priority maintenance item). After fluid service, perform adaptation reset via VCDS/OBDeleven to recalibrate shift patterns.",parts:[],est_difficulty:"Cascading",est_cost:"$0",related_codes:["P0100","U1113"],sev:"medium"},
  "714":{code:"714",name:"Right Center Vent Motor -V111",system:"HVAC",description:"Vent flap motor fault. Stored/intermittent.",repair_guide:"Low priority. Monitor vent function.",parts:[],est_difficulty:"Advanced (dash removal)",est_cost:"$25-50",related_codes:[],sev:"low"},
  "1314":{code:"1314",name:"ECM: No Communications",system:"Brakes",description:"Brake module lost CAN comm with ECM. Related to P068A/battery. Note: rear brake service requires scan tool 'service mode' — pistons push straight in on B8.",repair_guide:"Resolves with P068A/battery fix.",parts:[],est_difficulty:"Cascading",est_cost:"$0",related_codes:["P068A"],sev:"low"},
  "2616":{code:"2616",name:"Fuel Cap Unlock: Open/Short",system:"Comfort",description:"Fuel door actuator circuit fault.",repair_guide:"Check actuator connector behind LR quarter panel. Replace if dead.",parts:[{name:"Fuel Door Actuator",partNum:"8R0862153",cost:"$20-35"}],est_difficulty:"Beginner",est_cost:"$20-35",related_codes:[],sev:"low"},
  "2244":{code:"2244",name:"Pressure Ctrl Valve 2: Electrical Error",system:"Info",description:"Stored intermittent fault.",repair_guide:"Clear and monitor.",parts:[],est_difficulty:"Unknown",est_cost:"Varies",related_codes:[],sev:"low"},
  "2981":{code:"2981",name:"Intake Manifold Runner Sensor",system:"Radio (misattributed)",description:"BlueDriver scan tool mapping error on VAG codes. Verify with VCDS/OBDeleven.",repair_guide:"Re-scan with VAG-specific tool to verify. BlueDriver misattributes some VAG codes.",parts:[],est_difficulty:"Verify",est_cost:"$0",related_codes:[],sev:"low"},
};

const VEHICLE = { id:"v_midnight", nickname:"Midnight", year:2017, make:"Audi", model:"Q5", trim:"2.0T quattro Premium", engine:"2.0L TFSI I4 Turbo (EA888 CPMA/CNCD longitudinal, 220 hp)", drivetrain:"AWD (Torsen quattro)", transmission:"8-Spd ZF 8HP Tiptronic", fuel:"Gasoline", hp:"220", torque:"258 lb-ft", vin:"WA1C2AFP9HA075605", mileage:64716, assembly:"Ingolstadt, Germany", oil_spec:"VW 502 00 — 5W-40 synthetic", oil_capacity:"4.5L (4.8 qt)", coolant:"G13 (TL-VW 774 J)", brake_fluid:"DOT 4 (ATE TYP 200)", tire_size:"235/60R18", lug_torque:"120 Nm (17mm, M14x1.5)", steering:"Electric EPAS (no fluid)",
  history:"B8.5 Q5 (8R chassis), final model year before second-gen. Built at Ingolstadt. The EA888 in the longitudinal B8 Q5 uses the CPMA/CNCD engine code (220 hp) — some classify this as late Gen 2 longitudinal, others Gen 3. The AWD system is Torsen-based with a crown gear center differential — this is 'real' quattro, not Haldex. No Haldex coupling to service.\n\nAt 64,716 miles, this vehicle is at a critical inflection point. Major services are due now — ZF 8HP transmission fluid (highest priority), differential and transfer case fluids, and spark plugs. The car is entering the mileage range where the EA888's known weak points begin to surface: water pump (plastic impeller cracking, 50-100k failure range), PCV valve (diaphragm tears 50-100k), and upper control arm bushings (B8 platform Achilles heel, wear begins 50-70k).\n\nThe ZF 8HP transmission is one of the most reliable modern automatics IF the fluid is maintained — despite Audi's 'lifetime fill' claim, ZF themselves recommend 50-75k mi changes. The battery is ~9 years old and should be tested immediately.\n\nWith proactive maintenance (5,000 mi oil changes, timely fluid services, preventive replacement of known failure items), this powertrain is capable of 200,000+ miles. The Ownership Bible estimates DIY maintenance saves $1,200-2,000/year vs dealer pricing." };

function calcInterval(interval, mileage, records) {
  if (!mileage) return { status:"unknown", pct:0, lastMi:null, lastDate:null, nextDueMi:null, miRemain:null };
  const matching = records.filter(r => r.intervalKey === interval.key).sort((a,b) => new Date(b.date) - new Date(a.date));
  const last = matching[0];
  const lastMi = last?.mileage || 0;
  const lastDate = last?.date || null;
  const nextDueMi = lastMi + interval.miInt;
  const miRemain = nextDueMi - mileage;
  const pct = Math.min(100, Math.max(0, ((mileage - lastMi) / interval.miInt) * 100));
  let status;
  if (!last && mileage > interval.miInt) status = "overdue";
  else if (!last) status = pct > 60 ? "upcoming" : "ok";
  else if (miRemain < 0) status = "overdue";
  else if (miRemain < interval.miInt * 0.15) status = "due";
  else if (miRemain < interval.miInt * 0.4) status = "upcoming";
  else status = "ok";
  return { status, pct, lastMi: last ? lastMi : null, lastDate, nextDueMi, miRemain };
}

const INIT = {
  screen:"dash", vehicle:{...VEHICLE}, sel:"v_midnight", tab:"overview",
  codes: ["P0100","U1113","P261A","P1264","P068A","464384","2505","714","1314","2616","2244","2981"].map((code,i)=>({
    id:"dc"+i, vehicleId:"v_midnight", code, scanDate:"2026-02-17", mileage:64716, status:"active", type:i<7?"confirmed":"stored",
  })),
  records:[
    {id:"sr1",vehicleId:"v_midnight",intervalKey:"oil",date:"2026-02-17",mileage:64716,service:"Oil & Filter Change",parts:[{name:"Mobil 1 0W-40 European (5qt)",pn:"MOB-153669",cost:27.47},{name:"Mann-Filter HU 719/6x",pn:"HU719/6x",cost:8.99},{name:"Drain Plug Crush Washer M14",pn:"N0138157",cost:1.50}],notes:"4.5L fill, VW 502 00 spec. Drain plug torqued to 25 Nm, filter cap 25 Nm. Old oil dark but healthy. No metallic sheen or milkiness.",total:37.96},
    {id:"sr2",vehicleId:"v_midnight",intervalKey:"spark",date:"2026-02-17",mileage:64716,service:"Spark Plugs",parts:[{name:"NGK PFR7S8EG (x4)",pn:"PFR7S8EG",cost:48}],notes:"Gapped 0.028in, torqued 25 Nm. Normal wear. Oil seepage in plug wells — valve cover gasket seeping (common at this mileage on EA888). Coils cleaned, test fine per FIL advice. Dielectric grease on boot ribs.",total:48},
  ],
  mileageLog:[
    { vehicleId:"v_midnight", date:"2026-02-17", mileage:64716, note:"Scan + oil change + plugs" },
    { vehicleId:"v_midnight", date:"2025-08-20", mileage:60000, note:"Spark plugs" },
    { vehicleId:"v_midnight", date:"2025-06-01", mileage:55000, note:"Cabin air filter" },
    { vehicleId:"v_midnight", date:"2024-03-15", mileage:40000, note:"40k service" },
  ],
  modal:null, codeDetail:null, guideDetail:null, preselect:null, guideProgress:{},
};

function reducer(s,a){
  switch(a.type){
    case "TAB": return {...s,tab:a.tab,codeDetail:null,guideDetail:null};
    case "MODAL": return {...s,modal:a.modal,preselect:a.preselect||null};
    case "CODE_DETAIL": return {...s,codeDetail:a.code,guideDetail:null};
    case "GUIDE_DETAIL": return {...s,guideDetail:a.key,codeDetail:null};
    case "ADD_CODE": return {...s,codes:[...s.codes,{...a.c,id:"dc_"+Date.now()}],modal:null};
    case "RESOLVE": return {...s,codes:s.codes.map(c=>c.id===a.id?{...c,status:"resolved"}:c)};
    case "ADD_RECORD": {
      const nr={...a.r,id:"sr_"+Date.now()};
      let vehicle=s.vehicle;
      if(a.r.mileage&&(!vehicle.mileage||a.r.mileage>vehicle.mileage)) vehicle={...vehicle,mileage:a.r.mileage};
      let ml=s.mileageLog;
      if(a.r.mileage) ml=[...ml,{vehicleId:"v_midnight",date:a.r.date,mileage:a.r.mileage,note:"Service: "+a.r.service}];
      return {...s,records:[nr,...s.records],vehicle,mileageLog:ml,modal:null};
    }
    case "UPDATE_MILEAGE": {
      const vehicle={...s.vehicle,mileage:a.mileage};
      const ml=[...s.mileageLog,{vehicleId:"v_midnight",date:new Date().toISOString().split("T")[0],mileage:a.mileage,note:a.note||"Odometer update"}];
      return {...s,vehicle,mileageLog:ml,modal:null};
    }
    case "GUIDE_STEP": {
      const gp={...s.guideProgress};
      if(!gp[a.guideKey])gp[a.guideKey]=[];
      if(gp[a.guideKey].includes(a.step))gp[a.guideKey]=gp[a.guideKey].filter(x=>x!==a.step);
      else gp[a.guideKey]=[...gp[a.guideKey],a.step];
      return {...s,guideProgress:gp};
    }
    default: return s;
  }
}

function Btn({children,v="primary",sz="md",onClick,dis,cls=""}){const vs={primary:"bg-[var(--amber)] text-[var(--bg)] hover:brightness-110",secondary:"bg-[var(--bg3)] text-[var(--t1)] border border-[var(--bdr)] hover:border-[var(--bdr2)]",ghost:"text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--bg3)]",success:"bg-[var(--green-d)] text-[var(--green)] border border-[rgba(34,197,94,.2)]",danger:"bg-[var(--red-d)] text-[var(--red)] border border-[rgba(239,68,68,.2)]"};const szs={sm:"text-xs px-2.5 py-1.5",md:"text-sm px-4 py-2",lg:"text-sm px-6 py-2.5"};return <button onClick={onClick} disabled={dis} className={`inline-flex items-center justify-center font-semibold rounded-lg transition-all gap-2 ${vs[v]} ${szs[sz]} ${dis?"opacity-40 cursor-not-allowed":"cursor-pointer"} ${cls}`}>{children}</button>;}
function Input({label,value,onChange,type="text",ph,mono,cls="",...r}){return <label className={`block ${cls}`}>{label&&<span className="block text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-1.5">{label}</span>}<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={ph} className={`w-full bg-[var(--bg)] border border-[var(--bdr)] rounded-lg px-3 py-2.5 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:border-[var(--amber)] transition-colors ${mono?"font-mono":""}`} {...r}/></label>;}
function Sel({label,value,onChange,opts,ph,cls=""}){return <label className={`block ${cls}`}>{label&&<span className="block text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-1.5">{label}</span>}<select value={value} onChange={e=>onChange(e.target.value)} className="w-full bg-[var(--bg)] border border-[var(--bdr)] rounded-lg px-3 py-2.5 text-sm text-[var(--t1)] focus:outline-none focus:border-[var(--amber)] appearance-none cursor-pointer" style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234d5b72' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center"}}>{ph&&<option value="">{ph}</option>}{opts.map(o=><option key={o} value={o}>{o}</option>)}</select></label>;}
function TextArea({label,value,onChange,ph,rows=3,cls=""}){return <label className={`block ${cls}`}>{label&&<span className="block text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-1.5">{label}</span>}<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={ph} rows={rows} className="w-full bg-[var(--bg)] border border-[var(--bdr)] rounded-lg px-3 py-2.5 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:border-[var(--amber)] resize-none"/></label>;}
function Modal({open,onClose,title,wide,children}){if(!open)return null;return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}><div className="absolute inset-0 bg-black/70 backdrop-blur-sm"/><div className={`relative bg-[var(--bg2)] border border-[var(--bdr)] rounded-2xl shadow-2xl w-full ${wide?"max-w-2xl":"max-w-lg"} max-h-[90vh] overflow-y-auto scr fade`} onClick={e=>e.stopPropagation()}><div className="sticky top-0 bg-[var(--bg2)] border-b border-[var(--bdr)] px-6 py-4 flex items-center justify-between z-10"><h3 className="text-lg font-bold">{title}</h3><button onClick={onClose} className="text-[var(--t3)] hover:text-[var(--t1)] text-xl cursor-pointer">×</button></div><div className="p-6">{children}</div></div></div>;}
function Badge({children,c="amber"}){const cs={amber:"bg-[var(--amber-d)] text-[var(--amber)] border-[rgba(240,168,50,.2)]",red:"bg-[var(--red-d)] text-[var(--red)] border-[rgba(239,68,68,.2)]",green:"bg-[var(--green-d)] text-[var(--green)] border-[rgba(34,197,94,.2)]",blue:"bg-[var(--blue-d)] text-[var(--blue)] border-[rgba(59,130,246,.2)]",orange:"bg-[var(--orange-d)] text-[var(--orange)] border-[rgba(249,115,22,.2)]",cyan:"bg-[var(--cyan-d)] text-[var(--cyan)] border-[rgba(6,182,212,.2)]",gray:"bg-[rgba(77,91,114,.1)] text-[var(--t3)] border-[rgba(77,91,114,.2)]"};return <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${cs[c]}`}>{children}</span>;}
function StatusBadge({status}){const m={ok:["green","OK"],upcoming:["blue","UPCOMING"],due:["orange","DUE"],overdue:["red","OVERDUE"],unknown:["gray","NO DATA"]};const[c,l]=m[status]||["gray",status];return <Badge c={c}>{l}</Badge>;}
function Card({children,cls="",onClick}){return <div onClick={onClick} className={`bg-[var(--bg4)] border border-[var(--bdr)] rounded-xl transition-all duration-200 ${onClick?"cursor-pointer hover:border-[var(--bdr2)] hover:shadow-lg hover:shadow-black/20":""} ${cls}`}>{children}</div>;}

function Dash({s,d}){
  const v=s.vehicle;
  const tabs=[{id:"overview",l:"Dashboard"},{id:"timeline",l:"Timeline"},{id:"planner",l:"Planner"},{id:"intervals",l:"Intervals"},{id:"diagnostics",l:"Diagnostics"},{id:"service",l:"Service Log"},{id:"guides",l:"Guides"},{id:"specs",l:"Vehicle"}];
  const ac=s.codes.filter(c=>c.vehicleId===v.id&&c.status==="active"&&c.type==="confirmed");
  if(ac.length>0)tabs[4].l=`Diagnostics (${ac.length})`;
  const ints=INTERVAL_DEFS[v.id]||[];const vRecs=s.records.filter(r=>r.vehicleId===v.id);
  const odc=ints.filter(i=>calcInterval(i,v.mileage,vRecs).status==="overdue").length;
  if(odc>0)tabs[3].l=`Intervals (${odc})`;
  return <div className="min-h-screen" style={{background:"radial-gradient(ellipse at 50% 0%,rgba(240,168,50,.02),transparent 50%),var(--bg)"}}>
    <header className="border-b border-[var(--bdr)] bg-[var(--bg2)]"><div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between"><div className="flex items-center gap-4"><h1 className="text-lg font-black" style={{fontFamily:"var(--fd)"}}>Garage<span className="text-[var(--amber)]">IQ</span></h1><div className="w-px h-5 bg-[var(--bdr)]"/><div><p className="font-bold text-sm">{v.nickname}</p><p className="text-[var(--t3)] text-xs">{v.year} {v.make} {v.model} {v.trim}</p></div></div>
    <button onClick={()=>d({type:"MODAL",modal:"updateMileage"})} className="text-right group cursor-pointer"><span className="text-[var(--t3)] text-xs block group-hover:text-[var(--amber)]">Odometer ✎</span><span className="font-bold text-sm font-mono">{v.mileage?v.mileage.toLocaleString()+" mi":"— Update —"}</span></button>
    </div><div className="max-w-7xl mx-auto px-6"><div className="flex gap-1 overflow-x-auto">{tabs.map(t=><button key={t.id} onClick={()=>d({type:"TAB",tab:t.id})} className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 cursor-pointer ${s.tab===t.id?"text-[var(--t1)] border-[var(--amber)]":"text-[var(--t3)] border-transparent hover:text-[var(--t2)]"}`}>{t.l}</button>)}</div></div></header>
    <div className="max-w-7xl mx-auto px-6 py-8 fade">
      {s.tab==="overview"&&<Overview v={v} s={s} d={d}/>}
      {s.tab==="timeline"&&<Timeline v={v} s={s} d={d}/>}
      {s.tab==="planner"&&<Planner v={v} s={s} d={d}/>}
      {s.tab==="intervals"&&<IntervalsPage v={v} s={s} d={d}/>}
      {s.tab==="diagnostics"&&!s.codeDetail&&<DiagList v={v} s={s} d={d}/>}
      {s.tab==="diagnostics"&&s.codeDetail&&<CodeDetail code={s.codeDetail} v={v} s={s} d={d}/>}
      {s.tab==="service"&&<ServiceLog v={v} s={s} d={d}/>}
      {s.tab==="guides"&&!s.guideDetail&&<GuideList v={v} s={s} d={d}/>}
      {s.tab==="guides"&&s.guideDetail&&<GuideDetailPage gk={s.guideDetail} v={v} s={s} d={d}/>}
      {s.tab==="specs"&&<Specs v={v}/>}
    </div>
    <UpdateMileageModal open={s.modal==="updateMileage"} onClose={()=>d({type:"MODAL",modal:null})} v={v} s={s} d={d}/>
    <AddRecordModal open={s.modal==="addRecord"} onClose={()=>d({type:"MODAL",modal:null})} vid={v.id} d={d} preselect={s.preselect||""}/>
  </div>;
}

function UpdateMileageModal({open,onClose,v,s,d}){
  const[mi,setMi]=useState("");const[note,setNote]=useState("");
  const hist=s.mileageLog.filter(m=>m.vehicleId===v.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  let avgMi=null;if(hist.length>=2){const days=(new Date(hist[0].date)-new Date(hist[hist.length-1].date))/(86400000);if(days>7)avgMi=Math.round((hist[0].mileage-hist[hist.length-1].mileage)/(days/30.44));}
  return <Modal open={open} onClose={()=>{onClose();setMi("");setNote("");}} title="Update Odometer"><div className="space-y-4">
    <div className="text-center mb-2"><p className="text-[var(--t3)] text-sm">Current: <strong className="text-[var(--t1)] font-mono">{v.mileage?v.mileage.toLocaleString():"—"}</strong> mi</p>{avgMi&&<p className="text-[var(--t3)] text-xs mt-1">Avg: ~{avgMi.toLocaleString()} mi/month</p>}</div>
    <Input label="New Reading" value={mi} onChange={setMi} ph={v.mileage?String(v.mileage+500):""} type="number" mono/>
    <Input label="Note (optional)" value={note} onChange={setNote} ph="Gas station, scan, etc."/>
    <Btn v="primary" cls="w-full" onClick={()=>{if(!mi)return;d({type:"UPDATE_MILEAGE",vehicleId:v.id,mileage:parseInt(mi),note});setMi("");setNote("");}} dis={!mi||(v.mileage&&parseInt(mi)<v.mileage)}>Update</Btn>
    {hist.length>0&&<div className="pt-4 border-t border-[var(--bdr)]"><p className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-2">History</p>{hist.slice(0,8).map((h,i)=><div key={i} className="flex items-center justify-between py-1.5 text-xs"><span className="text-[var(--t3)]">{h.date}</span><span className="text-[var(--t2)] font-mono">{h.mileage.toLocaleString()} mi</span><span className="text-[var(--t3)] truncate max-w-[120px] ml-2">{h.note}</span></div>)}</div>}
  </div></Modal>;
}

function Overview({v,s,d}){
  const codes=s.codes.filter(c=>c.vehicleId===v.id&&c.status==="active"&&c.type==="confirmed");
  const recs=s.records.filter(r=>r.vehicleId===v.id);const tot=recs.reduce((a,r)=>a+r.total,0);
  const ints=INTERVAL_DEFS[v.id]||[];const vRecs=recs;
  const intStatuses=ints.map(i=>({...i,st:calcInterval(i,v.mileage,vRecs)}));
  const overdue=intStatuses.filter(i=>i.st.status==="overdue");
  const due=intStatuses.filter(i=>i.st.status==="due");
  const upcoming=intStatuses.filter(i=>i.st.status==="upcoming");
  const ok=intStatuses.filter(i=>i.st.status==="ok");

  // Health score: 100 - (overdue*15 + due*8 + codes*10 + upcoming*2), min 0
  const healthScore=Math.max(0,Math.min(100, 100 - overdue.length*15 - due.length*8 - codes.length*10 - upcoming.length*2));
  const hColor=healthScore>=75?"var(--green)":healthScore>=50?"var(--amber)":"var(--red)";

  // Next 3 upcoming services
  const next3=[...overdue,...due,...upcoming].slice(0,3);

  // DIY savings: sum dealer costs of completed services vs what was spent
  const completedInts=recs.filter(r=>r.intervalKey).map(r=>{const def=ints.find(i=>i.key===r.intervalKey);return def?{diy:r.total,dealer:def.dealerCost||0}:null;}).filter(Boolean);
  const totalDealer=completedInts.reduce((a,c)=>a+c.dealer,0);
  const totalDIY=completedInts.reduce((a,c)=>a+c.diy,0);
  const saved=totalDealer-totalDIY;

  // Estimated annual maintenance cost (DIY)
  const annualDIY=ints.reduce((a,i)=>{const perYear=i.miInt?(12000/i.miInt):1;return a+(i.diyCost||0)*perYear;},0);
  const annualDealer=ints.reduce((a,i)=>{const perYear=i.miInt?(12000/i.miInt):1;return a+(i.dealerCost||0)*perYear;},0);

  // Miles since last service
  const lastRec=recs[0];
  const miSinceLast=lastRec?.mileage?v.mileage-lastRec.mileage:null;

  return <div className="space-y-6">
    {/* Row 1: Health + Stats */}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card cls="p-5"><span className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider">Health</span>
        <div className="flex items-center gap-3 mt-2"><div className="relative w-16 h-16"><svg viewBox="0 0 36 36" className="w-16 h-16" style={{transform:"rotate(-90deg)"}}><circle cx="18" cy="18" r="14" fill="none" stroke="rgba(77,91,114,.2)" strokeWidth="3.5"/><circle cx="18" cy="18" r="14" fill="none" stroke={hColor} strokeWidth="3.5" strokeDasharray={`${healthScore*0.88} ${88-healthScore*0.88}`} strokeLinecap="round"/></svg><span className="absolute inset-0 flex items-center justify-center font-black font-mono text-lg" style={{color:hColor}}>{healthScore}</span></div><div><p className="text-xs text-[var(--t3)]">{healthScore>=75?"Good shape":healthScore>=50?"Needs attention":"Action needed"}</p></div></div>
      </Card>
      <Card cls="p-5 group cursor-pointer" onClick={()=>d({type:"TAB",tab:"intervals"})}><span className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider">Service Due</span><p className={`text-2xl font-black mt-1 font-mono ${overdue.length?"text-[var(--red)]":due.length?"text-[var(--orange)]":"text-[var(--green)]"}`}>{overdue.length+due.length}</p><p className="text-[var(--t3)] text-xs mt-1">{overdue.length} overdue · {due.length} due</p></Card>
      <Card cls="p-5 group cursor-pointer" onClick={()=>d({type:"TAB",tab:"diagnostics"})}><span className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider">Active Codes</span><p className={`text-2xl font-black mt-1 font-mono ${codes.length?"text-[var(--red)]":"text-[var(--green)]"}`}>{codes.length}</p><p className="text-[var(--t3)] text-xs mt-1">{s.codes.filter(c=>c.vehicleId===v.id&&c.type==="stored"&&c.status==="active").length} stored</p></Card>
      <Card cls="p-5 group cursor-pointer" onClick={()=>d({type:"TAB",tab:"service"})}><span className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider">DIY Savings</span><p className="text-2xl font-black mt-1 font-mono text-[var(--green)]">${saved>0?saved.toFixed(0):"0"}</p><p className="text-[var(--t3)] text-xs mt-1">vs ${totalDealer.toFixed(0)} dealer</p></Card>
      <Card cls="p-5"><span className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider">Since Last Service</span><p className="text-2xl font-black mt-1 font-mono">{miSinceLast!=null?miSinceLast.toLocaleString():"—"}</p><p className="text-[var(--t3)] text-xs mt-1">{lastRec?`${lastRec.service} · ${lastRec.date}`:"No services logged"}</p></Card>
    </div>

    {/* Row 2: Overdue alert */}
    {overdue.length>0&&<div className="rounded-xl border border-[rgba(249,115,22,.2)] bg-[var(--orange-d)] p-5"><span className="text-[var(--orange)] text-xs font-bold uppercase tracking-wider">⏱ Service Overdue</span>{overdue.map(i=><div key={i.key} onClick={()=>d({type:"TAB",tab:"intervals"})} className="flex items-center justify-between py-2 px-3 mt-2 rounded-lg hover:bg-[rgba(0,0,0,.15)] cursor-pointer"><span className="text-sm font-medium">{i.name}</span><span className="text-[var(--red)] text-xs font-bold font-mono">{i.st.miRemain!==null&&i.st.miRemain<0?Math.abs(i.st.miRemain).toLocaleString()+" mi over":"Never done"}</span></div>)}</div>}

    {/* Row 3: Priority Codes */}
    {codes.filter(c=>!CODE_DB[c.code]?.est_difficulty?.includes("Cascading")).length>0&&<div className="rounded-xl border border-[rgba(239,68,68,.2)] bg-[var(--red-d)] p-5"><div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-[var(--red)] pulse"/><span className="text-[var(--red)] text-xs font-bold uppercase tracking-wider">Priority Codes</span></div>{codes.map(c=>{const db=CODE_DB[c.code];if(!db||db.est_difficulty?.includes("Cascading"))return null;return <div key={c.id} onClick={()=>{d({type:"TAB",tab:"diagnostics"});setTimeout(()=>d({type:"CODE_DETAIL",code:c.code}),50);}} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[rgba(0,0,0,.15)] cursor-pointer group"><span className="font-bold text-[var(--amber)] text-sm w-16 font-mono">{c.code}</span><span className="text-[var(--t2)] text-sm flex-1">{db.name}</span><span className="text-[var(--t4)] group-hover:text-[var(--amber)] text-sm">→</span></div>;})}</div>}

    {/* Row 4: DIY vs Dealer comparison chart */}
    <Card cls="p-5"><h3 className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-4">DIY vs Dealer Cost Comparison</h3>
      <div className="space-y-2">
        {ints.filter(i=>i.dealerCost>50).sort((a,b)=>b.dealerCost-a.dealerCost).slice(0,8).map(i=>{
          const maxCost=Math.max(...ints.map(x=>x.dealerCost||0));
          return <div key={i.key} className="flex items-center gap-3">
            <span className="text-[10px] text-[var(--t3)] w-[120px] shrink-0 truncate text-right">{i.name.replace(/ \(.*/,"")}</span>
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="flex items-center gap-1"><div className="h-2.5 rounded-sm bg-[var(--green)]" style={{width:`${((i.diyCost||0)/maxCost)*100}%`}}/><span className="text-[9px] text-[var(--green)] font-mono font-bold">${i.diyCost}</span></div>
              <div className="flex items-center gap-1"><div className="h-2.5 rounded-sm bg-[var(--red)] opacity-40" style={{width:`${((i.dealerCost||0)/maxCost)*100}%`}}/><span className="text-[9px] text-[var(--t3)] font-mono">${i.dealerCost}</span></div>
            </div>
          </div>;
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--bdr)] text-xs"><span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[var(--green)]"/>DIY</span><span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[var(--red)] opacity-40"/>Dealer</span><span className="ml-auto text-[var(--t3)]">Annual: <span className="text-[var(--green)] font-bold font-mono">${Math.round(annualDIY)}</span> DIY vs <span className="text-[var(--t3)] line-through font-mono">${Math.round(annualDealer)}</span> dealer · Save <span className="text-[var(--green)] font-bold font-mono">${Math.round(annualDealer-annualDIY)}/yr</span></span></div>
    </Card>

    {/* Row 5: Next up */}
    <Card cls="p-5"><h3 className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Next Up</h3>
      {next3.length>0?next3.map(i=><div key={i.key} className="flex items-center justify-between py-2.5 border-b border-[var(--bdr)] last:border-0"><div className="flex items-center gap-3"><StatusBadge status={i.st.status}/><span className="text-sm">{i.name}</span></div><div className="text-right"><span className="text-[var(--amber)] font-bold font-mono text-sm">${i.diyCost||0}</span><span className="text-[var(--t3)] text-xs ml-1">DIY</span></div></div>):<p className="text-[var(--t3)] text-sm">All services up to date</p>}
      <Btn v="secondary" sz="sm" cls="mt-3 w-full" onClick={()=>d({type:"TAB",tab:"planner"})}>View Full Planner →</Btn>
    </Card>

    {/* Row 5: Recent service */}
    <div><h3 className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Recent Service</h3>{recs.slice(0,3).map(r=><Card key={r.id} cls="p-4 mb-3 cursor-pointer" onClick={()=>d({type:"TAB",tab:"service"})}><div className="flex justify-between"><div><p className="font-semibold text-sm">{r.service}</p><p className="text-[var(--t3)] text-xs">{r.date} · {r.mileage?.toLocaleString()} mi</p></div><span className="text-[var(--green)] font-bold text-sm font-mono">${r.total.toFixed(2)}</span></div></Card>)}</div>
  </div>;
}

function Timeline({v,s,d}){
  const ints=INTERVAL_DEFS[v.id]||[];const recs=s.records.filter(r=>r.vehicleId===v.id);
  const hist=s.mileageLog.filter(m=>m.vehicleId===v.id).sort((a,b)=>a.mileage-b.mileage);
  const avgMiPerMonth=hist.length>=2?Math.round((hist[hist.length-1].mileage-hist[0].mileage)/((new Date(hist[hist.length-1].date)-new Date(hist[0].date))/86400000/30.44)):1000;

  const pastEvents=recs.map(r=>({type:"past",mi:r.mileage,date:r.date,name:r.service,cost:r.total})).filter(e=>e.mi);
  const futureEvents=[];
  ints.forEach(i=>{
    const st=calcInterval(i,v.mileage,recs);
    if(st.status==="overdue"){futureEvents.push({type:"overdue",mi:v.mileage,date:"Now",name:i.name,cost:i.diyCost||0});}
    else{
      const nextMi=st.nextDueMi||(v.mileage+i.miInt);
      const moAway=(nextMi-v.mileage)/(avgMiPerMonth||1000);
      const estDate=new Date();estDate.setMonth(estDate.getMonth()+Math.round(moAway));
      futureEvents.push({type:"future",mi:nextMi,date:estDate.toLocaleDateString("en-US",{month:"short",year:"numeric"}),name:i.name,cost:i.diyCost||0});
    }
  });

  const allEvents=[...pastEvents,...futureEvents].sort((a,b)=>a.mi-b.mi);
  const maxMi=Math.max(v.mileage+30000,...allEvents.map(e=>e.mi));
  const currentPct=(v.mileage/maxMi)*100;

  return <div><h2 className="text-lg font-bold mb-1">Maintenance Timeline</h2><p className="text-[var(--t3)] text-sm mb-6">Service history and future projections at ~{avgMiPerMonth.toLocaleString()} mi/month</p>
    <Card cls="p-5 mb-4"><div className="flex items-center gap-4 text-xs flex-wrap"><span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[var(--green)]"/>Completed</span><span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[var(--red)]"/>Overdue</span><span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[var(--blue)] opacity-50"/>Projected</span><span className="flex items-center gap-1.5"><span className="w-0.5 h-4 bg-[var(--amber)]"/>Now ({v.mileage.toLocaleString()} mi)</span></div></Card>
    {/* Mileage scale header */}
    <Card cls="p-4 mb-1"><div className="relative h-6 ml-[140px]">
      <div className="absolute inset-x-0 top-3 h-px bg-[var(--bdr)]"/>
      <div className="absolute top-0 h-6 w-0.5 bg-[var(--amber)]" style={{left:`${currentPct}%`}}/>
      {[25000,50000,75000,100000,125000].filter(m=>m<maxMi).map(m=><span key={m} className="absolute text-[9px] text-[var(--t4)] font-mono" style={{left:`${(m/maxMi)*100}%`,transform:"translateX(-50%)"}}>{(m/1000)}k</span>)}
    </div></Card>
    {/* Event rows */}
    <div className="space-y-0.5">{allEvents.map((e,i)=>{
      const pct=(e.mi/maxMi)*100;
      const color=e.type==="past"?"var(--green)":e.type==="overdue"?"var(--red)":"var(--blue)";
      const opacity=e.type==="future"?0.45:1;
      return <Card key={i} cls="px-4 py-2.5 flex items-center gap-0 rounded-lg">
        <span className="text-[10px] text-[var(--t3)] font-mono w-[70px] shrink-0">{e.date}</span>
        <div className="flex-1 relative h-5 mx-2">
          <div className="absolute inset-x-0 top-[9px] h-px bg-[var(--bdr)]"/>
          <div className="absolute top-0 h-5 w-0.5 bg-[var(--amber)] opacity-30" style={{left:`${currentPct}%`}}/>
          <div className="absolute top-[5px] w-2.5 h-2.5 rounded-full" style={{backgroundColor:color,left:`${pct}%`,transform:"translateX(-50%)",opacity}}/>
        </div>
        <div className="w-[250px] shrink-0 flex items-center justify-between">
          <span className="text-xs font-medium truncate" style={{color:e.type==="past"?"var(--t1)":e.type==="overdue"?"var(--red)":"var(--t3)",opacity}}>{e.name}</span>
          {e.cost>0&&<span className="text-[10px] font-mono shrink-0 ml-2" style={{color:e.type==="past"?"var(--green)":"var(--t3)",opacity}}>${e.cost}</span>}
        </div>
      </Card>;})}</div>
  </div>;
}

function Planner({v,s,d}){
  const ints=INTERVAL_DEFS[v.id]||[];const recs=s.records.filter(r=>r.vehicleId===v.id);
  const intStatuses=ints.map(i=>({...i,st:calcInterval(i,v.mileage,recs)}));

  // Group into batches
  const overdue=intStatuses.filter(i=>i.st.status==="overdue");
  const dueNow=intStatuses.filter(i=>i.st.status==="due");
  const by75k=intStatuses.filter(i=>i.st.status==="upcoming"||i.st.status==="ok").filter(i=>{const next=i.st.nextDueMi||(v.mileage+i.miInt);return next<=75000;});
  const by80k=intStatuses.filter(i=>i.st.status==="upcoming"||i.st.status==="ok").filter(i=>{const next=i.st.nextDueMi||(v.mileage+i.miInt);return next>75000&&next<=80000;});
  const by100k=intStatuses.filter(i=>i.st.status==="upcoming"||i.st.status==="ok").filter(i=>{const next=i.st.nextDueMi||(v.mileage+i.miInt);return next>80000&&next<=100000;});

  const Batch=({title,items,color,icon,urgency})=>{
    if(items.length===0)return null;
    const totalDIY=items.reduce((a,i)=>a+(i.diyCost||0),0);
    const totalDealer=items.reduce((a,i)=>a+(i.dealerCost||0),0);
    return <Card cls="p-5 mb-4">
      <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><span>{icon}</span><h3 className="font-bold text-sm">{title}</h3><Badge c={color}>{urgency}</Badge></div><div className="text-right"><span className="text-[var(--green)] font-bold font-mono">${totalDIY}</span><span className="text-[var(--t3)] text-xs ml-1">DIY</span><span className="text-[var(--t3)] text-xs ml-2 line-through">${totalDealer}</span></div></div>
      {items.map(i=><div key={i.key} className="flex items-center justify-between py-2.5 border-b border-[var(--bdr)] last:border-0">
        <div className="flex items-center gap-3 flex-1 min-w-0"><StatusBadge status={i.st.status}/><div className="min-w-0"><p className="text-sm font-medium truncate">{i.name}</p><p className="text-[var(--t3)] text-xs">{i.time||"—"}{i.guideKey&&" · 📖 Guide available"}</p></div></div>
        <div className="flex items-center gap-3 shrink-0"><span className="text-[var(--amber)] font-bold font-mono text-sm">${i.diyCost||0}</span>
          <Btn v={i.st.status==="overdue"||i.st.status==="due"?"primary":"secondary"} sz="sm" onClick={()=>d({type:"MODAL",modal:"addRecord",preselect:i.key})}>Log ✓</Btn></div>
      </div>)}
    </Card>;
  };

  return <div><h2 className="text-lg font-bold mb-1">Service Planner</h2><p className="text-[var(--t3)] text-sm mb-6">Grouped by priority — what to do this weekend vs. next month vs. long-term</p>
    <Batch title="Overdue — Do Now" items={overdue} color="red" icon="🔴" urgency="CRITICAL"/>
    <Batch title="Due Soon" items={dueNow} color="orange" icon="🟡" urgency="THIS MONTH"/>
    <Batch title="By 75,000 mi" items={by75k} color="blue" icon="🔵" urgency="UPCOMING"/>
    <Batch title="By 80,000 mi" items={by80k} color="cyan" icon="🔵" urgency="PLAN AHEAD"/>
    <Batch title="By 100,000 mi" items={by100k} color="gray" icon="⚪" urgency="LONG-TERM"/>
    {overdue.length===0&&dueNow.length===0&&by75k.length===0&&by80k.length===0&&by100k.length===0&&<Card cls="p-8 text-center"><p className="text-4xl mb-3">✅</p><p className="font-bold">All caught up!</p><p className="text-[var(--t3)] text-sm mt-1">No services due at this mileage.</p></Card>}
  </div>;
}


function IntervalsPage({v,s,d}){
  const ints=INTERVAL_DEFS[v.id]||[];const vRecs=s.records.filter(r=>r.vehicleId===v.id);
  if(!v.mileage)return <div className="text-center py-16"><p className="text-4xl mb-3">⏱</p><p className="text-[var(--t2)] font-semibold mb-3">Update odometer to activate service tracking</p><Btn onClick={()=>d({type:"MODAL",modal:"updateMileage"})}>Update Odometer</Btn></div>;
  const sorted=[...ints].sort((a,b)=>{const sa=calcInterval(a,v.mileage,vRecs);const sb=calcInterval(b,v.mileage,vRecs);const o={overdue:0,due:1,upcoming:2,ok:3,unknown:4};return(o[sa.status]??4)-(o[sb.status]??4);});
  const hist=s.mileageLog.filter(m=>m.vehicleId===v.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  let avgMi=null;if(hist.length>=2){const days=(new Date(hist[0].date)-new Date(hist[hist.length-1].date))/86400000;if(days>7)avgMi=Math.round((hist[0].mileage-hist[hist.length-1].mileage)/(days/30.44));}
  return <div><div className="flex items-center justify-between mb-6"><div><h2 className="text-lg font-bold">Service Intervals</h2><p className="text-[var(--t3)] text-sm">{v.year} {v.make} {v.model}{avgMi?` · ~${avgMi.toLocaleString()} mi/month`:""}</p></div></div>
    <div className="space-y-3">{sorted.map(i=>{const st=calcInterval(i,v.mileage,vRecs);const bc=st.status==="overdue"?"bg-[var(--red)]":st.status==="due"?"bg-[var(--orange)]":st.status==="upcoming"?"bg-[var(--blue)]":"bg-[var(--green)]";
      let estDate=null;if(avgMi&&st.miRemain&&st.miRemain>0){const mo=st.miRemain/avgMi;const d2=new Date();d2.setMonth(d2.getMonth()+Math.round(mo));estDate=d2.toLocaleDateString("en-US",{month:"short",year:"numeric"});}
      const guide=i.guideKey&&GUIDE_DB[i.guideKey];
      return <Card key={i.key} cls="p-4">
        <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-3 flex-wrap"><span className="font-semibold text-sm">{i.name}</span><StatusBadge status={st.status}/>{guide&&<button onClick={()=>{d({type:"TAB",tab:"guides"});setTimeout(()=>d({type:"GUIDE_DETAIL",key:i.guideKey}),50);}} className="text-[var(--cyan)] text-xs hover:underline cursor-pointer">📖 Guide</button>}</div><div className="flex items-center gap-2"><span className="text-[var(--t3)] text-xs font-mono">Every {i.miInt.toLocaleString()} mi{i.moInt?` / ${i.moInt}mo`:""}</span><Btn v={st.status==="overdue"||st.status==="due"?"primary":"secondary"} sz="sm" onClick={()=>d({type:"MODAL",modal:"addRecord",preselect:i.key})}>Log ✓</Btn></div></div>
        <div className="h-1.5 bg-[var(--bg)] rounded-full overflow-hidden mb-2"><div className={`h-full rounded-full ${bc}`} style={{width:`${Math.min(st.pct,100)}%`}}/></div>
        <div className="flex justify-between text-xs text-[var(--t3)]"><span>Last: {st.lastDate||"Never"}{st.lastMi!=null?` @ ${st.lastMi.toLocaleString()} mi`:""}</span><div className="text-right">{st.miRemain!=null&&<span className={st.miRemain<0?"text-[var(--red)] font-semibold":""}>{st.miRemain<0?Math.abs(st.miRemain).toLocaleString()+" mi overdue":st.miRemain.toLocaleString()+" mi remaining"}</span>}{estDate&&st.miRemain>0&&<span className="text-[var(--t4)] ml-2">~{estDate}</span>}</div></div>
        {i.note&&<p className="text-[var(--t3)] text-xs mt-2 leading-relaxed italic">{i.note}</p>}
      </Card>;})}</div>
  </div>;
}

function DiagList({v,s,d}){
  const[filter,setFilter]=useState("active");const[search,setSearch]=useState("");
  const all=s.codes.filter(c=>c.vehicleId===v.id);
  const filtered=(filter==="all"?all:all.filter(c=>c.status===filter)).filter(c=>{if(!search)return true;const q=search.toLowerCase();const db=CODE_DB[c.code];return c.code.toLowerCase().includes(q)||(db&&db.name.toLowerCase().includes(q));});
  return <div><div className="flex items-center justify-between mb-6"><div><h2 className="text-lg font-bold">Diagnostic Codes</h2><p className="text-[var(--t3)] text-sm">Click any code for details and repair guide</p></div><Btn sz="sm" onClick={()=>d({type:"MODAL",modal:"addCode"})}>+ Add Code</Btn></div>
    <div className="flex gap-3 mb-6 items-center"><div className="flex gap-1">{[["active","Active"],["resolved","Resolved"],["all","All"]].map(([val,lab])=><button key={val} onClick={()=>setFilter(val)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer ${filter===val?"bg-[var(--bg4)] text-[var(--t1)] border border-[var(--bdr2)]":"text-[var(--t3)]"}`}>{lab}</button>)}</div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="bg-[var(--bg)] border border-[var(--bdr)] rounded-lg px-3 py-1.5 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:border-[var(--amber)] w-40 font-mono"/></div>
    <div className="space-y-2">{filtered.map(c=>{const db=CODE_DB[c.code]||{};return <Card key={c.id} cls="p-4" onClick={()=>d({type:"CODE_DETAIL",code:c.code})}><div className="flex items-center gap-4"><div className="w-16 shrink-0 text-center"><span className="font-bold text-[var(--amber)] text-sm font-mono">{c.code}</span><span className={`text-[10px] block uppercase ${c.type==="confirmed"?"text-[var(--red)]":"text-[var(--t3)]"}`}>{c.type}</span></div><div className="flex-1 min-w-0"><p className="text-[var(--t2)] text-sm font-medium">{db.name||c.code}</p><p className="text-[var(--t3)] text-xs">{db.system||"—"}</p></div><div className="flex items-center gap-2"><Badge c={db.sev==="high"?"red":db.sev==="low"?"blue":"orange"}>{db.sev||"—"}</Badge><Badge c={c.status==="active"?"red":"green"}>{c.status}</Badge>{c.status==="active"&&<Btn v="success" sz="sm" onClick={e=>{e.stopPropagation();d({type:"RESOLVE",id:c.id});}}>✓</Btn>}<span className="text-[var(--t4)] ml-1">→</span></div></div></Card>;})}</div>
    <AddCodeModal open={s.modal==="addCode"} onClose={()=>d({type:"MODAL",modal:null})} vid={v.id} d={d}/>
  </div>;
}

function CodeDetail({code,v,s,d}){
  const db=CODE_DB[code];const entry=s.codes.find(c=>c.vehicleId===v.id&&c.code===code);
  if(!db)return <div className="fade"><button onClick={()=>d({type:"CODE_DETAIL",code:null})} className="text-[var(--t3)] hover:text-[var(--t1)] text-sm mb-6 block cursor-pointer">← All codes</button><p className="text-[var(--t2)] text-center py-16">No info for {code}.</p></div>;
  return <div className="fade max-w-4xl"><button onClick={()=>d({type:"CODE_DETAIL",code:null})} className="text-[var(--t3)] hover:text-[var(--t1)] text-sm mb-6 block cursor-pointer">← All codes</button>
    <div className="mb-8"><div className="flex items-center gap-3 mb-2"><span className="text-3xl font-black font-mono text-[var(--amber)]">{db.code}</span><Badge c={db.sev==="high"?"red":db.sev==="low"?"blue":"orange"}>{db.sev}</Badge>{entry&&<Badge c={entry.status==="active"?"red":"green"}>{entry.status}</Badge>}</div><h2 className="text-xl font-bold mb-1">{db.name}</h2><p className="text-[var(--t3)] text-sm">{db.system} · {v.year} {v.make} {v.model}</p></div>
    {db.description&&<Card cls="p-5 mb-4"><h3 className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-3">What This Means</h3><p className="text-[var(--t2)] text-sm leading-relaxed">{db.description}</p></Card>}
    {db.symptoms&&db.symptoms.length>0&&<Card cls="p-5 mb-4"><h3 className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Symptoms</h3>{db.symptoms.map((s2,i)=><div key={i} className="flex items-start gap-2 py-1"><span className="text-[var(--orange)] text-xs mt-0.5">▸</span><span className="text-[var(--t2)] text-sm">{s2}</span></div>)}</Card>}
    {db.causes&&db.causes.length>0&&<Card cls="p-5 mb-4"><h3 className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Causes</h3>{db.causes.map((c2,i)=><div key={i} className="flex items-start gap-2 py-1"><span className="text-[var(--cyan)] text-xs mt-0.5">▸</span><span className="text-[var(--t2)] text-sm">{c2}</span></div>)}</Card>}
    {db.repair_guide&&<Card cls="p-5 mb-4 border-[var(--amber-d)]"><h3 className="text-xs font-bold text-[var(--amber)] uppercase tracking-wider mb-3">🔧 Repair Guide</h3><p className="text-[var(--t2)] text-sm leading-relaxed">{db.repair_guide}</p><div className="flex gap-4 mt-3 text-xs text-[var(--t3)]"><span>Difficulty: <strong className="text-[var(--t1)]">{db.est_difficulty}</strong></span><span>Cost: <strong className="text-[var(--amber)]">{db.est_cost}</strong></span></div>{db.guideKey&&GUIDE_DB[db.guideKey]&&<Btn v="secondary" sz="sm" cls="mt-3" onClick={()=>{d({type:"TAB",tab:"guides"});setTimeout(()=>d({type:"GUIDE_DETAIL",key:db.guideKey}),50);}}>📖 Full Step-by-Step Guide</Btn>}</Card>}
    {db.parts&&db.parts.length>0&&<Card cls="p-5 mb-4"><h3 className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Parts</h3>{db.parts.map((p2,i)=><div key={i} className="flex justify-between py-2 border-b border-[var(--bdr)] last:border-0"><div><span className="text-sm">{p2.name}</span><span className="text-[var(--t3)] text-xs ml-2 font-mono">#{p2.partNum}</span></div><span className="text-[var(--amber)] font-bold text-sm font-mono">{p2.cost}</span></div>)}</Card>}
    {db.related_codes&&db.related_codes.length>0&&<Card cls="p-5"><h3 className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Related Codes</h3><div className="flex flex-wrap gap-2">{db.related_codes.map(rc=>{const present=s.codes.some(c2=>c2.vehicleId===v.id&&c2.code===rc&&c2.status==="active");return <button key={rc} onClick={()=>CODE_DB[rc]&&d({type:"CODE_DETAIL",code:rc})} className={`px-3 py-1.5 rounded-lg border text-sm font-mono cursor-pointer ${present?"bg-[var(--red-d)] border-[rgba(239,68,68,.2)] text-[var(--red)]":"bg-[var(--bg3)] border-[var(--bdr)] text-[var(--t3)]"}`}>{rc}{present?" ●":""}</button>;})}</div></Card>}
  </div>;
}

function AddCodeModal({open,onClose,vid,d}){
  const[search,setSearch]=useState("");const[sel,setSel]=useState(null);const[f,sf]=useState({scanDate:new Date().toISOString().split("T")[0],mileage:"",type:"confirmed"});
  const results=search.length>=2?Object.keys(CODE_DB).filter(c=>{const db=CODE_DB[c];return c.toLowerCase().includes(search.toLowerCase())||db.name.toLowerCase().includes(search.toLowerCase());}).slice(0,6):[];
  return <Modal open={open} onClose={()=>{onClose();setSel(null);setSearch("");}} title="Add Diagnostic Code" wide><div className="space-y-4">{!sel?<><Input label="Search Codes" value={search} onChange={setSearch} ph="Code (P0100) or keyword (MAF)..." mono/>{results.map(c=><button key={c} onClick={()=>setSel(c)} className="w-full text-left p-3 rounded-lg bg-[var(--bg)] border border-[var(--bdr)] hover:border-[var(--bdr2)] mb-1 cursor-pointer"><span className="font-bold text-[var(--amber)] font-mono text-sm">{c}</span><span className="text-[var(--t2)] text-sm ml-3">{CODE_DB[c].name}</span></button>)}</>:<div className="fade"><div className="flex items-center gap-2 mb-4"><span className="text-xl font-black font-mono text-[var(--amber)]">{sel}</span><span className="text-[var(--t2)] text-sm">{CODE_DB[sel]?.name}</span><button onClick={()=>setSel(null)} className="ml-auto text-[var(--t3)] text-xs cursor-pointer">Change</button></div><div className="grid grid-cols-3 gap-3"><Input label="Scan Date" value={f.scanDate} onChange={v=>sf(p=>({...p,scanDate:v}))} type="date"/><Input label="Mileage" value={f.mileage} onChange={v=>sf(p=>({...p,mileage:v}))} type="number" ph="64716"/><Sel label="Type" value={f.type} onChange={v=>sf(p=>({...p,type:v}))} opts={["confirmed","pending","stored","permanent"]}/></div><div className="flex gap-3 pt-4"><Btn v="secondary" onClick={()=>{onClose();setSel(null);setSearch("");}}>Cancel</Btn><Btn onClick={()=>{d({type:"ADD_CODE",c:{vehicleId:vid,code:sel,scanDate:f.scanDate,mileage:f.mileage?parseInt(f.mileage):null,type:f.type,status:"active"}});setSel(null);setSearch("");}}>Add</Btn></div></div>}</div></Modal>;
}

function ServiceLog({v,s,d}){
  const recs=s.records.filter(r=>r.vehicleId===v.id);const tot=recs.reduce((a,r)=>a+r.total,0);
  const ints=INTERVAL_DEFS[v.id]||[];
  return <div><div className="flex items-center justify-between mb-6"><div><h2 className="text-lg font-bold">Service Log</h2><p className="text-[var(--t3)] text-sm">{recs.length} records · ${tot.toFixed(2)} total parts</p></div><Btn sz="sm" onClick={()=>d({type:"MODAL",modal:"addRecord"})}>+ Log Service</Btn></div>
    {recs.map(r=>{const linkedInt=ints.find(i=>i.key===r.intervalKey);const guide=linkedInt?.guideKey?GUIDE_DB[linkedInt.guideKey]:null;return <Card key={r.id} cls="p-5 mb-4"><div className="flex justify-between mb-2"><div><h4 className="font-bold">{r.service}{linkedInt&&<Badge c="green" cls="ml-2">Tracked</Badge>}{!linkedInt&&!r.intervalKey&&<Badge c="gray" cls="ml-2">Custom</Badge>}</h4><p className="text-[var(--t3)] text-xs">{r.date} · {r.mileage?.toLocaleString()} mi · DIY</p></div><div className="text-right"><span className="text-[var(--amber)] font-bold font-mono">${r.total.toFixed(2)}</span><span className="text-[var(--t3)] text-xs block">parts</span></div></div>
      {r.notes&&<p className="text-[var(--t2)] text-sm mb-3 leading-relaxed">{r.notes}</p>}
      {guide&&<div className="bg-[var(--bg)] rounded-lg p-3 mb-3 border border-[var(--cyan-d)]"><div className="flex items-center justify-between"><span className="text-xs font-bold text-[var(--cyan)] uppercase tracking-wider">📖 Guide Available</span><button onClick={()=>{d({type:"TAB",tab:"guides"});setTimeout(()=>d({type:"GUIDE_DETAIL",key:linkedInt.guideKey}),50);}} className="text-[var(--cyan)] text-xs hover:underline cursor-pointer">View full walkthrough →</button></div></div>}
      {r.parts.length>0&&<div className="bg-[var(--bg)] rounded-lg p-3"><p className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-2">Parts</p>{r.parts.map((p2,i)=><div key={i} className="flex justify-between py-1.5 border-b border-[var(--bdr)] last:border-0"><div><span className="text-[var(--t2)] text-sm">{p2.name}</span>{p2.pn&&<span className="text-[var(--t3)] text-xs ml-2 font-mono">#{p2.pn}</span>}</div><span className="font-mono text-sm">${p2.cost.toFixed(2)}</span></div>)}</div>}
    </Card>;})}
  </div>;
}

function AddRecordModal({open,onClose,vid,d,preselect}){
  const ints=INTERVAL_DEFS[vid]||[];
  const[selKey,setSelKey]=useState(preselect||"");
  const[f,sf]=useState({date:new Date().toISOString().split("T")[0],mileage:"",notes:""});
  const[parts,setParts]=useState([{name:"",pn:"",cost:""}]);
  const[customMode,setCustomMode]=useState(false);
  const[customService,setCustomService]=useState("");

  const selInt=ints.find(i=>i.key===selKey);
  const guide=selInt?.guideKey?GUIDE_DB[selInt.guideKey]:null;

  const loadGuideParts=()=>{
    if(guide?.parts?.length){setParts(guide.parts.map(p=>({name:p.name,pn:p.pn||"",cost:String(p.cost||"")})));}
  };

  useEffect(()=>{if(preselect&&preselect!==selKey)setSelKey(preselect);},[preselect]);

  const serviceName=customMode?customService:selInt?.name||"";
  const intervalKey=customMode?null:selKey;

  const save=()=>{
    if(!serviceName||!f.date)return;
    const cp=parts.filter(p2=>p2.name).map(p2=>({...p2,cost:parseFloat(p2.cost)||0}));
    d({type:"ADD_RECORD",r:{vehicleId:vid,intervalKey,service:serviceName,...f,mileage:f.mileage?parseInt(f.mileage):null,parts:cp,total:cp.reduce((a,p2)=>a+p2.cost,0)}});
    setSelKey("");sf({date:new Date().toISOString().split("T")[0],mileage:"",notes:""});setParts([{name:"",pn:"",cost:""}]);setCustomMode(false);setCustomService("");
  };

  return <Modal open={open} onClose={()=>{onClose();setSelKey("");setCustomMode(false);}} title="Log Service" wide><div className="space-y-4">
    {!customMode?<div>
      <span className="block text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-1.5">Service Item*</span>
      <div className="grid grid-cols-1 gap-1.5 max-h-[240px] overflow-y-auto scr pr-1">
        {ints.map(i=>{const st=calcInterval(i,INIT.vehicle.mileage,INIT.records);return <button key={i.key} onClick={()=>setSelKey(i.key)} className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${selKey===i.key?"border-[var(--amber)] bg-[var(--amber-d)]":"border-[var(--bdr)] bg-[var(--bg)] hover:border-[var(--bdr2)]"}`}>
          <div className="flex items-center gap-2.5">
            <span className={`text-sm font-medium ${selKey===i.key?"text-[var(--amber)]":"text-[var(--t1)]"}`}>{i.name}</span>
            {i.guideKey&&<span className="text-[var(--cyan)] text-[10px]">📖</span>}
          </div>
          <StatusBadge status={st.status}/>
        </button>;})}
      </div>
      <button onClick={()=>setCustomMode(true)} className="mt-2 text-[var(--t3)] text-xs hover:text-[var(--amber)] cursor-pointer">+ Custom service not in list</button>
    </div>:<div>
      <div className="flex items-center justify-between mb-1.5"><span className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider">Custom Service</span><button onClick={()=>setCustomMode(false)} className="text-[var(--t3)] text-xs hover:text-[var(--amber)] cursor-pointer">← Back to list</button></div>
      <Input value={customService} onChange={setCustomService} ph="Describe the service..."/>
    </div>}

    {selKey&&guide&&<div className="bg-[var(--cyan-d)] border border-[rgba(6,182,212,.2)] rounded-lg p-3 flex items-center justify-between">
      <span className="text-[var(--cyan)] text-xs font-bold">📖 {guide.title} guide available</span>
      <Btn v="ghost" sz="sm" onClick={loadGuideParts}>Auto-fill parts from guide</Btn>
    </div>}

    <div className="grid grid-cols-2 gap-3">
      <Input label="Date*" value={f.date} onChange={v=>sf(p=>({...p,date:v}))} type="date"/>
      <Input label="Mileage" value={f.mileage} onChange={v=>sf(p=>({...p,mileage:v}))} type="number" ph="64716"/>
    </div>

    <TextArea label="Notes" value={f.notes} onChange={v=>sf(p=>({...p,notes:v}))} ph="Observations, torque specs used, tips..." rows={3}/>

    <div><div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider">Parts Used</span><Btn v="ghost" sz="sm" onClick={()=>setParts(p=>[...p,{name:"",pn:"",cost:""}])}>+ Part</Btn></div>
      {parts.map((p2,i)=><div key={i} className="flex gap-2 items-end mb-2"><Input label={i===0?"Name":""} value={p2.name} onChange={v=>setParts(pr=>pr.map((x,j)=>j===i?{...x,name:v}:x))} ph="Part" cls="flex-1"/><Input label={i===0?"PN":""} value={p2.pn} onChange={v=>setParts(pr=>pr.map((x,j)=>j===i?{...x,pn:v}:x))} ph="#" cls="w-28" mono/><Input label={i===0?"$":""} value={p2.cost} onChange={v=>setParts(pr=>pr.map((x,j)=>j===i?{...x,cost:v}:x))} type="number" ph="0" cls="w-20"/>{parts.length>1&&<button onClick={()=>setParts(pr=>pr.filter((_,j)=>j!==i))} className="text-[var(--t3)] hover:text-[var(--red)] text-lg pb-2.5 cursor-pointer">×</button>}</div>)}
    </div>

    <div className="flex gap-3 pt-2"><Btn v="secondary" onClick={()=>{onClose();setSelKey("");setCustomMode(false);}}>Cancel</Btn><Btn onClick={save} dis={!serviceName||!f.date}>Log Service</Btn></div>
  </div></Modal>;
}

function GuideList({v,s,d}){
  const guides=Object.values(GUIDE_DB).filter(g=>g.vehicle.includes(v.make));
  // Also show placeholder guides for intervals without full guides
  const ints=INTERVAL_DEFS[v.id]||[];const withoutGuide=ints.filter(i=>!i.guideKey);
  const dc={Beginner:"green",Intermediate:"orange",Advanced:"red"};
  return <div><h2 className="text-lg font-bold mb-1">How-To Guides</h2><p className="text-[var(--t3)] text-sm mb-6">{v.year} {v.make} {v.model}</p>
    {guides.length>0&&<div className="space-y-3 mb-8">{guides.map(g=>{const active=g.relatedCodes?.some(rc=>s.codes.some(c=>c.vehicleId===v.id&&c.code===rc&&c.status==="active"));return <Card key={g.title} cls="p-4" onClick={()=>d({type:"GUIDE_DETAIL",key:Object.keys(GUIDE_DB).find(k=>GUIDE_DB[k]===g)})}><div className="flex items-start gap-4"><div className="w-10 h-10 rounded-lg bg-[var(--bg3)] flex items-center justify-center text-lg shrink-0">📖</div><div className="flex-1"><div className="flex items-center gap-2"><p className="font-semibold text-sm">{g.title}</p>{active&&<Badge c="red">FIX CODE</Badge>}</div><p className="text-[var(--t3)] text-xs mt-1">{g.overview.slice(0,120)}...</p><div className="flex gap-3 mt-2 text-xs text-[var(--t3)]"><span>{g.time}</span><span>·</span><span>{g.parts.length} parts</span><span>·</span><span>{g.steps.length} steps</span></div></div><Badge c={dc[g.difficulty]}>{g.difficulty}</Badge></div></Card>;})}</div>}
    {withoutGuide.length>0&&<><h3 className="text-sm font-bold text-[var(--t3)] uppercase tracking-wider mb-3">More Services (guides coming)</h3><div className="space-y-2">{withoutGuide.map(i=><Card key={i.key} cls="p-3 opacity-60"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[var(--bg3)] flex items-center justify-center text-sm shrink-0">🔧</div><span className="text-[var(--t2)] text-sm">{i.name}</span><span className="text-[var(--t3)] text-xs ml-auto">Every {i.miInt.toLocaleString()} mi</span></div></Card>)}</div></>}
  </div>;
}

function GuideDetailPage({gk,v,s,d}){
  const g=GUIDE_DB[gk];
  if(!g)return <div className="fade"><button onClick={()=>d({type:"GUIDE_DETAIL",key:null})} className="text-[var(--t3)] hover:text-[var(--t1)] text-sm mb-6 block cursor-pointer">← All guides</button><p className="text-center py-16 text-[var(--t2)]">Guide not found.</p></div>;
  const dc={Beginner:"green",Intermediate:"orange",Advanced:"red"};
  const relatedRecords=s.records.filter(r=>r.vehicleId===v.id&&r.service.toLowerCase().includes(g.title.toLowerCase().slice(0,10)));
  const completedSteps=s.guideProgress[gk]||[];
  const pct=g.steps.length?Math.round(completedSteps.length/g.steps.length*100):0;
  // Match torque specs to steps based on keyword overlap
  const findTorqueForStep=(stepText)=>{
    const t=stepText.toLowerCase();
    return TORQUE_SPECS.filter(ts=>{
      const f=ts.fastener.toLowerCase();
      const keywords=f.split(/[\s\/]+/).filter(w=>w.length>3);
      return keywords.some(k=>t.includes(k))||
        (t.includes("drain plug")&&f.includes("drain plug"))||
        (t.includes("fill plug")&&f.includes("fill plug"))||
        (t.includes("pan bolt")&&f.includes("pan bolt"))||
        (t.includes("spark")&&f.includes("spark"))||
        (t.includes("filter")&&t.includes("cap")&&f.includes("filter"))||
        (t.includes("lug")&&f.includes("lug"))||
        (t.includes("coil")&&f.includes("coil"))||
        (t.includes("belly pan")&&f.includes("belly"));
    });
  };
  return <div className="fade max-w-4xl"><button onClick={()=>d({type:"GUIDE_DETAIL",key:null})} className="text-[var(--t3)] hover:text-[var(--t1)] text-sm mb-6 block cursor-pointer">← All guides</button>
    <div className="mb-8"><div className="flex items-center gap-3 mb-2"><h2 className="text-2xl font-black">{g.title}</h2><Badge c={dc[g.difficulty]}>{g.difficulty}</Badge></div><p className="text-[var(--t2)] text-sm">{g.vehicle} · {g.time}</p></div>
    <Card cls="p-5 mb-4"><p className="text-[var(--t2)] text-sm leading-relaxed">{g.overview}</p></Card>
    {g.relatedCodes&&g.relatedCodes.length>0&&s.codes.some(c=>c.vehicleId===v.id&&g.relatedCodes.includes(c.code)&&c.status==="active")&&<div className="rounded-xl border border-[rgba(239,68,68,.15)] bg-[var(--red-d)] p-4 mb-4"><span className="text-[var(--red)] text-xs font-bold uppercase tracking-wider">⚡ Addresses active codes: </span>{g.relatedCodes.filter(rc=>s.codes.some(c=>c.vehicleId===v.id&&c.code===rc&&c.status==="active")).map(rc=><span key={rc} className="text-[var(--amber)] font-mono font-bold ml-2">{rc}</span>)}</div>}
    {g.specs&&<Card cls="p-5 mb-4"><h3 className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Specifications</h3>{Object.entries(g.specs).map(([k,val])=><div key={k} className="flex justify-between py-1.5 border-b border-[var(--bdr)] last:border-0"><span className="text-[var(--t3)] text-sm capitalize">{k.replace(/([A-Z])/g,' $1')}</span><span className="text-[var(--t1)] text-sm font-mono">{val}</span></div>)}</Card>}
    <Card cls="p-5 mb-4"><h3 className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Parts Needed</h3>{g.parts.map((p2,i)=><div key={i} className="py-2 border-b border-[var(--bdr)] last:border-0"><div className="flex justify-between"><span className="text-sm font-medium">{p2.name}</span><span className="text-[var(--amber)] font-bold font-mono text-sm">${p2.cost.toFixed(2)}</span></div><div className="flex gap-3 mt-0.5 text-xs text-[var(--t3)]"><span className="font-mono">#{p2.pn}</span>{p2.notes&&<span>{p2.notes}</span>}</div></div>)}<div className="flex justify-between pt-3 mt-1 text-sm"><span className="font-semibold text-[var(--t2)]">Total Parts Cost</span><span className="font-bold text-[var(--amber)] font-mono">${g.parts.reduce((a,p2)=>a+p2.cost,0).toFixed(2)}</span></div></Card>
    <Card cls="p-5 mb-4"><h3 className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Tools Required</h3><div className="flex flex-wrap gap-2">{g.tools.map((t,i)=><span key={i} className="text-xs bg-[var(--bg)] border border-[var(--bdr)] rounded-lg px-3 py-1.5 text-[var(--t2)]">{t}</span>)}</div></Card>
    <Card cls="p-5 mb-4 border-[var(--amber-d)]"><div className="flex items-center justify-between mb-3"><h3 className="text-xs font-bold text-[var(--amber)] uppercase tracking-wider">🔧 Step-by-Step Walkthrough</h3><div className="flex items-center gap-2"><span className="text-[var(--t3)] text-xs">{completedSteps.length}/{g.steps.length}</span><div className="w-20 h-1.5 bg-[var(--bg)] rounded-full overflow-hidden"><div className="h-full rounded-full bg-[var(--amber)]" style={{width:`${pct}%`}}/></div><span className="text-[var(--amber)] text-xs font-bold font-mono">{pct}%</span></div></div><div className="space-y-1">{g.steps.map((st,i)=>{const done=completedSteps.includes(st.n||i+1);return <div key={i} className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-all ${done?"bg-[var(--green-d)] border border-[rgba(34,197,94,.15)]":"hover:bg-[var(--bg)]"}`} onClick={()=>d({type:"GUIDE_STEP",guideKey:gk,step:st.n||i+1})}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${done?"bg-[var(--green)] text-[var(--bg)]":"bg-[var(--amber-d)]"}`}>{done?<span className="text-sm font-bold">✓</span>:<span className="text-[var(--amber)] font-bold font-mono text-sm">{st.n||i+1}</span>}</div>
        <div className={`flex-1 ${done?"opacity-60":""}`}><h4 className={`font-semibold text-sm mb-1 ${done?"line-through":""}`}>{st.title}</h4><p className="text-[var(--t2)] text-sm leading-relaxed">{st.d}</p>
          {(()=>{const ts=findTorqueForStep((st.title+" "+st.d));return ts.length>0?<div className="flex flex-wrap gap-1.5 mt-2">{ts.map((t,j)=><span key={j} className="inline-flex items-center gap-1 text-[10px] bg-[var(--amber-d)] border border-[rgba(240,168,50,.15)] text-[var(--amber)] rounded px-2 py-0.5 font-mono font-bold">🔧 {t.fastener}: {t.spec} ({t.tool})</span>)}</div>:null;})()}</div>
      </div>})}</div></Card>
    {g.tips&&g.tips.length>0&&<Card cls="p-5 mb-4"><h3 className="text-xs font-bold text-[var(--cyan)] uppercase tracking-wider mb-3">💡 Tips & Notes</h3>{g.tips.map((t,i)=><div key={i} className="flex items-start gap-2 py-2 border-b border-[var(--bdr)] last:border-0"><span className="text-[var(--cyan)] text-sm shrink-0">•</span><p className="text-[var(--t2)] text-sm leading-relaxed">{t}</p></div>)}</Card>}
    {relatedRecords.length>0&&<Card cls="p-5"><h3 className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Your Service History</h3>{relatedRecords.map((r,i)=><div key={i} className="flex justify-between py-2 border-b border-[var(--bdr)] last:border-0"><div><span className="text-sm">{r.date}</span><span className="text-[var(--t3)] text-xs ml-2">{r.mileage?.toLocaleString()} mi</span></div><span className="text-[var(--green)] font-bold font-mono text-sm">${r.total.toFixed(2)}</span></div>)}</Card>}
  </div>;
}

function Specs({v}){
  const[tsSearch,setTsSearch]=useState("");
  const rows=[["Nickname",v.nickname],["Year / Make / Model",`${v.year} ${v.make} ${v.model}`],["Trim",v.trim],["VIN",v.vin],["Engine",v.engine],["HP / Torque",`${v.hp} hp / ${v.torque}`],["Transmission",v.transmission],["Drivetrain",v.drivetrain],["Oil Spec",v.oil_spec],["Oil Capacity",v.oil_capacity],["Coolant",v.coolant],["Brake Fluid",v.brake_fluid||"—"],["Steering",v.steering||"—"],["Tire Size",v.tire_size],["Lug Torque",v.lug_torque||"120 Nm"],["Assembly",v.assembly],["Odometer",v.mileage?v.mileage.toLocaleString()+" mi":"—"]];
  const filteredTS=TORQUE_SPECS.filter(t=>!tsSearch||t.fastener.toLowerCase().includes(tsSearch.toLowerCase())||t.tool.toLowerCase().includes(tsSearch.toLowerCase()));
  return <div className="max-w-4xl"><h2 className="text-2xl font-black mb-1" style={{fontFamily:"var(--fd)"}}>{v.nickname||v.model}</h2><p className="text-[var(--t2)] mb-6">{v.year} {v.make} {v.model} {v.trim}</p>
    {v.history&&<Card cls="p-5 mb-6 border-[var(--amber-d)]"><h3 className="text-xs font-bold text-[var(--amber)] uppercase tracking-wider mb-3">🏁 About This Vehicle</h3><p className="text-[var(--t2)] text-sm leading-relaxed whitespace-pre-line">{v.history}</p></Card>}
    <Card cls="overflow-hidden mb-6">{rows.map(([k,val],i)=><div key={k} className={`flex justify-between px-5 py-3 ${i%2===0?"bg-[var(--bg4)]":"bg-[var(--bg3)]"} border-b border-[var(--bdr)] last:border-0`}><span className="text-[var(--t2)] text-sm">{k}</span><span className={`text-sm font-medium ${k==="VIN"?"font-mono text-[var(--t2)]":"text-[var(--t1)]"}`}>{val||"—"}</span></div>)}</Card>
    <h3 className="text-lg font-bold mb-3">🔧 Torque Specs Quick Reference</h3>
    <input value={tsSearch} onChange={e=>setTsSearch(e.target.value)} placeholder="Search fastener or tool..." className="w-full bg-[var(--bg)] border border-[var(--bdr)] rounded-lg px-3 py-2.5 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:border-[var(--amber)] mb-3 font-mono"/>
    <Card cls="overflow-hidden">
      <div className="grid grid-cols-[1fr_120px_80px_1fr] gap-0 text-xs font-bold text-[var(--t3)] uppercase tracking-wider px-4 py-2.5 bg-[var(--bg3)] border-b border-[var(--bdr)]"><span>Fastener</span><span>Torque</span><span>Tool</span><span>Note</span></div>
      {filteredTS.map((t,i)=><div key={i} className={`grid grid-cols-[1fr_120px_80px_1fr] gap-0 px-4 py-2.5 text-sm border-b border-[var(--bdr)] last:border-0 ${i%2===0?"bg-[var(--bg4)]":"bg-[var(--bg3)]"}`}><span className="text-[var(--t1)] font-medium">{t.fastener}</span><span className="text-[var(--amber)] font-bold font-mono">{t.spec}</span><span className="text-[var(--t2)] font-mono text-xs">{t.tool}</span><span className="text-[var(--t3)] text-xs">{t.note}</span></div>)}
    </Card>
  </div>;
}

/* ─── MECHANIC AI ─── */

function buildSystemPrompt(v, s) {
  if (!v) return "You are a helpful automotive assistant. The user hasn't selected a vehicle yet.";
  const codes = s.codes.filter(c => c.vehicleId === v.id && c.status === "active");
  const confirmed = codes.filter(c => c.type === "confirmed");
  const stored = codes.filter(c => c.type === "stored");
  const recs = s.records.filter(r => r.vehicleId === v.id);
  const ints = INTERVAL_DEFS[v.id] || [];
  const intervalSummary = ints.map(i => {
    const st = calcInterval(i, v.mileage, recs);
    return `- ${i.name}: ${st.status.toUpperCase()}${st.lastDate ? ` (last: ${st.lastDate} @ ${st.lastMi?.toLocaleString()} mi)` : " (never performed)"}${st.miRemain != null ? `, ${st.miRemain < 0 ? Math.abs(st.miRemain).toLocaleString() + " mi overdue" : st.miRemain.toLocaleString() + " mi remaining"}` : ""}`;
  }).join("\n");
  const codeSummary = confirmed.map(c => {
    const db = CODE_DB[c.code] || {};
    return `- ${c.code}: ${db.name || "Unknown"} [${db.sev || "?"}] — ${(db.repair_guide || "No guide").slice(0, 150)}`;
  }).join("\n");
  const storedSummary = stored.map(c => `- ${c.code}: ${(CODE_DB[c.code]||{}).name || "Unknown"}`).join("\n");
  const serviceSummary = recs.slice(0, 5).map(r =>
    `- ${r.date} @ ${r.mileage?.toLocaleString()} mi: ${r.service} ($${r.total.toFixed(2)})${r.notes ? " — " + r.notes.slice(0, 80) : ""}`
  ).join("\n");

  return `You are MechanicAI, an expert automotive diagnostic and maintenance assistant embedded in GarageIQ. You have been trained on the complete "2017 Audi Q5 2.0T quattro Ownership Bible" and use it as your primary reference.

VEHICLE: ${v.year} ${v.make} ${v.model} ${v.trim} "${v.nickname||v.model}"
Engine: ${v.engine} | ${v.drivetrain} | ${v.transmission}
VIN: ${v.vin} | Odometer: ${v.mileage ? v.mileage.toLocaleString() + " mi" : "Unknown"}
Oil: ${v.oil_spec}, ${v.oil_capacity} | Coolant: ${v.coolant}

ACTIVE CONFIRMED CODES (${confirmed.length}):
${codeSummary || "None"}

STORED CODES (${stored.length}):
${storedSummary || "None"}

SERVICE INTERVALS:
${intervalSummary}

RECENT SERVICE:
${serviceSummary || "None"}

KEY BIBLE KNOWLEDGE FOR THIS VEHICLE:
- AWD is Torsen-based (crown gear center diff), NOT Haldex. No Haldex coupling to service.
- Oil capacity is 4.5L (4.8 qt) per Audi official fluid chart (CPMB engine). Drain plug torque 25 Nm into aluminum — most common DIY mistake is over-torquing.
- Oil filter is Mann HU 719/6x (OEM 06J115403Q). FCP Euro lifetime warranty.
- Spark plugs are NGK PFR7S8EG (OEM 06H905601A). Gap 0.028" stock, 0.024-0.026" if tuned.
- ZF 8HP transmission fluid service is the HIGHEST PRIORITY item right now. ZF recommends 50-75k despite Audi "lifetime" claim. Kit 0BK398009A. A complete 21-step DIY guide is available in the app's Guides section covering every detail from parts sourcing through adaptation reset.
- Water pump plastic impeller WILL fail (50-100k range). Revised metal impeller 06L121111H. Proactive replacement by 80k recommended.
- PCV valve diaphragm tears 50-100k. Causes whistling, CELs (P0171/P0507/P2187), oil consumption, rear main seal damage. RKXtech reinforced version $25-35.
- Upper control arm bushings are B8 platform Achilles heel. Wear begins 50-70k. Meyle HD kit. Must torque at ride height.
- Battery is ~9 years old — test immediately. B8 complex electronics cause parasitic drain.
- Recall 19N3/19N4 (coolant pump fire risk) and 20Z8 (fuel pump flange) must be verified complete.
- Transfer case fluid: use G 052 145 S2, NOT G 055 145 A2 (factory fill friction modifier accumulates).
- Carbon buildup is inevitable on direct injection. Fifth port injector helps but doesn't eliminate it. Borescope inspect, walnut blast if needed.
- Rear brake service requires scan tool "service mode" — pistons push straight in (not screw) on B8.
- FCP Euro lifetime replacement warranty on all consumables saves thousands over vehicle lifetime.

RULES:
- Reference the Ownership Bible's specific recommendations when answering.
- This is a DIY owner who wrenches. Give practical hands-on advice with part numbers, torque specs, tools.
- Be direct and concise. Skip generic disclaimers.
- Reference code cascade relationships. Many stored codes are downstream of primary ECM faults.
- Use the correct part numbers and specs from the Bible.
- When discussing priorities, follow the Bible's action plan: immediate (recalls, battery, sunroof drains), next service (trans fluid, diffs, plugs, brake fluid, coolant, belt, PCV), by 80k (water pump, PCV, control arms, walnut blast, catch can), by 100k (second trans service, timing chain monitoring).
- Format with **bold** for part numbers and emphasis. Keep paragraphs short.`;
}

function ChatPanel({ open, onClose, s }) {
  const v = s.vehicle;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);
  const inRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (open) setTimeout(() => inRef.current?.focus(), 300); }, [open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim(); setInput(""); setError(null);
    const next = [...messages, { role: "user", content: txt }];
    setMessages(next); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: buildSystemPrompt(v, s), messages: next.map(m => ({ role: m.role, content: m.content })) }),
      });
      if (!res.ok) throw new Error("API " + res.status);
      const data = await res.json();
      const reply = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
      setMessages(p => [...p, { role: "assistant", content: reply }]);
    } catch (err) { setError("Failed to respond. Try again."); } finally { setLoading(false); }
  };
  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const renderMd = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
      const proc = parts.map((p, j) => {
        if (p.startsWith("**") && p.endsWith("**")) return <strong key={j} className="text-[var(--t1)]">{p.slice(2, -2)}</strong>;
        if (p.startsWith("`") && p.endsWith("`")) return <code key={j} className="text-[var(--amber)] bg-[var(--bg)] px-1 py-0.5 rounded text-xs font-mono">{p.slice(1, -1)}</code>;
        return p;
      });
      return <span key={i}>{proc}{i < text.split("\n").length - 1 && <br />}</span>;
    });
  };

  const confirmed = s.codes.filter(c => v && c.vehicleId === v.id && c.status === "active" && c.type === "confirmed");
  const suggestions = v ? [
    confirmed.length > 0 ? "Which code should I fix first?" : null,
    "What maintenance is most urgent?",
    v.make === "Audi" ? "What should I watch for at this mileage on the EA888?" : "Common issues at this mileage?",
  ].filter(Boolean) : [];

  return <>
    {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />}
    <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[var(--bg2)] border-l border-[var(--bdr)] shadow-2xl flex flex-col" style={{ transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform .3s cubic-bezier(.4,0,.2,1)" }}>
      {/* Header */}
      <div className="border-b border-[var(--bdr)] px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-[var(--amber-d)] flex items-center justify-center"><span className="text-lg">🔧</span></div><div><h3 className="font-bold text-sm">MechanicAI</h3><p className="text-[var(--t3)] text-xs">{v ? `${v.nickname||v.model} · ${v.mileage?.toLocaleString()||"?"} mi` : "No vehicle"}</p></div></div>
        <div className="flex items-center gap-2">{messages.length > 0 && <button onClick={() => { setMessages([]); setError(null); }} className="text-[var(--t3)] text-xs cursor-pointer px-2 py-1 rounded hover:bg-[var(--bg3)]">Clear</button>}<button onClick={onClose} className="text-[var(--t3)] hover:text-[var(--t1)] text-xl cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg3)]">×</button></div>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scr">
        {messages.length === 0 && <div className="text-center py-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--amber-d)] flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🔧</span></div>
          <h4 className="font-bold mb-1">MechanicAI</h4>
          <p className="text-[var(--t3)] text-sm mb-6">{v ? `I know ${v.nickname||v.model}'s codes, service history, intervals, and specs. Ask me anything.` : "Select a vehicle to get started."}</p>
          {suggestions.map((sg, i) => <button key={i} onClick={() => setInput(sg)} className="block w-full text-left px-4 py-2.5 rounded-xl bg-[var(--bg4)] border border-[var(--bdr)] hover:border-[var(--bdr2)] text-[var(--t2)] text-sm cursor-pointer mb-2">{sg}</button>)}
        </div>}
        {messages.map((m, i) => <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-[var(--amber)] text-[var(--bg)] rounded-br-md" : "bg-[var(--bg4)] border border-[var(--bdr)] text-[var(--t2)] rounded-bl-md"}`}>{m.role === "assistant" ? renderMd(m.content) : m.content}</div></div>)}
        {loading && <div className="flex justify-start"><div className="bg-[var(--bg4)] border border-[var(--bdr)] rounded-2xl rounded-bl-md px-4 py-3"><div className="flex items-center gap-3"><div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--amber)] pulse"/><div className="w-2 h-2 rounded-full bg-[var(--amber)] pulse" style={{animationDelay:"300ms"}}/><div className="w-2 h-2 rounded-full bg-[var(--amber)] pulse" style={{animationDelay:"600ms"}}/></div><span className="text-[var(--t3)] text-xs font-medium">Diagnosing...</span></div></div></div>}
        {error && <div className="text-center"><p className="text-[var(--red)] text-xs">{error}</p></div>}
        <div ref={endRef}/>
      </div>
      {/* Input */}
      <div className="border-t border-[var(--bdr)] px-4 py-3 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea ref={inRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} placeholder={v ? `Ask about ${v.nickname||v.model}...` : "Select a vehicle..."} disabled={loading} rows={1} className="flex-1 bg-[var(--bg)] border border-[var(--bdr)] rounded-xl px-4 py-2.5 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:border-[var(--amber)] resize-none" style={{minHeight:"42px",maxHeight:"120px"}} onInput={e=>{e.target.style.height="42px";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}}/>
          <button onClick={send} disabled={!input.trim()||loading} className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${input.trim()&&!loading?"bg-[var(--amber)] text-[var(--bg)] cursor-pointer hover:brightness-110":"bg-[var(--bg3)] text-[var(--t3)] cursor-not-allowed"}`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
        </div>
        <p className="text-[var(--t4)] text-[10px] mt-2 text-center">Context-aware vehicle assistant · Not a substitute for professional diagnosis</p>
      </div>
    </div>
  </>;
}

export default function App(){
  const[s,d]=useReducer(reducer,INIT);
  const[chatOpen,setChatOpen]=useState(false);
  return <><style>{CSS}</style><div style={{fontFamily:"var(--fb)"}}>
    <Dash s={s} d={d}/>
    <button onClick={()=>setChatOpen(true)} className="fixed bottom-6 right-6 z-30 h-12 rounded-2xl bg-[var(--amber)] text-[var(--bg)] shadow-lg shadow-[rgba(240,168,50,.25)] hover:brightness-110 hover:scale-[1.03] transition-all cursor-pointer flex items-center gap-2.5 px-5 group"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span className="font-bold text-sm tracking-tight" style={{fontFamily:"var(--fm)"}}>MechanicAI</span></button>
    <ChatPanel open={chatOpen} onClose={()=>setChatOpen(false)} s={s}/>
  </div></>;
}
