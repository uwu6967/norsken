const STORAGE_KEY = "norsken-layout-v3";
const LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14", "15", "16"];

// Kept off-screen for later: two dobbeltdører on the left wall, servitørdør on the
// bottom wall, vindu along the top (glass is smaller than the whole wall), and a
// corner at the top right. Top-right corner photo still owed.

// ---------------------------------------------------------------------------
// MÅL / MEASUREMENTS
// Everything real is stored in centimetres. Percentages are only used for
// drawing, and are derived from cm so the map is always to scale.
//
// Room is MEASURED: 13,60 m along the long walls x 7,00 m along the window wall.
// small.d is MEASURED: 132 cm, from the tape photo of the round table laid for
// six (IMG_2481/2482, 2026-09-21). big and the plates are still PLACEHOLDERS
// (dims.est), and big was raised to 160 because the "lite" turned out to be
// 132 — the old 110 guess was smaller than the small table.
// Bump DIMS_VERSION whenever a placeholder changes, so an existing browser
// picks it up without clobbering a size the user really measured.
// ---------------------------------------------------------------------------
const DIMS_VERSION = 7;
const DEFAULT_DIMS = {
  v: DIMS_VERSION,
  room: { w: 700, h: 1360 },
  small: { d: 132 },
  big: { d: 160 },
  // Bordplater — tabletop panels fetched from storage and set on bases to
  // build a long table. Three sizes. All still PLACEHOLDERS.
  // A plate fills part of the GAP between two tables. `w` is how much gap it
  // fills; `l` is its length across the table. `n` is how many exist.
  // SEVERAL plates go into one gap side by side (user drawing, 2026-09-22),
  // so the board solves gap -> combination, not gap -> one plate.
  // plateS.w 37 and plateM.w 49.5 are MEASURED (tape photos IMG_2483-2486,
  // confirmed by the user 2026-09-22). plateL.w is still a guess, and so is
  // every `n` — nobody has counted how many of each the restaurant owns.
  plateS: { w: 37, l: 90, n: 2 },
  plateM: { w: 49.5, l: 90, n: 2 },
  plateL: { w: 80, l: 90, n: 2 },
  // The rectangular table itself ("langbordet i midten"). Plates go BETWEEN
  // two of these; plates are not tables.
  long: { w: 90, l: 220 },
  // Fixed furniture. The big old table in the bottom-left corner, against the
  // bottom wall. Heavy — it does not get moved in service, so it is an
  // obstacle, not a table. Depth 60 cm is MEASURED (IMG_2487-2489). Length 178
  // is worked out from photo IMG_2490 (2026-09-26): the whole top is in frame,
  // and a perspective fit scaled by the folding rule across its end gives
  // 176-181 cm. Not taped, so it keeps its ANSLAG badge until someone does.
  sidebord: { w: 60, l: 178 },
  // Chair widths. chairBig 54 cm is MEASURED (user, IMG_2477/2479, widest point
  // at the front when tucked in). chairSmall is the old small chairs used at
  // table 1 for up to 8 — never measured, so it stays a badged guess.
  chairBig: { d: 54 },
  chairSmall: { d: 45 },
  aisle: 90,
  snap: 10,
  est: {
    small: false,
    big: true,
    plateS: false,
    plateM: false,
    plateL: true,
    long: true,
    sidebord: true,
    chairBig: false,
    chairSmall: true,
  },
};

// Tables you can put on the floor, in tray and drawer order.
const SIZES = ["small", "big", "long"];
// Plate INSERTS. Not tables — they live only in dims and fill gaps.
const PLATES = ["plateS", "plateM", "plateL"];
const SIZE_KINDS = {
  small: "round",
  big: "round",
  long: "plate", // "plate" here is the rectangle KIND, kept for the CSS class
  sidebord: "furniture",
};
const isPlate = (size) => SIZE_KINDS[size] === "plate";

const i18n = {
  no: {
    kicker: "Spisestua · oppsett",
    hint: "Blanke bord i lageret. Nummer følger plassen: 1 nede til venstre, 6 oppe til høyre, 16 i midten oppe. Høyre side er 6–10, og 11 hvis det trengs.",
    tray: "Lager / ikke i bruk",
    print: "Skriv ut / PDF",
    reset: "Tomt rom",
    measure: "Mål",
    grid: "Rutenett",
    rotate: "Roter",
    toTray: "Til lager",
    small: "Lite",
    big: "Stort",
    long: "Langbord",
    plateS: "liten plate",
    plateM: "medium plate",
    plateL: "stor plate",
    add: { small: "+ lite", big: "+ stort", long: "+ langbord" },
    kinds: { small: "Lite bord", big: "Stort bord", long: "Langbord" },
    panelTitle: "Mål i cm",
    panelNote: "Bordmålene er anslag til du måler dem. Skriv inn ekte cm, så tegnes kartet riktig.",
    roomW: "Rom · bredde (vindusvegg)",
    roomH: "Rom · lengde",
    smallD: "Lite bord · diameter",
    bigD: "Stort bord · diameter",
    plateSW: "Liten plate · fyller",
    plateSN: "Liten plate · antall",
    plateMW: "Medium plate · fyller",
    plateMN: "Medium plate · antall",
    plateLW: "Stor plate · fyller",
    plateLN: "Stor plate · antall",
    longW: "Langbord · bredde",
    longL: "Langbord · lengde",
    aisleLabel: "Minste gangbredde",
    snapLabel: "Rutenett-steg",
    est: "anslag",
    listTitle: "Målliste",
    listEmpty: "Ingen bord på gulvet ennå.",
    colTable: "Bord",
    colSize: "Størrelse",
    colWindow: "Fra vindu",
    colLeft: "Fra venstre vegg",
    colNearest: "Nærmeste bord",
    warnTitle: "For trangt for servitør",
    warnOk: "Alle avstander er minst",
    walls: { top: "vindu", bottom: "servitørdør", left: "dobbeltdør", right: "høyre vegg" },
    furniture: { sidebord: "Gammelt bord" },
    sidebordW: "Gammelt bord · dybde",
    sidebordL: "Gammelt bord · lengde",
    chairBigD: "Stol · bredde",
    chairSmallD: "Liten stol · bredde",
    withChairs: "Med stoler",
    chairNote: "målt fra stolrygg til stolrygg",
    topNote: "målt fra bordkant til bordkant",
    marksTitle: "Merking av plasser",
    marksNote: "Velg en farge og klikk på en stol. Klikk igjen for å fjerne.",
    markNone: "Ingen",
    seats: "Personer",
    nameLabel: "Navn",
    nameHint: "f.eks. Hansen",
    join: "Koble sammen",
    unjoin: "Koble fra",
    groupTitle: "Bordgruppe",
    groupOf: "bord koblet sammen",
    gapLabel: "Mellomrom",
    plateFits: "passer",
    plateClose: "nærmeste",
    plateTooBig: "for stor",
    plateTooSmall: "for liten",
    noPlate: "ingen plate passer",
    plateRack: "Bordplater",
    plateRackNote: "Dra en plate ned i mellomrommet mellom to bord. Bordene flytter seg så platen passer nøyaktig.",
    plateFills: "fyller",
    plateLeft: "igjen",
    plateNoneLeft: "Alle platene er i bruk.",
    plateNeedsTwo: "Sett ned to bord først — en plate går imellom dem.",
    plateRemoveHint: "Klikk for å ta bort",
    gapEmpty: "ingen plate lagt inn",
    gapSuggest: "forslag",
    needPlate: "Trenger plate",
    numberLabel: "Nummer",
    auto: "Auto",
    manualHint: "f.eks. 1a",
    manualTag: "manuelt",
    dupTitle: "Samme nummer brukt flere ganger",
    position: "Plassering",
    clearance: "Klaring",
    nearest: "Nærmeste",
    nudge: "Flytt",
    none: "ingen",
    scale: "1 rute = 1 m",
  },
  en: {
    kicker: "Dining room · layout",
    hint: "Storage is blank. Numbers follow the room: 1 bottom left, 6 top right, 16 middle top. The right side is 6–10, and 11 only if that extra table is there.",
    tray: "Storage / not in use",
    print: "Print / PDF",
    reset: "Empty room",
    measure: "Measure",
    grid: "Grid",
    rotate: "Rotate",
    toTray: "To storage",
    small: "Small",
    big: "Large",
    long: "Long table",
    plateS: "small plate",
    plateM: "medium plate",
    plateL: "large plate",
    add: { small: "+ small", big: "+ large", long: "+ long table" },
    kinds: { small: "Small table", big: "Large table", long: "Long table" },
    panelTitle: "Measurements in cm",
    panelNote: "Table sizes are estimates until you measure them. Type the real cm and the map redraws to scale.",
    roomW: "Room · width (window wall)",
    roomH: "Room · length",
    smallD: "Small table · diameter",
    bigD: "Large table · diameter",
    plateSW: "Small plate · fills",
    plateSN: "Small plate · count",
    plateMW: "Medium plate · fills",
    plateMN: "Medium plate · count",
    plateLW: "Large plate · fills",
    plateLN: "Large plate · count",
    longW: "Long table · width",
    longL: "Long table · length",
    aisleLabel: "Minimum aisle",
    snapLabel: "Grid step",
    est: "est.",
    listTitle: "Measurement list",
    listEmpty: "No tables on the floor yet.",
    colTable: "Table",
    colSize: "Size",
    colWindow: "From window",
    colLeft: "From left wall",
    colNearest: "Nearest table",
    warnTitle: "Too tight for a waitress",
    warnOk: "Every gap is at least",
    walls: { top: "window", bottom: "waitress door", left: "double doors", right: "right wall" },
    furniture: { sidebord: "Old table" },
    sidebordW: "Old table · depth",
    sidebordL: "Old table · length",
    chairBigD: "Chair · width",
    chairSmallD: "Small chair · width",
    withChairs: "With chairs",
    chairNote: "measured chair back to chair back",
    topNote: "measured tabletop to tabletop",
    marksTitle: "Seat marking",
    marksNote: "Pick a colour, then click a chair. Click again to clear.",
    markNone: "None",
    seats: "People",
    nameLabel: "Name",
    nameHint: "e.g. Hansen",
    join: "Join together",
    unjoin: "Separate",
    groupTitle: "Table group",
    groupOf: "tables joined",
    gapLabel: "Gap",
    plateFits: "fits",
    plateClose: "closest",
    plateTooBig: "too big",
    plateTooSmall: "too small",
    noPlate: "no plate fits",
    plateRack: "Table plates",
    plateRackNote: "Drag a plate into the gap between two tables. The tables move so the plate fits exactly.",
    plateFills: "fills",
    plateLeft: "left",
    plateNoneLeft: "Every plate is in use.",
    plateNeedsTwo: "Put two tables down first — a plate goes between them.",
    plateRemoveHint: "Click to remove",
    gapEmpty: "no plate inserted",
    gapSuggest: "suggestion",
    needPlate: "Plate needed",
    numberLabel: "Number",
    auto: "Auto",
    manualHint: "e.g. 1a",
    manualTag: "manual",
    dupTitle: "Same number used more than once",
    position: "Position",
    clearance: "Clearance",
    nearest: "Nearest",
    nudge: "Nudge",
    none: "none",
    scale: "1 square = 1 m",
  },
};

function uid() {
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeTable(size, zone = "tray") {
  const table = { id: uid(), label: "", zone, x: 50, y: 50, rotated: false, plates: null, gapPlates: null };
  applySize(table, size);
  return table;
}

function starterTables() {
  return [
    ...Array.from({ length: 8 }, () => makeTable("small")),
    ...Array.from({ length: 6 }, () => makeTable("big")),
    makeTable("long"),
    makeTable("long"),
  ];
}

// Fixed furniture: never numbered, never goes to the tray, but it takes up
// floor space, so it counts for clearances and the aisle check.
function defaultFurniture() {
  return [{ id: "sidebord", size: "sidebord", wall: "bottom", along: 20 }];
}

// The old table was anchored to the LEFT wall until 2026-09-22. The user says
// it stands along the BOTTOM wall in the bottom-left corner. Move a saved one
// across once; after that they are free to slide it along that wall.
function migrateFurniture(list) {
  for (const item of list || []) {
    if (item.id === "sidebord" && item.wall !== "bottom") {
      item.wall = "bottom";
      item.along = 20;
    }
  }
  return list;
}

// Derive x/y percent from the wall anchor so furniture can reuse every
// table helper (centerCm, tableCm, clearances, gapCm).
function syncFurniture() {
  const r = room();
  for (const item of state.furniture) {
    item.kind = SIZE_KINDS[item.size] || "furniture";
    item.rotated = item.wall === "top" || item.wall === "bottom";
    const s = tableCm(item);
    if (item.wall === "left") {
      item.x = (s.w / 2 / r.w) * 100;
      item.y = Math.min(100 - (s.h / 2 / r.h) * 100, Math.max((s.h / 2 / r.h) * 100, item.along));
    } else if (item.wall === "right") {
      item.x = 100 - (s.w / 2 / r.w) * 100;
      item.y = Math.min(100 - (s.h / 2 / r.h) * 100, Math.max((s.h / 2 / r.h) * 100, item.along));
    } else if (item.wall === "top") {
      item.y = (s.h / 2 / r.h) * 100;
      item.x = Math.min(100 - (s.w / 2 / r.w) * 100, Math.max((s.w / 2 / r.w) * 100, item.along));
    } else {
      item.y = 100 - (s.h / 2 / r.h) * 100;
      item.x = Math.min(100 - (s.w / 2 / r.w) * 100, Math.max((s.w / 2 / r.w) * 100, item.along));
    }
  }
}

function getFurniture(id) {
  return state.furniture.find((item) => item.id === id);
}

// Everything on the floor that a waitress has to walk around.
function obstacles() {
  return [...roomTables(), ...state.furniture];
}

function defaultFixtures() {
  return [
    { id: "double-1", wall: "left", along: 24 },
    { id: "double-2", wall: "left", along: 68 },
    { id: "waitress", wall: "bottom", along: 50 },
  ];
}

function cloneDims() {
  return JSON.parse(JSON.stringify(DEFAULT_DIMS));
}

function defaultState() {
  return {
    lang: "no",
    selected: null,
    showGrid: true,
    showMeasure: false,
    withChairs: true,
    dims: cloneDims(),
    tables: starterTables(),
    fixtures: defaultFixtures(),
    furniture: defaultFurniture(),
  };
}

// Saved dims win over defaults, EXCEPT for a size the user never measured
// (est === true) when the defaults have moved on to a newer DIMS_VERSION.
// That way a better placeholder reaches an existing browser, and a number the
// user actually measured is never overwritten.
function mergeDims(saved) {
  const dims = cloneDims();
  if (!saved || typeof saved !== "object") return dims;
  const stale = saved.v !== DIMS_VERSION;
  const wasEst = (size) => saved.est?.[size] !== false;
  const take = (size, target, source) => {
    if (!source) return;
    if (stale && wasEst(size)) return; // keep the newer placeholder
    Object.assign(target, source);
  };
  if (saved.room) Object.assign(dims.room, saved.room);
  take("small", dims.small, saved.small);
  take("big", dims.big, saved.big);
  // v2 and earlier had a single `long`; it becomes the large plate.
  take("long", dims.long, saved.long);
  take("plateS", dims.plateS, saved.plateS);
  take("plateM", dims.plateM, saved.plateM);
  take("plateL", dims.plateL, saved.plateL);
  take("sidebord", dims.sidebord, saved.sidebord);
  take("chairBig", dims.chairBig, saved.chairBig);
  take("chairSmall", dims.chairSmall, saved.chairSmall);
  if (Number.isFinite(saved.aisle)) dims.aisle = saved.aisle;
  if (Number.isFinite(saved.snap)) dims.snap = saved.snap;
  if (saved.est) {
    for (const size of [...SIZES, ...PLATES, "sidebord", "chairBig", "chairSmall"]) {
      if (saved.est[size] === false) dims.est[size] = false;
      else if (!stale) dims.est[size] = DEFAULT_DIMS.est[size];
    }
  }
  dims.v = DIMS_VERSION;
  return dims;
}

function loadState() {
  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    parsed = null;
  }
  return normalizeState(parsed);
}

// Shared by the local cache and the shared plan (db). Pure: runs before
// `state` exists and again for every remote update.
function normalizeState(parsed) {
  try {
    if (!parsed?.tables?.length) return defaultState();
    const next = { ...defaultState(), ...parsed };
    if (!next.fixtures?.length) next.fixtures = defaultFixtures();
    if (!next.furniture?.length) next.furniture = defaultFurniture();
    else migrateFurniture(next.furniture);
    next.dims = mergeDims(parsed.dims);
    next.showGrid = parsed.showGrid !== false;
    next.withChairs = parsed.withChairs !== false;
    next.showMeasure = parsed.showMeasure === true;
    for (const table of next.tables) {
      // v3/v4 briefly modelled plates as tables; they are inserts, so a plate
      // left on the floor becomes the rectangular table it really was.
      if (PLATES.includes(table.size)) table.size = "long";
      if (!SIZE_KINDS[table.size]) table.size = "small";
      table.kind = SIZE_KINDS[table.size];
      table.rotated = Boolean(table.rotated);
      const c = table.custom;
      table.custom =
        c && Number.isFinite(c.w) && Number.isFinite(c.l)
          ? { w: Math.min(400, Math.max(30, c.w)), l: Math.min(900, Math.max(50, c.l)) }
          : null;
      table.plates = null; // old cover-tracking field, not used any more
      // Plates inserted in the gap above this table. Only a grouped floor
      // table can hold any, and only real plate sizes count.
      const inserted = Array.isArray(table.gapPlates)
        ? table.gapPlates.filter((size) => PLATES.includes(size))
        : null;
      table.gapPlates = table.zone === "room" && table.group && inserted?.length ? inserted : null;
    }
    // A group's first table has nothing above it, and a group of one is not a
    // group at all.
    // NOTE: this runs BEFORE `state` exists, so it must not call orderGroup /
    // centerCm / room() — those read `state` and would throw into the catch
    // below, silently resetting the user's whole layout. Percentages sort the
    // same way centimetres do, so order on those directly.
    const byGroup = new Map();
    for (const table of next.tables) {
      if (table.zone !== "room" || !table.group) continue;
      if (!byGroup.has(table.group)) byGroup.set(table.group, []);
      byGroup.get(table.group).push(table);
    }
    for (const members of byGroup.values()) {
      if (members.length < 2) {
        for (const member of members) {
          member.group = null;
          member.gapPlates = null;
        }
        continue;
      }
      const xs = members.map((m) => m.x);
      const ys = members.map((m) => m.y);
      const vertical = Math.max(...ys) - Math.min(...ys) >= Math.max(...xs) - Math.min(...xs);
      const sorted = members
        .slice()
        .sort((a, b) => (vertical ? a.y - b.y || a.x - b.x : a.x - b.x || a.y - b.y));
      sorted[0].gapPlates = null;
    }
    return next;
  } catch {
    return defaultState();
  }
}

let state = loadState();
let drag = null;

// --- measurement helpers ---------------------------------------------------

function room() {
  return state.dims.room;
}

// Langbord are NOT all the same size (user, 2026-11-11), so each one can carry
// its own measured width x length in table.custom. Without it the table uses
// the default langbord size from Mål.
function customCm(table) {
  const c = table && table.size === "long" ? table.custom : null;
  return c && Number.isFinite(c.w) && Number.isFinite(c.l) ? c : null;
}

function sizeCm(table) {
  const own = customCm(table);
  if (own) return { w: own.w, h: own.l };
  const spec = state.dims[table.size] || state.dims.small;
  if (spec.d != null) return { w: spec.d, h: spec.d };
  return { w: spec.w, h: spec.l };
}

function tableCm(table) {
  const s = sizeCm(table);
  return table.rotated ? { w: s.h, h: s.w } : { w: s.w, h: s.h };
}

function tableDims(table) {
  const cm = tableCm(table);
  const r = room();
  return { w: (cm.w / r.w) * 100, h: (cm.h / r.h) * 100 };
}

function centerCm(table) {
  const r = room();
  return { x: (table.x / 100) * r.w, y: (table.y / 100) * r.h };
}

function snapTo(value) {
  const step = state.dims.snap;
  if (!step || step < 1) return value;
  return Math.round(value / step) * step;
}

function setCenterCm(table, pos, useSnap = true) {
  const r = room();
  const s = tableCm(table);
  let x = useSnap ? snapTo(pos.x) : pos.x;
  let y = useSnap ? snapTo(pos.y) : pos.y;
  x = Math.min(r.w - s.w / 2, Math.max(s.w / 2, x));
  y = Math.min(r.h - s.h / 2, Math.max(s.h / 2, y));
  table.x = (x / r.w) * 100;
  table.y = (y / r.h) * 100;
}

function clampAll() {
  for (const table of state.tables) {
    if (table.zone === "room") setCenterCm(table, centerCm(table), false);
  }
}

function clearances(table) {
  const c = centerCm(table);
  const s = tableCm(table);
  const r = room();
  return {
    top: c.y - s.h / 2,
    bottom: r.h - (c.y + s.h / 2),
    left: c.x - s.w / 2,
    right: r.w - (c.x + s.w / 2),
  };
}

// How much floor the table really takes: the top, plus the chairs round it.
// Chair centre sits at edge + chair*0.62, so the outer edge is + chair*1.12.
function occupiedCm(table, withChairs) {
  const s = tableCm(table);
  if (!withChairs || table.kind === "furniture") return s;
  if (!seatsOf(table).length) return s;
  const pad = Math.max(20, state.dims.chairBig.d) * 1.12 * 2;
  return { w: s.w + pad, h: s.h + pad };
}

function gapCm(a, b, withChairs = false) {
  const ca = centerCm(a);
  const cb = centerCm(b);
  const sa = occupiedCm(a, withChairs);
  const sb = occupiedCm(b, withChairs);
  if (a.kind === "round" && b.kind === "round") {
    return Math.hypot(ca.x - cb.x, ca.y - cb.y) - sa.w / 2 - sb.w / 2;
  }
  const dx = Math.abs(ca.x - cb.x) - (sa.w + sb.w) / 2;
  const dy = Math.abs(ca.y - cb.y) - (sa.h + sb.h) / 2;
  if (dx > 0 && dy > 0) return Math.hypot(dx, dy);
  return Math.max(dx, dy);
}

function nearest(table) {
  let best = null;
  for (const other of obstacles()) {
    if (other === table) continue;
    // the gap to your own group is the plate, not a problem
    if (table.group && other.group === table.group) continue;
    const gap = gapCm(table, other, state.withChairs);
    if (!best || gap < best.gap) best = { table: other, gap };
  }
  return best;
}

// What to call something in a warning or a "nearest" line.
function obstacleName(item) {
  const copy = t();
  if (item.kind === "furniture") return copy.furniture[item.size] || item.size;
  return `${copy.colTable} ${item.label}`;
}

function tightPairs() {
  const items = obstacles();
  const out = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      // two bits of fixed furniture are not a passage problem to solve here
      if (items[i].kind === "furniture" && items[j].kind === "furniture") continue;
      // members of one joined table are meant to have a gap — that is the plate
      if (items[i].group && items[i].group === items[j].group) continue;
      const gap = gapCm(items[i], items[j], state.withChairs);
      if (gap < state.dims.aisle) out.push({ a: items[i], b: items[j], gap });
    }
  }
  return out.sort((x, y) => x.gap - y.gap);
}

function fmt(cm) {
  if (cm == null || !Number.isFinite(cm)) return "–";
  const dec = state.lang === "en" ? "." : ",";
  const v = Math.round(cm);
  if (Math.abs(v) >= 100) return `${(v / 100).toFixed(2).replace(".", dec)} m`;
  return `${v} cm`;
}

// A plate can be 49,5 cm. Never round that to 50 — the whole point of the
// board is that the number is the measured one.
function cmNum(value) {
  if (!Number.isFinite(value)) return "–";
  const dec = state.lang === "en" ? "." : ",";
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", dec);
}

function sizeLabelCm(table) {
  const copy = t();
  const s = sizeCm(table);
  const tag = state.dims.est[table.size] ? ` (${copy.est})` : "";
  const spec = state.dims[table.size];
  const own = customCm(table);
  if (own) return `${copy[table.size]} ${cmNum(own.w)}×${cmNum(own.l)} cm`;
  if (isPlate(table.size)) return `${copy[table.size]} ${spec.w}×${spec.l} cm${tag}`;
  // (round below)
  return `${copy[table.size]} ⌀${Math.round(s.w)} cm${tag}`;
}

function applySize(table, size) {
  table.size = size;
  table.kind = SIZE_KINDS[size] || "round";
  // rotation is kept across a size change: for a rectangle it swaps w/h, for
  // a round table it offsets the chair ring. Both stay meaningful.
  if (table.zone === "room") setCenterCm(table, centerCm(table), false);
}

// --- state plumbing --------------------------------------------------------

function save() {
  const r = room();
  for (const table of state.tables) {
    const cm = tableCm(table);
    table.w = (cm.w / r.w) * 100;
    table.h = (cm.h / r.h) * 100;
    // print.html reads the cover count straight off the saved table. Baked
    // HERE, not in relabelRoom() — changing the people count does not
    // renumber the room, so relabelRoom() never runs for it.
    table.guests = table.zone === "room" ? seatsOf(table).length : null;
    // baked for print.html so it never has to redo the seat geometry
    table.seatsRender =
      table.zone === "room"
        ? seatsOf(table).map((seat) => ({
            x: (seat.pos.x / r.w) * 100,
            y: (seat.pos.y / r.h) * 100,
            mark: seat.mark || null,
          }))
        : null;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // private window / blocked storage: the page still works for this visit
  }
  scheduleShare();
}

// --- shared plan -----------------------------------------------------------
// When the board runs as a hosted Claude artifact, the layout lives in the
// artifact's db so the boss and every waitress see the SAME plan. Only the
// floor plan is shared; language, grid/chair toggles and the selection stay
// per person. Opened as a plain local file, none of this runs and the board
// keeps using localStorage only.
const SHARED_DOC = "plan/current";
const SHARED_KEYS = ["tables", "fixtures", "furniture", "dims"];
const CLIENT_ID = Math.random().toString(36).slice(2);
const share = { db: null, ready: false, timer: null, lastSent: "", canWrite: true, status: "local", at: null };

function sharedPayload() {
  const out = {};
  for (const key of SHARED_KEYS) out[key] = state[key];
  return out;
}

function scheduleShare() {
  if (!share.db || !share.ready || !share.canWrite) return;
  clearTimeout(share.timer);
  share.timer = setTimeout(pushShare, 700);
}

async function pushShare() {
  if (!share.db || drag) {
    if (drag) scheduleShare();
    return;
  }
  const body = JSON.stringify(sharedPayload());
  if (body === share.lastSent) return;
  share.lastSent = body;
  setShareStatus("saving");
  try {
    await share.db.doc(SHARED_DOC).set({ plan: body, writer: CLIENT_ID, at: Date.now() });
    setShareStatus("saved", Date.now());
  } catch (error) {
    share.lastSent = "";
    const msg = String(error?.code || error?.message || "");
    if (/perm|denied|forbid|role|level/i.test(msg)) {
      share.canWrite = false;
      setShareStatus("readonly");
    } else {
      setShareStatus("error");
    }
  }
}

function applyRemote(doc) {
  if (!doc || typeof doc.plan !== "string") return;
  if (doc.plan === share.lastSent) return; // our own echo
  let remote;
  try {
    remote = JSON.parse(doc.plan);
  } catch {
    return;
  }
  const view = { lang: state.lang, showGrid: state.showGrid, showMeasure: state.showMeasure, withChairs: state.withChairs, brush: state.brush };
  const keepSelected = state.selected;
  const next = normalizeState({ ...view, ...remote });
  Object.assign(next, view);
  next.selected = next.tables.some((table) => table.id === keepSelected) ? keepSelected : null;
  state = next;
  share.lastSent = doc.plan;
  syncFurniture();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  setShareStatus("saved", doc.at);
  render();
}

function setShareStatus(status, at) {
  share.status = status;
  if (at) share.at = at;
  const el = document.getElementById("sync-status");
  if (!el) return;
  el.hidden = false;
  const en = state.lang === "en";
  const time = share.at ? new Date(share.at).toLocaleTimeString(en ? "en-GB" : "nb-NO", { hour: "2-digit", minute: "2-digit" }) : "";
  const text = {
    connecting: en ? "Connecting…" : "Kobler til…",
    saving: en ? "Saving…" : "Lagrer…",
    saved: en ? `Shared plan · ${time}` : `Delt plan · ${time}`,
    readonly: en ? "View only" : "Kun visning",
    error: en ? "Not saved – retrying" : "Ikke lagret – prøver igjen",
    local: en ? "Only on this device" : "Bare på denne enheten",
  }[status];
  el.textContent = text || "";
  el.dataset.status = status;
  if (status === "error") setTimeout(scheduleShare, 4000);
}

async function connectShare() {
  if (!window.claude?.use) return;
  setShareStatus("connecting");
  let db = null;
  try {
    db = await window.claude.use("db");
  } catch {
    db = null;
  }
  if (!db) {
    setShareStatus("local");
    return;
  }
  share.db = db;
  let first = true;
  const giveUp = setTimeout(() => {
    if (first) {
      share.ready = true; // db is slow: keep working, pushes will follow
      setShareStatus("error");
    }
  }, 10000);
  try {
    db.doc(SHARED_DOC).onSnapshot(
      (snap) => {
        const data = snap && typeof snap.data === "function" ? snap.data() : snap;
        if (first) {
          first = false;
          clearTimeout(giveUp);
          share.ready = true;
          if (data && typeof data.plan === "string") applyRemote(data);
          else pushShare(); // empty db: this device's layout becomes the plan
          if (!data) setShareStatus("saving");
          return;
        }
        if (data && data.writer !== CLIENT_ID && !drag) applyRemote(data);
      },
      () => {
        clearTimeout(giveUp);
        share.ready = true;
        setShareStatus("error");
      },
    );
  } catch {
    clearTimeout(giveUp);
    setShareStatus("local");
  }
}

// A one-shot message under the plate rack ("put two tables down first").
// Deliberately NOT part of state — it must not survive a reload.
let trayHint = "";

function t() {
  return i18n[state.lang];
}

function getTable(id) {
  return state.tables.find((item) => item.id === id);
}

function roomTables() {
  return state.tables.filter((item) => item.zone === "room");
}

function trayTables() {
  return state.tables.filter((item) => item.zone === "tray");
}

const LEFT_MAX = 42;
const RIGHT_MIN = 58;
const TOP_MAX = 26;

// ---------------------------------------------------------------------------
// BORDGRUPPER
// Two tables stood apart with the metal frame spanning the gap, and a
// "plate" (bordplate) dropped into that gap to make one long table. So a
// plate is an INSERT, not a table of its own, and the question the user
// actually asks is "which plate fills this gap?".
// A joined set is ONE table with ONE number (user, 2026-09-22).
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// SETEMERKER / SEAT MARKS
// Colour is the quick cue; the LETTER is the identity. Eight categorical
// colours cannot be told apart reliably when any two can sit side by side --
// validated: worst normal-vision pair dE 7.1 (red/orange, floor is 15) and
// worst colour-blind pair dE 3.2 (green/orange, protan). So every marked seat
// carries its code, which also survives a black-and-white printout.
// Hues are the validated reference categorical order.
// ---------------------------------------------------------------------------
const SEAT_MARKS = [
  { key: "gluten", color: "#2a78d6", code: "G", no: "Gluten", en: "Gluten" },
  { key: "laktose", color: "#eb6834", code: "L", no: "Laktose", en: "Lactose" },
  { key: "notter", color: "#1baf7a", code: "N", no: "Nøtter", en: "Nuts" },
  { key: "skalldyr", color: "#eda100", code: "S", no: "Skalldyr", en: "Shellfish" },
  { key: "diabetes", color: "#e87ba4", code: "D", no: "Diabetes", en: "Diabetes" },
  { key: "gravid", color: "#008300", code: "Gr", no: "Gravid", en: "Pregnant" },
  { key: "vegetar", color: "#4a3aa7", code: "V", no: "Vegetar", en: "Vegetarian" },
  { key: "annet", color: "#e34948", code: "A", no: "Annet", en: "Other" },
];

function markOf(key) {
  return SEAT_MARKS.find((mark) => mark.key === key) || null;
}

function markName(mark) {
  return state.lang === "en" ? mark.en : mark.no;
}

// Readable ink on each swatch, rather than guessing per colour.
function inkOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const srgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return lum > 0.42 ? "#1d1812" : "#ffffff";
}

const PLATE_TOLERANCE = 5; // cm either way still counts as a fit

function groupsOf(tables) {
  const map = new Map();
  for (const table of tables) {
    if (!table.group) continue;
    if (!map.has(table.group)) map.set(table.group, []);
    map.get(table.group).push(table);
  }
  return map;
}

function groupMembers(table) {
  if (!table?.group) return [];
  return roomTables().filter((item) => item.group === table.group);
}

// Which way does the run of a joined set go? A long table built out of two
// round ones can run across the room as well as down it.
function groupAxis(members) {
  if (members.length < 2) return "y";
  const xs = members.map((m) => centerCm(m).x);
  const ys = members.map((m) => centerCm(m).y);
  const dx = Math.max(...xs) - Math.min(...xs);
  const dy = Math.max(...ys) - Math.min(...ys);
  return dy >= dx ? "y" : "x";
}

// Order along the group's run, then pick the first as the one that carries
// the number.
function orderGroup(members) {
  if (members.length < 2) return members.slice();
  const axis = groupAxis(members);
  return members.slice().sort((a, b) => {
    const ca = centerCm(a);
    const cb = centerCm(b);
    return axis === "y" ? ca.y - cb.y || ca.x - cb.x : ca.x - cb.x || ca.y - cb.y;
  });
}

// ---------------------------------------------------------------------------
// PLATES IN A GAP
// A plate is a real object the restaurant owns, so the board tracks the ones
// actually inserted rather than only suggesting a combination. `gapPlates`
// lives on the DOWNSTREAM member of a pair and lists the plate sizes filling
// the gap above/left of it. The gap is then made to equal their total — you
// do not measure it by hand, you drop plates in and the tables move apart.
// ---------------------------------------------------------------------------
function plateWidth(size) {
  const spec = state.dims[size];
  return spec && spec.w > 0 ? spec.w : 0;
}

function gapPlatesOf(table) {
  return Array.isArray(table?.gapPlates) ? table.gapPlates : [];
}

function gapWidthOf(table) {
  return gapPlatesOf(table).reduce((sum, size) => sum + plateWidth(size), 0);
}

function platesUsed() {
  const used = {};
  for (const size of PLATES) used[size] = 0;
  for (const table of roomTables()) {
    for (const size of gapPlatesOf(table)) {
      if (used[size] != null) used[size] += 1;
    }
  }
  return used;
}

function plateOwned(size) {
  const n = state.dims[size]?.n;
  return Math.max(0, Math.min(12, Math.round(Number.isFinite(n) ? n : 0)));
}

function plateStock(size) {
  return Math.max(0, plateOwned(size) - platesUsed()[size]);
}

function halfAlong(table, axis) {
  const s = tableCm(table);
  return (axis === "y" ? s.h : s.w) / 2;
}

// Re-space a joined set so every gap equals the plates inserted in it, and
// every member lines up on the same centre line. `anchorId` stays put.
function respaceGroup(groupId, anchorId) {
  const members = roomTables().filter((item) => item.group === groupId);
  if (members.length < 2) return;
  const sorted = orderGroup(members);
  const axis = groupAxis(members);
  const cross = axis === "y" ? "x" : "y";
  let anchorIndex = sorted.findIndex((item) => item.id === anchorId);
  if (anchorIndex < 0) anchorIndex = 0;
  const line = centerCm(sorted[anchorIndex])[cross];

  for (let i = anchorIndex + 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const pc = centerCm(prev);
    const pos = { x: pc.x, y: pc.y };
    pos[axis] = pc[axis] + halfAlong(prev, axis) + gapWidthOf(cur) + halfAlong(cur, axis);
    pos[cross] = line;
    setCenterCm(cur, pos, false);
  }
  for (let i = anchorIndex - 1; i >= 0; i -= 1) {
    const next = sorted[i + 1];
    const cur = sorted[i];
    const nc = centerCm(next);
    const pos = { x: nc.x, y: nc.y };
    pos[axis] = nc[axis] - halfAlong(next, axis) - gapWidthOf(next) - halfAlong(cur, axis);
    pos[cross] = line;
    setCenterCm(cur, pos, false);
  }
}

// Pairs that can take a plate: neighbours in a joined set, or any two tables
// not yet joined. Non-adjacent members of one group are skipped — a plate
// cannot span straight through the table in the middle.
function gapCandidates() {
  const tables = roomTables();
  const out = [];
  for (let i = 0; i < tables.length; i += 1) {
    for (let j = i + 1; j < tables.length; j += 1) {
      const a = tables[i];
      const b = tables[j];
      if (a.group && a.group === b.group) {
        const sorted = orderGroup(groupMembers(a));
        if (Math.abs(sorted.indexOf(a) - sorted.indexOf(b)) !== 1) continue;
      }
      out.push({ a, b });
    }
  }
  return out;
}

const GAP_REACH = 260; // cm from the drop point to the middle of a gap

function findGap(pointCm) {
  let best = null;
  for (const pair of gapCandidates()) {
    const band = gapBand(pair.a, pair.b);
    const mid = band.vertical
      ? { x: band.center, y: band.start + band.length / 2 }
      : { x: band.start + band.length / 2, y: band.center };
    const d = Math.hypot(mid.x - pointCm.x, mid.y - pointCm.y);
    if (!best || d < best.d) best = { a: pair.a, b: pair.b, d };
  }
  if (!best || best.d > GAP_REACH) return null;
  return best;
}

// Drop a plate into the gap between two tables. Joins them if needed, then
// pulls them to exactly the distance the plates fill.
function addPlate(a, b, size) {
  if (plateStock(size) <= 0) return false;
  const joined = a.group && a.group === b.group;
  const groupId = joined ? a.group : `g-${uid()}`;
  if (!joined) {
    for (const item of [a, b]) {
      const existing = item.group ? groupMembers(item) : [item];
      for (const member of existing) member.group = groupId;
    }
  }
  const sorted = orderGroup(roomTables().filter((item) => item.group === groupId));
  const ia = sorted.indexOf(a);
  const ib = sorted.indexOf(b);
  if (ia < 0 || ib < 0 || Math.abs(ia - ib) !== 1) return false;
  const upstream = sorted[Math.min(ia, ib)];
  const downstream = sorted[Math.max(ia, ib)];
  sorted[0].gapPlates = null;
  for (let i = 1; i < sorted.length; i += 1) {
    if (!Array.isArray(sorted[i].gapPlates)) sorted[i].gapPlates = [];
  }
  downstream.gapPlates = [...gapPlatesOf(downstream), size];
  respaceGroup(groupId, upstream.id);
  relabelRoom();
  return true;
}

function removePlate(tableId, index) {
  const table = getTable(tableId);
  if (!table) return false;
  const list = gapPlatesOf(table).slice();
  if (index < 0 || index >= list.length) return false;
  list.splice(index, 1);
  table.gapPlates = list;
  if (table.group) {
    const sorted = orderGroup(groupMembers(table));
    respaceGroup(table.group, sorted[0].id);
  }
  relabelRoom();
  return true;
}

// A table leaving the floor, or leaving its group, gives its plates back.
function clearGapPlates(table) {
  if (table) table.gapPlates = null;
}

function leadOf(members) {
  return orderGroup(members)[0];
}

// Which COMBINATION of plates fills a gap of this many cm? Brute force over
// the stock — at most a few hundred combinations, so no cleverness needed.
// Ties break toward using fewer plates.
function bestPlate(gap) {
  const stock = PLATES.map((size) => ({
    size,
    w: state.dims[size].w,
    n: Math.max(0, Math.min(12, Math.round(state.dims[size].n ?? 0))),
  })).filter((item) => item.w > 0 && item.n > 0);
  if (!stock.length) return null;

  let best = null;
  const walk = (index, counts, total) => {
    if (index === stock.length) {
      if (!total) return;
      const diff = total - gap;
      const used = counts.reduce((a, b) => a + b, 0);
      if (
        !best ||
        Math.abs(diff) < Math.abs(best.diff) - 0.001 ||
        (Math.abs(Math.abs(diff) - Math.abs(best.diff)) < 0.001 && used < best.used)
      ) {
        best = { diff, total, used, counts: counts.slice() };
      }
      return;
    }
    for (let k = 0; k <= stock[index].n; k += 1) {
      counts[index] = k;
      walk(index + 1, counts, total + k * stock[index].w);
    }
    counts[index] = 0;
  };
  walk(0, new Array(stock.length).fill(0), 0);
  if (!best) return null;

  best.fits = Math.abs(best.diff) <= PLATE_TOLERANCE;
  best.parts = best.counts
    .map((count, i) => (count ? { size: stock[i].size, count, w: stock[i].w } : null))
    .filter(Boolean);
  return best;
}

function groupGaps(members) {
  const sorted = orderGroup(members);
  const out = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const cur = sorted[i + 1];
    const gap = gapCm(sorted[i], cur);
    const plates = gapPlatesOf(cur);
    out.push({
      gap,
      plates,
      tableId: cur.id,
      // only guess when nothing has actually been put in
      plate: plates.length ? null : bestPlate(gap),
    });
  }
  return out;
}

// Where each inserted plate sits, in percent of the room, for the printout.
function groupStrips(members) {
  const r = room();
  const sorted = orderGroup(members);
  const out = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const cur = sorted[i];
    const list = gapPlatesOf(cur);
    if (!list.length) continue;
    const band = gapBand(sorted[i - 1], cur);
    let cursor = band.start;
    for (const size of list) {
      const run = plateWidth(size);
      if (run <= 0) continue;
      out.push(
        band.vertical
          ? {
              left: (band.center / r.w) * 100,
              top: ((cursor + run / 2) / r.h) * 100,
              w: (band.across / r.w) * 100,
              h: (run / r.h) * 100,
            }
          : {
              top: (band.center / r.h) * 100,
              left: ((cursor + run / 2) / r.w) * 100,
              h: (band.across / r.h) * 100,
              w: (run / r.w) * 100,
            },
      );
      cursor += run;
    }
  }
  return out;
}

// "plateS, plateS, plateM" -> "2 x liten plate + medium plate"
function plateListText(list) {
  const copy = t();
  const counts = new Map();
  for (const size of list) counts.set(size, (counts.get(size) || 0) + 1);
  return [...counts.entries()]
    .map(([size, count]) => `${count > 1 ? `${count} × ` : ""}${copy[size]}`)
    .join(" + ");
}

function plateParts(plate) {
  const copy = t();
  return plate.parts
    .map((part) => `${part.count > 1 ? `${part.count} × ` : ""}${copy[part.size]}`)
    .join(" + ");
}

function plateText(entry) {
  const copy = t();
  if (entry.plates?.length) {
    const total = entry.plates.reduce((sum, size) => sum + plateWidth(size), 0);
    return `${plateListText(entry.plates)} = ${cmNum(total)} cm`;
  }
  if (!entry.plate) return copy.gapEmpty;
  const list = `${plateParts(entry.plate)} = ${Math.round(entry.plate.total)} cm`;
  if (entry.plate.fits) return `${copy.gapSuggest}: ${list} — ${copy.plateFits}`;
  const how = entry.plate.diff > 0 ? copy.plateTooBig : copy.plateTooSmall;
  return `${copy.gapSuggest}: ${list} (${Math.abs(Math.round(entry.plate.diff))} cm ${how})`;
}

// The empty band between two joined tables — where the plates go.
// Returns cm, plus which way the run goes.
function gapBand(a, b) {
  const ca = centerCm(a);
  const cb = centerCm(b);
  const sa = tableCm(a);
  const sb = tableCm(b);
  const vertical = Math.abs(cb.y - ca.y) >= Math.abs(cb.x - ca.x);
  if (vertical) {
    const [first, second] = ca.y <= cb.y ? [a, b] : [b, a];
    const cf = centerCm(first);
    const cs = centerCm(second);
    const start = cf.y + tableCm(first).h / 2;
    const end = cs.y - tableCm(second).h / 2;
    return {
      vertical: true,
      start,
      length: Math.max(0, end - start),
      across: Math.min(sa.w, sb.w),
      center: (ca.x + cb.x) / 2,
    };
  }
  const [first, second] = ca.x <= cb.x ? [a, b] : [b, a];
  const cf = centerCm(first);
  const cs = centerCm(second);
  const start = cf.x + tableCm(first).w / 2;
  const end = cs.x - tableCm(second).w / 2;
  return {
    vertical: false,
    start,
    length: Math.max(0, end - start),
    across: Math.min(sa.h, sb.h),
    center: (ca.y + cb.y) / 2,
  };
}

// Default covers per table. A round table is laid for FOUR unless the user
// says otherwise (user, 2026-09-22) — the old perimeter sum said 7, which is
// what fits, not what is laid. Rectangles still derive from their length.
const ROUND_DEFAULT_SEATS = 4;

function seatCount(table) {
  if (Number.isFinite(table.seatCount) && table.seatCount > 0) return Math.min(24, table.seatCount);
  const s = tableCm(table);
  const chair = Math.max(20, state.dims.chairBig.d);
  if (table.kind === "round") return ROUND_DEFAULT_SEATS;
  const long = Math.max(s.w, s.h);
  return Math.max(2, 2 * Math.max(1, Math.floor(long / chair)));
}

// Squares laid around the table, the way chairs actually stand.
function seatPositions(table) {
  const s = tableCm(table);
  const c = centerCm(table);
  const chair = Math.max(20, state.dims.chairBig.d);
  const count = seatCount(table);
  const out = [];
  if (table.kind === "round") {
    const radius = s.w / 2 + chair * 0.62;
    // A circle looks the same rotated, so "Roter" on a round table turns the
    // CHAIR RING by half a place instead — 4 covers at N/E/S/W become the
    // diagonals. That is the only rotation that means anything here.
    const turn = table.rotated ? Math.PI / count : 0;
    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + turn + (i * 2 * Math.PI) / count;
      out.push({ x: c.x + Math.cos(angle) * radius, y: c.y + Math.sin(angle) * radius });
    }
    return out;
  }
  const vertical = s.h >= s.w;
  const along = vertical ? s.h : s.w;
  const offset = (vertical ? s.w : s.h) / 2 + chair * 0.62;
  const perSide = Math.ceil(count / 2);
  for (let side = 0; side < 2 && out.length < count; side += 1) {
    for (let i = 0; i < perSide && out.length < count; i += 1) {
      const pos = -along / 2 + ((i + 0.5) / perSide) * along;
      if (vertical) out.push({ x: c.x + (side ? offset : -offset), y: c.y + pos });
      else out.push({ x: c.x + pos, y: c.y + (side ? offset : -offset) });
    }
  }
  return out;
}

// No chair stands where the neighbouring table or the plates already are.
function seatBlocked(table, pos) {
  if (!table.group) return false;
  const members = groupMembers(table);
  for (const other of members) {
    if (other === table) continue;
    const co = centerCm(other);
    const so = tableCm(other);
    if (Math.abs(pos.x - co.x) < so.w / 2 && Math.abs(pos.y - co.y) < so.h / 2) return true;
  }
  const ordered = orderGroup(members);
  for (let i = 0; i < ordered.length - 1; i += 1) {
    const band = gapBand(ordered[i], ordered[i + 1]);
    if (band.length <= 0) continue;
    if (band.vertical) {
      if (pos.y > band.start && pos.y < band.start + band.length && Math.abs(pos.x - band.center) < band.across / 2) return true;
    } else if (pos.x > band.start && pos.x < band.start + band.length && Math.abs(pos.y - band.center) < band.across / 2) {
      return true;
    }
  }
  return false;
}

function seatsOf(table) {
  return seatPositions(table)
    .map((pos, index) => ({ pos, index, mark: table.seatMarks?.[index] || null }))
    .filter((seat) => !seatBlocked(table, seat.pos));
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch],
  );
}

// "1a" must sort next to "1", not fall to the bottom as NaN.
function labelSortKey(label) {
  const m = String(label ?? "").match(/^(\d+)?(.*)$/);
  return [m[1] ? Number(m[1]) : 999, (m[2] || "").toLowerCase()];
}

function byLabel(a, b) {
  const ka = labelSortKey(a.label);
  const kb = labelSortKey(b.label);
  return ka[0] - kb[0] || ka[1].localeCompare(kb[1]);
}

function cleanManual(value) {
  return String(value ?? "").trim().replace(/\s+/g, "").slice(0, 4);
}

function nextFreeLabel(used) {
  return LABELS.find((label) => !used.has(label)) || String(used.size + 1);
}

function relabelRoom() {
  const all = roomTables();
  const groups = groupsOf(all);

  // A group is numbered as a single unit, represented by its lead table.
  // Everything else in the group is invisible to the numbering pass and
  // copies the lead's number afterwards.
  const leadIds = new Set();
  for (const members of groups.values()) leadIds.add(leadOf(members).id);
  for (const table of all) table.lead = !table.group || leadIds.has(table.id);

  const tables = all.filter((table) => table.lead);
  const used = new Set();

  // A table with a manual number (1a, 1b, ...) keeps it and is taken out of
  // the automatic run. Its POSITION still counts, so the tables around it keep
  // the number their spot would normally give them.
  for (const table of tables) {
    if (table.manual) {
      table.label = table.manual;
      used.add(table.manual);
    }
  }

  const assign = (table, wanted) => {
    if (!table || table.manual) return;
    const label = used.has(wanted) ? nextFreeLabel(used) : wanted;
    table.label = label;
    used.add(label);
  };

  // Plates: the first one is always 14. Reserve it up front so no overflow
  // round can take it, but do not hand out numbers to the EXTRA plates yet --
  // they must not steal 1 or 2 from the bottom-left column. They get whatever
  // is left once every round table has its position-based number.
  const plates = tables.filter((item) => item.kind === "plate").sort((a, b) => a.y - b.y);
  const rounds = tables.filter((item) => item.kind === "round");
  if (plates.some((item) => !item.manual)) used.add("14");

  const sixteen = rounds
    .filter((item) => item.y <= TOP_MAX && item.x >= 38 && item.x <= 62)
    .sort((a, b) => Math.abs(a.x - 50) + a.y * 0.35 - (Math.abs(b.x - 50) + b.y * 0.35))[0];
  if (sixteen) assign(sixteen, "16");

  const rest = rounds.filter((item) => item !== sixteen);
  const left = rest.filter((item) => item.x < LEFT_MAX).sort((a, b) => b.y - a.y);
  const right = rest.filter((item) => item.x > RIGHT_MIN).sort((a, b) => a.y - b.y);
  const mid = rest.filter((item) => item.x >= LEFT_MAX && item.x <= RIGHT_MIN).sort((a, b) => a.y - b.y);

  ["1", "2", "3", "4", "5"].forEach((num, i) => assign(left[i], num));
  left.slice(5).forEach((item) => assign(item, nextFreeLabel(used)));

  ["6", "7", "8", "9", "10", "11"].forEach((num, i) => assign(right[i], num));
  right.slice(6).forEach((item) => assign(item, nextFreeLabel(used)));

  mid.forEach((item) => {
    if (item.y <= 36 && !used.has("15")) assign(item, "15");
    else assign(item, "12");
  });

  if (plates.length) {
    const autoPlates = plates.filter((item) => !item.manual);
    if (autoPlates[0]) autoPlates[0].label = "14"; // "14" was reserved above
    autoPlates.slice(1).forEach((item) => {
      const label = nextFreeLabel(used);
      item.label = label;
      used.add(label);
    });
  }

  // print.html reads the cover count straight off the saved table
  for (const table of all) table.guests = seatsOf(table).length;
  for (const table of all) table.groupInfo = null;
  for (const members of groups.values()) {
    const lead = leadOf(members);
    for (const member of members) if (member !== lead) member.label = lead.label;
    // stashed on the lead so print.html can render it without redoing the maths
    lead.groupInfo = {
      count: members.length,
      gaps: groupGaps(members),
      // Bake the strips in percent so print.html draws the same plates
      // without redoing gapBand / orderGroup.
      strips: groupStrips(members),
    };
  }
}

function getFixture(id) {
  return state.fixtures.find((item) => item.id === id);
}

function moveFixture(id, clientX, clientY) {
  const fixture = getFixture(id);
  if (!fixture) return;
  const pos = dropPercent(clientX, clientY);
  if (fixture.wall === "left") {
    fixture.along = Math.min(88, Math.max(8, pos.y));
  } else {
    fixture.along = Math.min(82, Math.max(18, pos.x));
  }
}

function doorButton(fixture) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `fixture door ${fixture.wall}`;
  el.dataset.fixtureId = fixture.id;
  if (fixture.wall === "left") el.style.top = `${fixture.along}%`;
  else el.style.left = `${fixture.along}%`;
  el.addEventListener("pointerdown", (event) => startDrag(event, { kind: "fixture", id: fixture.id }, el));
  el.addEventListener("mousedown", (event) => {
    if (drag) return;
    startDrag(event, { kind: "fixture", id: fixture.id }, el);
  });
  return el;
}

// One strip per plate, laid into the gap, so you can see what the
// combination actually looks like on the floor.
function plateInserts() {
  const r = room();
  const copy = t();
  const nodes = [];
  for (const members of groupsOf(roomTables()).values()) {
    const sorted = orderGroup(members);
    for (let i = 1; i < sorted.length; i += 1) {
      const cur = sorted[i];
      const list = gapPlatesOf(cur);
      if (!list.length) continue;
      const band = gapBand(sorted[i - 1], cur);
      let cursor = band.start;
      list.forEach((size, index) => {
        const run = plateWidth(size);
        if (run <= 0) return;
        const el = document.createElement("button");
        el.type = "button";
        el.className = "plate-insert";
        el.dataset.plateTable = cur.id;
        el.dataset.plateIndex = String(index);
        el.title = `${copy[size]} ${cmNum(run)} cm — ${copy.plateRemoveHint}`;
        if (band.vertical) {
          el.style.left = `${(band.center / r.w) * 100}%`;
          el.style.top = `${((cursor + run / 2) / r.h) * 100}%`;
          el.style.width = `${(band.across / r.w) * 100}%`;
          el.style.height = `${(run / r.h) * 100}%`;
        } else {
          el.style.top = `${(band.center / r.h) * 100}%`;
          el.style.left = `${((cursor + run / 2) / r.w) * 100}%`;
          el.style.height = `${(band.across / r.h) * 100}%`;
          el.style.width = `${(run / r.w) * 100}%`;
        }
        nodes.push(el);
        cursor += run;
      });
    }
  }
  return nodes;
}

function seatNodes() {
  const r = room();
  const chair = Math.max(20, state.dims.chairBig.d);
  const nodes = [];
  for (const table of roomTables()) {
    for (const seat of seatsOf(table)) {
      const mark = markOf(seat.mark);
      const el = document.createElement("button");
      el.type = "button";
      el.className = `seat${mark ? " marked" : ""}`;
      el.dataset.tableId = table.id;
      el.dataset.seatIndex = seat.index;
      el.style.left = `${(seat.pos.x / r.w) * 100}%`;
      el.style.top = `${(seat.pos.y / r.h) * 100}%`;
      el.style.width = `${(chair / r.w) * 100}%`;
      el.style.height = `${(chair / r.h) * 100}%`;
      if (mark) {
        el.style.background = mark.color;
        el.style.borderColor = mark.color;
        el.style.color = inkOn(mark.color);
        el.textContent = mark.code;
        el.title = `${t().colTable} ${table.label} · ${markName(mark)}`;
      } else {
        el.title = `${t().colTable} ${table.label}`;
      }
      nodes.push(el);
    }
  }
  return nodes;
}

function furnitureButton(item) {
  const dims = tableDims(item);
  const el = document.createElement("button");
  el.type = "button";
  el.className = "furniture";
  el.dataset.furnitureId = item.id;
  el.style.left = `${item.x}%`;
  el.style.top = `${item.y}%`;
  el.style.width = `${dims.w}%`;
  el.style.height = `${dims.h}%`;
  el.title = furnitureLabel(item);
  el.innerHTML = `<span class="furn-tag">${t().furniture[item.size] || item.size}</span>`;
  el.addEventListener("pointerdown", (event) => startDrag(event, { kind: "furniture", id: item.id }, el));
  el.addEventListener("mousedown", (event) => {
    if (drag) return;
    startDrag(event, { kind: "furniture", id: item.id }, el);
  });
  return el;
}

function furnitureLabel(item) {
  const copy = t();
  const spec = state.dims[item.size];
  const tag = state.dims.est[item.size] ? ` (${copy.est})` : "";
  return `${copy.furniture[item.size] || item.size} ${spec.w}×${spec.l} cm${tag}`;
}

function moveFurniture(id, clientX, clientY) {
  const item = getFurniture(id);
  if (!item) return;
  const pos = dropPercent(clientX, clientY);
  item.along = item.wall === "left" || item.wall === "right" ? pos.y : pos.x;
  syncFurniture();
}

function cleanupDrag() {
  document.querySelectorAll(".drag-ghost").forEach((node) => node.remove());
  document.getElementById("tray")?.classList.remove("drop");
  drag = null;
}

function pointIn(el, x, y) {
  if (!el) return false;
  const box = el.getBoundingClientRect();
  return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
}

function dropPercent(clientX, clientY) {
  const box = document.getElementById("room").getBoundingClientRect();
  return {
    x: Math.min(100, Math.max(0, ((clientX - box.left) / box.width) * 100)),
    y: Math.min(100, Math.max(0, ((clientY - box.top) / box.height) * 100)),
  };
}

function placeTable(table, clientX, clientY) {
  if (pointIn(document.getElementById("room"), clientX, clientY)) {
    const pct = dropPercent(clientX, clientY);
    const r = room();
    const groupId = table.group;
    table.zone = "room";
    setCenterCm(table, { x: (pct.x / 100) * r.w, y: (pct.y / 100) * r.h });
    // A joined set is one long table: drag any part of it and the rest
    // follows, keeping every gap exactly as wide as its plates.
    if (groupId) respaceGroup(groupId, table.id);
  } else {
    const groupId = table.group;
    table.zone = "tray";
    table.label = "";
    table.manual = null; // storage tables are blank
    table.name = null; // and no guest
    table.group = null;
    clearGapPlates(table); // its plates go back on the rack
    if (groupId) {
      const left = roomTables().filter((item) => item.group === groupId);
      if (left.length === 1) {
        left[0].group = null;
        clearGapPlates(left[0]);
      } else if (left.length > 1) {
        const sorted = orderGroup(left);
        clearGapPlates(sorted[0]);
        respaceGroup(groupId, sorted[0].id);
      }
    }
  }
  relabelRoom();
}

function tableButton(table, inTray) {
  const btn = document.createElement("button");
  const dims = tableDims(table);
  const copy = t();
  btn.type = "button";
  btn.className = `table ${table.kind} ${table.size}${state.selected === table.id ? " selected" : ""}${
    inTray || !table.label ? " blank" : ""
  }`;
  btn.dataset.id = table.id;
  if (!inTray) {
    btn.style.left = `${table.x}%`;
    btn.style.top = `${table.y}%`;
    btn.style.width = `${dims.w}%`;
    btn.style.height = `${dims.h}%`;
    btn.title = sizeLabelCm(table);
  }
  const own = customCm(table);
  const sizeName = own ? `${cmNum(own.w)}×${cmNum(own.l)}` : copy[table.size];
  if (inTray) btn.title = sizeLabelCm(table);
  btn.innerHTML = inTray
    ? `<span class="size-tag">${sizeName}</span>`
    : table.lead === false
      ? `<span class="stack"><span class="size-tag floor-size">${sizeName}</span></span>`
      : `<span class="stack">${
          table.name
            ? `<span class="guest-name">${esc(table.name)}</span><span class="num small">${table.label}</span>`
            : `<span class="num">${table.label}</span>`
        }<span class="size-tag floor-size">${sizeName} · ${seatsOf(table).length}p</span></span>`;
  btn.addEventListener("pointerdown", (event) => startDrag(event, { kind: "table", id: table.id }, btn));
  btn.addEventListener("mousedown", (event) => {
    if (drag) return;
    startDrag(event, { kind: "table", id: table.id }, btn);
  });
  return btn;
}

function startDrag(event, target, el) {
  if (event.button) return;
  event.preventDefault();
  try {
    el.setPointerCapture?.(event.pointerId);
  } catch {
    /* synthetic or lost pointers still work via window listeners */
  }
  drag = {
    kind: target.kind,
    id: target.id,
    size: target.size,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    moved: false,
    el,
  };
}

function samePointer(event) {
  if (!drag) return false;
  if (event.pointerId == null || drag.pointerId == null) return true;
  return event.pointerId === drag.pointerId;
}

function onMove(event) {
  if (!drag || !samePointer(event)) return;
  drag.lastX = event.clientX;
  drag.lastY = event.clientY;
  const dist = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
  if (!drag.moved && dist < 6) return;
  event.preventDefault();
  if (!drag.moved) {
    drag.moved = true;
    const ghost = drag.el.cloneNode(true);
    ghost.classList.add("drag-ghost");
    ghost.style.position = "fixed";
    ghost.style.margin = "0";
    ghost.style.zIndex = "80";
    ghost.style.pointerEvents = "none";
    document.body.appendChild(ghost);
    drag.ghost = ghost;
  }
  drag.ghost.style.left = `${event.clientX}px`;
  drag.ghost.style.top = `${event.clientY}px`;
  drag.ghost.style.transform = "translate(-50%, -50%)";
  if (drag.kind === "table") {
    document.getElementById("tray").classList.toggle(
      "drop",
      pointIn(document.getElementById("tray"), event.clientX, event.clientY),
    );
  }
  if (drag.kind === "plate") showGapTarget(event.clientX, event.clientY);
}

// While a plate is in the air, outline the gap it would drop into.
function showGapTarget(clientX, clientY) {
  const roomEl = document.getElementById("room");
  let marker = document.getElementById("gap-target");
  const clear = () => marker?.remove();
  if (!pointIn(roomEl, clientX, clientY)) return clear();
  const pct = dropPercent(clientX, clientY);
  const r = room();
  const hit = findGap({ x: (pct.x / 100) * r.w, y: (pct.y / 100) * r.h });
  if (!hit) return clear();
  const band = gapBand(hit.a, hit.b);
  if (!marker) {
    marker = document.createElement("div");
    marker.id = "gap-target";
    marker.className = "gap-target";
    roomEl.appendChild(marker);
  }
  const run = Math.max(band.length, 20);
  if (band.vertical) {
    marker.style.left = `${(band.center / r.w) * 100}%`;
    marker.style.top = `${((band.start + band.length / 2) / r.h) * 100}%`;
    marker.style.width = `${(band.across / r.w) * 100}%`;
    marker.style.height = `${(run / r.h) * 100}%`;
  } else {
    marker.style.top = `${(band.center / r.h) * 100}%`;
    marker.style.left = `${((band.start + band.length / 2) / r.w) * 100}%`;
    marker.style.height = `${(band.across / r.h) * 100}%`;
    marker.style.width = `${(run / r.w) * 100}%`;
  }
  return undefined;
}

function finishDrag(clientX, clientY) {
  const current = drag;
  if (!current) return;
  current.ghost?.remove();
  cleanupDrag();
  if (current.kind === "fixture") {
    if (current.moved) {
      moveFixture(current.id, clientX, clientY);
      save();
      render();
    }
    return;
  }
  if (current.kind === "furniture") {
    if (current.moved) {
      moveFurniture(current.id, clientX, clientY);
      relabelRoom();
      save();
      render();
    }
    return;
  }
  if (current.kind === "plate") {
    document.getElementById("gap-target")?.remove();
    if (!current.moved) return;
    if (!pointIn(document.getElementById("room"), clientX, clientY)) return;
    const pct = dropPercent(clientX, clientY);
    const r = room();
    const hit = findGap({ x: (pct.x / 100) * r.w, y: (pct.y / 100) * r.h });
    if (!hit) {
      trayHint = t().plateNeedsTwo;
      render();
      return;
    }
    if (!addPlate(hit.a, hit.b, current.size)) {
      trayHint = t().plateNoneLeft;
      render();
      return;
    }
    trayHint = "";
    state.selected = hit.a.id;
    save();
    render();
    return;
  }
  const table = getTable(current.id);
  if (!table) return;
  if (!current.moved) {
    selectTable(current.id);
    return;
  }
  placeTable(table, clientX, clientY);
  state.selected = table.id;
  save();
  render();
}

function onUp(event) {
  if (!drag || !samePointer(event)) return;
  finishDrag(event.clientX, event.clientY);
}

function onCancel() {
  if (!drag) return;
  if (drag.moved) {
    finishDrag(drag.lastX, drag.lastY);
    return;
  }
  cleanupDrag();
}

window.addEventListener("pointermove", onMove, { passive: false });
window.addEventListener("mousemove", onMove, { passive: false });
window.addEventListener("pointerup", onUp);
window.addEventListener("mouseup", onUp);
window.addEventListener("pointercancel", onCancel);

// --- render ----------------------------------------------------------------

function gridLayer() {
  const r = room();
  const el = document.createElement("div");
  el.className = "grid-layer";
  el.style.setProperty("--m-x", `${(10000 / r.w).toFixed(4)}%`);
  el.style.setProperty("--m-y", `${(10000 / r.h).toFixed(4)}%`);
  return el;
}

function rulerLayer() {
  const r = room();
  const wrap = document.createElement("div");
  wrap.className = "ruler-layer";
  for (let m = 1; m * 100 < r.w; m += 1) {
    const tick = document.createElement("span");
    tick.className = "tick top";
    tick.style.left = `${((m * 100) / r.w) * 100}%`;
    tick.textContent = m;
    wrap.appendChild(tick);
  }
  for (let m = 1; m * 100 < r.h; m += 1) {
    const tick = document.createElement("span");
    tick.className = "tick left";
    tick.style.top = `${((m * 100) / r.h) * 100}%`;
    tick.textContent = m;
    wrap.appendChild(tick);
  }
  return wrap;
}

function renderRoom() {
  const el = document.getElementById("room");
  el.innerHTML = "";
  el.classList.toggle("no-grid", !state.showGrid);
  if (state.showGrid) {
    el.appendChild(gridLayer());
    el.appendChild(rulerLayer());
  }
  const windowEl = document.createElement("div");
  windowEl.className = "fixture window";
  el.appendChild(windowEl);
  const corner = document.createElement("div");
  corner.className = "fixture corner";
  el.appendChild(corner);
  for (const node of plateInserts()) el.appendChild(node);
  for (const node of seatNodes()) el.appendChild(node);
  for (const item of state.furniture) el.appendChild(furnitureButton(item));
  for (const fixture of state.fixtures) el.appendChild(doorButton(fixture));
  for (const table of roomTables()) el.appendChild(tableButton(table, false));
}

function renderTray() {
  const copy = t();
  document.getElementById("tray-title").textContent = copy.tray;
  document.getElementById("add-row").innerHTML = Object.entries(copy.add)
    .map(([size, label]) => `<button type="button" class="add-btn" data-add="${size}">${label}</button>`)
    .join("");
  const stack = document.getElementById("tray-stack");
  stack.innerHTML = "";
  for (const table of trayTables()) stack.appendChild(tableButton(table, true));
  renderPlateRack();
}

// The plates the restaurant owns, minus the ones already in a gap. These are
// NOT tables — they can only be dropped between two tables.
function renderPlateRack() {
  const copy = t();
  const title = document.getElementById("plate-title");
  const note = document.getElementById("plate-note");
  const stack = document.getElementById("plate-stack");
  if (!stack) return;
  if (title) title.textContent = copy.plateRack;
  if (note) {
    note.textContent = trayHint || copy.plateRackNote;
    note.classList.toggle("warn", Boolean(trayHint));
  }
  stack.innerHTML = "";
  const used = platesUsed();
  for (const size of PLATES) {
    const owned = plateOwned(size);
    const left = Math.max(0, owned - used[size]);
    const badge = state.dims.est?.[size] ? ` (${copy.est})` : "";
    const head = document.createElement("p");
    head.className = "plate-line";
    head.textContent = `${copy[size]} · ${copy.plateFills} ${cmNum(plateWidth(size))} cm${badge} · ${left}/${owned} ${copy.plateLeft}`;
    stack.appendChild(head);
    const row = document.createElement("div");
    row.className = "plate-row";
    for (let i = 0; i < left; i += 1) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `plate-chip ${size}`;
      chip.dataset.plateSize = size;
      chip.title = `${copy[size]} ${cmNum(plateWidth(size))} cm`;
      chip.innerHTML = `<span class="plate-chip-tag">${cmNum(plateWidth(size))}</span>`;
      chip.addEventListener("pointerdown", (event) => startDrag(event, { kind: "plate", size }, chip));
      chip.addEventListener("mousedown", (event) => {
        if (drag) return;
        startDrag(event, { kind: "plate", size }, chip);
      });
      row.appendChild(chip);
    }
    if (!left) {
      const none = document.createElement("span");
      none.className = "plate-empty";
      none.textContent = "—";
      row.appendChild(none);
    }
    stack.appendChild(row);
  }
}

function renderChrome() {
  const copy = t();
  document.documentElement.lang = state.lang;
  document.getElementById("lang-btn").textContent = state.lang.toUpperCase();
  document.getElementById("print-btn").textContent = copy.print;
  document.getElementById("reset-btn").textContent = copy.reset;
  const presetBtn = document.getElementById("preset-btn");
  if (presetBtn && presetBtn.dataset.armed !== "1") presetBtn.textContent = state.lang === "en" ? "Usual setup" : "Vanlig oppsett";
  if (share.status !== "local" || window.claude?.use) setShareStatus(share.status, share.at);
  document.getElementById("hint").textContent = copy.hint;
  const measureBtn = document.getElementById("measure-btn");
  measureBtn.textContent = copy.measure;
  measureBtn.classList.toggle("on", state.showMeasure);
  const gridBtn = document.getElementById("grid-btn");
  gridBtn.textContent = copy.grid;
  gridBtn.classList.toggle("on", state.showGrid);
  const chairBtn = document.getElementById("chairs-btn");
  chairBtn.textContent = copy.withChairs;
  chairBtn.classList.toggle("on", state.withChairs);
}

const FIELDS = [
  { key: "roomW", path: ["room", "w"], min: 200, max: 5000 },
  { key: "roomH", path: ["room", "h"], min: 200, max: 5000 },
  { key: "smallD", path: ["small", "d"], min: 30, max: 400, est: "small" },
  { key: "bigD", path: ["big", "d"], min: 30, max: 400, est: "big" },
  { key: "plateSW", path: ["plateS", "w"], min: 10, max: 400, est: "plateS" },
  { key: "plateSN", path: ["plateS", "n"], min: 0, max: 12 },
  { key: "plateMW", path: ["plateM", "w"], min: 10, max: 400, est: "plateM" },
  { key: "plateMN", path: ["plateM", "n"], min: 0, max: 12 },
  { key: "plateLW", path: ["plateL", "w"], min: 10, max: 400, est: "plateL" },
  { key: "plateLN", path: ["plateL", "n"], min: 0, max: 12 },
  { key: "longW", path: ["long", "w"], min: 30, max: 400, est: "long" },
  { key: "longL", path: ["long", "l"], min: 50, max: 900, est: "long" },
  // Depth is taped (60); only the length is an estimate, so only the length
  // field carries the sidebord ANSLAG badge and typing a depth does not clear it.
  { key: "sidebordW", path: ["sidebord", "w"], min: 20, max: 300 },
  { key: "sidebordL", path: ["sidebord", "l"], min: 40, max: 900, est: "sidebord" },
  { key: "chairBigD", path: ["chairBig", "d"], min: 25, max: 120, est: "chairBig" },
  { key: "chairSmallD", path: ["chairSmall", "d"], min: 25, max: 120, est: "chairSmall" },
  { key: "aisleLabel", path: ["aisle"], min: 30, max: 300 },
  { key: "snapLabel", path: ["snap"], min: 0, max: 100 },
];

function dimValue(path) {
  return path.reduce((acc, key) => acc[key], state.dims);
}

function setDimValue(path, value) {
  let node = state.dims;
  for (let i = 0; i < path.length - 1; i += 1) node = node[path[i]];
  node[path[path.length - 1]] = value;
}

function renderMeasurePanel() {
  const copy = t();
  const panel = document.getElementById("measure-panel");
  panel.hidden = !state.showMeasure;
  if (!state.showMeasure) return;
  document.getElementById("measure-title").textContent = copy.panelTitle;
  document.getElementById("measure-note").textContent = copy.panelNote;
  document.getElementById("measure-fields").innerHTML = FIELDS.map((field) => {
    const tag = field.est && state.dims.est[field.est] ? `<em class="est">${copy.est}</em>` : "";
    return `<label class="field">
        <span>${copy[field.key]} ${tag}</span>
        <input type="number" inputmode="decimal" data-dim="${field.key}" value="${Number(dimValue(field.path).toFixed(1))}" min="${field.min}" max="${field.max}" step="0.5" />
      </label>`;
  }).join("");
}

function sortedRoomTables() {
  return roomTables().filter((table) => table.lead !== false).slice().sort(byLabel);
}

function renderSeatPalette() {
  const copy = t();
  document.getElementById("brush-title").textContent = copy.marksTitle;
  document.getElementById("brush-note").textContent = copy.marksNote;
  const row = document.getElementById("brush-row");
  const none = `<button type="button" class="brush${state.brush ? "" : " active"}" data-brush="">${copy.markNone}</button>`;
  row.innerHTML =
    none +
    SEAT_MARKS.map(
      (mark) =>
        `<button type="button" class="brush${state.brush === mark.key ? " active" : ""}" data-brush="${mark.key}">
           <span class="dot" style="background:${mark.color};color:${inkOn(mark.color)}">${mark.code}</span>${markName(mark)}
         </button>`,
    ).join("");
}

function seatSummary() {
  const rows = [];
  for (const table of sortedRoomTables()) {
    const members = table.group ? groupMembers(table) : [table];
    const counts = {};
    for (const member of members) {
      for (const seat of seatsOf(member)) {
        if (seat.mark) counts[seat.mark] = (counts[seat.mark] || 0) + 1;
      }
    }
    const keys = Object.keys(counts);
    if (keys.length) rows.push({ table, counts, keys });
  }
  return rows;
}

function renderList() {
  const copy = t();
  document.getElementById("list-title").textContent = copy.listTitle;
  document.getElementById("scale-note").textContent = `${copy.scale} · ${fmt(room().w)} × ${fmt(room().h)}`;
  const body = document.getElementById("list-body");
  const tables = sortedRoomTables();
  if (!tables.length) {
    body.innerHTML = `<p class="empty">${copy.listEmpty}</p>`;
  } else {
    const rows = tables
      .map((table) => {
        const c = clearances(table);
        const near = nearest(table);
        const nearCell = near
          ? `<span class="${near.gap < state.dims.aisle ? "tight" : ""}">${obstacleName(near.table)} · ${fmt(near.gap)}</span>`
          : copy.none;
        return `<tr>
            <td class="num-cell">${table.label}</td>
            <td>${esc(table.name || "–")}</td>
            <td>${seatsOf(table).length}</td>
            <td>${sizeLabelCm(table)}</td>
            <td>${fmt(c.top)}</td>
            <td>${fmt(c.left)}</td>
            <td>${nearCell}</td>
          </tr>`;
      })
      .join("");
    body.innerHTML = `<div class="table-scroll"><table class="measure-table">
        <thead><tr>
          <th>${copy.colTable}</th><th>${copy.nameLabel}</th><th>${copy.seats}</th><th>${copy.colSize}</th><th>${copy.colWindow}</th><th>${copy.colLeft}</th><th>${copy.colNearest}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  const summary = seatSummary();
  document.getElementById("seat-summary").innerHTML = summary.length
    ? `<p class="kicker">${copy.marksTitle}</p><ul class="seat-list">${summary
        .map(
          (row) =>
            `<li><strong>${copy.colTable} ${esc(row.table.label)}</strong> — ${row.keys
              .map((key) => {
                const mark = markOf(key);
                return `<span class="seat-chip" style="background:${mark.color};color:${inkOn(mark.color)}">${mark.code}</span> ${markName(mark)}${row.counts[key] > 1 ? ` ×${row.counts[key]}` : ""}`;
              })
              .join(" · ")}</li>`,
        )
        .join("")}</ul>`
    : "";

  const warnEl = document.getElementById("warnings");
  const tight = tightPairs();
  const counts = {};
  for (const item of tables) counts[item.label] = (counts[item.label] || 0) + 1;
  const dups = Object.keys(counts).filter((label) => counts[label] > 1);
  const dupHtml = dups.length
    ? `<p class="warn-title">⚠ ${copy.dupTitle}: <strong>${dups.map(esc).join(", ")}</strong></p>`
    : "";
  if (!tables.length) {
    warnEl.innerHTML = "";
  } else if (!tight.length) {
    warnEl.innerHTML =
      dupHtml +
      `<p class="ok">✓ ${copy.warnOk} ${fmt(state.dims.aisle)} <span class="basis">(${state.withChairs ? copy.chairNote : copy.topNote})</span>.</p>`;
  } else {
    warnEl.innerHTML = dupHtml + `<p class="warn-title">⚠ ${copy.warnTitle} (&lt; ${fmt(state.dims.aisle)}, ${state.withChairs ? copy.chairNote : copy.topNote})</p><ul>${tight
      .map((pair) => `<li>${obstacleName(pair.a)} ↔ ${obstacleName(pair.b)}: <strong>${fmt(pair.gap)}</strong></li>`)
      .join("")}</ul>`;
  }
}

function renderDrawer() {
  const drawer = document.getElementById("drawer");
  const table = getTable(state.selected);
  const copy = t();
  if (!table || table.zone !== "room") {
    drawer.hidden = true;
    return;
  }
  drawer.hidden = false;
  document.getElementById("drawer-kicker").textContent = copy.kinds[table.size];
  document.getElementById("drawer-title").textContent =
    `${state.lang === "en" ? "Table" : "Bord"} ${table.label}`;
  document.getElementById("size-row").innerHTML = SIZES.map(
    (size) =>
      `<button type="button" class="status-btn${size === table.size ? " active" : ""}" data-size="${size}">${copy[size]}</button>`,
  ).join("");
  document.getElementById("rotate-btn").textContent = copy.rotate;
  // every table can be rotated now — a rectangle turns, a round table turns
  // its chair ring
  document.getElementById("rotate-btn").hidden = false;
  document.getElementById("to-tray-btn").textContent = copy.toTray;

  document.getElementById("label-row").innerHTML = `
    <label class="label-field">
      <span>${copy.numberLabel}</span>
      <input type="text" id="label-input" maxlength="4" autocomplete="off"
             value="${esc(table.label)}" placeholder="${copy.manualHint}" />
    </label>
    <button type="button" class="status-btn${table.manual ? "" : " active"}" id="auto-label">${copy.auto}</button>
    ${table.manual ? `<span class="manual-tag">${copy.manualTag}</span>` : ""}
    <label class="label-field people-field">
      <span>${copy.seats}</span>
      <span class="people-steps">
        <button type="button" class="nudge" data-seats="-1">−</button>
        <strong class="people-count">${seatsOf(table).length}</strong>
        <button type="button" class="nudge" data-seats="1">+</button>
        <button type="button" class="nudge wide" data-seats="auto">${copy.auto}</button>
      </span>
    </label>
    <label class="label-field name-field">
      <span>${copy.nameLabel}</span>
      <input type="text" id="name-input" maxlength="28" autocomplete="off"
             value="${esc(table.name || "")}" placeholder="${copy.nameHint}" />
    </label>
    ${table.size === "long" ? customFields(table) : ""}`;

  const copyG = copy;
  const groupRow = document.getElementById("group-row");
  if (table.group) {
    const members = groupMembers(table);
    const gaps = groupGaps(members);
    groupRow.innerHTML = `
      <p class="group-head">${copyG.groupTitle} · ${members.length} ${copyG.groupOf}</p>
      ${gaps
        .map((entry) => {
          const ok = entry.plates?.length ? true : entry.plate?.fits;
          return `<p class="gap-line${ok ? "" : " tight"}">${copyG.gapLabel} <strong>${cmNum(entry.gap)} cm</strong> → ${plateText(entry)}</p>`;
        })
        .join("")}
      <button type="button" class="status-btn" id="unjoin-btn">${copyG.unjoin}</button>`;
  } else {
    const near = nearest(table);
    const target = near && near.table.kind !== "furniture" ? near.table : null;
    groupRow.innerHTML = target
      ? `<button type="button" class="status-btn" id="join-btn">${copyG.join} → ${copyG.colTable} ${esc(target.label)}</button>`
      : "";
  }

  const c = clearances(table);
  const centre = centerCm(table);
  const near = nearest(table);
  const step = state.dims.snap && state.dims.snap >= 1 ? state.dims.snap : 10;
  document.getElementById("drawer-measure").innerHTML = `
    <p class="m-size">${sizeLabelCm(table)}</p>
    <dl class="m-grid">
      <div><dt>${copy.position}</dt><dd>${copy.walls.top} ${fmt(centre.y)} · ${copy.walls.left} ${fmt(centre.x)}</dd></div>
      <div><dt>${copy.clearance}</dt><dd>${copy.walls.top} ${fmt(c.top)} · ${copy.walls.bottom} ${fmt(c.bottom)}<br />${copy.walls.left} ${fmt(c.left)} · ${copy.walls.right} ${fmt(c.right)}</dd></div>
      <div><dt>${copy.nearest}</dt><dd>${
        near
          ? `<span class="${near.gap < state.dims.aisle ? "tight" : ""}">${obstacleName(near.table)} · ${fmt(near.gap)}</span>`
          : copy.none
      }</dd></div>
    </dl>
    <div class="nudge-row">
      <span class="nudge-label">${copy.seats} ${seatsOf(table).length}</span>
    </div>
    <div class="nudge-row">
      <span class="nudge-label">${copy.nudge} ${step} cm</span>
      <button type="button" class="nudge" data-nudge="left">←</button>
      <button type="button" class="nudge" data-nudge="up">↑</button>
      <button type="button" class="nudge" data-nudge="down">↓</button>
      <button type="button" class="nudge" data-nudge="right">→</button>
    </div>`;
}

function render() {
  try {
    renderChrome();
    renderMeasurePanel();
    renderSeatPalette();
    renderRoom();
    renderTray();
    renderList();
    renderDrawer();
  } catch (error) {
    console.error(error);
  }
}

function selectTable(id) {
  state.selected = id;
  save();
  render();
}

// --- events ----------------------------------------------------------------

document.getElementById("lang-btn").addEventListener("click", () => {
  state.lang = state.lang === "no" ? "en" : "no";
  save();
  render();
});

document.getElementById("measure-btn").addEventListener("click", () => {
  state.showMeasure = !state.showMeasure;
  save();
  render();
});

document.getElementById("chairs-btn").addEventListener("click", () => {
  state.withChairs = !state.withChairs;
  save();
  render();
});

document.getElementById("grid-btn").addEventListener("click", () => {
  state.showGrid = !state.showGrid;
  save();
  render();
});

document.getElementById("measure-fields").addEventListener("change", (event) => {
  const key = event.target.dataset.dim;
  if (!key) return;
  const field = FIELDS.find((item) => item.key === key);
  if (!field) return;
  // Half centimetres are allowed: the medium plate is 49,5 cm, and rounding it
  // to 50 here would quietly overwrite a real measurement. An empty or
  // unreadable box puts the old value back instead of snapping to the minimum.
  const raw = event.target.valueAsNumber;
  if (!Number.isFinite(raw)) return render();
  const value = Math.min(field.max, Math.max(field.min, Math.round(raw * 2) / 2));
  setDimValue(field.path, value);
  if (field.est) state.dims.est[field.est] = false;
  syncFurniture();
  clampAll();
  relabelRoom();
  save();
  render();
});

// The hosted page cannot show confirm() dialogs, so destructive buttons ask
// with a second tap instead: first tap arms it for four seconds.
function armed(button, question) {
  if (button.dataset.armed === "1") {
    button.dataset.armed = "";
    clearTimeout(button._disarm);
    return true;
  }
  button.dataset.armed = "1";
  const before = button.textContent;
  button.textContent = question;
  button.classList.add("armed");
  button._disarm = setTimeout(() => {
    button.dataset.armed = "";
    button.classList.remove("armed");
    button.textContent = before;
  }, 4000);
  return false;
}

document.getElementById("reset-btn").addEventListener("click", (event) => {
  const button = event.currentTarget;
  if (!armed(button, state.lang === "en" ? "Sure? Tap again" : "Sikker? Trykk igjen")) return;
  button.classList.remove("armed");
  const { lang, fixtures, furniture, dims, showGrid, showMeasure } = state;
  state = defaultState();
  Object.assign(state, { lang, fixtures, furniture, dims, showGrid, showMeasure });
  save();
  render();
});

document.getElementById("add-row").addEventListener("click", (event) => {
  const size = event.target.dataset.add;
  if (!size) return;
  state.tables.push(makeTable(size));
  save();
  render();
});

// Clicking a plate strip on the map takes that plate out and closes the gap.
document.getElementById("room").addEventListener("click", (event) => {
  const strip = event.target.closest?.(".plate-insert");
  if (!strip) return;
  event.preventDefault();
  if (removePlate(strip.dataset.plateTable, Number(strip.dataset.plateIndex))) {
    trayHint = "";
    save();
    render();
  }
});

document.getElementById("close-drawer").addEventListener("click", () => {
  state.selected = null;
  save();
  render();
});

document.getElementById("size-row").addEventListener("click", (event) => {
  const size = event.target.dataset.size;
  if (!size || !SIZE_KINDS[size]) return;
  const table = getTable(state.selected);
  if (!table) return;
  applySize(table, size);
  relabelRoom();
  save();
  render();
});

document.getElementById("rotate-btn").addEventListener("click", () => {
  const table = getTable(state.selected);
  if (!table) return;
  table.rotated = !table.rotated;
  setCenterCm(table, centerCm(table), false);
  save();
  render();
});

document.getElementById("to-tray-btn").addEventListener("click", () => {
  const table = getTable(state.selected);
  if (!table) return;
  const leavingGroup = table.group;
  table.zone = "tray";
  table.label = "";
  table.name = null;
  table.manual = null;
  table.group = null;
  clearGapPlates(table);
  if (leavingGroup) {
    const left = roomTables().filter((item) => item.group === leavingGroup);
    if (left.length === 1) {
      left[0].group = null;
      clearGapPlates(left[0]);
    } else if (left.length > 1) {
      const sorted = orderGroup(left);
      clearGapPlates(sorted[0]);
      respaceGroup(leavingGroup, sorted[0].id);
    }
  }
  state.selected = null;
  relabelRoom();
  save();
  render();
});

document.getElementById("brush-row").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-brush]");
  if (!btn) return;
  state.brush = btn.dataset.brush || null;
  save();
  render();
});

document.getElementById("room").addEventListener("click", (event) => {
  const seat = event.target.closest(".seat");
  if (!seat) return;
  const table = getTable(seat.dataset.tableId);
  if (!table) return;
  const index = Number(seat.dataset.seatIndex);
  if (!table.seatMarks) table.seatMarks = {};
  if (!state.brush || table.seatMarks[index] === state.brush) delete table.seatMarks[index];
  else table.seatMarks[index] = state.brush;
  save();
  render();
});

document.getElementById("group-row").addEventListener("click", (event) => {
  const table = getTable(state.selected);
  if (!table) return;
  if (event.target.id === "unjoin-btn") {
    const groupId = table.group;
    const members = groupMembers(table);
    table.group = null;
    clearGapPlates(table);
    // a group of one is not a group
    const left = members.filter((item) => item !== table);
    if (left.length === 1) {
      left[0].group = null;
      clearGapPlates(left[0]);
    } else if (left.length > 1) {
      clearGapPlates(orderGroup(left)[0]);
    } else {
      void groupId;
    }
    relabelRoom();
    save();
    render();
    return;
  }
  if (event.target.id !== "join-btn") return;
  const near = nearest(table);
  if (!near || near.table.kind === "furniture") return;
  const other = near.table;
  const groupId = table.group || other.group || `g-${uid()}`;
  for (const item of [table, other]) {
    const existing = item.group ? groupMembers(item) : [item];
    for (const member of existing) member.group = groupId;
  }
  relabelRoom();
  save();
  render();
});

function setManualLabel(value) {
  const table = getTable(state.selected);
  if (!table) return;
  const next = cleanManual(value);
  table.manual = next || null;
  relabelRoom();
  save();
  render();
}

// The people stepper now lives in the label row, next to the number.
document.getElementById("label-row").addEventListener("click", (event) => {
  const seats = event.target.dataset.seats;
  if (!seats) return;
  const table = getTable(state.selected);
  if (!table) return;
  if (seats === "auto") delete table.seatCount;
  else table.seatCount = Math.max(1, Math.min(24, seatCount(table) + Number(seats)));
  save();
  render();
});

function customFields(table) {
  const en = state.lang === "en";
  const own = customCm(table);
  const base = state.dims.long;
  const val = (v) => Number(Number(v).toFixed(1));
  return `<div class="custom-size">
      <span class="custom-title">${en ? "This table's size" : "Mål på dette bordet"}${
        own ? "" : ` <em class="est">${en ? "standard" : "standard"}</em>`
      }</span>
      <label class="label-field"><span>${en ? "Width" : "Bredde"} cm</span>
        <input type="number" id="custom-w" inputmode="decimal" step="0.5" min="30" max="400" value="${val(own ? own.w : base.w)}" /></label>
      <label class="label-field"><span>${en ? "Length" : "Lengde"} cm</span>
        <input type="number" id="custom-l" inputmode="decimal" step="0.5" min="50" max="900" value="${val(own ? own.l : base.l)}" /></label>
      ${own ? `<button type="button" class="status-btn" id="custom-reset">${en ? "Use standard" : "Bruk standard"}</button>` : ""}
    </div>`;
}

function setCustomSize(table, w, l) {
  if (w == null) table.custom = null;
  else table.custom = { w: Math.min(400, Math.max(30, w)), l: Math.min(900, Math.max(50, l)) };
  if (table.zone === "room") {
    setCenterCm(table, centerCm(table), false);
    if (table.group) respaceGroup(table.group, table.id);
  }
  relabelRoom();
  save();
  // Render after focus has moved, then put it back, so typing the width and
  // tabbing/tapping to the length does not lose the length box.
  setTimeout(() => {
    const focusId = document.activeElement?.id;
    render();
    if (focusId) document.getElementById(focusId)?.focus();
  }, 0);
}

document.getElementById("label-row").addEventListener("change", (event) => {
  const id = event.target.id;
  if (id !== "custom-w" && id !== "custom-l") return;
  const table = getTable(state.selected);
  if (!table || table.size !== "long") return;
  const w = document.getElementById("custom-w").valueAsNumber;
  const l = document.getElementById("custom-l").valueAsNumber;
  if (!Number.isFinite(w) || !Number.isFinite(l)) return render();
  setCustomSize(table, Math.round(w * 2) / 2, Math.round(l * 2) / 2);
});

document.getElementById("label-row").addEventListener("click", (event) => {
  if (event.target.id !== "custom-reset") return;
  const table = getTable(state.selected);
  if (table) setCustomSize(table, null);
});

function setTableName(value) {
  const table = getTable(state.selected);
  if (!table) return;
  const next = String(value ?? "").trim().slice(0, 28);
  table.name = next || null;
  save();
  render();
}

document.getElementById("label-row").addEventListener("change", (event) => {
  if (event.target.id === "name-input") return setTableName(event.target.value);
  if (event.target.id !== "label-input") return;
  setManualLabel(event.target.value);
});

document.getElementById("label-row").addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  if (event.target.id === "name-input") {
    event.preventDefault();
    setTableName(event.target.value);
    return;
  }
  if (event.target.id !== "label-input") return;
  event.preventDefault();
  setManualLabel(event.target.value);
});

document.getElementById("label-row").addEventListener("click", (event) => {
  if (event.target.id !== "auto-label") return;
  const table = getTable(state.selected);
  if (!table) return;
  table.manual = null;
  relabelRoom();
  save();
  render();
});

document.getElementById("drawer-measure").addEventListener("click", (event) => {
  const seats = event.target.dataset.seats;
  if (seats) {
    const table = getTable(state.selected);
    if (!table) return;
    if (seats === "auto") delete table.seatCount;
    else table.seatCount = Math.max(1, Math.min(24, seatCount(table) + Number(seats)));
    save();
    render();
    return;
  }
  const dir = event.target.dataset.nudge;
  if (!dir) return;
  const table = getTable(state.selected);
  if (!table) return;
  const step = state.dims.snap && state.dims.snap >= 1 ? state.dims.snap : 10;
  const c = centerCm(table);
  if (dir === "left") c.x -= step;
  if (dir === "right") c.x += step;
  if (dir === "up") c.y -= step;
  if (dir === "down") c.y += step;
  setCenterCm(table, c, false);
  relabelRoom();
  save();
  render();
});

syncFurniture();
clampAll();
relabelRoom();
save();
render();


// --- vanlig oppsett ----------------------------------------------------------
// A starting point built from the user's own numbering rules and the room
// photos: five round tables down each long wall (1-5 left, bottom->top;
// 6-10 right, top->bottom), 16 at the top middle, the langbord (14) down the
// middle on the rug. Sizes and exact spots are a SUGGESTION to drag from,
// not a measurement: the waitress corrects it and the board remembers.
function presetLayout() {
  const r = room();
  const placed = [];
  const put = (size, x, y, rotated = false) => {
    const table = makeTable(size, "room");
    table.rotated = rotated;
    setCenterCm(table, { x, y }, false);
    placed.push(table);
  };
  const leftX = 120;
  const rightX = r.w - 120;
  const step = (r.h - 2 * 200) / 4;
  // left column, table 1 nearest the waitress door (bottom) is the big one
  for (let i = 0; i < 5; i += 1) put(i === 0 ? "big" : "small", leftX, r.h - 200 - i * step);
  // right column, 6 at the top
  for (let i = 0; i < 5; i += 1) put("small", rightX, 200 + i * step);
  put("small", r.w / 2, 160); // 16
  put("long", r.w / 2, r.h / 2 + 40); // 14
  // whatever is left of the normal stock goes back in the tray
  const used = { small: 0, big: 0, long: 0 };
  for (const table of placed) used[table.size] += 1;
  const stock = { small: 8, big: 6, long: 2 };
  const tray = [];
  for (const size of SIZES) {
    for (let i = used[size]; i < stock[size]; i += 1) tray.push(makeTable(size));
  }
  state.tables = [...placed, ...tray];
  state.selected = null;
  relabelRoom();
  save();
  render();
}

document.getElementById("preset-btn")?.addEventListener("click", (event) => {
  const button = event.currentTarget;
  if (!armed(button, state.lang === "en" ? "Replace the floor? Tap again" : "Bytte ut gulvet? Trykk igjen")) return;
  button.classList.remove("armed");
  presetLayout();
});

// --- print in the hosted page -------------------------------------------------
// The hosted frame blocks window.print and new tabs. There the button builds a
// self-contained copy of print.html with the plan baked in and offers it as a
// download; opening that file prints it. As a local file the link works as before.
document.getElementById("print-btn")?.addEventListener("click", async (event) => {
  if (!window.claude?.use) return;
  let downloads = null;
  try {
    downloads = await window.claude.use("downloads");
  } catch {
    downloads = null;
  }
  if (!downloads) return;
  event.preventDefault();
  try {
    save();
    const html = await (await fetch("print.html")).text();
    const data = JSON.stringify(state).replace(/</g, "\\u003c");
    const baked = html.replace("<script>", `<script>window.__NORSKEN_STATE__ = ${data};</script>\n    <script>`);
    const day = new Date().toISOString().slice(0, 10);
    await downloads.save({ filename: `norsken-oppsett-${day}.html`, data: baked });
  } catch (error) {
    if (error?.code !== "declined") console.error(error);
  }
});

connectShare();
