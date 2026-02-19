import { useState, useReducer, useEffect, useRef } from "react";

const CSS = `
:root{
  --bg:#0d1117;--bg2:#161b22;--bg3:#1c2128;--bg4:#21262d;--bg5:#282e36;
  --bdr:#30363d;--bdr2:#484f58;
  --t1:#e6edf3;--t2:#8b949e;--t3:#6e7681;--t4:#484f58;
  --amber:#f0a832;--amber-d:rgba(240,168,50,.1);
  --red:#ef4444;--red-d:rgba(239,68,68,.08);
  --green:#22c55e;--green-d:rgba(34,197,94,.08);
  --blue:#3b82f6;--blue-d:rgba(59,130,246,.08);
  --orange:#f97316;--orange-d:rgba(249,115,22,.08);
  --cyan:#06b6d4;--cyan-d:rgba(6,182,212,.08);
  --fd:'Instrument Serif',Georgia,serif;
  --fb:'DM Sans',system-ui,sans-serif;
  --fm:'JetBrains Mono',ui-monospace,monospace;
  /* Type scale */
  --fs-display:1.5rem;--fs-h1:1.25rem;--fs-h2:1rem;--fs-body:0.875rem;--fs-caption:0.8125rem;--fs-micro:0.6875rem;
  /* Spacing scale */
  --sp-xs:4px;--sp-sm:8px;--sp-md:16px;--sp-lg:24px;--sp-xl:32px;--sp-2xl:48px;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body,#root{background:var(--bg);color:var(--t1);font-family:var(--fb);-webkit-font-smoothing:antialiased;line-height:1.55;font-size:14px}
input,select,textarea,button{font-family:inherit}
::selection{background:var(--amber);color:var(--bg)}
.fade{animation:f .25s ease-out}@keyframes f{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
@keyframes p{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:p 2s ease-in-out infinite}
@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes ringFill{from{stroke-dashoffset:var(--ring-circ)}to{stroke-dashoffset:var(--ring-offset)}}
@keyframes barGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.stagger{animation:slideUp .4s cubic-bezier(.16,1,.3,1) both}
.stagger-1{animation-delay:.05s}.stagger-2{animation-delay:.1s}.stagger-3{animation-delay:.15s}.stagger-4{animation-delay:.2s}
.ring-animate{animation:ringFill 1.2s cubic-bezier(.16,1,.3,1) both;animation-delay:.3s}
.bar-segment{animation:barGrow .6s cubic-bezier(.16,1,.3,1) both;transform-origin:left}
.scr::-webkit-scrollbar{width:4px}.scr::-webkit-scrollbar-track{background:transparent}.scr::-webkit-scrollbar-thumb{background:var(--bg5);border-radius:2px}
a{color:inherit}
/* Mobile-first responsive utilities */
@media(max-width:639px){
  .hide-mobile{display:none!important}
  .stack-mobile{flex-direction:column!important}
  .full-mobile{width:100%!important;min-width:0!important}
}
@media(min-width:640px){.hide-desktop{display:none!important}}
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
    relatedCodes:["P0100"], dealerCost:185, youtube:"qCSbLVKdHGY",
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
    relatedCodes:["P0300","P0301","P0302","P0303","P0304"], dealerCost:280, youtube:"VHfgXq0_BwY",
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
    relatedCodes:["P0100","P0101","P0102","P0103"], dealerCost:350, youtube:"fkmFIAwW4ok", youtubeShort:true,
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
    relatedCodes:["2505"], dealerCost:950, youtube:"kXKhZievmSI",
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
      "MISTAKE #6: Paper towels near valve body. Lint = contaminated solenoids. Lint-free cloths ONLY. ZF is very specific about this.",
      "After first 500 mi, consider a second drain-and-fill (just drain plug, no pan removal). This gets you to ~80% fresh fluid instead of ~60%.",
    ],
  },
};

const CODE_DB = {
  P0100:{code:"P0100",name:"MAF Sensor Circuit Malfunction",system:"Engine / Intake",sev:"high",description:"The Mass Air Flow sensor (P/N 06J906461D on this engine) is sending an out-of-range signal to the ECM. This causes incorrect fuel metering, rough idle, power loss, and potential lean/rich conditions. On your 64k-mile EA888, the most common cause is oil film from PCV vapors coating the sensing element.",symptoms:["Rough or unstable idle","Reduced acceleration / turbo feels flat","Engine stalling, especially at low RPM","Higher than normal fuel consumption","Other codes appearing (P0171 lean, P0172 rich)"],causes:["Contaminated MAF element (PCV oil vapors — most likely at 64k)","Failed/cracked PCV diaphragm pushing oil mist upstream","Cracked intake tube (check post-MAF boots)","Corroded MAF connector pins","Failed MAF sensor (less common on OEM Bosch units)"],repair_guide:"Start with CRC MAF Cleaner ($10, 20 min). If it recurs, inspect PCV valve diaphragm — it's likely tearing at this mileage. Replace MAF only if cleaning doesn't resolve after PCV check.",est_difficulty:"Beginner",est_cost:"$10 clean / $95 replace",guideKey:"maf_clean_midnight",parts:[{name:"CRC MAF Cleaner",partNum:"05110",cost:"$9.99"},{name:"Bosch MAF Sensor (OEM)",partNum:"06J906461D",cost:"$95.00"}],related_codes:["P0101","P0102","P0103","P0171","P0172"]},
  P261A:{code:"P261A",name:"Coolant Pump B Control Circuit/Open",system:"Engine / Cooling",sev:"medium",description:"The auxiliary (electric) coolant pump circuit is open. On the B8/8R Q5, this is the secondary electric pump that circulates coolant after engine shutoff to prevent heat soak. Not the main mechanical water pump.",symptoms:["No immediate driveability impact","Turbo heat soak after shutdown (reduced turbo longevity)","Possible CEL"],causes:["Failed auxiliary coolant pump (electric motor)","Corroded connector/wiring to aux pump","Blown fuse for aux pump circuit","Failed ECM relay"],repair_guide:"Check fuse first. Then inspect connector at the auxiliary pump (located near the firewall, low on the engine). If pump doesn't spin when commanded, replace the pump. This is separate from the main water pump.",est_difficulty:"Beginner-Intermediate",est_cost:"$50-150",parts:[{name:"Auxiliary Coolant Pump",partNum:"Various",cost:"$50-150"}],related_codes:["P26B0"]},
  P1264:{code:"P1264",name:"Injector Cyl 2 Regulation Range",system:"Engine / Fuel",sev:"medium",description:"The fuel injector on cylinder 2 is operating outside normal correction range. On the EA888, this is typically a coding/adaptation issue rather than a hardware failure, especially if no driveability symptoms are present.",symptoms:["Usually no noticeable symptoms if stored/not confirmed","Possible rough idle on cylinder 2","Slight fuel trim deviation"],causes:["Normal injector wear requiring ECM adaptation reset","Injector coding mismatch after replacement","Carbon buildup on injector tip","Fuel quality issue (one-time event)"],repair_guide:"Clear code and drive. If it returns, perform injector adaptation reset with VCDS/OBDeleven. On the EA888, injector codes are often 'adaptation noise' rather than hardware failures.",est_difficulty:"Beginner",est_cost:"$0 (clear & monitor)",parts:[],related_codes:["P0201","P0202","P0203","P0204"]},
  P068A:{code:"P068A",name:"ECM Power Relay De-Energized Too Early",system:"Engine / Electrical",sev:"low",description:"The ECM detected its power relay shut off before the normal shutdown sequence completed. Common on VAG vehicles — usually caused by brief voltage dip during cranking or a battery nearing end of life.",symptoms:["Usually none — stored code only","Occasional longer crank time"],causes:["Aging battery (common at 7+ years)","Corroded battery terminals","Voltage dip during accessory load","Normal occurrence during jump-start or battery disconnect"],repair_guide:"Check battery health with load test. Clean terminals. If battery is original (2017), it's approaching replacement age regardless. Clear code and monitor — if it recurs frequently, replace battery proactively.",est_difficulty:"Beginner",est_cost:"$0-180",parts:[{name:"AGM Battery (if needed)",partNum:"Various",cost:"$180"}],related_codes:["U1113"]},
  U1113:{code:"U1113",name:"Function Limitation - Malfunction Value",system:"Network / Communication",sev:"low",description:"A control module received a malfunction value from another module on the CAN bus. This is almost always a downstream effect of another code — when the ECM has an issue (like P0100), it broadcasts a malfunction flag that other modules store as U1113.",symptoms:["None directly — this is a communication flag","Other systems may limit functions based on the reported malfunction"],causes:["Downstream effect of P0100 or other ECM code (most likely)","Momentary CAN bus communication error","ECM voltage issue (see P068A)"],repair_guide:"Fix the root cause code (P0100 in your case) and clear all codes. U1113 should not return once the primary issue is resolved. If it persists alone, check CAN bus wiring.",est_difficulty:"N/A",est_cost:"$0 (fix root cause)",parts:[],related_codes:["P0100","P068A"]},
  "2505":{code:"2505",name:"Torque Management Feedback Signal A",system:"Transmission Control",sev:"low",description:"The transmission control module received an unexpected torque management signal. On your vehicle, this is likely related to the P0100 (MAF) issue — incorrect air mass readings cause incorrect torque calculations, which the TCM flags.",symptoms:["Usually none — stored code","Possible momentary shift firmness variation"],causes:["Downstream of MAF issue (P0100) — incorrect torque calculation","Brief TCM-ECM communication mismatch","Normal occurrence during hard acceleration with traction intervention"],repair_guide:"Fix P0100 first. Clear all codes. This should resolve as a downstream effect. If it persists after MAF fix, may need TCM adaptation reset during ZF 8HP service.",est_difficulty:"N/A",est_cost:"$0",parts:[],related_codes:["P0100","U1113"]},
};

function calcInterval(def,mileage,records){
  if(!mileage)return{status:"unknown",pct:0};
  const recs=records.filter(r=>r.intervalKey===def.key).sort((a,b)=>b.mileage-a.mileage);
  const lastRec=recs[0];const lastMi=lastRec?.mileage||0;const lastDate=lastRec?.date||null;
  const miSince=mileage-lastMi;const pct=Math.round((miSince/def.miInt)*100);
  const miRemain=def.miInt-miSince;const nextDueMi=lastMi+def.miInt;
  let moSinceLast=null;if(lastDate){moSinceLast=Math.round((Date.now()-new Date(lastDate))/(86400000*30.44));}
  let status="ok";
  if(miRemain<0||(def.moInt&&moSinceLast&&moSinceLast>def.moInt))status="overdue";
  else if(pct>=80||(def.moInt&&moSinceLast&&moSinceLast>=def.moInt*0.8))status="due";
  else if(pct>=50)status="upcoming";
  return{status,pct,lastMi:lastMi||null,lastDate,miRemain,miSince,nextDueMi};
}

const INIT = {
  tab:"overview", subTab:"intervals",
  vehicle:{id:"v_midnight",nickname:"Midnight",year:2017,make:"Audi",model:"Q5",trim:"2.0T quattro Premium",vin:"WA1C2AFP9HA075605",engine:"EA888 Gen3 2.0L Turbo I4",hp:220,torque:"258 lb-ft",transmission:"ZF 8HP55 8-speed auto (0BK)",drivetrain:"quattro AWD",oil_spec:"VW 502 00 — 5W-40 Full Synthetic",oil_capacity:"4.5L (4.8 qt) w/ filter",coolant:"G13 (TL-VW 774 J)",brake_fluid:"DOT 4 (ATE TYP 200)",tire_size:"235/55R19",assembly:"Ingolstadt, Germany",mileage:64716,color:"Brilliant Black",interior:"Black Leather",images:[
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='400' viewBox='0 0 900 400'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23131920'/%3E%3Cstop offset='100%25' stop-color='%230d1117'/%3E%3C/linearGradient%3E%3ClinearGradient id='car' x1='0' y1='0' x2='1' y2='0'%3E%3Cstop offset='0%25' stop-color='%231a1a2e'/%3E%3Cstop offset='50%25' stop-color='%232d2d44'/%3E%3Cstop offset='100%25' stop-color='%231a1a2e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='900' height='400' fill='url(%23bg)'/%3E%3Crect x='120' y='160' width='660' height='140' rx='30' fill='url(%23car)'/%3E%3Crect x='200' y='120' width='400' height='100' rx='20' fill='%23222238'/%3E%3Ccircle cx='280' cy='300' r='45' fill='%23111' stroke='%23333' stroke-width='3'/%3E%3Ccircle cx='280' cy='300' r='20' fill='%23222'/%3E%3Ccircle cx='620' cy='300' r='45' fill='%23111' stroke='%23333' stroke-width='3'/%3E%3Ccircle cx='620' cy='300' r='20' fill='%23222'/%3E%3Crect x='610' y='170' width='140' height='12' rx='3' fill='%23f0a832' opacity='.8'/%3E%3Crect x='160' y='170' width='100' height='12' rx='3' fill='%23fff' opacity='.4'/%3E%3Ctext x='450' y='360' text-anchor='middle' fill='%236e7681' font-family='monospace' font-size='11'%3E2017 Audi Q5 2.0T quattro — Brilliant Black%3C/text%3E%3C/svg%3E",
  ]},
  codes:[
    {id:"dc1",vehicleId:"v_midnight",code:"P0100",type:"confirmed",status:"active",scanDate:"2026-02-17",mileage:64716},
    {id:"dc2",vehicleId:"v_midnight",code:"P261A",type:"stored",status:"active",scanDate:"2026-02-17",mileage:64716},
    {id:"dc3",vehicleId:"v_midnight",code:"P1264",type:"stored",status:"active",scanDate:"2026-02-17",mileage:64716},
    {id:"dc4",vehicleId:"v_midnight",code:"P068A",type:"stored",status:"active",scanDate:"2026-02-17",mileage:64716},
    {id:"dc5",vehicleId:"v_midnight",code:"U1113",type:"confirmed",status:"active",scanDate:"2026-02-17",mileage:64716},
    {id:"dc6",vehicleId:"v_midnight",code:"2505",type:"confirmed",status:"active",scanDate:"2026-02-17",mileage:64716},
  ],
  records:[
    {id:"sr1",vehicleId:"v_midnight",intervalKey:"oil",date:"2026-02-17",mileage:64716,service:"Oil & Filter Change",parts:[{name:"Liqui Moly 5W-40 (5L+1L)",pn:"2332+2331",cost:38},{name:"Mann HU 719/6x",pn:"HU719/6x",cost:8.99},{name:"Crush Washer M14",pn:"N0138157",cost:1.50}],notes:"Drained dark but clean. No metallic sheen. 4.5L refill with filter. Torqued drain plug 25 Nm, filter cap 25 Nm. Inspected undertray — all fasteners good. MMI service indicator reset + OBDeleven reset.",total:48.49},
    {id:"sr2",vehicleId:"v_midnight",intervalKey:"spark",date:"2026-02-17",mileage:64716,service:"Spark Plugs",parts:[{name:"NGK PFR7S8EG (x4)",pn:"PFR7S8EG",cost:48}],notes:"Gapped 0.028in, torqued 25 Nm. Normal wear. Oil seepage in plug wells — valve cover gasket seeping (common at this mileage on EA888). Coils cleaned, test fine per FIL advice. Dielectric grease on boot ribs.",total:48},
  ],
  mileageLog:[
    { vehicleId:"v_midnight", date:"2026-02-17", mileage:64716, note:"Scan + oil change + plugs" },
    { vehicleId:"v_midnight", date:"2025-08-20", mileage:60000, note:"Spark plugs" },
    { vehicleId:"v_midnight", date:"2025-06-01", mileage:55000, note:"Cabin air filter" },
    { vehicleId:"v_midnight", date:"2024-03-15", mileage:40000, note:"40k service" },
  ],
  modal:null, codeDetail:null, guideDetail:null, preselect:null, guideProgress:{}, editRecord:null,
};

function reducer(s,a){
  switch(a.type){
    case "TAB": return {...s,tab:a.tab,codeDetail:null,guideDetail:null};
    case "SUBTAB": return {...s,subTab:a.subTab};
    case "MODAL": return {...s,modal:a.modal,preselect:a.preselect||null};
    case "CODE_DETAIL": return {...s,codeDetail:a.code,guideDetail:null};
    case "GUIDE_DETAIL": return {...s,guideDetail:a.key,codeDetail:null};
    case "ADD_CODE": return {...s,codes:[...s.codes,{...a.c,id:"dc_"+Date.now()}],modal:null};
    case "RESOLVE": return {...s,codes:s.codes.map(c=>c.id===a.id?{...c,status:c.status==="active"?"resolved":"active"}:c)};
    case "ADD_RECORD": {
      const nr={...a.r,id:"sr_"+Date.now()};
      let vehicle=s.vehicle;
      if(a.r.mileage&&(!vehicle.mileage||a.r.mileage>vehicle.mileage)) vehicle={...vehicle,mileage:a.r.mileage};
      let ml=s.mileageLog;
      if(a.r.mileage) ml=[...ml,{vehicleId:"v_midnight",date:a.r.date,mileage:a.r.mileage,note:"Service: "+a.r.service}];
      return {...s,records:[nr,...s.records],vehicle,mileageLog:ml,modal:null,preselect:null};
    }
    case "EDIT_RECORD": {
      const updated=s.records.map(r=>r.id===a.id?{...r,...a.changes}:r);
      return {...s,records:updated,modal:null,editRecord:null};
    }
    case "DELETE_RECORD": return {...s,records:s.records.filter(r=>r.id!==a.id)};
    case "SET_EDIT": return {...s,editRecord:a.record,modal:"editRecord"};
    case "UPDATE_MILEAGE": {
      const vehicle={...s.vehicle,mileage:a.mileage};
      const ml=[...s.mileageLog,{vehicleId:"v_midnight",date:new Date().toISOString().split("T")[0],mileage:a.mileage,note:a.note||"Odometer update"}];
      return {...s,vehicle,mileageLog:ml,modal:null};
    }
    case "GUIDE_STEP": {
      const gp={...s.guideProgress};
      if(!gp[a.guideKey])gp[a.guideKey]=[];
      const stepNum=a.step;
      if(gp[a.guideKey].includes(stepNum)){
        gp[a.guideKey]=gp[a.guideKey].filter(x=>x<stepNum);
      } else {
        const newSteps=new Set(gp[a.guideKey]);
        for(let i=1;i<=stepNum;i++) newSteps.add(i);
        gp[a.guideKey]=[...newSteps];
      }
      return {...s,guideProgress:gp};
    }
    default: return s;
  }
}

/* ── Primitives ─────────────────────────────────────── */
function Btn({children,v="primary",sz="md",onClick,dis,cls=""}){
  const vs={primary:"bg-[var(--amber)] text-[var(--bg)] hover:brightness-110",secondary:"bg-[var(--bg3)] text-[var(--t1)] border border-[var(--bdr)] hover:border-[var(--bdr2)]",ghost:"text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--bg3)]",success:"bg-[var(--green-d)] text-[var(--green)] border border-[rgba(34,197,94,.2)]",danger:"bg-[var(--red-d)] text-[var(--red)] border border-[rgba(239,68,68,.2)]"};
  const szs={sm:"text-xs px-2.5 py-1.5 min-h-[32px]",md:"text-sm px-4 py-2.5 min-h-[40px]",lg:"text-sm px-6 py-3 min-h-[44px]"};
  return <button onClick={onClick} disabled={dis} className={`inline-flex items-center justify-center font-semibold rounded-lg transition-all gap-2 ${vs[v]} ${szs[sz]} ${dis?"opacity-40 cursor-not-allowed":"cursor-pointer"} ${cls}`}>{children}</button>;
}
function Input({label,value,onChange,type="text",ph,mono,cls="",...r}){return <label className={`block ${cls}`}>{label&&<span className="block text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-1.5">{label}</span>}<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={ph} className={`w-full bg-[var(--bg)] border border-[var(--bdr)] rounded-lg px-3 py-2.5 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:border-[var(--amber)] transition-colors min-h-[40px] ${mono?"font-mono":""}`} {...r}/></label>;}
function Sel({label,value,onChange,opts,ph,cls=""}){return <label className={`block ${cls}`}>{label&&<span className="block text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-1.5">{label}</span>}<select value={value} onChange={e=>onChange(e.target.value)} className="w-full bg-[var(--bg)] border border-[var(--bdr)] rounded-lg px-3 py-2.5 text-sm text-[var(--t1)] focus:outline-none focus:border-[var(--amber)] appearance-none cursor-pointer min-h-[40px]" style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234d5b72' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center"}}>{ph&&<option value="">{ph}</option>}{opts.map(o=><option key={o} value={o}>{o}</option>)}</select></label>;}
function TextArea({label,value,onChange,ph,rows=3,cls=""}){return <label className={`block ${cls}`}>{label&&<span className="block text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-1.5">{label}</span>}<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={ph} rows={rows} className="w-full bg-[var(--bg)] border border-[var(--bdr)] rounded-lg px-3 py-2.5 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:border-[var(--amber)] resize-none"/></label>;}
function Modal({open,onClose,title,wide,children}){if(!open)return null;return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}><div className="absolute inset-0 bg-black/70 backdrop-blur-sm"/><div className={`relative bg-[var(--bg2)] border border-[var(--bdr)] rounded-2xl shadow-2xl w-full ${wide?"max-w-2xl":"max-w-lg"} max-h-[90vh] overflow-y-auto scr fade`} onClick={e=>e.stopPropagation()}><div className="sticky top-0 bg-[var(--bg2)] border-b border-[var(--bdr)] px-5 sm:px-6 py-4 flex items-center justify-between z-10"><h3 className="text-lg font-bold">{title}</h3><button onClick={onClose} className="text-[var(--t3)] hover:text-[var(--t1)] text-xl cursor-pointer w-8 h-8 flex items-center justify-center">×</button></div><div className="p-5 sm:p-6">{children}</div></div></div>;}

function Badge({children,c="amber",cls=""}){const cs={amber:"bg-[var(--amber-d)] text-[var(--amber)] border-[rgba(240,168,50,.15)]",red:"bg-[var(--red-d)] text-[var(--red)] border-[rgba(239,68,68,.15)]",green:"bg-[var(--green-d)] text-[var(--green)] border-[rgba(34,197,94,.15)]",blue:"bg-[var(--blue-d)] text-[var(--blue)] border-[rgba(59,130,246,.15)]",orange:"bg-[var(--orange-d)] text-[var(--orange)] border-[rgba(249,115,22,.15)]",cyan:"bg-[var(--cyan-d)] text-[var(--cyan)] border-[rgba(6,182,212,.15)]",gray:"bg-[rgba(77,91,114,.08)] text-[var(--t3)] border-[rgba(77,91,114,.15)]"};return <span className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded border uppercase tracking-wide leading-none ${cs[c]} ${cls}`}>{children}</span>;}
function StatusBadge({status}){const m={ok:["green","OK"],upcoming:["blue","UPCOMING"],due:["orange","DUE"],overdue:["red","OVERDUE"],unknown:["gray","NO DATA"]};const[c,l]=m[status]||["gray",status];return <Badge c={c}>{l}</Badge>;}
function YouTubeEmbed({videoId,title,isShort}){
  const watchUrl=isShort?`https://www.youtube.com/shorts/${videoId}`:`https://www.youtube.com/watch?v=${videoId}`;
  return <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold no-underline transition-all hover:brightness-125 border" style={{background:"rgba(255,0,0,.1)",borderColor:"rgba(255,0,0,.2)",color:"#ff4444"}}>
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/></svg>
    Watch Video ↗
  </a>;
}

/* Section heading — consistent hierarchy */
function SH({children,color,cls=""}){return <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${color?"":" text-[var(--t3)]"} ${cls}`} style={color?{color}:{}}>{children}</h3>;}
/* Card — visual differentiation through accent prop */
function Card({children,cls="",onClick,accent}){return <div onClick={onClick} className={`bg-[#161b22] border border-[#30363d] rounded-xl transition-all duration-200 ${onClick?"cursor-pointer hover:bg-[#1c2128] hover:border-[#484f58]":""} ${cls}`} style={accent?{borderLeftWidth:3,borderLeftColor:accent}:{}}>{children}</div>;}

/* ── Shell & Navigation ─────────────────────────────── */
function Dash({s,d}){
  const v=s.vehicle;
  const tabs=[{id:"overview",l:"Dashboard",sl:"Dash",ico:"⬡"},{id:"intervals",l:"Service",sl:"Service",ico:"⏱"},{id:"diagnostics",l:"Diagnostics",sl:"Diag",ico:"⚡"},{id:"guides",l:"Guides",sl:"Guides",ico:"📖"},{id:"specs",l:"Vehicle",sl:"Info",ico:"☰"}];
  const ac=s.codes.filter(c=>c.vehicleId===v.id&&c.status==="active"&&c.type==="confirmed");
  if(ac.length>0)tabs[2].badge=ac.length;
  const ints=INTERVAL_DEFS[v.id]||[];const vRecs=s.records.filter(r=>r.vehicleId===v.id);
  const odc=ints.filter(i=>calcInterval(i,v.mileage,vRecs).status==="overdue").length;
  if(odc>0)tabs[1].badge=odc;
  return <div className="min-h-screen bg-[var(--bg)]">
    {/* Header */}
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-[#0d1117ee] border-b border-[#30363d]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--amber)] to-[#e08a10] flex items-center justify-center shadow-lg shadow-[rgba(240,168,50,.12)]"><span className="text-[var(--bg)] font-black text-xs tracking-tight" style={{fontFamily:"var(--fm)"}}>IQ</span></div>
          <div>
            <p className="font-semibold text-[15px] tracking-tight leading-tight">{v.nickname} <span className="text-[var(--t3)] font-normal text-xs ml-1 hide-mobile">{v.year} {v.model}</span></p>
            <button onClick={()=>d({type:"MODAL",modal:"updateMileage"})} className="text-[var(--t3)] text-xs hover:text-[var(--amber)] transition-colors cursor-pointer group">
              <span className="font-mono font-medium text-[var(--t2)] group-hover:text-[var(--amber)]">{v.mileage?v.mileage.toLocaleString():"-"}</span> mi
            </button>
          </div>
        </div>
      </div>
      {/* Tab nav — underline style, mobile-friendly */}
      <nav className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex gap-0 overflow-x-auto -mb-px">
          {tabs.map(t=><button key={t.id} onClick={()=>d({type:"TAB",tab:t.id})} className={`relative px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap transition-all cursor-pointer border-b-2 min-h-[44px] ${s.tab===t.id?"text-[var(--t1)] border-[var(--amber)]":"text-[var(--t3)] hover:text-[var(--t2)] border-transparent"}`}>
            <span className="hide-mobile">{t.l}</span><span className="hide-desktop">{t.sl}</span>
            {t.badge&&<span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[11px] font-bold bg-[var(--red)] text-white px-1">{t.badge}</span>}
          </button>)}
        </div>
      </nav>
    </header>
    {/* Content */}
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 fade">
      {s.tab==="overview"&&<Overview v={v} s={s} d={d}/>}
      {s.tab==="intervals"&&<IntervalsPage v={v} s={s} d={d}/>}
      {s.tab==="diagnostics"&&!s.codeDetail&&<DiagList v={v} s={s} d={d}/>}
      {s.tab==="diagnostics"&&s.codeDetail&&<CodeDetail code={s.codeDetail} v={v} s={s} d={d}/>}
      {s.tab==="guides"&&!s.guideDetail&&<GuideList v={v} s={s} d={d}/>}
      {s.tab==="guides"&&s.guideDetail&&<GuideDetailPage gk={s.guideDetail} v={v} s={s} d={d}/>}
      {s.tab==="specs"&&<Specs v={v}/>}
    </main>
    <UpdateMileageModal open={s.modal==="updateMileage"} onClose={()=>d({type:"MODAL",modal:null})} v={v} s={s} d={d}/>
    <AddRecordModal open={s.modal==="addRecord"} onClose={()=>d({type:"MODAL",modal:null})} vid={v.id} d={d} preselect={s.preselect||""} s={s}/>
    <EditRecordModal open={s.modal==="editRecord"} onClose={()=>d({type:"MODAL",modal:null})} d={d} record={s.editRecord}/>
  </div>;
}

/* ── Modals ──────────────────────────────────────────── */
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

function AddRecordModal({open,onClose,vid,d,preselect,s}){
  const ints=INTERVAL_DEFS[vid]||[];
  const currentMileage=s?.vehicle?.mileage||0;
  const currentRecords=s?.records||[];
  const[selKey,setSelKey]=useState(preselect||"");
  const[f,sf]=useState({date:new Date().toISOString().split("T")[0],mileage:"",notes:""});
  const[parts,setParts]=useState([{name:"",pn:"",cost:""}]);
  const[customMode,setCustomMode]=useState(false);
  const[customService,setCustomService]=useState("");
  const selInt=ints.find(i=>i.key===selKey);
  const guide=selInt?.guideKey?GUIDE_DB[selInt.guideKey]:null;
  const loadGuideParts=()=>{if(guide?.parts?.length){setParts(guide.parts.map(p=>({name:p.name,pn:p.pn||"",cost:String(p.cost||"")})));}};
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
        {ints.map(i=>{const st=calcInterval(i,currentMileage,currentRecords);return <button key={i.key} onClick={()=>setSelKey(i.key)} className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between min-h-[44px] ${selKey===i.key?"border-[var(--amber)] bg-[var(--amber-d)]":"border-[var(--bdr)] bg-[var(--bg)] hover:border-[var(--bdr2)]"}`}>
          <div className="flex items-center gap-2.5">
            <span className={`text-sm font-medium ${selKey===i.key?"text-[var(--amber)]":"text-[var(--t1)]"}`}>{i.name}</span>
            {i.guideKey&&<span className="text-[var(--cyan)] text-xs">📖</span>}
          </div>
          <StatusBadge status={st.status}/>
        </button>;})}
      </div>
      <button onClick={()=>setCustomMode(true)} className="mt-2 text-[var(--t3)] text-xs hover:text-[var(--amber)] cursor-pointer min-h-[32px]">+ Custom service not in list</button>
    </div>:<div>
      <div className="flex items-center justify-between mb-1.5"><span className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider">Custom Service</span><button onClick={()=>setCustomMode(false)} className="text-[var(--t3)] text-xs hover:text-[var(--amber)] cursor-pointer">← Back to list</button></div>
      <Input value={customService} onChange={setCustomService} ph="Describe the service..."/>
    </div>}
    {selKey&&guide&&<div className="bg-[var(--cyan-d)] border border-[rgba(6,182,212,.2)] rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
      <span className="text-[var(--cyan)] text-xs font-bold">📖 {guide.title} guide available</span>
      <Btn v="ghost" sz="sm" onClick={loadGuideParts}>Auto-fill parts from guide</Btn>
    </div>}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Input label="Date*" value={f.date} onChange={v2=>sf(p=>({...p,date:v2}))} type="date"/>
      <Input label="Mileage" value={f.mileage} onChange={v2=>sf(p=>({...p,mileage:v2}))} type="number" ph="64716" mono/>
    </div>
    <div><span className="block text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-1.5">Parts</span>{parts.map((p,i)=><div key={i} className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_100px_80px_32px] gap-2 mb-2 items-end">
      <Input value={p.name} onChange={v2=>{const n=[...parts];n[i].name=v2;setParts(n);}} ph="Part name"/>
      <Input value={p.pn} onChange={v2=>{const n=[...parts];n[i].pn=v2;setParts(n);}} ph="P/N" mono cls="hide-mobile"/>
      <Input value={p.cost} onChange={v2=>{const n=[...parts];n[i].cost=v2;setParts(n);}} ph="$" type="number" mono/>
      <button onClick={()=>setParts(parts.filter((_,j)=>j!==i))} className="text-[var(--t3)] hover:text-[var(--red)] text-sm cursor-pointer h-[40px] flex items-center justify-center">✕</button>
    </div>)}<button onClick={()=>setParts([...parts,{name:"",pn:"",cost:""}])} className="text-[var(--t3)] text-xs hover:text-[var(--amber)] cursor-pointer min-h-[32px]">+ Add part</button></div>
    <TextArea label="Notes" value={f.notes} onChange={v2=>sf(p=>({...p,notes:v2}))} ph="Details, observations, torque values..."/>
    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2"><Btn v="secondary" onClick={onClose} cls="flex-1">Cancel</Btn><Btn onClick={save} cls="flex-1" dis={!serviceName||!f.date}>Save Record</Btn></div>
  </div></Modal>;
}

function EditRecordModal({open,onClose,d,record}){
  const[f,sf]=useState({date:"",mileage:"",notes:""});
  useEffect(()=>{if(record)sf({date:record.date||"",mileage:record.mileage?String(record.mileage):"",notes:record.notes||""});},[record]);
  if(!record)return null;
  return <Modal open={open} onClose={onClose} title={`Edit: ${record.service}`}><div className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Input label="Date" value={f.date} onChange={v=>sf(p=>({...p,date:v}))} type="date"/><Input label="Mileage" value={f.mileage} onChange={v=>sf(p=>({...p,mileage:v}))} type="number" mono/></div>
    <TextArea label="Notes" value={f.notes} onChange={v=>sf(p=>({...p,notes:v}))} rows={3}/>
    <div className="flex flex-col-reverse sm:flex-row gap-3"><Btn v="secondary" onClick={onClose} cls="flex-1">Cancel</Btn><Btn onClick={()=>{d({type:"EDIT_RECORD",id:record.id,changes:{date:f.date,mileage:f.mileage?parseInt(f.mileage):record.mileage,notes:f.notes}});}} cls="flex-1">Save Changes</Btn></div>
  </div></Modal>;
}

function AddCodeModal({open,onClose,vid,d}){
  const[search,setSearch]=useState("");const[sel,setSel]=useState(null);const[f,sf]=useState({scanDate:new Date().toISOString().split("T")[0],mileage:"",type:"confirmed"});
  const results=search.length>=2?Object.keys(CODE_DB).filter(c=>{const db=CODE_DB[c];return c.toLowerCase().includes(search.toLowerCase())||db.name.toLowerCase().includes(search.toLowerCase());}).slice(0,6):[];
  return <Modal open={open} onClose={()=>{onClose();setSel(null);setSearch("");}} title="Add Diagnostic Code" wide><div className="space-y-4">{!sel?<><Input label="Search Codes" value={search} onChange={setSearch} ph="Code (P0100) or keyword (MAF)..." mono/>{results.map(c=><button key={c} onClick={()=>setSel(c)} className="w-full text-left p-3 rounded-lg bg-[var(--bg)] border border-[var(--bdr)] hover:border-[var(--bdr2)] mb-1 cursor-pointer min-h-[44px]"><span className="font-bold text-[var(--amber)] font-mono text-sm">{c}</span><span className="text-[var(--t2)] text-sm ml-3">{CODE_DB[c].name}</span></button>)}</>:<div className="fade"><div className="flex items-center gap-2 mb-4 flex-wrap"><span className="text-xl font-black font-mono text-[var(--amber)]">{sel}</span><span className="text-[var(--t2)] text-sm">{CODE_DB[sel]?.name}</span><button onClick={()=>setSel(null)} className="ml-auto text-[var(--t3)] text-xs cursor-pointer">Change</button></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><Input label="Scan Date" value={f.scanDate} onChange={v=>sf(p=>({...p,scanDate:v}))} type="date"/><Input label="Mileage" value={f.mileage} onChange={v=>sf(p=>({...p,mileage:v}))} type="number" ph="64716"/><Sel label="Type" value={f.type} onChange={v=>sf(p=>({...p,type:v}))} opts={["confirmed","pending","stored","permanent"]}/></div><div className="flex gap-3 pt-4"><Btn v="secondary" onClick={()=>{onClose();setSel(null);setSearch("");}}>Cancel</Btn><Btn onClick={()=>{d({type:"ADD_CODE",c:{vehicleId:vid,code:sel,scanDate:f.scanDate,mileage:f.mileage?parseInt(f.mileage):null,type:f.type,status:"active"}});setSel(null);setSearch("");}}>Add</Btn></div></div>}</div></Modal>;
}

/* ── Health Ring SVG ────────────────────────────────── */
function HealthRing({current,total,size=120}){
  const pct=total>0?current/total:0;
  const r=(size-12)/2;
  const circ=2*Math.PI*r;
  const offset=circ*(1-pct);
  const color=pct>=0.7?"var(--green)":pct>=0.4?"var(--orange)":"var(--red)";
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#21262d" strokeWidth="6" opacity="0.5"/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
      strokeDasharray={circ} strokeDashoffset={offset}
      className="ring-animate" style={{"--ring-circ":circ,"--ring-offset":offset}}
      transform={`rotate(-90 ${size/2} ${size/2})`}/>
    <text x={size/2} y={size/2-8} textAnchor="middle" fill="var(--t1)" fontSize="28" fontWeight="900" fontFamily="var(--fm)">{Math.round(pct*100)}</text>
    <text x={size/2} y={size/2+10} textAnchor="middle" fill="var(--t3)" fontSize="10" fontWeight="600" letterSpacing="1" fontFamily="var(--fb)">% CURRENT</text>
  </svg>;
}

/* ── Stat Card ─────────────────────────────────────── */
function StatCard({label,value,sub,color,onClick,idx=0}){
  return <div onClick={onClick} className={`flex-1 min-w-[130px] rounded-xl p-3.5 transition-all stagger stagger-${idx+1} ${onClick?"cursor-pointer hover:brightness-110 hover:translate-y-[-1px]":""}`} style={{background:"#161b22",border:"1px solid #30363d"}}>
    <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--t3)] mb-1.5">{label}</p>
    <p className="text-2xl font-black leading-none" style={{fontFamily:"var(--fm)",color:color||"var(--t1)"}}>{value}</p>
    {sub&&<p className="text-[var(--t3)] text-xs mt-1.5 truncate">{sub}</p>}
  </div>;
}

/* ── Dashboard ───────────────────────────────────────── */
function Overview({v,s,d}){
  const codes=s.codes.filter(c=>c.vehicleId===v.id&&c.status==="active"&&c.type==="confirmed");
  const recs=s.records.filter(r=>r.vehicleId===v.id);
  const ints=INTERVAL_DEFS[v.id]||[];
  const intStatuses=ints.map(i=>({...i,st:calcInterval(i,v.mileage,recs)}));
  const overdue=intStatuses.filter(i=>i.st.status==="overdue");
  const due=intStatuses.filter(i=>i.st.status==="due");
  const next5=[...overdue,...due,...intStatuses.filter(i=>i.st.status==="upcoming")].slice(0,5);
  const completedInts=recs.filter(r=>r.intervalKey).map(r=>{const def=ints.find(i=>i.key===r.intervalKey);return def?{diy:r.total,dealer:def.dealerCost||0}:null;}).filter(Boolean);
  const totalDealer=completedInts.reduce((a,c)=>a+c.dealer,0);
  const saved=totalDealer-completedInts.reduce((a,c)=>a+c.diy,0);
  const annualDIY=ints.reduce((a,i)=>{const py=i.miInt?(12000/i.miInt):1;return a+(i.diyCost||0)*py;},0);
  const annualDealer=ints.reduce((a,i)=>{const py=i.miInt?(12000/i.miInt):1;return a+(i.dealerCost||0)*py;},0);
  const confirmedCodes=codes.filter(c=>c.type==="confirmed");
  const storedCodes=s.codes.filter(c=>c.vehicleId===v.id&&c.status==="active"&&c.type!=="confirmed");
  const lastRec=recs[0];
  const totalInts=ints.length;
  const statusOrder={overdue:0,due:1,upcoming:2,ok:3,unknown:4};
  const sortedStatuses=[...intStatuses].sort((a,b)=>(statusOrder[a.st.status]||4)-(statusOrder[b.st.status]||4));
  const statusColors={overdue:"var(--red)",due:"var(--orange)",upcoming:"var(--blue)",ok:"var(--green)",unknown:"#21262d"};
  const topPriority=overdue[0]||due[0]||null;
  const currentCount=intStatuses.filter(i=>i.st.status==="ok"||i.st.status==="upcoming").length;

  return <div className="space-y-5">
    {/* ── Hero: Health Ring + Status Bar ── */}
    <div className="rounded-2xl p-5 sm:p-6 stagger" style={{background:"linear-gradient(135deg,#1a2029 0%,#131920 100%)",border:"1px solid #30363d"}}>
      <div className="flex items-center gap-5 sm:gap-8">
        {/* Health Ring */}
        <HealthRing current={currentCount} total={totalInts} size={110}/>
        {/* Vehicle identity + status bar */}
        <div className="flex-1 min-w-0">
          <p className="text-lg sm:text-xl font-bold tracking-tight leading-tight mb-0.5">{v.nickname}</p>
          <p className="text-[var(--t3)] text-xs mb-4">{v.year} {v.make} {v.model} {v.trim} · <span className="font-mono text-[var(--t2)]">{v.mileage?.toLocaleString()}</span> mi</p>
          {/* Status bar */}
          <div className="mb-2">
            <div className="flex gap-px h-2.5 rounded-full overflow-hidden bg-[#0d1117]">
              {sortedStatuses.map((item,idx)=><div key={item.key} className="relative group cursor-pointer h-full rounded-sm transition-all hover:brightness-150 bar-segment" style={{flex:1,backgroundColor:statusColors[item.st.status]||"#21262d",opacity:item.st.status==="ok"?0.5:1,animationDelay:`${0.3+idx*0.02}s`}} onClick={()=>d({type:"MODAL",modal:"addRecord",preselect:item.key})} title={`${item.name}: ${item.st.status.toUpperCase()}`}/>)}
            </div>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap">
            {[["Overdue",overdue.length,"var(--red)"],["Due",due.length,"var(--orange)"],["Current",currentCount,"var(--green)"]].map(([label,n,color])=>n>0&&<div key={label} className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:color}}/><span className="text-[11px] text-[var(--t3)]">{label} <strong className="text-[var(--t2)] font-mono">{n}</strong></span></div>)}
          </div>
        </div>
      </div>
    </div>

    {/* ── Stat Strip ── */}
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      <StatCard label="Overdue" value={overdue.length} sub={overdue.length?overdue[0].name:"All clear"} color={overdue.length?"var(--red)":"var(--green)"} onClick={()=>d({type:"TAB",tab:"intervals"})} idx={0}/>
      <StatCard label="Active Codes" value={<>{confirmedCodes.length}<span className="text-[var(--t4)] text-sm font-semibold ml-0.5">+{storedCodes.length}</span></>} sub={confirmedCodes.length?confirmedCodes.map(c=>c.code).slice(0,2).join(", "):"No confirmed codes"} color={confirmedCodes.length?"var(--amber)":"var(--green)"} onClick={()=>d({type:"TAB",tab:"diagnostics"})} idx={1}/>
      <StatCard label="DIY Savings" value={`$${saved>0?saved.toFixed(0):"0"}`} sub={`$${Math.round(annualDealer-annualDIY)}/yr projected`} color="var(--green)" idx={2}/>
      <StatCard label="Last Service" value={lastRec?<span className="text-base font-bold text-[var(--t1)]" style={{fontFamily:"var(--fb)"}}>{lastRec.service.split(" ").slice(0,2).join(" ")}</span>:<span className="text-base text-[var(--t3)]">None</span>} sub={lastRec?`${lastRec.date} · ${lastRec.mileage?.toLocaleString()} mi`:""} idx={3}/>
    </div>

    {/* ── Priority Alert ── */}
    {topPriority&&<div className="rounded-xl p-4 cursor-pointer hover:brightness-105 transition-all stagger stagger-3" style={{background:"linear-gradient(135deg,rgba(239,68,68,.06) 0%,rgba(249,115,22,.04) 100%)",border:"1px solid rgba(239,68,68,.2)"}} onClick={()=>d({type:"MODAL",modal:"addRecord",preselect:topPriority.key})}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--red)]">Next Priority</span>
            <StatusBadge status={topPriority.st.status}/>
          </div>
          <p className="font-bold text-base sm:text-lg">{topPriority.name}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap">
            <span className="text-[var(--t3)]">{topPriority.st.miRemain!==null&&topPriority.st.miRemain<0?Math.abs(topPriority.st.miRemain).toLocaleString()+" mi overdue":"Due now"}</span>
            {topPriority.time&&<><span className="text-[var(--t4)]">·</span><span className="text-[var(--t3)]">{topPriority.time}</span></>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-black font-mono text-[var(--amber)]">${topPriority.diyCost}</p>
          {topPriority.dealerCost&&<p className="text-xs font-mono text-[var(--t4)] line-through mt-0.5">${topPriority.dealerCost} dealer</p>}
          {topPriority.guideKey&&GUIDE_DB[topPriority.guideKey]&&<p className="text-[var(--cyan)] text-xs font-semibold mt-1.5">Guide →</p>}
        </div>
      </div>
    </div>}

    {/* ── Overdue alert ── */}
    {overdue.length>1&&<Card cls="p-4" accent="var(--red)">
      <SH color="var(--red)">Overdue Services</SH>
      {overdue.slice(0,4).map(i=><div key={i.key} onClick={()=>d({type:"MODAL",modal:"addRecord",preselect:i.key})} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[#151c24] cursor-pointer min-h-[44px]"><div className="flex items-center gap-2.5"><div className="w-1.5 h-1.5 rounded-full bg-[var(--red)]"/><span className="text-sm">{i.name}</span></div><div className="flex items-center gap-3"><span className="text-[var(--t3)] text-xs font-mono hide-mobile">{i.st.miRemain!==null&&i.st.miRemain<0?Math.abs(i.st.miRemain).toLocaleString()+" mi over":"Never done"}</span><span className="text-[var(--amber)] text-xs font-bold font-mono">${i.diyCost}</span></div></div>)}
      {overdue.length>4&&<p className="text-[var(--t3)] text-xs mt-1 pl-4">+{overdue.length-4} more</p>}
    </Card>}

    {/* ── Two-column: Priority + Cost ── */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <Card cls="p-4"><SH>Priority Queue</SH>
          {next5.map(i=><div key={i.key} className="flex items-center gap-2.5 py-2.5 border-b border-[#21262d] last:border-0 min-h-[40px]"><StatusBadge status={i.st.status}/><span className="text-sm flex-1 truncate">{i.name}</span><span className="text-[var(--t3)] text-xs font-mono shrink-0 hide-mobile">{i.time}</span><span className="text-[var(--amber)] text-xs font-bold font-mono shrink-0">${i.diyCost||0}</span></div>)}
          <Btn v="ghost" sz="sm" cls="w-full mt-2" onClick={()=>d({type:"TAB",tab:"intervals"})}>View all services →</Btn>
        </Card>
        <Card cls="p-4"><SH>Recent Work</SH>
          {recs.slice(0,3).map(r=><div key={r.id} className="flex items-center justify-between py-2.5 border-b border-[#21262d] last:border-0"><div className="min-w-0"><p className="text-sm font-medium truncate">{r.service}</p><p className="text-[var(--t3)] text-xs mt-0.5">{r.date} · {r.mileage?.toLocaleString()} mi</p></div><span className="text-[var(--green)] font-bold text-sm font-mono shrink-0 ml-3">${r.total.toFixed(2)}</span></div>)}
        </Card>
      </div>
      {/* Cost comparison */}
      <Card cls="p-4 lg:col-span-3"><SH>DIY vs Dealer</SH>
        <div className="space-y-3">
          {ints.filter(i=>(i.dealerCost||0)>50).sort((a,b)=>(b.dealerCost||0)-(a.dealerCost||0)).slice(0,6).map(i=>{
            const max=Math.max(...ints.map(x=>x.dealerCost||0));
            return <div key={i.key}>
              <div className="flex items-center justify-between mb-1"><span className="text-xs text-[var(--t2)] truncate">{i.name.replace(/ \(.*/,"")}</span><span className="text-xs font-mono"><span className="text-[var(--green)] font-bold">${i.diyCost}</span><span className="text-[var(--t4)] mx-1">/</span><span className="text-[var(--t3)] line-through">${i.dealerCost}</span></span></div>
              <div className="relative h-1.5 bg-[#21262d] rounded-full overflow-hidden"><div className="absolute inset-y-0 left-0 bg-[var(--green)] rounded-full" style={{width:`${((i.diyCost||0)/max)*100}%`}}/><div className="absolute inset-y-0 left-0 bg-[var(--red)] opacity-15 rounded-full" style={{width:`${((i.dealerCost||0)/max)*100}%`}}/></div>
            </div>;
          })}
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#21262d] text-xs"><span className="text-[var(--t3)]">Est. annual</span><span><span className="text-[var(--green)] font-bold font-mono">${Math.round(annualDIY)}</span> <span className="text-[var(--t4)]">vs</span> <span className="text-[var(--t3)] line-through font-mono">${Math.round(annualDealer)}</span> <span className="text-[var(--green)]">save ${Math.round(annualDealer-annualDIY)}/yr</span></span></div>
      </Card>
    </div>

    {/* ── Active codes ── */}
    {codes.length>0&&<Card cls="p-4"><SH><span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--red)] mr-1.5 pulse"/>Active Codes</SH>
      {codes.slice(0,4).map(c=>{const db=CODE_DB[c.code];return <div key={c.id} onClick={()=>{d({type:"TAB",tab:"diagnostics"});setTimeout(()=>d({type:"CODE_DETAIL",code:c.code}),50);}} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-[#151c24] cursor-pointer border-b border-[#21262d] last:border-0 min-h-[44px]"><span className="font-bold text-[var(--amber)] text-sm font-mono w-14 shrink-0">{c.code}</span><span className="text-[var(--t2)] text-sm flex-1 truncate">{db?.name||c.desc}</span><span className="text-[var(--t4)] text-sm">→</span></div>;})}
    </Card>}
  </div>;
}

/* ── Service Intervals ──────────────────────────────── */
function IntervalsPage({v,s,d}){
  const ints=INTERVAL_DEFS[v.id]||[];const vRecs=s.records.filter(r=>r.vehicleId===v.id);
  if(!v.mileage)return <div className="text-center py-16"><p className="text-4xl mb-3">⏱</p><p className="text-[var(--t2)] font-semibold mb-3">Update odometer to activate service tracking</p><Btn onClick={()=>d({type:"MODAL",modal:"updateMileage"})}>Update Odometer</Btn></div>;
  const sub=s.subTab||"intervals";
  return <div>
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
      <div className="flex gap-1 bg-[#151c24] rounded-lg p-0.5">{[["intervals","Intervals"],["planner","Planner"],["log","Service Log"]].map(([id,l])=>
        <button key={id} onClick={()=>d({type:"SUBTAB",subTab:id})} className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer min-h-[36px] ${sub===id?"bg-[#242a33] text-[var(--t1)]":"text-[var(--t3)] hover:text-[var(--t2)]"}`}>{l}</button>
      )}</div>
      <Btn sz="sm" onClick={()=>d({type:"MODAL",modal:"addRecord"})}>+ Log Service</Btn>
    </div>
    {sub==="intervals"&&<IntervalsList v={v} s={s} d={d} ints={ints} vRecs={vRecs}/>}
    {sub==="planner"&&<Planner v={v} s={s} d={d}/>}
    {sub==="log"&&<ServiceLog v={v} s={s} d={d}/>}
  </div>;
}

function IntervalsList({v,s,d,ints,vRecs}){
  const sorted=[...ints].sort((a,b)=>{const sa=calcInterval(a,v.mileage,vRecs);const sb=calcInterval(b,v.mileage,vRecs);const o={overdue:0,due:1,upcoming:2,ok:3,unknown:4};return(o[sa.status]??4)-(o[sb.status]??4);});
  const hist=s.mileageLog.filter(m=>m.vehicleId===v.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  let avgMi=null;if(hist.length>=2){const days=(new Date(hist[0].date)-new Date(hist[hist.length-1].date))/86400000;if(days>7)avgMi=Math.round((hist[0].mileage-hist[hist.length-1].mileage)/(days/30.44));}
  return <div className="space-y-2.5">{sorted.map(i=>{const st=calcInterval(i,v.mileage,vRecs);const bc=st.status==="overdue"?"bg-[var(--red)]":st.status==="due"?"bg-[var(--orange)]":st.status==="upcoming"?"bg-[var(--blue)]":"bg-[var(--green)]";
    let estDate=null;if(avgMi&&st.miRemain&&st.miRemain>0){const mo=st.miRemain/avgMi;const d2=new Date();d2.setMonth(d2.getMonth()+Math.round(mo));estDate=d2.toLocaleDateString("en-US",{month:"short",year:"numeric"});}
    const guide=i.guideKey&&GUIDE_DB[i.guideKey];
    return <Card key={i.key} cls="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2.5 flex-wrap"><span className="font-semibold text-sm">{i.name}</span><StatusBadge status={st.status}/>{guide&&<button onClick={()=>{d({type:"TAB",tab:"guides"});setTimeout(()=>d({type:"GUIDE_DETAIL",key:i.guideKey}),50);}} className="text-[var(--cyan)] text-xs hover:underline cursor-pointer">📖 Guide</button>}</div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--t3)] text-xs font-mono">{i.miInt.toLocaleString()} mi{i.moInt?` / ${i.moInt}mo`:""}</span>
          <Btn v={st.status==="overdue"||st.status==="due"?"primary":"secondary"} sz="sm" onClick={()=>d({type:"MODAL",modal:"addRecord",preselect:i.key})}>Log ✓</Btn>
        </div>
      </div>
      <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden mb-2"><div className={`h-full rounded-full ${bc}`} style={{width:`${Math.min(st.pct,100)}%`}}/></div>
      <div className="flex flex-col sm:flex-row justify-between text-xs text-[var(--t3)] gap-1">
        <span>Last: {st.lastDate||"Never"}{st.lastMi!=null?` @ ${st.lastMi.toLocaleString()} mi`:""}</span>
        <div className="text-right">{st.miRemain!=null&&<span className={st.miRemain<0?"text-[var(--red)] font-semibold":""}>{st.miRemain<0?Math.abs(st.miRemain).toLocaleString()+" mi overdue":st.miRemain.toLocaleString()+" mi remaining"}</span>}{estDate&&st.miRemain>0&&<span className="text-[var(--t4)] ml-2">~{estDate}</span>}</div>
      </div>
      {i.note&&<p className="text-[var(--t3)] text-xs mt-2 leading-relaxed italic">{i.note}</p>}
    </Card>;})}</div>;
}

function Planner({v,s,d}){
  const ints=INTERVAL_DEFS[v.id]||[];const recs=s.records.filter(r=>r.vehicleId===v.id);
  const intStatuses=ints.map(i=>({...i,st:calcInterval(i,v.mileage,recs)}));
  const overdue=intStatuses.filter(i=>i.st.status==="overdue");
  const dueNow=intStatuses.filter(i=>i.st.status==="due");
  const by75k=intStatuses.filter(i=>i.st.status==="upcoming"||i.st.status==="ok").filter(i=>{const next=i.st.nextDueMi||(v.mileage+i.miInt);return next<=75000;});
  const by80k=intStatuses.filter(i=>i.st.status==="upcoming"||i.st.status==="ok").filter(i=>{const next=i.st.nextDueMi||(v.mileage+i.miInt);return next>75000&&next<=80000;});
  const by100k=intStatuses.filter(i=>i.st.status==="upcoming"||i.st.status==="ok").filter(i=>{const next=i.st.nextDueMi||(v.mileage+i.miInt);return next>80000&&next<=100000;});

  const Batch=({title,items,color,icon,urgency})=>{
    if(items.length===0)return null;
    const totalDIY=items.reduce((a,i)=>a+(i.diyCost||0),0);
    const totalDealer=items.reduce((a,i)=>a+(i.dealerCost||0),0);
    return <Card cls="p-4 sm:p-5 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2"><div className="flex items-center gap-2"><span>{icon}</span><h3 className="font-bold text-sm">{title}</h3><Badge c={color}>{urgency}</Badge></div><div className="text-right"><span className="text-[var(--green)] font-bold font-mono">${totalDIY}</span><span className="text-[var(--t3)] text-xs ml-1">DIY</span><span className="text-[var(--t3)] text-xs ml-2 line-through">${totalDealer}</span></div></div>
      {items.map(i=><div key={i.key} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-[var(--bdr)] last:border-0 gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0"><StatusBadge status={i.st.status}/><div className="min-w-0"><p className="text-sm font-medium truncate">{i.name}</p><p className="text-[var(--t3)] text-xs">{i.time||"—"}{i.guideKey&&" · 📖 Guide"}</p></div></div>
        <div className="flex items-center gap-3 shrink-0 ml-11 sm:ml-0"><span className="text-[var(--amber)] font-bold font-mono text-sm">${i.diyCost||0}</span>
          <Btn v={i.st.status==="overdue"||i.st.status==="due"?"primary":"secondary"} sz="sm" onClick={()=>d({type:"MODAL",modal:"addRecord",preselect:i.key})}>Log ✓</Btn></div>
      </div>)}
    </Card>;
  };

  return <div><h2 className="text-lg font-bold mb-1">Service Planner</h2><p className="text-[var(--t3)] text-sm mb-6">Grouped by priority</p>
    <Batch title="Overdue — Do Now" items={overdue} color="red" icon="🔴" urgency="CRITICAL"/>
    <Batch title="Due Soon" items={dueNow} color="orange" icon="🟡" urgency="THIS MONTH"/>
    <Batch title="By 75,000 mi" items={by75k} color="blue" icon="🔵" urgency="UPCOMING"/>
    <Batch title="By 80,000 mi" items={by80k} color="cyan" icon="🔵" urgency="PLAN AHEAD"/>
    <Batch title="By 100,000 mi" items={by100k} color="gray" icon="⚪" urgency="LONG-TERM"/>
    {overdue.length===0&&dueNow.length===0&&by75k.length===0&&by80k.length===0&&by100k.length===0&&<Card cls="p-8 text-center"><p className="text-4xl mb-3">✅</p><p className="font-bold">All caught up!</p><p className="text-[var(--t3)] text-sm mt-1">No services due.</p></Card>}
  </div>;
}

function ServiceLog({v,s,d}){
  const recs=s.records.filter(r=>r.vehicleId===v.id);const tot=recs.reduce((a,r)=>a+r.total,0);
  const ints=INTERVAL_DEFS[v.id]||[];
  return <div><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2"><div><h2 className="text-lg font-bold">Service Log</h2><p className="text-[var(--t3)] text-sm">{recs.length} records · ${tot.toFixed(2)} total</p></div><Btn sz="sm" onClick={()=>d({type:"MODAL",modal:"addRecord"})}>+ Log Service</Btn></div>
    {recs.map(r=>{const linkedInt=ints.find(i=>i.key===r.intervalKey);const guide=linkedInt?.guideKey?GUIDE_DB[linkedInt.guideKey]:null;return <Card key={r.id} cls="p-4 sm:p-5 mb-4"><div className="flex flex-col sm:flex-row justify-between mb-2 gap-2"><div className="min-w-0"><h4 className="font-bold truncate">{r.service}{linkedInt&&<Badge c="green" cls="ml-2">Tracked</Badge>}{!linkedInt&&!r.intervalKey&&<Badge c="gray" cls="ml-2">Custom</Badge>}</h4><p className="text-[var(--t3)] text-xs mt-0.5">{r.date} · {r.mileage?.toLocaleString()} mi · DIY</p></div><div className="flex items-center gap-3"><span className="text-[var(--amber)] font-bold font-mono">${r.total.toFixed(2)}</span><div className="flex gap-1"><button onClick={()=>d({type:"SET_EDIT",record:r})} className="text-[var(--t3)] hover:text-[var(--amber)] text-xs cursor-pointer p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center">✎</button><button onClick={()=>{if(confirm("Delete this record?"))d({type:"DELETE_RECORD",id:r.id});}} className="text-[var(--t3)] hover:text-[var(--red)] text-xs cursor-pointer p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center">✕</button></div></div></div>
      {r.notes&&<p className="text-[var(--t2)] text-sm mb-3 leading-relaxed">{r.notes}</p>}
      {guide&&<div className="bg-[var(--bg)] rounded-lg p-3 mb-3 border border-[var(--cyan-d)]"><div className="flex items-center justify-between flex-wrap gap-2"><span className="text-xs font-bold text-[var(--cyan)] uppercase tracking-wider">📖 Guide Available</span><button onClick={()=>{d({type:"TAB",tab:"guides"});setTimeout(()=>d({type:"GUIDE_DETAIL",key:linkedInt.guideKey}),50);}} className="text-[var(--cyan)] text-xs hover:underline cursor-pointer">View walkthrough →</button></div></div>}
      {r.parts.length>0&&<div className="bg-[var(--bg)] rounded-lg p-3"><p className="text-xs font-semibold text-[var(--t3)] uppercase tracking-wider mb-2">Parts</p>{r.parts.map((p2,i)=><div key={i} className="flex justify-between py-1.5 border-b border-[var(--bdr)] last:border-0"><div className="min-w-0"><span className="text-[var(--t2)] text-sm truncate block">{p2.name}</span>{p2.pn&&<span className="text-[var(--t3)] text-xs font-mono">#{p2.pn}</span>}</div><span className="font-mono text-sm shrink-0 ml-2">${p2.cost.toFixed(2)}</span></div>)}</div>}
    </Card>;})}
  </div>;
}

/* ── Diagnostics ─────────────────────────────────────── */
function DiagList({v,s,d}){
  const[filter,setFilter]=useState("active");const[search,setSearch]=useState("");
  const all=s.codes.filter(c=>c.vehicleId===v.id);
  const filtered=(filter==="all"?all:all.filter(c=>c.status===filter)).filter(c=>{if(!search)return true;const q=search.toLowerCase();const db=CODE_DB[c.code];return c.code.toLowerCase().includes(q)||(db&&db.name.toLowerCase().includes(q));});
  return <div><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3"><div><h2 className="text-lg font-bold">Diagnostic Codes</h2><p className="text-[var(--t3)] text-sm">Click any code for details</p></div><Btn sz="sm" onClick={()=>d({type:"MODAL",modal:"addCode"})}>+ Add Code</Btn></div>
    <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center">
      <div className="flex gap-1">{[["active","Active"],["resolved","Resolved"],["all","All"]].map(([val,lab])=><button key={val} onClick={()=>setFilter(val)} className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer min-h-[36px] ${filter===val?"bg-[var(--bg4)] text-[var(--t1)] border border-[var(--bdr2)]":"text-[var(--t3)]"}`}>{lab}</button>)}</div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="bg-[var(--bg)] border border-[var(--bdr)] rounded-lg px-3 py-2 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:border-[var(--amber)] w-full sm:w-40 font-mono min-h-[36px]"/>
    </div>
    <div className="space-y-2.5">{filtered.map(c=>{const db=CODE_DB[c.code]||{};return <Card key={c.id} cls="p-4" onClick={()=>d({type:"CODE_DETAIL",code:c.code})}>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="shrink-0 text-center"><span className="font-bold text-[var(--amber)] text-sm font-mono block">{c.code}</span><span className={`text-xs block uppercase ${c.type==="confirmed"?"text-[var(--red)]":"text-[var(--t3)]"}`}>{c.type}</span></div>
        <div className="flex-1 min-w-0"><p className="text-[var(--t2)] text-sm font-medium truncate">{db.name||c.code}</p><p className="text-[var(--t3)] text-xs">{db.system||"—"}</p></div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <Badge c={db.sev==="high"?"red":db.sev==="low"?"blue":"orange"}>{db.sev||"—"}</Badge>
          <span className="hide-mobile"><Badge c={c.status==="active"?"red":"green"}>{c.status}</Badge></span>
          {c.status==="active"?<Btn v="success" sz="sm" onClick={e=>{e.stopPropagation();d({type:"RESOLVE",id:c.id});}}>Resolve</Btn>:<Btn v="danger" sz="sm" onClick={e=>{e.stopPropagation();d({type:"RESOLVE",id:c.id});}}>Reactivate</Btn>}
          <span className="text-[var(--t4)] ml-1 hide-mobile">→</span>
        </div>
      </div>
    </Card>;})}</div>
    <AddCodeModal open={s.modal==="addCode"} onClose={()=>d({type:"MODAL",modal:null})} vid={v.id} d={d}/>
  </div>;
}

function CodeDetail({code,v,s,d}){
  const db=CODE_DB[code];const entry=s.codes.find(c=>c.vehicleId===v.id&&c.code===code);
  if(!db)return <div className="fade"><button onClick={()=>d({type:"CODE_DETAIL",code:null})} className="text-[var(--t3)] hover:text-[var(--t1)] text-sm mb-6 block cursor-pointer min-h-[44px]">← All codes</button><p className="text-[var(--t2)] text-center py-16">No info for {code}.</p></div>;
  return <div className="fade max-w-4xl"><button onClick={()=>d({type:"CODE_DETAIL",code:null})} className="text-[var(--t3)] hover:text-[var(--t1)] text-sm mb-6 block cursor-pointer min-h-[44px] flex items-center">← All codes</button>
    <div className="mb-8"><div className="flex items-center gap-3 mb-2 flex-wrap"><span className="text-2xl sm:text-3xl font-black font-mono text-[var(--amber)]">{db.code}</span><Badge c={db.sev==="high"?"red":db.sev==="low"?"blue":"orange"}>{db.sev}</Badge>{entry&&<Badge c={entry.status==="active"?"red":"green"}>{entry.status}</Badge>}{entry&&(entry.status==="active"?<Btn v="success" sz="sm" onClick={()=>d({type:"RESOLVE",id:entry.id})}>Resolve</Btn>:<Btn v="danger" sz="sm" onClick={()=>d({type:"RESOLVE",id:entry.id})}>Reactivate</Btn>)}</div><h2 className="text-lg sm:text-xl font-bold mb-1">{db.name}</h2><p className="text-[var(--t3)] text-sm">{db.system} · {v.year} {v.make} {v.model}</p></div>
    {db.description&&<Card cls="p-4 sm:p-5 mb-4"><SH>What This Means</SH><p className="text-[var(--t2)] text-sm leading-relaxed">{db.description}</p></Card>}
    {db.symptoms&&db.symptoms.length>0&&<Card cls="p-4 sm:p-5 mb-4"><SH>Symptoms</SH>{db.symptoms.map((s2,i)=><div key={i} className="flex items-start gap-2 py-1.5"><span className="text-[var(--orange)] text-xs mt-0.5">▸</span><span className="text-[var(--t2)] text-sm">{s2}</span></div>)}</Card>}
    {db.causes&&db.causes.length>0&&<Card cls="p-4 sm:p-5 mb-4"><SH>Causes</SH>{db.causes.map((c2,i)=><div key={i} className="flex items-start gap-2 py-1.5"><span className="text-[var(--cyan)] text-xs mt-0.5">▸</span><span className="text-[var(--t2)] text-sm">{c2}</span></div>)}</Card>}
    {db.repair_guide&&<Card cls="p-4 sm:p-5 mb-4 border-[var(--amber-d)]"><SH color="var(--amber)">🔧 Repair Guide</SH><p className="text-[var(--t2)] text-sm leading-relaxed">{db.repair_guide}</p><div className="flex gap-4 mt-3 text-xs text-[var(--t3)] flex-wrap"><span>Difficulty: <strong className="text-[var(--t1)]">{db.est_difficulty}</strong></span><span>Cost: <strong className="text-[var(--amber)]">{db.est_cost}</strong></span></div>{db.guideKey&&GUIDE_DB[db.guideKey]&&<Btn v="secondary" sz="sm" cls="mt-3" onClick={()=>{d({type:"TAB",tab:"guides"});setTimeout(()=>d({type:"GUIDE_DETAIL",key:db.guideKey}),50);}}>📖 Full Step-by-Step Guide</Btn>}</Card>}
    {db.parts&&db.parts.length>0&&<Card cls="p-4 sm:p-5 mb-4"><SH>Parts</SH>{db.parts.map((p2,i)=><div key={i} className="flex justify-between py-2 border-b border-[var(--bdr)] last:border-0"><div className="min-w-0"><span className="text-sm block truncate">{p2.name}</span><span className="text-[var(--t3)] text-xs font-mono">#{p2.partNum}</span></div><span className="text-[var(--amber)] font-bold text-sm font-mono shrink-0 ml-2">{p2.cost}</span></div>)}</Card>}
    {db.related_codes&&db.related_codes.length>0&&<Card cls="p-4 sm:p-5"><SH>Related Codes</SH><div className="flex flex-wrap gap-2">{db.related_codes.map(rc=>{const present=s.codes.some(c2=>c2.vehicleId===v.id&&c2.code===rc&&c2.status==="active");return <button key={rc} onClick={()=>CODE_DB[rc]&&d({type:"CODE_DETAIL",code:rc})} className={`px-3 py-2 rounded-lg border text-sm font-mono cursor-pointer min-h-[40px] ${present?"bg-[var(--red-d)] border-[rgba(239,68,68,.2)] text-[var(--red)]":"bg-[var(--bg3)] border-[var(--bdr)] text-[var(--t3)]"}`}>{rc}{present?" ●":""}</button>;})}</div></Card>}
  </div>;
}

/* ── Guides ──────────────────────────────────────────── */
function GuideList({v,s,d}){
  const guides=Object.values(GUIDE_DB).filter(g=>g.vehicle.includes(v.model)||g.vehicle.includes(v.make));
  const ints=INTERVAL_DEFS[v.id]||[];const withoutGuide=ints.filter(i=>!i.guideKey);
  const dc={Beginner:"green",Intermediate:"orange",Advanced:"red"};
  return <div><h2 className="text-lg font-bold mb-1">How-To Guides</h2><p className="text-[var(--t3)] text-sm mb-6">{v.year} {v.make} {v.model}</p>
    {guides.length>0&&<div className="space-y-3 mb-8">{guides.map(g=>{const active=g.relatedCodes?.some(rc=>s.codes.some(c=>c.vehicleId===v.id&&c.code===rc&&c.status==="active"));return <Card key={g.title} cls="p-4" onClick={()=>d({type:"GUIDE_DETAIL",key:Object.keys(GUIDE_DB).find(k=>GUIDE_DB[k]===g)})}>
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 rounded-lg bg-[var(--bg3)] flex items-center justify-center text-lg shrink-0">📖</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap"><p className="font-semibold text-sm">{g.title}</p>{active&&<Badge c="red">FIX CODE</Badge>}<Badge c={dc[g.difficulty]} cls="hide-mobile">{g.difficulty}</Badge></div>
          <p className="text-[var(--t3)] text-xs mt-1 line-clamp-2">{g.overview.slice(0,120)}...</p>
          <div className="flex gap-3 mt-2 text-xs text-[var(--t3)] flex-wrap"><span>{g.time}</span><span>·</span><span>{g.parts.length} parts</span><span>·</span><span>{g.steps.length} steps</span></div>
        </div>
      </div>
    </Card>;})}</div>}
    {withoutGuide.length>0&&<><h3 className="text-sm font-bold text-[var(--t3)] uppercase tracking-wider mb-3">More Services (guides coming)</h3><div className="space-y-2">{withoutGuide.map(i=><Card key={i.key} cls="p-3 opacity-60"><div className="flex items-center gap-3 min-h-[40px]"><div className="w-8 h-8 rounded-lg bg-[var(--bg3)] flex items-center justify-center text-sm shrink-0">🔧</div><span className="text-[var(--t2)] text-sm flex-1 truncate">{i.name}</span><span className="text-[var(--t3)] text-xs shrink-0">Every {i.miInt.toLocaleString()} mi</span></div></Card>)}</div></>}
  </div>;
}

function GuideDetailPage({gk,v,s,d}){
  const g=GUIDE_DB[gk];
  if(!g)return <div className="fade"><button onClick={()=>d({type:"GUIDE_DETAIL",key:null})} className="text-[var(--t3)] hover:text-[var(--t1)] text-sm mb-6 block cursor-pointer min-h-[44px] flex items-center">← All guides</button><p className="text-center py-16 text-[var(--t2)]">Guide not found.</p></div>;
  const dc={Beginner:"green",Intermediate:"orange",Advanced:"red"};
  const relatedRecords=s.records.filter(r=>r.vehicleId===v.id&&r.service.toLowerCase().includes(g.title.toLowerCase().slice(0,10)));
  const completedSteps=s.guideProgress[gk]||[];
  const pct=g.steps.length?Math.round(completedSteps.length/g.steps.length*100):0;
  const findTorqueForStep=(stepText)=>{
    const t=stepText.toLowerCase();
    return TORQUE_SPECS.filter(ts=>{
      const f=ts.fastener.toLowerCase();
      const keywords=f.split(/[\s\/]+/).filter(w=>w.length>3);
      return keywords.some(k=>t.includes(k))||(t.includes("drain plug")&&f.includes("drain plug"))||(t.includes("fill plug")&&f.includes("fill plug"))||(t.includes("pan bolt")&&f.includes("pan bolt"))||(t.includes("spark")&&f.includes("spark"))||(t.includes("filter")&&t.includes("cap")&&f.includes("filter"))||(t.includes("lug")&&f.includes("lug"))||(t.includes("coil")&&f.includes("coil"))||(t.includes("belly pan")&&f.includes("belly"));
    });
  };
  return <div className="fade max-w-4xl"><button onClick={()=>d({type:"GUIDE_DETAIL",key:null})} className="text-[var(--t3)] hover:text-[var(--t1)] text-sm mb-6 block cursor-pointer min-h-[44px] flex items-center">← All guides</button>
    {/* Header */}
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center gap-3 flex-wrap mb-2"><h2 className="text-xl sm:text-2xl font-black">{g.title}</h2><Badge c={dc[g.difficulty]}>{g.difficulty}</Badge>{g.youtube&&<YouTubeEmbed videoId={g.youtube} title={g.title} isShort={g.youtubeShort}/>}</div>
      <p className="text-[var(--t2)] text-sm">{g.vehicle} · {g.time}</p>
    </div>
    {/* Overview */}
    <Card cls="p-4 sm:p-5 mb-4"><p className="text-[var(--t2)] text-sm leading-relaxed">{g.overview}</p></Card>
    {/* Cost comparison */}
    {(()=>{const diyCost=g.parts.reduce((a,p2)=>a+p2.cost,0);const dealer=g.dealerCost||0;const saved2=dealer-diyCost;const pctSaved=dealer?Math.round((saved2/dealer)*100):0;return dealer?<Card cls="p-4 sm:p-5 mb-4 border-[rgba(34,197,94,.15)]"><SH color="var(--green)">💰 DIY vs Dealer</SH><div className="flex gap-4 sm:gap-6 items-end mb-3 flex-wrap"><div><span className="text-[var(--t3)] text-xs block mb-1">DIY (parts only)</span><span className="text-[var(--green)] text-xl sm:text-2xl font-black font-mono">${diyCost.toFixed(0)}</span></div><div><span className="text-[var(--t3)] text-xs block mb-1">Dealer estimate</span><span className="text-[var(--red)] text-xl sm:text-2xl font-black font-mono line-through opacity-60">${dealer}</span></div><div><span className="text-[var(--t3)] text-xs block mb-1">You save</span><span className="text-[var(--amber)] text-xl sm:text-2xl font-black font-mono">${saved2} <span className="text-sm">({pctSaved}%)</span></span></div></div><div className="relative h-2 bg-[var(--bg)] rounded-full overflow-hidden"><div className="absolute inset-y-0 left-0 bg-[var(--green)] rounded-full" style={{width:`${((diyCost)/dealer)*100}%`}}/></div><p className="text-[var(--t3)] text-xs mt-2">Green = your DIY cost as a percentage of dealer price</p></Card>:null;})()}
    {/* Active codes alert */}
    {g.relatedCodes&&g.relatedCodes.length>0&&s.codes.some(c=>c.vehicleId===v.id&&g.relatedCodes.includes(c.code)&&c.status==="active")&&<div className="rounded-xl border border-[rgba(239,68,68,.15)] bg-[var(--red-d)] p-4 mb-4"><span className="text-[var(--red)] text-xs font-bold uppercase tracking-wider">⚡ Addresses active codes: </span>{g.relatedCodes.filter(rc=>s.codes.some(c=>c.vehicleId===v.id&&c.code===rc&&c.status==="active")).map(rc=><span key={rc} className="text-[var(--amber)] font-mono font-bold ml-2">{rc}</span>)}</div>}
    {/* Specs */}
    {g.specs&&<Card cls="p-4 sm:p-5 mb-4"><SH>Specifications</SH>{Object.entries(g.specs).map(([k,val])=><div key={k} className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-[var(--bdr)] last:border-0 gap-0.5"><span className="text-[var(--t3)] text-sm capitalize">{k.replace(/([A-Z])/g,' $1')}</span><span className="text-[var(--t1)] text-sm font-mono break-all">{val}</span></div>)}</Card>}
    {/* Parts */}
    <Card cls="p-4 sm:p-5 mb-4"><SH>Parts Needed</SH>{g.parts.map((p2,i)=><div key={i} className="py-2.5 border-b border-[var(--bdr)] last:border-0"><div className="flex justify-between items-start"><span className="text-sm font-medium flex-1 min-w-0">{p2.name}</span><span className="text-[var(--amber)] font-bold font-mono text-sm shrink-0 ml-2">${p2.cost.toFixed(2)}</span></div><div className="flex gap-3 mt-0.5 text-xs text-[var(--t3)]"><span className="font-mono">#{p2.pn}</span></div>{p2.notes&&<p className="text-[var(--t3)] text-xs mt-1">{p2.notes}</p>}</div>)}<div className="flex justify-between pt-3 mt-1 text-sm"><span className="font-semibold text-[var(--t2)]">Total Parts Cost</span><span className="font-bold text-[var(--amber)] font-mono">${g.parts.reduce((a,p2)=>a+p2.cost,0).toFixed(2)}</span></div></Card>
    {/* Tools */}
    <Card cls="p-4 sm:p-5 mb-4"><SH>Tools Required</SH><div className="flex flex-wrap gap-2">{g.tools.map((t,i)=><span key={i} className="text-xs bg-[var(--bg)] border border-[var(--bdr)] rounded-lg px-3 py-2 text-[var(--t2)]">{t}</span>)}</div></Card>
    {/* Steps */}
    <Card cls="p-4 sm:p-5 mb-4 border-[var(--amber-d)]">
      <div className="flex items-center justify-between mb-4">
        <SH color="var(--amber)" cls="mb-0">🔧 Walkthrough</SH>
        <div className="flex items-center gap-2"><span className="text-[var(--t3)] text-xs">{completedSteps.length}/{g.steps.length}</span><div className="w-16 sm:w-20 h-1.5 bg-[var(--bg)] rounded-full overflow-hidden"><div className="h-full rounded-full bg-[var(--amber)]" style={{width:`${pct}%`}}/></div><span className="text-[var(--amber)] text-xs font-bold font-mono">{pct}%</span></div>
      </div>
      <div className="space-y-1">{g.steps.map((st,i)=>{const done=completedSteps.includes(st.n||i+1);return <div key={i} className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-all min-h-[48px] ${done?"bg-[var(--green-d)] border border-[rgba(34,197,94,.15)]":"hover:bg-[var(--bg)]"}`} onClick={()=>d({type:"GUIDE_STEP",guideKey:gk,step:st.n||i+1})}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${done?"bg-[var(--green)] text-[var(--bg)]":"bg-[var(--amber-d)]"}`}>{done?<span className="text-sm font-bold">✓</span>:<span className="text-[var(--amber)] font-bold font-mono text-sm">{st.n||i+1}</span>}</div>
        <div className={`flex-1 min-w-0 ${done?"opacity-60":""}`}>
          <h4 className={`font-semibold text-sm mb-0.5 ${done?"line-through":""}`}>{st.title}</h4>
          <p className="text-[var(--t2)] text-sm leading-relaxed">{st.d}</p>
          {(()=>{const ts=findTorqueForStep((st.title+" "+st.d));return ts.length>0?<div className="flex flex-wrap gap-1.5 mt-2">{ts.map((t,j)=><span key={j} className="inline-flex items-center gap-1 text-xs bg-[var(--amber-d)] border border-[rgba(240,168,50,.15)] text-[var(--amber)] rounded px-2 py-1 font-mono font-bold break-all">🔧 {t.fastener}: {t.spec}</span>)}</div>:null;})()}
        </div>
      </div>})}</div>
    </Card>
    {/* Tips */}
    {g.tips&&g.tips.length>0&&<Card cls="p-4 sm:p-5 mb-4"><SH color="var(--cyan)">💡 Tips & Notes</SH>{g.tips.map((t,i)=><div key={i} className="flex items-start gap-2 py-2.5 border-b border-[var(--bdr)] last:border-0"><span className="text-[var(--cyan)] text-sm shrink-0 mt-0.5">•</span><p className="text-[var(--t2)] text-sm leading-relaxed">{t}</p></div>)}</Card>}
    {/* Service history */}
    {relatedRecords.length>0&&<Card cls="p-4 sm:p-5"><SH>Your Service History</SH>{relatedRecords.map((r,i)=><div key={i} className="flex justify-between py-2 border-b border-[var(--bdr)] last:border-0"><div><span className="text-sm">{r.date}</span><span className="text-[var(--t3)] text-xs ml-2">{r.mileage?.toLocaleString()} mi</span></div><span className="text-[var(--green)] font-bold font-mono text-sm">${r.total.toFixed(2)}</span></div>)}</Card>}
  </div>;
}

/* ── Vehicle Specs ───────────────────────────────────── */
function Specs({v}){
  const[tsSearch,setTsSearch]=useState("");
  const[imgIdx,setImgIdx]=useState(0);
  const imgs=v.images||[];
  const rows=[["Nickname",v.nickname],["Year / Make / Model",`${v.year} ${v.make} ${v.model}`],["Trim",v.trim],["VIN",v.vin],["Engine",v.engine],["HP / Torque",`${v.hp} hp / ${v.torque}`],["Transmission",v.transmission],["Drivetrain",v.drivetrain],["Exterior",v.color||"—"],["Interior",v.interior||"—"],["Oil Spec",v.oil_spec],["Oil Capacity",v.oil_capacity],["Coolant",v.coolant],["Brake Fluid",v.brake_fluid||"—"],["Steering",v.steering||"—"],["Tire Size",v.tire_size],["Lug Torque",v.lug_torque||"120 Nm"],["Assembly",v.assembly],["Odometer",v.mileage?v.mileage.toLocaleString()+" mi":"—"]];
  const filteredTS=TORQUE_SPECS.filter(t=>!tsSearch||t.fastener.toLowerCase().includes(tsSearch.toLowerCase())||t.tool.toLowerCase().includes(tsSearch.toLowerCase()));
  return <div className="max-w-4xl">
    {/* Hero image */}
    {imgs.length>0&&<div className="mb-6">
      <div className="relative rounded-2xl overflow-hidden" style={{maxHeight:"320px"}}>
        <img src={imgs[imgIdx]} alt={`${v.nickname}`} className="w-full h-full" style={{objectFit:"cover",maxHeight:"320px"}}/>
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4 sm:p-5">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight" style={{fontFamily:"var(--fd)"}}>{v.nickname}</h2>
          <p className="text-white/70 text-sm">{v.year} {v.make} {v.model} {v.trim}</p>
        </div>
        {imgs.length>1&&<div className="absolute top-3 right-3 flex gap-1.5">
          {imgs.map((_,i)=><button key={i} onClick={()=>setImgIdx(i)} className={`w-3 h-3 rounded-full cursor-pointer transition-all ${i===imgIdx?"bg-[var(--amber)] scale-125":"bg-white/50 hover:bg-white/80"}`}/>)}
        </div>}
        {imgs.length>1&&<>
          <button onClick={()=>setImgIdx(i=>(i-1+imgs.length)%imgs.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center cursor-pointer hover:bg-black/60 text-lg">‹</button>
          <button onClick={()=>setImgIdx(i=>(i+1)%imgs.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center cursor-pointer hover:bg-black/60 text-lg">›</button>
        </>}
      </div>
    </div>}
    {/* Vehicle details */}
    <Card cls="p-4 sm:p-5 mb-6"><SH>Vehicle Details</SH>
      {rows.map(([k,val])=><div key={k} className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-[var(--bdr)] last:border-0 gap-0.5"><span className="text-[var(--t3)] text-sm">{k}</span><span className="text-[var(--t1)] text-sm font-mono break-all">{val}</span></div>)}
    </Card>
    {/* Torque specs — responsive table */}
    <Card cls="p-4 sm:p-5"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3"><SH cls="mb-0">Torque Specifications</SH>
      <input value={tsSearch} onChange={e=>setTsSearch(e.target.value)} placeholder="Search torque specs..." className="bg-[var(--bg)] border border-[var(--bdr)] rounded-lg px-3 py-2 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:border-[var(--amber)] w-full sm:w-48 font-mono min-h-[36px]"/>
    </div>
    {/* Desktop table */}
    <div className="hidden sm:block">
      <div className="grid grid-cols-[1fr_120px_80px_1fr] gap-0 text-xs font-bold text-[var(--t3)] uppercase tracking-wider px-4 py-2.5 bg-[var(--bg3)] border-b border-[var(--bdr)] rounded-t-lg"><span>Fastener</span><span>Torque</span><span>Tool</span><span>Note</span></div>
      {filteredTS.map((t,i)=><div key={i} className={`grid grid-cols-[1fr_120px_80px_1fr] gap-0 px-4 py-2.5 text-sm border-b border-[var(--bdr)] last:border-0 ${i%2===0?"bg-[var(--bg4)]":"bg-[var(--bg3)]"}`}><span className="text-[var(--t1)] font-medium">{t.fastener}</span><span className="text-[var(--amber)] font-bold font-mono">{t.spec}</span><span className="text-[var(--t2)] font-mono text-xs">{t.tool}</span><span className="text-[var(--t3)] text-xs">{t.note}</span></div>)}
    </div>
    {/* Mobile card list */}
    <div className="sm:hidden space-y-2">
      {filteredTS.map((t,i)=><div key={i} className="bg-[var(--bg3)] rounded-lg p-3 border border-[var(--bdr)]">
        <div className="flex justify-between items-start mb-1"><span className="text-sm font-medium text-[var(--t1)]">{t.fastener}</span><span className="text-xs font-mono text-[var(--t2)] shrink-0 ml-2">{t.tool}</span></div>
        <p className="text-[var(--amber)] font-bold font-mono text-sm">{t.spec}</p>
        {t.note&&<p className="text-[var(--t3)] text-xs mt-1">{t.note}</p>}
      </div>)}
    </div>
    </Card>
  </div>;
}

/* ── MechanicAI Chat Panel ──────────────────────────── */
function buildSystemPrompt(v, s) {
  const ints = INTERVAL_DEFS[v.id] || [];
  const vRecs = s.records.filter(r => r.vehicleId === v.id);
  const intStatuses = ints.map(i => ({ name: i.name, ...calcInterval(i, v.mileage, vRecs), note: i.note, diyCost: i.diyCost }));
  const activeCodes = s.codes.filter(c => c.vehicleId === v.id && c.status === "active").map(c => {
    const db = CODE_DB[c.code]; return { code: c.code, type: c.type, name: db?.name, severity: db?.sev, system: db?.system, description: db?.description, repair: db?.repair_guide };
  });
  return `You are MechanicAI, an expert automotive diagnostic assistant embedded in GarageIQ. You are helping a DIY enthusiast with their specific vehicle. Be direct, specific, and actionable. Reference actual part numbers, torque specs, and costs when relevant. Prioritize safety warnings. Use the Ownership Bible data and real diagnostic codes. Vehicle: ${v.year} ${v.make} ${v.model} ${v.trim} | Engine: ${v.engine} | Trans: ${v.transmission} | Mileage: ${v.mileage?.toLocaleString()} mi | VIN: ${v.vin}. Active codes: ${JSON.stringify(activeCodes)}. Service intervals: ${JSON.stringify(intStatuses)}. Recent records: ${JSON.stringify(vRecs.slice(0, 5))}`;
}

function ChatPanel({ open, onClose, s }) {
  const v = s.vehicle;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);
  const inRef = useRef(null);

  useEffect(() => { if (open && inRef.current) inRef.current.focus(); }, [open]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const next = [...messages, { role: "user", content: input.trim() }];
    setMessages(next); setInput(""); setError(null); setLoading(true);
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
      <div className="border-b border-[var(--bdr)] px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-[var(--amber-d)] flex items-center justify-center"><span className="text-lg">🔧</span></div><div><h3 className="font-bold text-sm">MechanicAI</h3><p className="text-[var(--t3)] text-xs">{v ? `${v.nickname||v.model} · ${v.mileage?.toLocaleString()||"?"} mi` : "No vehicle"}</p></div></div>
        <div className="flex items-center gap-2">{messages.length > 0 && <button onClick={() => { setMessages([]); setError(null); }} className="text-[var(--t3)] text-xs cursor-pointer px-2 py-1.5 rounded hover:bg-[var(--bg3)] min-h-[32px]">Clear</button>}<button onClick={onClose} className="text-[var(--t3)] hover:text-[var(--t1)] text-xl cursor-pointer w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--bg3)]">×</button></div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scr">
        {messages.length === 0 && <div className="text-center py-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--amber-d)] flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🔧</span></div>
          <h4 className="font-bold mb-1">MechanicAI</h4>
          <p className="text-[var(--t3)] text-sm mb-6">{v ? `I know ${v.nickname||v.model}'s codes, service history, intervals, and specs.` : "Select a vehicle."}</p>
          {suggestions.map((sg, i) => <button key={i} onClick={() => setInput(sg)} className="block w-full text-left px-4 py-3 rounded-xl bg-[var(--bg4)] border border-[var(--bdr)] hover:border-[var(--bdr2)] text-[var(--t2)] text-sm cursor-pointer mb-2 min-h-[44px]">{sg}</button>)}
        </div>}
        {messages.map((m, i) => <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-[var(--amber)] text-[var(--bg)] rounded-br-md" : "bg-[var(--bg4)] border border-[var(--bdr)] text-[var(--t2)] rounded-bl-md"}`}>{m.role === "assistant" ? renderMd(m.content) : m.content}</div></div>)}
        {loading && <div className="flex justify-start"><div className="bg-[var(--bg4)] border border-[var(--bdr)] rounded-2xl rounded-bl-md px-4 py-3"><div className="flex items-center gap-3"><div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--amber)] pulse"/><div className="w-2 h-2 rounded-full bg-[var(--amber)] pulse" style={{animationDelay:"300ms"}}/><div className="w-2 h-2 rounded-full bg-[var(--amber)] pulse" style={{animationDelay:"600ms"}}/></div><span className="text-[var(--t3)] text-xs font-medium">Diagnosing...</span></div></div></div>}
        {error && <div className="text-center"><p className="text-[var(--red)] text-xs">{error}</p></div>}
        <div ref={endRef}/>
      </div>
      <div className="border-t border-[var(--bdr)] px-4 py-3 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea ref={inRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} placeholder={v ? `Ask about ${v.nickname||v.model}...` : "Select a vehicle..."} disabled={loading} rows={1} className="flex-1 bg-[var(--bg)] border border-[var(--bdr)] rounded-xl px-4 py-2.5 text-sm text-[var(--t1)] placeholder:text-[var(--t3)] focus:outline-none focus:border-[var(--amber)] resize-none" style={{minHeight:"42px",maxHeight:"120px"}} onInput={e=>{e.target.style.height="42px";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}}/>
          <button onClick={send} disabled={!input.trim()||loading} className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${input.trim()&&!loading?"bg-[var(--amber)] text-[var(--bg)] cursor-pointer hover:brightness-110":"bg-[var(--bg3)] text-[var(--t3)] cursor-not-allowed"}`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
        </div>
        <p className="text-[var(--t4)] text-xs mt-2 text-center">Context-aware assistant · Not a substitute for professional diagnosis</p>
      </div>
    </div>
  </>;
}

export default function App(){
  const[s,d]=useReducer(reducer,INIT);
  const[chatOpen,setChatOpen]=useState(false);
  return <><style>{CSS}</style>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,500;9..40,700;9..40,800&family=JetBrains+Mono:wght@400;600;700&family=Instrument+Serif&display=swap" rel="stylesheet"/>
    <div style={{fontFamily:"var(--fb)",background:"var(--bg)",color:"var(--t1)",minHeight:"100vh"}}>
    <Dash s={s} d={d}/>
    <button onClick={()=>setChatOpen(true)} className="fixed bottom-6 right-6 z-30 h-12 rounded-2xl bg-[var(--amber)] text-[var(--bg)] shadow-lg shadow-[rgba(240,168,50,.25)] hover:brightness-110 hover:scale-[1.03] transition-all cursor-pointer flex items-center gap-2.5 px-5 group"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span className="font-bold text-sm tracking-tight" style={{fontFamily:"var(--fm)"}}>MechanicAI</span></button>
    <ChatPanel open={chatOpen} onClose={()=>setChatOpen(false)} s={s}/>
  </div></>;
}
