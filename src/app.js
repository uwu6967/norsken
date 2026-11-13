// Rooms (2026-11-12): Spisestua and Domino. Each room is its own plan with
// its own storage key and shared doc. The picked room is per browser.
const ROOMS = {
  spisestua: { no: "Spisestua", en: "Dining room", key: "norsken-layout-v3", doc: "plan/current" },
  domino: { no: "Domino", en: "Domino", key: "norsken-layout-domino-v1", doc: "plan/domino" },
};
const ROOM_KEY = "norsken-room";
const ROOM_ID = (() => {
  try {
    const v = localStorage.getItem(ROOM_KEY);
    return ROOMS[v] ? v : "spisestua";
  } catch {
    return "spisestua";
  }
})();
const STORAGE_KEY = ROOMS[ROOM_ID].key;
// Domino is not measured yet: a placeholder size until Danny sends a photo / tape.
const DOMINO_ROOM = { w: 500, h: 650 }; // from photos 2026-11-12, NOT measured
// Staff habit for seating bookings (see BOOKINGS -> TABLES). Up here because
// defaultState() needs it before the rest of the file has run.
const DEFAULT_BOOKING_ORDER = "3, 6, 5, 8, 10, 9, 11, 7, 2, 4";
const LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14", "15", "16"];

// Kept off-screen for later: two dobbeltdører on the left wall, servitørdør on the
// bottom wall, vindu along the top (glass is smaller than the whole wall).
// Top-right corner: room photos (IMG_2538/2548) show nothing on the floor there,
// so the old dark placeholder block is gone (2026-11-11).

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
const DIMS_VERSION = 11;
const DEFAULT_DIMS = {
  v: DIMS_VERSION,
  room: { w: 700, h: 1360 },
  // 2026-11-11: user measured lite 130 (was 132 from IMG_2482) and stort 150.
  small: { d: 115 },
  big: { d: 135 },
  // Bordplater — tabletop panels fetched from storage and set on bases to
  // build a long table. Three sizes. All still PLACEHOLDERS.
  // A plate fills part of the GAP between two tables. `w` is how much gap it
  // fills; `l` is its length across the table. `n` is how many exist.
  // SEVERAL plates go into one gap side by side (user drawing, 2026-09-22),
  // so the board solves gap -> combination, not gap -> one plate.
  // plateS.w 37 and plateM.w 49.5 are MEASURED (tape photos IMG_2483-2486,
  // confirmed by the user 2026-09-22). plateL.w is still a guess, and so is
  // every `n` — nobody has counted how many of each the restaurant owns.
  // 2026-11-11, tape photos IMG_2558-2563 of the plate stack: 9 plates in FOUR
  // sizes - ~36 x2 (liten, fills 37), ~49 x4 (medium), 55,5 x2, 64 x1.
  plateS: { w: 37, l: 90, n: 2 },
  plateM: { w: 49.5, l: 90, n: 4 },
  plateL: { w: 55.5, l: 90, n: 2 },
  plateXL: { w: 64, l: 90, n: 1 },
  // The rectangular table itself ("langbordet i midten"). Plates go BETWEEN
  // two of these; plates are not tables.
  // ONE HALF of a langbord (the end table with legs); two halves pull apart on
  // wooden rails and the plates drop in between (photos IMG_2715-2719). 90 x 105
  // is read off those photos, NOT taped - stays ANSLAG until someone measures
  // one half. (The old 220 guess made two halves 4,4 m, so no plates were ever
  // needed.)
  long: { w: 90, l: 105 },
  // Table 16 is an OVAL table (user, 2026-11-11; also photo IMG_2538). Size is
  // a guess until someone tapes it - ANSLAG.
  oval: { w: 90, l: 165 },
  // The metal rectangle tables (Danny 2026-11-13): seat 4, no plates. Guess.
  rect: { w: 80, l: 120 },
  // Table length one guest needs along a langbord. Plate planning uses it.
  cover: { d: 60 },
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
    big: false,
    plateS: false,
    plateM: false,
    plateL: false,
    plateXL: false,
    long: true,
    sidebord: true,
    rect: true,
    chairBig: false,
    chairSmall: true,
    cover: true,
    oval: true,
  },
};

// Tables you can put on the floor, in tray and drawer order.
const SIZES = ["small", "big", "oval", "rect", "long"];
// Plate INSERTS. Not tables — they live only in dims and fill gaps.
const PLATES = ["plateS", "plateM", "plateL", "plateXL"];
const SIZE_KINDS = {
  small: "round",
  big: "round",
  oval: "oval",
  rect: "rect", // metal rectangle (sometimes table 2 or 4): 2 + 2, cannot take plates
  long: "plate", // "plate" here is the rectangle KIND, kept for the CSS class
  sidebord: "furniture",
};
const isPlate = (size) => SIZE_KINDS[size] === "plate";

const i18n = {
  no: {
    kicker: "Spisestua · oppsett",
    hint: "Blanke bord i lageret. Nummer følger plassen: 1 nede til venstre, 6 oppe til høyre, 16 i midten oppe. Høyre side er 6–11.",
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
    plateXL: "ekstra stor plate",
    oval: "Ovalt",
    ovalW: "Ovalt bord · bredde",
    ovalL: "Ovalt bord · lengde",
    add: { small: "+ lite", big: "+ stort", oval: "+ ovalt", rect: "+ metallbord", long: "+ langbord" },
    kinds: { small: "Lite bord", big: "Stort bord", oval: "Ovalt bord", rect: "Metallbord (firkant)", long: "Langbord" },
    rect: "Metall",
    rectW: "Metallbord · bredde",
    rectL: "Metallbord · lengde",
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
    plateXLW: "Ekstra stor plate · fyller",
    plateXLN: "Ekstra stor plate · antall",
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
    coverD: "Plass per person (langbord)",
    planTitle: "Personer ved langbordet",
    planBtn: "Finn plater",
    withChairs: "Med stoler",
    paintings: "Malerier",
    paintingKicker: "Maleri",
    paintingName: "Navn",
    paintingNamePh: "Skriv navnet fra skiltet",
    paintingHint: "Dra langs veggen for å flytte det.",
    walls: { left: "Dobbeltdør-veggen", right: "Høyre langvegg", top: "Vindusveggen", bottom: "Servitørdør-veggen" },
    paintingDesc: {
      storm: "Lite stormbilde ved vinduet",
      shipwreck: "Stort skipsforlis i storm",
      sailor: "Sjømann i båt med rød bøye",
      hills: "Grønne åser i solnedgang",
      street: "Gatescene med hest",
      spring: "Kvinne i hvitt ved en bekk",
      punch: "Herrer rundt punsjebollen",
      hunt: "Jegere og hunder ved bjørk",
      waterfall: "Foss i skogen",
    },
    chairNote: "målt fra stolrygg til stolrygg",
    topNote: "målt fra bordkant til bordkant",
    marksTitle: "Merking av plasser",
    marksNote: "Velg en farge og klikk på en stol. Klikk igjen for å fjerne.",
    markNone: "Ingen",
    markNote: "Notat",
    notePrompt: "Notat for denne plassen (f.eks. «ikke blåmugg»). Tomt = fjern.",
    marksTotal: "Merket totalt",
    seatsWord: "plasser",
    seats: "Personer",
    endsLabel: "Kortende",
    bookTitle: "Reservasjoner → bord",
    bookNote: "Én booking per linje: tid, navn, antall. Skriv «B:7» for å låse et bord. Legg ut bordene først (f.eks. Lunsj-oppsett).",
    bookPh: "12:00 2\n12:30 1\n12:15 2 B:7",
    bookOrder: "Prioritet (bord i rekkefølge)",
    bookRun: "Fordel bord",
    bookClear: "Fjern navn fra bordene",
    bookTime: "Tid",
    bookName: "Navn",
    bookGuests: "Pers.",
    bookTable: "Bord",
    bookExtra: "Ekstra",
    bookShared: "felles",
    bookNone: "ingen plass",
    bookEmpty: "Ingen bookinger skrevet inn.",
    turnLabel: "Snu stolene",
    clashTitle: "Stoler kolliderer (røde stoler) – snu stolene eller flytt bordet",
    wall: "vegg",
    lunch: "Lunsj-oppsett",
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
    hint: "Storage is blank. Numbers follow the room: 1 bottom left, 6 top right, 16 middle top. The right side is 6–11.",
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
    plateXL: "extra-large plate",
    oval: "Oval",
    ovalW: "Oval table · width",
    ovalL: "Oval table · length",
    add: { small: "+ small", big: "+ large", oval: "+ oval", rect: "+ metal table", long: "+ long table" },
    kinds: { small: "Small table", big: "Large table", oval: "Oval table", rect: "Metal table (rectangle)", long: "Long table" },
    rect: "Metal",
    rectW: "Metal table · width",
    rectL: "Metal table · length",
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
    plateXLW: "Extra-large plate · fills",
    plateXLN: "Extra-large plate · count",
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
    coverD: "Space per person (long table)",
    planTitle: "People at the long table",
    planBtn: "Find plates",
    withChairs: "With chairs",
    paintings: "Paintings",
    paintingKicker: "Painting",
    paintingName: "Name",
    paintingNamePh: "Type the name from the plaque",
    paintingHint: "Drag along the wall to move it.",
    walls: { left: "Double-door wall", right: "Right long wall", top: "Window wall", bottom: "Waitress-door wall" },
    paintingDesc: {
      storm: "Small storm scene by the window",
      shipwreck: "Large shipwreck in a storm",
      sailor: "Sailor in a boat with a red buoy",
      hills: "Green hills at sunset",
      street: "Street scene with a horse",
      spring: "Woman in white by a stream",
      punch: "Gentlemen round the punch bowl",
      hunt: "Hunters and dogs by a birch",
      waterfall: "Waterfall in the forest",
    },
    chairNote: "measured chair back to chair back",
    topNote: "measured tabletop to tabletop",
    marksTitle: "Seat marking",
    marksNote: "Pick a colour, then click a chair. Click again to clear.",
    markNone: "None",
    markNote: "Note",
    notePrompt: "Note for this seat (e.g. \"no blue cheese\"). Empty = remove.",
    marksTotal: "Marked in total",
    seatsWord: "seats",
    seats: "People",
    endsLabel: "Ends",
    bookTitle: "Bookings → tables",
    bookNote: "One booking per line: time, name, party size. Write \"B:7\" to lock a table. Lay the tables out first (e.g. Lunch setup).",
    bookPh: "12:00 2\n12:30 1\n12:15 2 B:7",
    bookOrder: "Priority (tables in order)",
    bookRun: "Assign tables",
    bookClear: "Clear names from tables",
    bookTime: "Time",
    bookName: "Name",
    bookGuests: "Pax",
    bookTable: "Table",
    bookExtra: "Spare",
    bookShared: "shared",
    bookNone: "no room",
    bookEmpty: "No bookings entered.",
    turnLabel: "Turn chairs",
    clashTitle: "Chairs clash (red chairs) – turn the chairs or move the table",
    wall: "wall",
    lunch: "Lunch setup",
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
  const table = { id: uid(), label: "", zone, x: 50, y: 50, rotated: false, plates: null, gapPlates: null, seatTurn: size === "oval" ? 30 : 45 };
  applySize(table, size);
  return table;
}

function starterTables() {
  return [
    ...Array.from({ length: 8 }, () => makeTable("small")),
    ...Array.from({ length: 6 }, () => makeTable("big")),
    makeTable("oval"),
    makeTable("rect"),
    makeTable("rect"),
    // four langbord halves = two langbord
    ...Array.from({ length: 4 }, () => makeTable("long")),
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
  return roomTables(); // doors, window and the old table are no longer on the map
}

function defaultFixtures() {
  if (ROOM_ID === "domino") return [];
  return [
    { id: "double-1", wall: "left", along: 24 },
    { id: "double-2", wall: "left", along: 68 },
    { id: "waitress", wall: "bottom", along: 50 },
  ];
}

// MALERIER (2026-11-11). Placed from the room photos IMG_2537-2554 and
// IMG_2828-2838, not measured: `along` is the centre in % along that wall
// (left/right walls: from the window; top/bottom walls: from the left wall),
// `span` its length in %. Names are left blank on purpose - the brass plates
// were unreadable in the photos, so staff type them in. Wall words stay off
// the map; the name shows when you tap the painting.
const PAINTING_WALLS = ["left", "right", "top", "bottom"];
function defaultPaintings() {
  return [
    { id: "storm", wall: "left", along: 5, span: 7, name: "" },
    { id: "shipwreck", wall: "left", along: 46, span: 17, name: "" },
    { id: "sailor", wall: "left", along: 91, span: 12, name: "" },
    { id: "waterfall", wall: "top", along: 93, span: 9, name: "" },
    { id: "hunt", wall: "right", along: 11, span: 13, name: "" },
    { id: "punch", wall: "right", along: 44, span: 26, name: "" },
    { id: "spring", wall: "right", along: 83, span: 12, name: "" },
    { id: "hills", wall: "bottom", along: 17, span: 14, name: "" },
    { id: "street", wall: "bottom", along: 77, span: 18, name: "" },
  ];
}

function normalizePaintings(list) {
  if (!Array.isArray(list) || !list.length) return defaultPaintings();
  const out = list
    .filter((p) => p && typeof p.id === "string" && PAINTING_WALLS.includes(p.wall))
    .map((p) => ({
      id: p.id,
      wall: p.wall,
      along: Math.min(97, Math.max(3, Number(p.along) || 50)),
      span: Math.min(40, Math.max(3, Number(p.span) || 10)),
      name: String(p.name || "").slice(0, 60),
    }));
  return out.length ? out : defaultPaintings();
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
    dims: (() => {
      const d = cloneDims();
      if (ROOM_ID === "domino") d.room = { ...DOMINO_ROOM };
      return d;
    })(),
    tables: ROOM_ID === "domino" ? dominoStarter() : starterTables(),
    fixtures: defaultFixtures(),
    furniture: defaultFurniture(),
    paintings: defaultPaintings(),
    showPaintings: false,
    selectedPainting: null,
    bookingsText: "",
    bookingOrder: DEFAULT_BOOKING_ORDER,
    overflow: "redeck", // when Spisestua is full: "redeck" (dekk om) or "domino"
    sitMinutes: 60, // how long a table is taken before it can be laid again
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
  take("oval", dims.oval, saved.oval);
  take("rect", dims.rect, saved.rect);
  // v2 and earlier had a single `long`; it becomes the large plate.
  take("long", dims.long, saved.long);
  take("plateS", dims.plateS, saved.plateS);
  take("plateM", dims.plateM, saved.plateM);
  take("plateL", dims.plateL, saved.plateL);
  take("plateXL", dims.plateXL, saved.plateXL);
  take("sidebord", dims.sidebord, saved.sidebord);
  take("chairBig", dims.chairBig, saved.chairBig);
  take("chairSmall", dims.chairSmall, saved.chairSmall);
  take("cover", dims.cover, saved.cover);
  // v8 (2026-11-11): the user re-measured lite (130, was 132) and counted four
  // medium plates. Both old values were stored as measured, so the normal
  // placeholder rule would keep them; move them only if still the old number.
  if (stale && (Number(saved.v) || 0) < 8) {
    if (saved.small?.d === 132) dims.small.d = 130;
    if (saved.plateM?.n === 2) dims.plateM.n = 4;
  }
  // v11 (2026-11-13): Danny wants the tables drawn smaller with more room
  // between them; exact sizes do not matter to him. Move the old numbers only.
  if (stale && (Number(saved.v) || 0) < 11) {
    if (saved.small?.d === 130) dims.small.d = 115;
    if (saved.big?.d === 150) dims.big.d = 135;
    if (saved.oval?.w === 100 && saved.oval?.l === 180) dims.oval = { w: 90, l: 165 };
  }
  if (Number.isFinite(saved.aisle)) dims.aisle = saved.aisle;
  if (Number.isFinite(saved.snap)) dims.snap = saved.snap;
  if (saved.est) {
    for (const size of [...SIZES, ...PLATES, "sidebord", "chairBig", "chairSmall", "cover"]) {
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
    if (!next.fixtures?.length || ROOM_ID === "domino") next.fixtures = defaultFixtures();
    next.paintings = normalizePaintings(parsed.paintings);
    next.showPaintings = parsed.showPaintings === true;
    if (!next.furniture?.length) next.furniture = defaultFurniture();
    else migrateFurniture(next.furniture);
    next.dims = mergeDims(parsed.dims);
    // the first guess (6 x 10 m) is replaced; a size typed under «Mål» is kept
    if (ROOM_ID === "domino" && (!parsed.dims?.room || (parsed.dims.room.w === 600 && parsed.dims.room.h === 1000))) {
      next.dims.room = { ...DOMINO_ROOM };
    }
    next.showGrid = parsed.showGrid !== false;
    next.withChairs = parsed.withChairs !== false;
    next.showMeasure = parsed.showMeasure === true;
    next.bookingsText = typeof parsed.bookingsText === "string" ? parsed.bookingsText.slice(0, 4000) : "";
    next.bookingOrder = typeof parsed.bookingOrder === "string" && parsed.bookingOrder.trim() ? parsed.bookingOrder.slice(0, 120) : DEFAULT_BOOKING_ORDER;
    if ((Number(parsed.dims?.v) || 0) < 10 && !next.tables.some((t) => t.size === "oval")) {
      const sixteen = next.tables.find((t) => t.zone === "room" && t.label === "16" && (t.size === "small" || t.size === "big"));
      if (sixteen) {
        next.tables.push({ ...sixteen, id: uid(), zone: "tray", label: "", x: 50, y: 50, name: null, seatMarks: null, seatCount: undefined });
        sixteen.size = "oval";
        sixteen.seatTurn = 30;
        delete sixteen.seatCount;
      } else {
        next.tables.push({ id: uid(), label: "", zone: "tray", x: 50, y: 50, rotated: false, plates: null, gapPlates: null, size: "oval", seatTurn: 30 });
      }
    }
    for (const table of next.tables) {
      // v3/v4 briefly modelled plates as tables; they are inserts, so a plate
      // left on the floor becomes the rectangular table it really was.
      if (PLATES.includes(table.size)) table.size = "long";
      if (!SIZE_KINDS[table.size]) table.size = "small";
      table.kind = SIZE_KINDS[table.size];
      table.rotated = Boolean(table.rotated);
      table.ends = [1, 2].includes(Number(table.ends)) ? Number(table.ends) : 0;
      if (!Number.isFinite(table.seatTurn)) table.seatTurn = table.kind === "round" && !table.rotated ? 45 : 0;
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
// Dagens liste: guest names, local to this browser only (see renderGuests).
const GUESTS_KEY = "norsken-guests-v1";
let guests = loadGuests();
let guestMsg = "";
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

// No clamping: a joined langbord must move as one piece. Clamping each half
// on its own squeezed them together at a wall (2026-11-11 bug report).
function setCenterRaw(table, pos) {
  const r = room();
  table.x = (pos.x / r.w) * 100;
  table.y = (pos.y / r.h) * 100;
}

function moveGroupBy(groupId, dx, dy) {
  for (const m of roomTables().filter((item) => item.group === groupId)) {
    const c = centerCm(m);
    setCenterRaw(m, { x: c.x + dx, y: c.y + dy });
  }
}

// Shift the whole joined table back inside the walls, all parts together.
function fitGroupInRoom(groupId) {
  const members = roomTables().filter((item) => item.group === groupId);
  if (!members.length) return;
  const r = room();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const m of members) {
    const c = centerCm(m);
    const s = tableCm(m);
    minX = Math.min(minX, c.x - s.w / 2);
    maxX = Math.max(maxX, c.x + s.w / 2);
    minY = Math.min(minY, c.y - s.h / 2);
    maxY = Math.max(maxY, c.y + s.h / 2);
  }
  const dx = minX < 0 ? -minX : maxX > r.w ? r.w - maxX : 0;
  const dy = minY < 0 ? -minY : maxY > r.h ? r.h - maxY : 0;
  if (dx || dy) moveGroupBy(groupId, dx, dy);
}

function clampAll() {
  const groups = new Set();
  for (const table of state.tables) {
    if (table.zone !== "room") continue;
    if (table.group) groups.add(table.group);
    else setCenterCm(table, centerCm(table), false);
  }
  for (const groupId of groups) fitGroupInRoom(groupId);
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
  if (isPlate(table.size) || spec?.d == null) return `${copy[table.size]} ${cmNum(spec.w)}×${cmNum(spec.l)} cm${tag}`;
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
            note: table.seatNotes?.[seat.index] || null,
            a: Number.isFinite(seat.pos.a) ? Math.round(seat.pos.a) : 0,
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
const SHARED_DOC = ROOMS[ROOM_ID].doc;
const SHARED_KEYS = ["tables", "fixtures", "furniture", "dims", "paintings", "bookingsText", "bookingOrder"];
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
  const view = { lang: state.lang, showGrid: state.showGrid, showMeasure: state.showMeasure, withChairs: state.withChairs, brush: state.brush, showPaintings: state.showPaintings, selectedPainting: state.selectedPainting };
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
  { key: "veganer", color: "#5f7d1f", code: "Vg", no: "Veganer", en: "Vegan" },
  { key: "pescetar", color: "#1f8fb0", code: "P", no: "Pescetarianer", en: "Pescetarian" },
  { key: "annet", color: "#e34948", code: "A", no: "Annet", en: "Other" },
  // a wish about the food, not an allergy - e.g. cold goose at gåsemiddag (yellow on the paper plan)
  { key: "onske", color: "#ffe14d", code: "Ø", no: "Ønske", en: "Request" },
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
    setCenterRaw(cur, pos);
  }
  for (let i = anchorIndex - 1; i >= 0; i -= 1) {
    const next = sorted[i + 1];
    const cur = sorted[i];
    const nc = centerCm(next);
    const pos = { x: nc.x, y: nc.y };
    pos[axis] = nc[axis] - halfAlong(next, axis) - gapWidthOf(next) - halfAlong(cur, axis);
    pos[cross] = line;
    setCenterRaw(cur, pos);
  }
  fitGroupInRoom(groupId);
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

// PEOPLE -> PLATES. Type how many sit at a langbord; the board picks the plates
// from what is actually in stock and pulls the halves apart to fit.
// Length needed = guests per side x cover. The answer is the SMALLEST plate
// combination that is long enough (ties -> fewer plates).
let planNote = ""; // one-shot message in the drawer, not saved

function fitRunInRoom(lead) {
  if (lead?.group) fitGroupInRoom(lead.group);
}

function pairUp(table) {
  if (groupSeatLead(table)) return orderGroup(groupMembers(table));
  // find a free half: nearest ungrouped langbord on the floor, else one from the tray
  const c = centerCm(table);
  const loose = roomTables()
    .filter((t) => t !== table && t.size === "long" && !t.group)
    .sort((p, q) => Math.hypot(centerCm(p).x - c.x, centerCm(p).y - c.y) - Math.hypot(centerCm(q).x - c.x, centerCm(q).y - c.y));
  let partner = loose.find((t) => Math.hypot(centerCm(t).x - c.x, centerCm(t).y - c.y) < 400);
  if (!partner) {
    partner = state.tables.find((t) => t.zone !== "room" && t.size === "long");
    if (!partner) return null;
    partner.zone = "room";
    partner.rotated = table.rotated;
    if (table.custom) partner.custom = { ...table.custom };
  }
  const vertical = tableCm(table).h >= tableCm(table).w;
  const s = tableCm(table);
  const pos = vertical ? { x: c.x, y: c.y + s.h } : { x: c.x + s.w, y: c.y };
  setCenterCm(partner, pos, false);
  const groupId = `g-${uid()}`;
  table.group = groupId;
  partner.group = groupId;
  const sorted = orderGroup([table, partner]);
  sorted[0].gapPlates = null;
  sorted[1].gapPlates = [];
  respaceGroup(groupId, sorted[0].id);
  return sorted;
}

function bestPlatesAtLeast(need, stock) {
  const items = PLATES.map((size) => ({ size, w: plateWidth(size), n: stock[size] })).filter((i) => i.w > 0 && i.n > 0);
  let best = null;
  let most = { total: 0, list: [] };
  const walk = (idx, list, total) => {
    if (idx === items.length) {
      if (total > most.total) most = { total, list: list.slice() };
      if (total + 0.001 >= need && (!best || total < best.total - 0.001 || (Math.abs(total - best.total) < 0.001 && list.length < best.list.length))) {
        best = { total, list: list.slice() };
      }
      return;
    }
    for (let k = 0; k <= items[idx].n; k += 1) {
      for (let j = 0; j < k; j += 1) list.push(items[idx].size);
      walk(idx + 1, list, total + k * items[idx].w);
      list.length -= k;
    }
  };
  walk(0, [], 0);
  return best ? { ...best, short: false } : { ...most, short: true };
}

function planPlates(table, people) {
  const en = state.lang === "en";
  const members = pairUp(table);
  if (!members) {
    planNote = en ? "No free langbord half to pair with." : "Ingen ledig langbord-halvdel å sette sammen med.";
    return;
  }
  const lead = members[0];
  for (let i = 1; i < members.length; i += 1) members[i].gapPlates = [];
  const axis = groupAxis(members);
  const base = members.reduce((sum, m) => sum + halfAlong(m, axis) * 2, 0);
  const ends = endSeatsOf(lead);
  const cover = Math.max(30, state.dims.cover.d);
  const want = Math.max(2, Math.min(40, people));
  const perSide = Math.ceil(Math.max(0, want - ends) / 2);
  const need = Math.max(0, perSide * cover - base);
  const stock = {};
  for (const size of PLATES) stock[size] = plateStock(size); // this run's plates were just released
  const pick = need > 0 ? bestPlatesAtLeast(need, stock) : { total: 0, list: [], short: false };
  pick.list.sort((p, q) => plateWidth(q) - plateWidth(p));
  members[1].gapPlates = pick.list;
  respaceGroup(lead.group, lead.id);
  fitRunInRoom(lead);
  const length = base + pick.total;
  const fits = ends + 2 * Math.floor(length / cover);
  lead.seatCount = pick.short ? Math.min(want, fits) : want;
  relabelRoom();
  const plates = pick.list.length ? plateListText(pick.list) : en ? "no plates" : "ingen plater";
  const len = `${(length / 100).toFixed(2).replace(".", en ? "." : ",")} m`;
  planNote = pick.short
    ? en
      ? `Not enough plates: all of them give ${len}, room for ${fits}.`
      : `For få plater: alle gir ${len}, plass til ${fits}.`
    : en
      ? `${want} people → ${plates}. Table ${len}.`
      : `${want} personer → ${plates}. Bordet blir ${len}.`;
}

// ---------------------------------------------------------------------------
// BOOKINGS -> TABLES (2026-11-11, from the ResDiary printouts IMG_2845/2846)
// Staff re-seat every ResDiary list by hand, by a fixed habit:
// - side tables first, in a set order: 3, 6, 5, 8, 10, 9, 11, then 7, 2, 4
// - never the middle (12, 14, 15); 14 stays the shared table for walk-ins
// - more than 5 people -> the oval 16 first, then a stort table
// - earliest booking gets the first free table in the order
// - "B:7" on a line locks that booking to table 7
// The leftover side tables are listed as "Ekstra", like the hand note
// "EKSTRA: 4, 11 + 14 (FELLES)".
// ---------------------------------------------------------------------------
const MIDDLE_LABELS = new Set(["12", "14", "15"]);
let bookingResult = null; // last assignment, shown under the panel (not saved)

// Side tables only: no langbord, nothing standing in the middle band of the
// room (that is where 12, 14, 15 and the oval 16 stand), whatever its number.
function isSideTable(table) {
  if (table.kind === "plate" || MIDDLE_LABELS.has(String(table.label))) return false;
  return table.x < 38 || table.x > 62;
}

function parseBookings(text) {
  const out = [];
  String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      let rest = line;
      let time = "";
      const tm = rest.match(/^(\d{1,2})(?:[:.](\d{2}))?(?=\s)/);
      if (tm) {
        time = `${tm[1].padStart(2, "0")}:${tm[2] || "00"}`;
        rest = rest.slice(tm[0].length).trim();
      }
      let forced = null;
      const fm = rest.match(/(?:^|\s)(?:b\s*:|bord\s*:?)\s*(\d{1,2}[a-z]?)(?=\s|$)/i); // "B:7" or "bord 7" - a lone "B" is an initial
      if (fm) {
        forced = fm[1].toLowerCase();
        rest = (rest.slice(0, fm.index) + " " + rest.slice(fm.index + fm[0].length)).trim();
      }
      let guests = 2;
      const gm = rest.match(/(?:^|\s)(\d{1,2})\s*(?:p|pers|personer|gjester|pax)?(?=\s|$)/i);
      if (gm) {
        guests = Math.max(1, Math.min(40, Number(gm[1])));
        rest = (rest.slice(0, gm.index) + " " + rest.slice(gm.index + gm[0].length)).trim();
      }
      out.push({ index, time, name: rest.replace(/\s+/g, " ").trim(), guests, forced });
    });
  return dropSubtotals(out, (b) => b.name, (b) => b.guests);
}

// ResDiary prints a subtotal per time slot: the time and the covers, no name
// (e.g. «12:00 11» after five bookings at 12:00). That is not a booking. A
// nameless line whose number equals the sum of the named bookings at the same
// time is dropped; any other nameless line is kept.
function dropSubtotals(list, nameOf, paxOf) {
  const sums = new Map();
  for (const b of list) {
    if (!nameOf(b)) continue;
    sums.set(b.time, (sums.get(b.time) || 0) + (Number(paxOf(b)) || 0));
  }
  return list.filter((b) => nameOf(b) || !sums.has(b.time) || sums.get(b.time) !== Number(paxOf(b)));
}

function tableCapacity(table) {
  if (table.kind === "plate") return seatsOf(seatOwner(table)).length || 4;
  if (table.kind === "oval") return 8;
  if (table.size === "big") return 6;
  return 4;
}

function clearBookedNames() {
  for (const table of state.tables) {
    delete table.redeck;
    delete table.redeckPax;
    if (!table.booked) continue;
    table.name = null;
    delete table.seatCount;
    table.booked = false;
  }
}

function assignBookings() {
  const bookings = parseBookings(state.bookingsText);
  clearBookedNames();
  const floor = roomTables().filter((t) => t.lead !== false && t.label);
  if (!floor.length) {
    bookingResult = { rows: [], spare: [], shared: false, noTables: true };
    return;
  }
  const labelMap = new Map(floor.map((t) => [String(t.label).toLowerCase(), t]));
  const domino = ROOM_ID === "domino";
  const order = domino
    ? floor.slice().sort(byLabel).map((t) => String(t.label).toLowerCase())
    : String(state.bookingOrder || DEFAULT_BOOKING_ORDER)
        .split(/[^0-9a-z]+/i)
        .map((s) => s.toLowerCase())
        .filter((s) => labelMap.has(s) && isSideTable(labelMap.get(s)));
  const side = domino
    ? []
    : floor
        .filter((t) => isSideTable(t) && !order.includes(String(t.label).toLowerCase()))
        .sort(byLabel)
        .map((t) => String(t.label).toLowerCase());
  const taken = new Set();
  const redecked = new Set();
  const firstTime = new Map(); // table label -> minutes of its first booking
  const sitMin = Math.max(15, Number(state.sitMinutes) || 60);
  const rows = [];
  const sorted = bookings.slice().sort((p, q) => (p.time || "99").localeCompare(q.time || "99") || p.index - q.index);
  // locked ones first so nobody else takes their table
  const locked = sorted.filter((b) => b.forced && labelMap.has(b.forced));
  const free = sorted.filter((b) => !(b.forced && labelMap.has(b.forced)));
  for (const b of locked) {
    if (taken.has(b.forced)) rows.push({ ...b, table: null });
    else {
      taken.add(b.forced);
      firstTime.set(b.forced, minutesOf(b.time));
      rows.push({ ...b, table: labelMap.get(b.forced) });
    }
  }
  for (const b of free) {
    if (domino) {
      const pick = order.find((label) => !taken.has(label) && tableCapacity(labelMap.get(label)) >= b.guests);
      if (pick) taken.add(pick);
      rows.push({ ...b, table: pick ? labelMap.get(pick) : null });
      continue;
    }
    const list = ruleOrder(b.guests, floor, order, side);
    const fits = (label, cap) => labelMap.has(label) && !taken.has(label) && cap(labelMap.get(label)) >= b.guests;
    // first where it is comfortable, then where it can squeeze in
    let pick = list.find((label) => fits(label, softCap)) || list.find((label) => fits(label, hardCap));
    if (pick) {
      taken.add(pick);
      firstTime.set(pick, minutesOf(b.time));
      rows.push({ ...b, table: labelMap.get(pick) });
      continue;
    }
    // a big group: a middle langbord (or 16 as the wooden table) is pulled out
    // with plates for this many people. 14 is the shared table: last.
    // only for groups bigger than any side table (7+); small groups are re-set instead
    const middle = b.guests > 6 && ["16", "12", "15", "14"].find((label) => {
      const t = labelMap.get(label);
      return t && t.kind === "plate" && !taken.has(label);
    });
    if (middle) {
      taken.add(middle);
      firstTime.set(middle, minutesOf(b.time));
      planPlates(labelMap.get(middle), b.guests);
      rows.push({ ...b, table: labelMap.get(middle) });
      continue;
    }
    // full: lay a table again once its first guests have had their time
    if (state.overflow !== "domino") {
      const at = minutesOf(b.time);
      // the table whose first guests came earliest is free first
      const want = (cap) =>
        floor
          .filter((t) => {
            const label = String(t.label).toLowerCase();
            const first = firstTime.get(label);
            return taken.has(label) && !redecked.has(label) && first != null && at != null && at - first >= sitMin && cap(t) >= b.guests;
          })
          .sort((p, q) => firstTime.get(String(p.label).toLowerCase()) - firstTime.get(String(q.label).toLowerCase()))[0];
      const again = want(softCap) || want(hardCap);
      if (again) {
        redecked.add(String(again.label).toLowerCase());
        rows.push({ ...b, table: again, redeck: true });
        continue;
      }
    }
    rows.push({ ...b, table: null });
  }
  for (const row of rows) {
    if (!row.table) continue;
    if (row.redeck) {
      row.table.redeck = `${row.time ? `${row.time} ` : ""}${row.name}`.trim().slice(0, 28);
      row.table.redeckPax = row.guests;
      row.table.seatCount = Math.max(Number(row.table.seatCount) || 0, row.guests);
      continue;
    }
    row.table.name = `${row.time ? `${row.time} ` : ""}${row.name}`.trim().slice(0, 28) || null;
    row.table.seatCount = row.guests;
    row.table.booked = true;
  }
  if (!domino) overflowToDomino(rows.filter((row) => !row.table)); // «Bruk Domino», or the last fallback
  rows.sort((p, q) => (p.time || "99").localeCompare(q.time || "99") || p.index - q.index);
  const spare = order.filter((label) => !taken.has(label));
  const shared = floor.some((t) => String(t.label) === "14");
  bookingResult = { rows, spare, shared };
  relabelRoom();
}

// Domino is the last resort (Danny 2026-11-12): bookings that do not fit in
// Spisestua get a Domino table. Domino's plan is read and written straight in
// this browser's storage; it is started from the photo layout if it is empty.
function readRoomPlan(id) {
  try {
    const plan = JSON.parse(localStorage.getItem(ROOMS[id].key) || "null");
    if (plan?.tables?.length) return plan;
  } catch {}
  return null;
}

function clearDominoBooked() {
  const plan = readRoomPlan("domino");
  if (!plan) return;
  for (const table of plan.tables) {
    if (!table.booked) continue;
    table.name = null;
    delete table.seatCount;
    table.booked = false;
  }
  try {
    localStorage.setItem(ROOMS.domino.key, JSON.stringify(plan));
  } catch {}
}

function overflowToDomino(rows) {
  clearDominoBooked();
  if (!rows.length) return;
  const plan = readRoomPlan("domino") || { tables: dominoStarter() };
  const cap = (t) => {
    if (Number.isFinite(t.seatCount) && t.seatCount > 0 && !t.booked) return t.seatCount;
    if (t.size === "long") return 2 * Math.max(1, Math.floor(((t.custom && t.custom.l) || state.dims.long.l) / Math.max(20, state.dims.chairBig.d)));
    if (t.size === "oval") return 8;
    if (t.size === "big") return 6;
    return 4;
  };
  const free = plan.tables
    .filter((t) => t.zone === "room" && t.lead !== false && t.label)
    .sort((a, b) => (parseInt(a.label, 10) || 999) - (parseInt(b.label, 10) || 999));
  const taken = new Set();
  for (const row of rows) {
    const pick = free.find((t) => !taken.has(t.id) && cap(t) >= row.guests) || null;
    if (!pick) continue;
    taken.add(pick.id);
    pick.name = `${row.time ? `${row.time} ` : ""}${row.name}`.trim().slice(0, 28) || null;
    pick.seatCount = row.guests;
    pick.booked = true;
    row.table = pick;
    row.room = "domino";
  }
  try {
    localStorage.setItem(ROOMS.domino.key, JSON.stringify(plan));
  } catch {}
}

function minutesOf(time) {
  const m = String(time || "").match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

// Danny's table rules (2026-11-13), Spisestua only.
//  soft = comfortable, hard = only when nothing comfortable is left.
//  3: the big spot – 4+ people go here first, up to 6.
//  4: 4 is comfortable, 6 if it must (a metal table: 4).
//  5: awkward – 2, max 3; up to 6 only when everything else is full.
//  2: round = 2; the metal rectangle = 4.
//  1: up to 8, only when it is the big table.
function softCap(table) {
  const label = String(table.label);
  if (table.kind === "plate") return 0; // langbord: pulled out for big groups instead
  if (label === "2") return table.size === "rect" ? 4 : 2;
  if (label === "5") return 3;
  if (label === "3") return 6;
  if (label === "1" && table.size === "big") return 8;
  if (table.size === "rect") return 4;
  return tableCapacity(table);
}

function hardCap(table) {
  const label = String(table.label);
  if (label === "4") return table.size === "rect" ? 4 : 6;
  if (label === "5") return 6;
  return softCap(table);
}

function ruleOrder(guests, floor, order, side) {
  const base = [...order, ...side];
  if (guests > 5) {
    const big1 = floor.some((t) => String(t.label) === "1" && t.size === "big") ? ["1"] : [];
    const bigs = floor.filter((t) => t.size === "big" && String(t.label) !== "1").map((t) => String(t.label).toLowerCase());
    return [...new Set(["16", "3", ...big1, ...bigs, ...base])];
  }
  if (guests >= 4) return [...new Set(["3", ...base])];
  // 2-3 people: keep the big spot (3) for bigger groups, 5 suits them well
  return [...new Set([...base.filter((label) => label !== "3"), "3"])];
}

function renderBookings() {
  const copy = t();
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set("book-title", copy.bookTitle);
  set("book-note", copy.bookNote);
  set("book-order-label", copy.bookOrder);
  const en0 = state.lang === "en";
  set("overflow-title", en0 ? "When Spisestua is full" : "Når Spisestua er full");
  set("overflow-redeck", en0 ? "Re-set a table (↻)" : "Dekk om et bord (↻)");
  set("overflow-domino", en0 ? "Use Domino" : "Bruk Domino");
  set("sit-label", en0 ? "Minutes before a table can be re-set" : "Minutter før et bord kan dekkes om");
  document.getElementById("overflow-redeck")?.classList.toggle("on", state.overflow !== "domino");
  document.getElementById("overflow-domino")?.classList.toggle("on", state.overflow === "domino");
  const sit = document.getElementById("sit-minutes");
  if (sit && document.activeElement !== sit) sit.value = String(Number(state.sitMinutes) || 60);
  const rulesEl = document.getElementById("book-rules");
  if (rulesEl) {
    rulesEl.innerHTML = (state.lang === "en"
      ? [
          "<b>3</b>: the big spot – 4 or more first, up to 6",
          "<b>4</b>: 4 is comfortable, 6 only if needed",
          "<b>5</b>: 2, max 3 – more only when everything is full",
          "<b>2</b>: round = 2, metal table = 4",
          "<b>1</b>: up to 8 when it is the big table",
          "<b>16</b>: oval or the wooden extendable table",
          "<b>Middle (12, 15, 14)</b>: big groups – pulled out with plates. 14 last (shared table)",
          "Still no room: a table is <b>re-set ↻</b> after its first guests (or Domino – your choice above)",
        ]
      : [
          "<b>3</b>: den store plassen – 4 eller flere først, opptil 6",
          "<b>4</b>: 4 er komfortabelt, 6 bare hvis det trengs",
          "<b>5</b>: 2, maks 3 – flere bare når alt annet er fullt",
          "<b>2</b>: rundt = 2, metallbord = 4",
          "<b>1</b>: opptil 8 når det er det store bordet",
          "<b>16</b>: ovalt eller trebordet som kan trekkes ut",
          "<b>Midten (12, 15, 14)</b>: store selskap – trekkes ut med plater. 14 sist (felles bord)",
          "Fortsatt ikke plass: et bord <b>dekkes om ↻</b> etter de første gjestene (eller Domino – velg over)",
        ]
    )
      .map((line) => `<li>${line}</li>`)
      .join("");
  }
  set("book-run", copy.bookRun);
  set("book-clear", copy.bookClear);
  const text = document.getElementById("book-text");
  if (text) {
    text.placeholder = copy.bookPh;
    if (document.activeElement !== text) text.value = state.bookingsText || "";
  }
  const order = document.getElementById("book-order");
  if (order && document.activeElement !== order) order.value = state.bookingOrder || DEFAULT_BOOKING_ORDER;
  const out = document.getElementById("book-result");
  if (!out) return;
  if (!bookingResult) {
    out.innerHTML = "";
    return;
  }
  if (bookingResult.noTables) {
    out.innerHTML = `<p class="brush-note tight">${
      state.lang === "en"
        ? "No tables on the floor in this room yet. Press «Usual setup» (or drag tables out) first, then «Assign tables»."
        : "Ingen bord ute i dette rommet ennå. Trykk «Vanlig oppsett» (eller dra ut bord) først, og så «Fordel bord»."
    }</p>`;
    return;
  }
  if (!bookingResult.rows.length) {
    out.innerHTML = `<p class="brush-note">${copy.bookEmpty}</p>`;
    return;
  }
  const extra = [...bookingResult.spare, ...(bookingResult.shared ? [`14 (${copy.bookShared})`] : [])];
  out.innerHTML = `<div class="table-scroll"><table class="measure-table"><thead><tr><th>${copy.bookTime}</th><th>${copy.bookName}</th><th>${copy.bookGuests}</th><th>${copy.bookTable}</th></tr></thead><tbody>${bookingResult.rows
    .map(
      (r) =>
        `<tr><td>${esc(r.time || "–")}</td><td>${esc(r.name || "–")}</td><td>${r.guests}</td><td>${
          r.table
            ? `<strong>${esc(r.room ? `${ROOMS[r.room].no} ${r.table.label}` : r.table.label)}</strong>${
                r.redeck ? ` <span class="redeck-tag">↻ ${state.lang === "en" ? "re-set" : "dekk om"}</span>` : ""
              }`
            : `<span class="tight">${copy.bookNone}</span>`
        }</td></tr>`,
    )
    .join("")}</tbody></table></div>${extra.length ? `<p class="book-extra"><strong>${copy.bookExtra}:</strong> ${esc(extra.join(", "))}</p>` : ""}`;
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
const ROUND_DEFAULT_SEATS = 0; // no chairs until people are added (Danny 2026-11-13)
const OVAL_DEFAULT_SEATS = 0;

// Chairs at the short ends of a rectangle (2026-11-11, lunch photos IMG_2839-2842:
// the langbord by the window has a chair at its window end). 0, 1 or 2.
// 1 = the end nearest the window (top), or the left end if the table lies across.
function endSeatsOf(table) {
  if (table.kind === "round") return 0;
  const n = Number(table.ends);
  return n === 1 || n === 2 ? n : 0;
}

// A joined langbord (halves + plates) seats as ONE table: the lead carries
// every chair along the whole run, the other halves carry none. Guests sit
// along the plates too - the plates are tabletop.
function groupSeatLead(table) {
  if (!table?.group || table.zone !== "room") return null;
  const members = roomTables().filter((item) => item.group === table.group);
  if (members.length < 2 || members.some((item) => item.kind !== "plate")) return null;
  return orderGroup(members)[0];
}

function seatOwner(table) {
  return groupSeatLead(table) || table;
}

function groupRun(lead) {
  const members = orderGroup(groupMembers(lead));
  const axis = groupAxis(members);
  const first = members[0];
  const last = members[members.length - 1];
  const start = centerCm(first)[axis] - halfAlong(first, axis);
  const end = centerCm(last)[axis] + halfAlong(last, axis);
  const across = Math.min(...members.map((m) => (axis === "y" ? tableCm(m).w : tableCm(m).h)));
  const cross = centerCm(first)[axis === "y" ? "x" : "y"];
  return { axis, start, end, length: end - start, across, cross, members };
}

function seatCount(table) {
  const lead = groupSeatLead(table);
  if (lead && lead !== table) return 0;
  if (Number.isFinite(table.seatCount) && table.seatCount > 0) return Math.min(40, table.seatCount);
  // No chairs until somebody adds people (+ / −, «Fordel bord», Dagens liste).
  if (table.kind === "round") return ROUND_DEFAULT_SEATS;
  if (table.kind === "oval") return OVAL_DEFAULT_SEATS;
  return 0;
}

// Squares laid around the table, the way chairs actually stand.
function seatPositions(table) {
  const lead = groupSeatLead(table);
  if (lead && lead !== table) return [];
  if (lead) {
    const run = groupRun(lead);
    const chair = Math.max(20, state.dims.chairBig.d);
    const count = seatCount(lead);
    const ends = Math.min(endSeatsOf(lead), count);
    const sideCount = count - ends;
    const perSide = Math.ceil(sideCount / 2);
    const offset = run.across / 2 + chair * 0.62;
    const out = [];
    const at = (along, side, endDir) =>
      run.axis === "y"
        ? { x: run.cross + side, y: along, a: endDir != null ? (endDir < 0 ? -90 : 90) : side > 0 ? 0 : 180 }
        : { x: along, y: run.cross + side, a: endDir != null ? (endDir < 0 ? 180 : 0) : side > 0 ? 90 : -90 };
    for (let side = 0; side < 2 && out.length < sideCount; side += 1) {
      for (let i = 0; i < perSide && out.length < sideCount; i += 1) {
        out.push(at(run.start + ((i + 0.5) / perSide) * run.length, side ? offset : -offset));
      }
    }
    for (let e = 0; e < ends; e += 1) out.push(at(e === 0 ? run.start - chair * 0.62 : run.end + chair * 0.62, 0, e === 0 ? -1 : 1));
    return out;
  }
  const s = tableCm(table);
  const c = centerCm(table);
  const chair = Math.max(20, state.dims.chairBig.d);
  const count = seatCount(table);
  const out = [];
  // The oval (table 16) is a stadium: straight long sides, round ends. Chairs
  // go along the long sides like a langbord (3 + 3 by default), plus end
  // chairs with Kortende. It falls through to the rectangle code below.
  if (table.kind === "round") {
    const radius = s.w / 2 + chair * 0.62;
    // A circle looks the same rotated, so "Roter" on a round table turns the
    // CHAIR RING by half a place instead — 4 covers at N/E/S/W become the
    // diagonals. That is the only rotation that means anything here.
    // seatTurn (degrees) is set with the ⟲ ⟳ buttons; the old Roter half-place still counts
    const turn = (table.rotated ? Math.PI / count : 0) + ((Number(table.seatTurn) || 0) * Math.PI) / 180;
    // 1-3 guests sit with their backs to the nearest wall (Danny's sketch,
    // 2026-11-12): 2 = both wall-side diagonals, 3 = those two plus one on
    // the open side ("just pick a side"), 4+ = the normal even split.
    // ⟲ ⟳ still turn it: seatTurn counts from the default 45.
    if (count <= 0) return [];
    if (count <= 3) {
      const cl = clearances(table);
      const walls = [
        [cl.left, Math.PI],
        [cl.right, 0],
        [cl.top, -Math.PI / 2],
        [cl.bottom, Math.PI / 2],
      ].sort((p, q) => p[0] - q[0]);
      const wall = walls[0][1] + (((Number(table.seatTurn) || 0) - 45) * Math.PI) / 180;
      const q = Math.PI / 4;
      const angles = count === 1 ? [wall] : count === 2 ? [wall - q, wall + q] : [wall - q, wall + q, wall + Math.PI - q];
      return angles.map((angle) => ({ x: c.x + Math.cos(angle) * radius, y: c.y + Math.sin(angle) * radius, a: (angle * 180) / Math.PI }));
    }
    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + turn + (i * 2 * Math.PI) / count;
      out.push({ x: c.x + Math.cos(angle) * radius, y: c.y + Math.sin(angle) * radius, a: (angle * 180) / Math.PI });
    }
    return out;
  }
  const vertical = s.h >= s.w;
  const along = vertical ? s.h : s.w;
  const offset = (vertical ? s.w : s.h) / 2 + chair * 0.62;
  const ends = Math.min(endSeatsOf(table), count);
  const sideCount = count - ends;
  const perSide = Math.ceil(sideCount / 2);
  for (let side = 0; side < 2 && out.length < sideCount; side += 1) {
    for (let i = 0; i < perSide && out.length < sideCount; i += 1) {
      const pos = -along / 2 + ((i + 0.5) / perSide) * along;
      if (vertical) out.push({ x: c.x + (side ? offset : -offset), y: c.y + pos, a: side ? 0 : 180 });
      else out.push({ x: c.x + pos, y: c.y + (side ? offset : -offset), a: side ? 90 : -90 });
    }
  }
  // end chairs go last so marks already on the side chairs keep their seat
  const endOffset = along / 2 + chair * 0.62;
  for (let e = 0; e < ends; e += 1) {
    const sign = e === 0 ? -1 : 1;
    if (vertical) out.push({ x: c.x, y: c.y + sign * endOffset, a: sign < 0 ? -90 : 90 });
    else out.push({ x: c.x + sign * endOffset, y: c.y, a: sign < 0 ? 180 : 0 });
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
  const grouped = Boolean(groupSeatLead(table));
  return seatPositions(table)
    .map((pos, index) => ({ pos, index, mark: table.seatMarks?.[index] || null }))
    .filter((seat) => grouped || !seatBlocked(table, seat.pos));
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

  if (ROOM_ID === "domino") {
    for (const table of tables) if (table.manual) used.add(table.manual);
    let n = 1;
    tables
      .slice()
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .forEach((table) => {
        if (table.manual) {
          table.label = table.manual;
          return;
        }
        while (used.has(String(n))) n += 1;
        table.label = String(n);
        used.add(String(n));
      });
    for (const table of all) table.guests = seatsOf(table).length;
    for (const table of all) table.groupInfo = null;
    for (const members of groupsOf(all).values()) {
      const lead = leadOf(members);
      for (const member of members) if (member !== lead) member.label = lead.label;
      lead.groupInfo = { count: members.length, gaps: groupGaps(members), strips: groupStrips(members) };
    }
    return;
  }

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
  let plates = tables.filter((item) => item.kind === "plate").sort((a, b) => a.y - b.y);
  const rounds = tables.filter((item) => item.kind === "round" || item.kind === "oval" || item.kind === "rect");

  // 16 is the top-middle table: the oval, or sometimes the extendable wooden
  // table (a langbord) – Danny 2026-11-13.
  const sixteen = [...rounds, ...plates.filter((item) => !item.manual)]
    .filter((item) => item.y <= TOP_MAX && item.x >= 38 && item.x <= 62)
    .sort((a, b) => Math.abs(a.x - 50) + a.y * 0.35 - (Math.abs(b.x - 50) + b.y * 0.35))[0];
  if (sixteen) plates = plates.filter((item) => item !== sixteen);
  if (plates.some((item) => !item.manual)) used.add("14");
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

function getPainting(id) {
  return state.paintings.find((item) => item.id === id);
}

function movePainting(id, clientX, clientY) {
  const painting = getPainting(id);
  if (!painting) return;
  const pos = dropPercent(clientX, clientY);
  const raw = painting.wall === "left" || painting.wall === "right" ? pos.y : pos.x;
  const half = painting.span / 2;
  painting.along = Math.round(Math.min(100 - half, Math.max(half, raw)) * 2) / 2;
}

function paintingTitle(painting) {
  const copy = t();
  return painting.name || copy.paintingDesc?.[painting.id] || copy.paintingKicker;
}

function paintingButton(painting) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `fixture painting ${painting.wall}${state.selectedPainting === painting.id ? " active" : ""}`;
  el.dataset.paintingId = painting.id;
  el.title = paintingTitle(painting);
  el.setAttribute("aria-label", paintingTitle(painting));
  if (painting.wall === "left" || painting.wall === "right") {
    el.style.top = `${painting.along}%`;
    el.style.height = `${painting.span}%`;
  } else {
    el.style.left = `${painting.along}%`;
    el.style.width = `${painting.span}%`;
  }
  el.addEventListener("pointerdown", (event) => startDrag(event, { kind: "painting", id: painting.id }, el));
  el.addEventListener("mousedown", (event) => {
    if (drag) return;
    startDrag(event, { kind: "painting", id: painting.id }, el);
  });
  return el;
}

function renderPaintingCard() {
  const card = document.getElementById("painting-card");
  if (!card) return;
  const painting = state.showPaintings ? getPainting(state.selectedPainting) : null;
  if (!painting) {
    card.hidden = true;
    return;
  }
  const copy = t();
  card.hidden = false;
  document.getElementById("painting-kicker").textContent = `${copy.paintingKicker} · ${copy.walls[painting.wall]}`;
  document.getElementById("painting-desc").textContent = copy.paintingDesc?.[painting.id] || "";
  document.getElementById("painting-name-label").textContent = copy.paintingName;
  document.getElementById("painting-hint").textContent = copy.paintingHint;
  const input = document.getElementById("painting-name");
  input.placeholder = copy.paintingNamePh;
  if (document.activeElement !== input) input.value = painting.name || "";
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

// Chairs that run into another table's chairs, another table, or a wall.
// Chairs are ~square and turn to face their table, so a circle of 0,45 x
// chair width is a fair footprint.
function seatClashes() {
  const chair = Math.max(20, state.dims.chairBig.d);
  const r = room();
  const all = [];
  for (const table of roomTables()) for (const seat of seatsOf(table)) all.push({ table, seat });
  const bad = new Set();
  const pairs = new Map();
  const key = (item) => `${item.table.id}:${item.seat.index}`;
  const owner = (table) => table.group || table.id;
  const note = (a, b) => {
    const k = [a, b].sort().join("|");
    if (!pairs.has(k)) pairs.set(k, [a, b]);
  };
  for (let i = 0; i < all.length; i += 1) {
    const p = all[i];
    const { x, y } = p.seat.pos;
    const edge = chair * 0.3;
    if (x < edge || y < edge || x > r.w - edge || y > r.h - edge) {
      bad.add(key(p));
      note(obstacleName(seatOwner(p.table)), t().wall || "vegg");
    }
    for (let j = i + 1; j < all.length; j += 1) {
      const q = all[j];
      if (owner(p.table) === owner(q.table)) continue;
      if (Math.hypot(x - q.seat.pos.x, y - q.seat.pos.y) < chair * 0.9) {
        bad.add(key(p));
        bad.add(key(q));
        note(obstacleName(seatOwner(p.table)), obstacleName(seatOwner(q.table)));
      }
    }
    for (const other of obstacles()) {
      if (other === p.table || (other.group && other.group === p.table.group)) continue;
      const c = centerCm(other);
      const s = tableCm(other);
      const hit =
        other.kind === "round"
          ? Math.hypot(x - c.x, y - c.y) < s.w / 2 + chair * 0.3
          : Math.abs(x - c.x) < s.w / 2 + chair * 0.3 && Math.abs(y - c.y) < s.h / 2 + chair * 0.3;
      if (hit) {
        bad.add(key(p));
        note(obstacleName(seatOwner(p.table)), obstacleName(other.group ? seatOwner(other) : other));
      }
    }
  }
  return { bad, pairs: [...pairs.values()] };
}

function seatNodes() {
  const r = room();
  const chair = Math.max(20, state.dims.chairBig.d);
  const nodes = [];
  const clash = seatClashes().bad;
  for (const table of roomTables()) {
    for (const seat of seatsOf(table)) {
      const mark = markOf(seat.mark);
      const el = document.createElement("button");
      el.type = "button";
      const note = table.seatNotes?.[seat.index] || "";
      el.className = `seat${mark ? " marked" : ""}${note ? " noted" : ""}${clash.has(`${table.id}:${seat.index}`) ? " clash" : ""}`;
      // the thick edge is the chair back: it faces away from the table
      const turn = (Number.isFinite(seat.pos.a) ? seat.pos.a : -90) + 90;
      el.style.transform = `translate(-50%, -50%) rotate(${turn}deg)`;
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
        el.innerHTML = `<span style="transform: rotate(${-turn}deg)">${esc(mark.code)}</span>`;
        el.title = `${t().colTable} ${table.label} · ${markName(mark)}`;
      } else {
        el.title = `${t().colTable} ${table.label}`;
      }
      if (note) el.title += ` · ✎ ${note}`;
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
    const wasOnFloor = table.zone === "room";
    const target = { x: (pct.x / 100) * r.w, y: (pct.y / 100) * r.h };
    if (groupId && wasOnFloor) {
      // A joined langbord is one table: drag any part and every part moves by
      // the same amount, so the halves never swap and the plates stay put.
      const from = centerCm(table);
      moveGroupBy(groupId, snapTo(target.x) - from.x, snapTo(target.y) - from.y);
      respaceGroup(groupId, table.id);
    } else {
      table.zone = "room";
      setCenterCm(table, target);
      if (groupId) respaceGroup(groupId, table.id);
    }
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
  // The shape already says langbord, so no word on it (user, 2026-11-11);
  // only a per-table custom size is shown.
  const sizeName = own ? `${cmNum(own.w)}×${cmNum(own.l)}` : table.size === "long" || table.size === "oval" ? "" : copy[table.size];
  const seatN = seatsOf(table).length;
  const floorTag = [sizeName, seatN ? `${seatN}p` : ""].filter(Boolean).join(" · ");
  // Wide screen: names sit beside the map with a line to the table
  // (renderCallouts), so the table itself only shows its number.
  const shownName = calloutMode() ? "" : [table.name || guestLabel(table), table.redeck ? `↻ ${table.redeck}` : ""].filter(Boolean).join(" · ");
  if (inTray) btn.title = sizeLabelCm(table);
  btn.innerHTML = inTray
    ? sizeName ? `<span class="size-tag">${sizeName}</span>` : ""
    : table.lead === false
      ? sizeName ? `<span class="stack"><span class="size-tag floor-size">${sizeName}</span></span>` : ""
      : `<span class="stack">${
          shownName
            ? `<span class="guest-name">${esc(shownName)}</span><span class="num small">${table.label}</span>`
            : `<span class="num">${table.label}</span>`
        }<span class="size-tag floor-size">${floorTag}</span></span>`;
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
  if (drag.kind === "guest") {
    const hit = guestDropTable(event.clientX, event.clientY);
    document.querySelectorAll("#room .table.guest-target").forEach((n) => {
      if (n.dataset.id !== hit?.id) n.classList.remove("guest-target");
    });
    if (hit) document.querySelector(`#room .table[data-id="${hit.id}"]`)?.classList.add("guest-target");
  }
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
  if (current.kind === "painting") {
    if (current.moved) {
      movePainting(current.id, clientX, clientY);
    }
    state.selectedPainting = current.id;
    state.selected = null;
    save();
    render();
    return;
  }
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
  if (current.kind === "guest") {
    document.querySelectorAll(".guest-target").forEach((n) => n.classList.remove("guest-target"));
    if (!current.moved) return;
    const hit = guestDropTable(clientX, clientY);
    const g0 = guests.list.find((g) => g.id === current.id);
    const before = g0 ? guestTable(g0) : null;
    if (!guests.room) guests.room = {};
    if (hit) {
      guests.placed[current.id] = hit.id;
      guests.room[current.id] = ROOM_ID;
    } else if (pointIn(document.getElementById("guest-rack"), clientX, clientY)) {
      delete guests.placed[current.id];
      delete guests.room[current.id];
    } else return;
    saveGuests();
    if (before) guestSeats(before);
    if (hit) guestSeats(hit);
    save();
    render();
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
  const rr = room();
  el.style.aspectRatio = `${rr.w} / ${rr.h}`;
  el.style.width = calloutMode()
    ? `min(calc(100% - 340px), calc(88vh * ${rr.w} / ${rr.h}), ${Math.round((680 * (rr.w / rr.h)) / (700 / 1360))}px)`
    : `min(100%, calc(84vh * ${rr.w} / ${rr.h}), ${Math.round((620 * (rr.w / rr.h)) / (700 / 1360))}px)`;
  // the entrance doors are back on the map (Danny 2026-11-13); window,
  // old table and paintings stay off
  for (const fixture of state.fixtures) el.appendChild(doorButton(fixture));
  if (state.showGrid) {
    el.appendChild(gridLayer());
    el.appendChild(rulerLayer());
  }
  for (const node of plateInserts()) el.appendChild(node);
  for (const node of seatNodes()) el.appendChild(node);

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
  const lunchBtn = document.getElementById("lunch-btn");
  if (lunchBtn && lunchBtn.dataset.armed !== "1") lunchBtn.textContent = copy.lunch;
  if (share.status !== "local" || window.claude?.use) setShareStatus(share.status, share.at);
  const en = state.lang === "en";
  const roomName = ROOMS[ROOM_ID][en ? "en" : "no"];
  const kicker = document.querySelector(".topbar .kicker");
  if (kicker) kicker.textContent = `${roomName} · ${en ? "layout" : "oppsett"}`;
  document.title = `Norsken — ${roomName}`;
  const setText = (id, text) => {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  };
  setText("settings-btn-text", en ? "Settings" : "Innstillinger");
  setText("settings-title", en ? "Settings" : "Innstillinger");
  setText("set-lang-title", en ? "Language" : "Språk");
  setText("set-view-title", en ? "Show on the map" : "Vis på kartet");
  setText("set-book-title", en ? "Assigning tables" : "Bordfordeling");
  setText("set-measure-title", en ? "Measurements" : "Mål");
  setText("set-room-title", en ? "The room" : "Rommet");
  document.getElementById("lang-btn").textContent = en ? "Norsk / English: English" : "Norsk / English: Norsk";
  document.querySelectorAll("[data-room]").forEach((btn) => {
    btn.textContent = ROOMS[btn.dataset.room][en ? "en" : "no"];
    btn.classList.toggle("on", btn.dataset.room === ROOM_ID);
  });

  if (lunchBtn) lunchBtn.hidden = ROOM_ID !== "spisestua";
  document.getElementById("hint").textContent =
    ROOM_ID === "domino"
      ? en
        ? "Domino is the last resort: used only when Spisestua is full. «Assign tables» in Spisestua sends what does not fit here. Top = the windows, right wall = the door to Spisestua."
        : "Domino er siste utvei: brukes bare når Spisestua er full. «Fordel bord» i Spisestua sender det som ikke får plass hit. Øverst = vinduene, høyre vegg = døra til Spisestua."
      : copy.hint;
  const measureBtn = document.getElementById("measure-btn");
  measureBtn.textContent = copy.measure;
  measureBtn.classList.toggle("on", state.showMeasure);
  const gridBtn = document.getElementById("grid-btn");
  gridBtn.textContent = copy.grid;
  gridBtn.classList.toggle("on", state.showGrid);
  const chairBtn = document.getElementById("chairs-btn");
  chairBtn.textContent = copy.withChairs;
  chairBtn.classList.toggle("on", state.withChairs);
  const paintBtn = document.getElementById("paintings-btn");
  if (paintBtn) {
    paintBtn.textContent = copy.paintings;
    paintBtn.classList.toggle("on", state.showPaintings);
  }
}

const FIELDS = [
  { key: "roomW", path: ["room", "w"], min: 200, max: 5000 },
  { key: "roomH", path: ["room", "h"], min: 200, max: 5000 },
  { key: "smallD", path: ["small", "d"], min: 30, max: 400, est: "small" },
  { key: "bigD", path: ["big", "d"], min: 30, max: 400, est: "big" },
  { key: "ovalW", path: ["oval", "w"], min: 30, max: 400, est: "oval" },
  { key: "ovalL", path: ["oval", "l"], min: 30, max: 600, est: "oval" },
  { key: "rectW", path: ["rect", "w"], min: 30, max: 300, est: "rect" },
  { key: "rectL", path: ["rect", "l"], min: 30, max: 400, est: "rect" },
  { key: "plateSW", path: ["plateS", "w"], min: 10, max: 400, est: "plateS" },
  { key: "plateSN", path: ["plateS", "n"], min: 0, max: 12 },
  { key: "plateMW", path: ["plateM", "w"], min: 10, max: 400, est: "plateM" },
  { key: "plateMN", path: ["plateM", "n"], min: 0, max: 12 },
  { key: "plateLW", path: ["plateL", "w"], min: 10, max: 400, est: "plateL" },
  { key: "plateLN", path: ["plateL", "n"], min: 0, max: 12 },
  { key: "plateXLW", path: ["plateXL", "w"], min: 10, max: 400, est: "plateXL" },
  { key: "plateXLN", path: ["plateXL", "n"], min: 0, max: 12 },
  { key: "longW", path: ["long", "w"], min: 30, max: 400, est: "long" },
  { key: "longL", path: ["long", "l"], min: 50, max: 900, est: "long" },
  // Depth is taped (60); only the length is an estimate, so only the length
  // field carries the sidebord ANSLAG badge and typing a depth does not clear it.
  { key: "chairBigD", path: ["chairBig", "d"], min: 25, max: 120, est: "chairBig" },
  { key: "chairSmallD", path: ["chairSmall", "d"], min: 25, max: 120, est: "chairSmall" },
  { key: "coverD", path: ["cover", "d"], min: 40, max: 120, est: "cover" },
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
    ).join("") +
    `<button type="button" class="brush${state.brush === "note" ? " active" : ""}" data-brush="note"><span class="dot note-dot">✎</span>${copy.markNote}</button>` +
    `<button type="button" class="brush${state.brush === "seatname" ? " active" : ""}" data-brush="seatname"><span class="dot name-dot">Aa</span>${
      state.lang === "en" ? "Name on chair" : "Navn på stol"
    }</button>`;
}

function seatSummary() {
  const rows = [];
  for (const table of sortedRoomTables()) {
    const members = table.group ? groupMembers(table) : [table];
    const counts = {};
    const notes = [];
    for (const member of members) {
      for (const seat of seatsOf(member)) {
        if (seat.mark) counts[seat.mark] = (counts[seat.mark] || 0) + 1;
        const note = member.seatNotes?.[seat.index];
        if (note) notes.push(note);
      }
    }
    const keys = Object.keys(counts);
    if (keys.length || notes.length) rows.push({ table, counts, keys, notes });
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
            <td>${esc(table.name || guestLabel(table) || "–")}</td>
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
  const markedTotal = summary.reduce((sum, row) => sum + row.keys.reduce((s, k) => s + row.counts[k], 0), 0);
  document.getElementById("seat-summary").innerHTML = summary.length
    ? `<p class="kicker">${copy.marksTitle}${markedTotal ? ` · ${copy.marksTotal}: ${markedTotal} ${copy.seatsWord}` : ""}</p><ul class="seat-list">${summary
        .map(
          (row) =>
            `<li><strong>${copy.colTable} ${esc(row.table.label)}</strong> — ${row.keys
              .map((key) => {
                const mark = markOf(key);
                return `<span class="seat-chip" style="background:${mark.color};color:${inkOn(mark.color)}">${mark.code}</span> ${markName(mark)}${row.counts[key] > 1 ? ` ×${row.counts[key]}` : ""}`;
              })
              .concat(row.notes.map((n) => `✎ ${esc(n)}`))
              .join(" · ")}</li>`,
        )
        .join("")}</ul>`
    : "";

  const warnEl = document.getElementById("warnings");
  const tight = tightPairs();
  const counts = {};
  for (const item of tables) counts[item.label] = (counts[item.label] || 0) + 1;
  const dups = Object.keys(counts).filter((label) => counts[label] > 1);
  const clashes = seatClashes().pairs;
  const dupHtml =
    (dups.length ? `<p class="warn-title">⚠ ${copy.dupTitle}: <strong>${dups.map(esc).join(", ")}</strong></p>` : "") +
    (clashes.length
      ? `<p class="warn-title">⚠ ${copy.clashTitle}</p><ul>${clashes
          .map(([p, q]) => `<li>${esc(p)} ↔ ${esc(q)}</li>`)
          .join("")}</ul>`
      : "");
  // The distance list («For trangt for servitør») and the chair-clash list are
  // gone (Danny 2026-11-13: "idk what this is for"). Only a doubled table
  // number is still worth a warning.
  void tight;
  void clashes;
  warnEl.innerHTML = tables.length && dups.length ? `<p class="warn-title">⚠ ${copy.dupTitle}: <strong>${dups.map(esc).join(", ")}</strong></p>` : "";
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
  // a round table turns its chairs with ⟲ ⟳ instead
  document.getElementById("rotate-btn").hidden = table.kind === "round";
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
        <strong class="people-count">${seatsOf(seatOwner(table)).length}</strong>
        <button type="button" class="nudge" data-seats="1">+</button>
        <button type="button" class="nudge wide" data-seats="auto">${copy.auto}</button>
      </span>
    </label>
    <label class="label-field name-field">
      <span>${copy.nameLabel}</span>
      <input type="text" id="name-input" maxlength="28" autocomplete="off"
             value="${esc(table.name || "")}" placeholder="${copy.nameHint}" />
    </label>
    ${table.kind === "round" ? `<label class="label-field ends-field">
      <span>${copy.turnLabel}</span>
      <span class="people-steps">
        <button type="button" class="nudge" data-turn="-15" aria-label="-15°">⟲</button>
        <strong class="people-count">${Math.round(((((Number(table.seatTurn) || 0) % 360) + 360) % 360))}°</strong>
        <button type="button" class="nudge" data-turn="15" aria-label="+15°">⟳</button>
      </span>
    </label>` : ""}
    ${table.kind !== "round" ? `<label class="label-field ends-field">
      <span>${copy.endsLabel}</span>
      <span class="people-steps">
        ${[0, 1, 2].map((n) => `<button type="button" class="nudge${endSeatsOf(seatOwner(table)) === n ? " active" : ""}" data-ends="${n}">${n}</button>`).join("")}
      </span>
    </label>` : ""}
    ${table.size === "long" ? `<div class="plate-plan">
      <label class="label-field">
        <span>${copy.planTitle}</span>
        <input type="number" id="plan-people" min="2" max="40" step="1" inputmode="numeric" value="${seatsOf(seatOwner(table)).length}" />
      </label>
      <button type="button" class="status-btn active" id="plan-plates">${copy.planBtn}</button>
      ${planNote ? `<p class="plan-note">${esc(planNote)}</p>` : ""}
    </div>` : ""}
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

// --- seat editor (note or name on one chair) --------------------------------
let seatEdit = null;
function openSeatEditor(table, index, field) {
  seatEdit = { id: table.id, index, field };
  const en = state.lang === "en";
  const box = document.getElementById("seat-editor");
  const input = document.getElementById("seat-editor-input");
  document.getElementById("seat-editor-title").textContent =
    field === "seatNames" ? (en ? `Name on a chair · table ${table.label}` : `Navn på stol · bord ${table.label}`) : en ? `Note on a chair · table ${table.label}` : `Notat på stol · bord ${table.label}`;
  document.getElementById("seat-editor-save").textContent = en ? "Save" : "Lagre";
  document.getElementById("seat-editor-clear").textContent = en ? "Remove" : "Fjern";
  input.value = table[field]?.[index] || "";
  box.hidden = false;
  input.focus();
}
function closeSeatEditor() {
  seatEdit = null;
  document.getElementById("seat-editor").hidden = true;
}
function saveSeatEditor(clear) {
  if (!seatEdit) return;
  const table = getTable(seatEdit.id);
  if (table) {
    const text = clear ? "" : document.getElementById("seat-editor-input").value.trim().slice(0, 60);
    if (!table[seatEdit.field]) table[seatEdit.field] = {};
    if (text) table[seatEdit.field][seatEdit.index] = text;
    else delete table[seatEdit.field][seatEdit.index];
    save();
  }
  closeSeatEditor();
  render();
}
document.getElementById("seat-editor-save")?.addEventListener("click", () => saveSeatEditor(false));
document.getElementById("seat-editor-clear")?.addEventListener("click", () => saveSeatEditor(true));
document.getElementById("seat-editor-close")?.addEventListener("click", closeSeatEditor);
document.getElementById("seat-editor-input")?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") saveSeatEditor(false);
  if (event.key === "Escape") closeSeatEditor();
});

// --- names beside the map ------------------------------------------------------
// On a wide screen the names do not have to fit in the circle: each one sits
// in the margin beside the map with a line to its table, or to its chair
// when a guest's name is set on one chair.
function calloutMode() {
  const wrap = document.querySelector(".room-wrap");
  return Boolean(wrap && wrap.clientWidth >= 620);
}

function renderCallouts() {
  const wrap = document.querySelector(".room-wrap");
  const roomEl = document.getElementById("room");
  if (!wrap || !roomEl) return;
  let layer = document.getElementById("callouts");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "callouts";
    layer.className = "callouts";
    wrap.appendChild(layer);
  }
  layer.innerHTML = "";
  if (!calloutMode()) return;
  const r = room();
  const wr = wrap.getBoundingClientRect();
  const rr = roomEl.getBoundingClientRect();
  const chair = Math.max(20, state.dims.chairBig.d);
  const items = [];
  for (const table of roomTables()) {
    if (table.lead === false) continue;
    const lines = [];
    const main = table.name || guestLabel(table);
    if (main) lines.push(main);
    if (table.redeck) lines.push(`↻ ${table.redeck}`);
    const c = centerCm(table);
    const s = tableCm(table);
    if (lines.length) items.push({ id: table.id, label: table.label, lines, x: c.x, y: c.y, rx: s.w / 2, ry: s.h / 2, kind: "table" });
    const names = table.seatNames || {};
    for (const seat of seatsOf(table)) {
      const nm = names[seat.index];
      if (nm) items.push({ id: table.id, label: table.label, lines: [nm], x: seat.pos.x, y: seat.pos.y, rx: chair / 2, ry: chair / 2, kind: "seat" });
    }
  }
  if (!items.length) return;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("class", "callout-lines");
  svg.setAttribute("width", String(wr.width));
  svg.setAttribute("height", String(wr.height));
  layer.appendChild(svg);
  const roomLeft = rr.left - wr.left;
  const roomRight = rr.right - wr.left;
  const roomTop = rr.top - wr.top;
  const gutter = Math.min(220, roomLeft - 18);
  const toPx = (x, y) => ({ x: roomLeft + (x / r.w) * rr.width, y: roomTop + (y / r.h) * rr.height });
  const sides = { left: [], right: [] };
  for (const it of items) {
    it.p = toPx(it.x, it.y);
    sides[it.x < r.w / 2 ? "left" : "right"].push(it);
  }
  for (const side of ["left", "right"]) {
    let lastBottom = -Infinity;
    for (const it of sides[side].sort((a, b) => a.p.y - b.p.y)) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = `callout ${side} is-${it.kind}`;
      el.style.width = `${gutter}px`;
      el.innerHTML = `<span class="callout-num">${esc(it.label)}</span><span class="callout-text">${it.lines.map(esc).join("<br>")}</span>`;
      el.addEventListener("click", () => selectTable(it.id));
      layer.appendChild(el);
      const h = el.offsetHeight;
      const top = Math.max(it.p.y - h / 2, lastBottom + 6, 0);
      el.style.top = `${top}px`;
      el.style.left = side === "left" ? `${roomLeft - 14 - gutter}px` : `${roomRight + 14}px`;
      lastBottom = top + h;
      // line from the label to the edge of the table (or chair), with a dot
      const from = { x: side === "left" ? roomLeft - 14 : roomRight + 14, y: top + h / 2 };
      const dx = from.x - it.p.x;
      const dy = from.y - it.p.y;
      const len = Math.hypot(dx, dy) || 1;
      const rxp = (it.rx / r.w) * rr.width;
      const ryp = (it.ry / r.h) * rr.height;
      const k = 1 / Math.sqrt((dx / len / rxp) ** 2 + (dy / len / ryp) ** 2);
      const to = { x: it.p.x + (dx / len) * k, y: it.p.y + (dy / len) * k };
      const line = document.createElementNS(ns, "path");
      line.setAttribute("d", `M ${from.x} ${from.y} L ${to.x} ${to.y}`);
      line.setAttribute("class", `callout-line is-${it.kind}`);
      svg.appendChild(line);
      const dot = document.createElementNS(ns, "circle");
      dot.setAttribute("cx", String(to.x));
      dot.setAttribute("cy", String(to.y));
      dot.setAttribute("r", it.kind === "seat" ? "3" : "4");
      dot.setAttribute("class", `callout-dot is-${it.kind}`);
      svg.appendChild(dot);
    }
  }
}
let calloutTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(calloutTimer);
  calloutTimer = setTimeout(render, 120);
});

function render() {
  try {
    renderChrome();
    renderMeasurePanel();
    renderSeatPalette();
    renderRoom();
    renderTray();
    renderList();
    renderDrawer();
    renderPaintingCard();
    renderBookings();
    renderGuests();
    requestAnimationFrame(renderCallouts);
  } catch (error) {
    console.error(error);
  }
}

function selectTable(id) {
  if (id !== state.selected) planNote = "";
  state.selected = id;
  if (id) state.selectedPainting = null;
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

document.getElementById("book-text")?.addEventListener("input", (event) => {
  state.bookingsText = event.target.value.slice(0, 4000);
  save();
});
document.getElementById("book-order")?.addEventListener("change", (event) => {
  state.bookingOrder = event.target.value.slice(0, 120) || DEFAULT_BOOKING_ORDER;
  save();
  render();
});
document.getElementById("book-run")?.addEventListener("click", () => {
  const order = document.getElementById("book-order");
  if (order) state.bookingOrder = order.value.slice(0, 120) || DEFAULT_BOOKING_ORDER;
  assignBookings();
  save();
  render();
});
document.getElementById("book-clear")?.addEventListener("click", () => {
  clearBookedNames();
  if (ROOM_ID === "spisestua") clearDominoBooked();
  bookingResult = null;
  save();
  render();
});

document.getElementById("paintings-btn")?.addEventListener("click", () => {
  state.showPaintings = !state.showPaintings;
  if (!state.showPaintings) state.selectedPainting = null;
  save();
  render();
});

document.getElementById("close-painting")?.addEventListener("click", () => {
  state.selectedPainting = null;
  save();
  render();
});

document.getElementById("painting-name")?.addEventListener("input", (event) => {
  const painting = getPainting(state.selectedPainting);
  if (!painting) return;
  painting.name = event.target.value.slice(0, 60);
  save();
  const node = document.querySelector(`[data-painting-id="${painting.id}"]`);
  if (node) node.title = paintingTitle(painting);
});

document.getElementById("painting-name")?.addEventListener("change", () => render());

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
  const { lang, fixtures, furniture, dims, showGrid, showMeasure, paintings, showPaintings } = state;
  state = defaultState();
  Object.assign(state, { lang, fixtures, furniture, dims, showGrid, showMeasure, paintings, showPaintings });
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
  if (state.brush === "note" || state.brush === "seatname") {
    // free text on one seat (a note like "ikke blåmugg", or a guest's name).
    // An editor on the page: the hosted page cannot show prompt().
    openSeatEditor(table, index, state.brush === "seatname" ? "seatNames" : "seatNotes");
    return;
  }
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
  const turnRaw = event.target.closest?.("[data-turn]")?.dataset.turn;
  if (turnRaw != null) {
    const table = getTable(state.selected);
    if (!table) return;
    table.seatTurn = ((((Number(table.seatTurn) || 0) + Number(turnRaw)) % 360) + 360) % 360;
    save();
    render();
    return;
  }
  if (event.target.id === "plan-plates") {
    const table = getTable(state.selected);
    const n = Number(document.getElementById("plan-people")?.value);
    if (!table || !Number.isFinite(n)) return;
    planPlates(table, Math.round(n));
    save();
    render();
    return;
  }
  const endsRaw = event.target.dataset.ends;
  if (endsRaw != null) {
    const table = seatOwner(getTable(state.selected));
    if (!table) return;
    const before = endSeatsOf(table);
    table.ends = Number(endsRaw);
    // a hand-set cover count keeps its side chairs; the end chairs add on
    if (Number.isFinite(table.seatCount)) {
      table.seatCount = Math.max(1, Math.min(24, table.seatCount + endSeatsOf(table) - before));
    }
    save();
    render();
    return;
  }
  const seats = event.target.dataset.seats;
  if (!seats) return;
  const picked = getTable(state.selected);
  const table = seatOwner(picked);
  if (!table) return;
  delete table.seatFromGuest; // set by hand now
  if (seats === "auto") delete table.seatCount;
  else if (picked.size === "long") planPlates(picked, seatsOf(table).length + Number(seats)); // + / − on a langbord pulls it apart or closes it with plates
  else table.seatCount = Math.max(1, Math.min(40, seatCount(table) + Number(seats)));
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
  table.booked = false; // typed by hand: "Fjern navn" leaves it alone
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
    const picked = getTable(state.selected);
    const table = seatOwner(picked);
    if (!table) return;
    delete table.seatFromGuest; // set by hand now
    if (seats === "auto") delete table.seatCount;
    else if (picked.size === "long") planPlates(picked, seatsOf(table).length + Number(seats));
    else table.seatCount = Math.max(1, Math.min(40, seatCount(table) + Number(seats)));
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
  if (table.group) {
    const from = centerCm(table);
    moveGroupBy(table.group, c.x - from.x, c.y - from.y);
    fitGroupInRoom(table.group);
  } else {
    setCenterCm(table, c, false);
  }
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
// Domino «Vanlig oppsett», read off Danny's photos (2026-11-12). Not measured:
// three rectangular tables for 2 + 2, about 90 x 160 cm (ANSLAG).
//  - by the window, short end to the window
//  - along the right wall (the wall with the door to Spisestua), below the door
//  - front left, across the room
// Pure (no `state`): also used to start a Domino plan from Spisestua when
// «Fordel bord» needs the overflow room and Domino was never opened.
function dominoTablesAt(r) {
  const spots = [
    [r.w * 0.4, 110, false],
    [r.w - 110, r.h * 0.55, false],
    [150, r.h - 115, true],
  ];
  return spots.map(([x, y, rotated], i) => {
    const table = makeTable("long");
    table.zone = "room";
    table.custom = { w: 90, l: 160 };
    table.rotated = rotated;
    table.x = (x / r.w) * 100;
    table.y = (y / r.h) * 100;
    table.label = String(i + 1);
    table.lead = true;
    return table;
  });
}

function dominoStarter() {
  return [...dominoTablesAt(DOMINO_ROOM), makeTable("long"), makeTable("long"), makeTable("small"), makeTable("small")];
}

function dominoLayout() {
  state.tables = [...dominoTablesAt(room()), makeTable("long"), makeTable("long"), makeTable("small"), makeTable("small")];
  state.selected = null;
  relabelRoom();
  save();
  render();
}

function presetLayout(kind = "usual") {
  if (ROOM_ID === "domino") return dominoLayout();
  const r = room();
  const placed = [];
  const put = (size, x, y, rotated = false) => {
    const table = makeTable(size, "room");
    table.rotated = rotated;
    setCenterCm(table, { x, y }, false);
    placed.push(table);
    return table;
  };
  // a closed langbord: two halves end to end, joined, no plates yet
  const L = state.dims.long.l;
  const langbord = (topY) => {
    const a = put("long", r.w / 2, topY + L / 2);
    const b = put("long", r.w / 2, topY + L + L / 2);
    const groupId = `g-${uid()}`;
    a.group = groupId;
    b.group = groupId;
    a.gapPlates = null;
    b.gapPlates = [];
    return a;
  };
  const leftX = 120;
  const rightX = r.w - 120;
  const step = (r.h - 2 * 200) / 4;
  // left column, table 1 nearest the waitress door (bottom) is the big one
  for (let i = 0; i < 5; i += 1) put(i === 0 ? "big" : "small", leftX, r.h - 200 - i * step);
  // right column 6-11, 6 at the top (Danny 2026-11-12: "normally there's
  // table 6 - 11"). Same first/last spot as the left column, six tables.
  const rightStep = (r.h - 2 * 200) / 5;
  for (let i = 0; i < 6; i += 1) put("small", rightX, 200 + i * rightStep);
  put("oval", r.w / 2, 170).seatTurn = 30; // 16 is the oval table: 3 + 3, none at the ends
  if (kind === "lunch") {
    // Lunch after a selskap (user photos IMG_2839-2842): two langbord end to end
    // down the middle with a short gap between them. The window one is laid for
    // 3 + 3 with a chair at its window end, the other for 2 + 2. Positions are a
    // suggestion from the photos, not measured.
    // each langbord is two halves pushed together (no plates)
    const gap = 40;
    const top = 470;
    const windowTable = langbord(top);
    const doorTable = langbord(top + 2 * L + gap);
    windowTable.ends = 1;
    windowTable.seatCount = 7;
    doorTable.seatCount = 4;
  } else {
    langbord(r.h / 2 + 40 - L); // 14, closed - set people to get plates
  }
  // whatever is left of the normal stock goes back in the tray
  const used = { small: 0, big: 0, oval: 0, rect: 0, long: 0 };
  for (const table of placed) used[table.size] += 1;
  const stock = { small: 8, big: 6, oval: 1, rect: 2, long: 4 };
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

document.getElementById("lunch-btn")?.addEventListener("click", (event) => {
  const button = event.currentTarget;
  if (!armed(button, state.lang === "en" ? "Replace the floor? Tap again" : "Bytte ut gulvet? Trykk igjen")) return;
  button.classList.remove("armed");
  presetLayout("lunch");
});

// --- Dagens liste (guest list from ResDiary) --------------------------------
// The CSV that the «Last ned liste» bookmark saves on the PC. Staff open it
// here and drag each name onto a table themselves - nothing is auto-seated.
// Guest names are NDA data: they live ONLY in this browser under their own
// key, never in `state`, so they are never part of the shared plan.

function loadGuests() {
  try {
    const g = JSON.parse(localStorage.getItem(GUESTS_KEY) || "null");
    if (g && Array.isArray(g.list)) {
      return {
        file: String(g.file || ""),
        list: g.list,
        placed: g.placed && typeof g.placed === "object" ? g.placed : {},
        room: g.room && typeof g.room === "object" ? g.room : {},
      };
    }
  } catch {}
  return { file: "", list: [], placed: {}, room: {} };
}

function guestRoom(guest) {
  return guests.room?.[guest.id] || "spisestua";
}

function saveGuests() {
  try {
    localStorage.setItem(GUESTS_KEY, JSON.stringify(guests));
  } catch {}
}

function parseCsv(text) {
  text = String(text || "").replace(/^﻿/, "");
  const first = text.split(/\r?\n/, 1)[0] || "";
  const sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ";" : ",";
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => c.replace(/\s+/g, " ").trim())).filter((r) => r.some(Boolean));
}

function guestsFromCsv(text) {
  const rows = parseCsv(text);
  const isHead = (r) => r.some((c) => /gjester|antall|pax/i.test(c)) && r.some((c) => /^tid|time/i.test(c));
  const out = [];
  let head = null;
  for (const r of rows) {
    if (isHead(r)) {
      head = r;
      continue;
    }
    if (!head) continue;
    const col = (re, skip = []) => head.findIndex((c, i) => re.test(c) && !skip.includes(i));
    const ti = col(/^tid|^time/i);
    const gi = col(/gjester|antall|pax|covers|personer/i);
    const bi = col(/^bord|^table/i);
    const ci = col(/komment|merknad|notat|note|spesial|ønske/i);
    let ni = col(/navn|name|kunde|gjest(?!er)/i, [ti, gi, bi, ci]);
    if (ni < 0) ni = head.findIndex((_, i) => ![ti, gi, bi, ci].includes(i));
    const time = (r[ti] || "").replace(".", ":");
    const name = (r[ni] || "").slice(0, 40);
    if (!name && !time) continue;
    out.push({
      id: `g${out.length}`,
      time,
      name,
      pax: parseInt(r[gi], 10) || null,
      rd: bi >= 0 ? r[bi] || "" : "",
      note: ci >= 0 ? (r[ci] || "").slice(0, 120) : "",
    });
  }
  return dropSubtotals(out, (g) => g.name, (g) => g.pax).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
}

// A placed guest only counts while its table is on the floor.
function guestTable(guest) {
  if (guestRoom(guest) !== ROOM_ID) return null;
  const table = getTable(guests.placed[guest.id]);
  return table && table.zone === "room" ? table : null;
}

function guestsOn(table) {
  return guests.list.filter((g) => guests.placed[g.id] === table.id && guestRoom(g) === ROOM_ID && table.zone === "room");
}

function guestLabel(table) {
  return guestsOn(table)
    .map((g) => `${g.time ? `${g.time} ` : ""}${g.name}`.trim())
    .join(" / ");
}

// The table under the pointer; a langbord half hands over to the half that
// carries the name.
function guestDropTable(x, y) {
  const node = document.elementsFromPoint(x, y).find((n) => n.classList?.contains("table") && n.closest("#room"));
  let table = node ? getTable(node.dataset.id) : null;
  if (table && table.lead === false && table.group) {
    table = roomTables().find((item) => item.group === table.group && item.lead !== false) || table;
  }
  return table;
}

function renderGuests() {
  const en = state.lang === "en";
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set("guest-title", en ? "Today's list" : "Dagens liste");
  set("guest-open", en ? "Open list from PC" : "Åpne liste fra PC");
  set("guest-clear", en ? "Clear list" : "Tøm liste");
  const clear = document.getElementById("guest-clear");
  if (clear) clear.hidden = !guests.list.length;
  const placed = guests.list.filter((g) => guests.placed[g.id]).length;
  set(
    "guest-note",
    guestMsg ||
    (guests.list.length
      ? en
        ? `${guests.file} · ${guests.list.length} bookings, ${placed} seated. Drag a name onto a table; drag it back here to remove.`
        : `${guests.file} · ${guests.list.length} bookinger, ${placed} plassert. Dra et navn til et bord. Dra det tilbake hit for å fjerne.`
      : en
        ? "Open the file from the «Last ned liste» bookmark. The names stay in this browser only."
        : "Åpne fila fra bokmerket «Last ned liste». Navnene blir bare i denne nettleseren."),
  );
  const list = document.getElementById("guest-list");
  if (!list) return;
  list.innerHTML = "";
  for (const g of guests.list) {
    const table = guestTable(g);
    const elsewhere = !table && guests.placed[g.id] && guestRoom(g) !== ROOM_ID ? ROOMS[guestRoom(g)] : null;
    const li = document.createElement("li");
    li.className = `guest-item${table || elsewhere ? " placed" : ""}`;
    li.dataset.id = g.id;
    li.innerHTML = `<span class="g-time">${esc(g.time || "–")}</span><span class="g-name">${esc(g.name || "–")}</span>${
      g.pax ? `<span class="g-pax">${g.pax}p</span>` : ""
    }${elsewhere ? `<span class="g-table">→ ${esc(elsewhere[en ? "en" : "no"])}</span>` : ""}${table ? `<span class="g-table">→ ${esc(table.label)}</span><button type="button" class="g-x" data-unplace="${g.id}" aria-label="${en ? "Remove from table" : "Fjern fra bordet"}">✕</button>` : ""}${
      g.note ? `<span class="g-note">${esc(g.note)}</span>` : ""
    }`;
    li.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".g-x")) return;
      startDrag(event, { kind: "guest", id: g.id }, li);
    });
    list.appendChild(li);
  }
}

document.getElementById("guest-file")?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  const list = guestsFromCsv(await file.text());
  if (!list.length) {
    guestMsg = state.lang === "en" ? "No bookings found in that file." : "Fant ingen bookinger i den fila.";
    render();
    return;
  }
  guestMsg = "";
  guests = { file: file.name, list, placed: {}, room: {} };
  saveGuests();
  render();
});

document.getElementById("guest-clear")?.addEventListener("click", (event) => {
  if (!armed(event.currentTarget, state.lang === "en" ? "Sure?" : "Sikker?")) return;
  guests = { file: "", list: [], placed: {}, room: {} };
  saveGuests();
  render();
});

document.getElementById("guest-list")?.addEventListener("click", (event) => {
  const id = event.target.closest(".g-x")?.dataset.unplace;
  if (!id) return;
  const g0 = guests.list.find((g) => g.id === id);
  const before = g0 ? guestTable(g0) : null;
  delete guests.placed[id];
  if (guests.room) delete guests.room[id];
  saveGuests();
  if (before) guestSeats(before);
  save();
  render();
});

// Chairs follow the party: a table gets as many chairs as its biggest
// booking. Only chairs set this way are undone when the guests leave; a
// count the waitress set by hand with + / − is left alone.
function guestSeats(table) {
  if (table.kind === "plate") return;
  const pax = guestsOn(table).map((g) => Number(g.pax) || 0);
  const most = pax.length ? Math.max(...pax) : 0;
  if (most > 0) {
    if (table.seatFromGuest || !Number.isFinite(table.seatCount)) {
      table.seatCount = most;
      table.seatFromGuest = true;
    }
  } else if (table.seatFromGuest) {
    delete table.seatCount;
    delete table.seatFromGuest;
  }
}

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
    const guestData = JSON.stringify(guests).replace(/</g, "\\u003c");
    const baked = html.replace(
      "<script>",
      `<script>window.__NORSKEN_STATE__ = ${data}; window.__NORSKEN_GUESTS__ = ${guestData}; window.__NORSKEN_ROOM__ = "${ROOM_ID}";</script>\n    <script>`,
    );
    const day = new Date().toISOString().slice(0, 10);
    await downloads.save({ filename: `norsken-oppsett-${day}.html`, data: baked });
  } catch (error) {
    if (error?.code !== "declined") console.error(error);
  }
});

connectShare();

// Room switch: save this room, remember the pick, reload into the other room.
document.querySelectorAll("[data-room]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const next = btn.dataset.room;
    if (!ROOMS[next] || next === ROOM_ID) return;
    save();
    try {
      localStorage.setItem(ROOM_KEY, next);
    } catch {}
    location.reload();
  }),
);

// --- Innstillinger: every setting in one panel ------------------------------
// Opened by the big ⚙ button; closed with ✕, a tap outside it, or Esc.
(function settingsPanel() {
  const panel = document.getElementById("settings");
  const backdrop = document.getElementById("settings-backdrop");
  const openBtn = document.getElementById("settings-btn");
  if (!panel || !backdrop || !openBtn) return;
  const open = () => {
    panel.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(() => {
      panel.classList.add("open");
      backdrop.classList.add("open");
    });
    document.getElementById("settings-close")?.focus();
  };
  const close = () => {
    panel.classList.remove("open");
    backdrop.classList.remove("open");
    setTimeout(() => {
      panel.hidden = true;
      backdrop.hidden = true;
    }, 220);
    openBtn.focus();
  };
  openBtn.addEventListener("click", open);
  document.getElementById("settings-close")?.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) close();
  });
})();

// overflow choice + sitting time (⚙ Innstillinger → Bordfordeling)
document.getElementById("overflow-redeck")?.addEventListener("click", () => {
  state.overflow = "redeck";
  save();
  render();
});
document.getElementById("overflow-domino")?.addEventListener("click", () => {
  state.overflow = "domino";
  save();
  render();
});
document.getElementById("sit-minutes")?.addEventListener("change", (event) => {
  const v = Math.round(Number(event.target.value));
  state.sitMinutes = Number.isFinite(v) ? Math.min(300, Math.max(15, v)) : 60;
  save();
  render();
});
