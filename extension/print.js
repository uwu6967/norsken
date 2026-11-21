      // every room with a table map (same ids as ROOM_DEFS in app.js)
      const ROOM_NAMES = {
        spisestua: { no: "Spisestua", en: "Dining room" },
        domino: { no: "Domino", en: "Domino" },
        bar: { no: "Bar", en: "Bar" },
        toddy: { no: "Toddy", en: "Toddy" },
        danske: { no: "Danske kjelleret", en: "Danske kjelleret" },
        arneberg: { no: "Arneberg", en: "Arneberg" },
        moterom: { no: "Møterom", en: "Meeting room" },
        kristiania: { no: "Kristiania", en: "Kristiania" },
        atheneum: { no: "Atheneum", en: "Atheneum" },
        bibliotek: { no: "Bibliotek", en: "Library" },
        r1818: { no: "1818", en: "1818" },
        r1814: { no: "1814", en: "1814" },
        r1772: { no: "1772", en: "1772" },
      };
      const roomKey = (id) => (id === "spisestua" ? "norsken-layout-v3" : id === "domino" ? "norsken-layout-domino-v1" : `norsken-layout-${id}-v1`);
      // The sheet is always Spisestua (Domino goes beside it when it is in use).
      // print.html?room=domino&embed=1 draws just the Domino map, for that corner.
      const PARAMS = new URLSearchParams(location.search);
      const EMBED = PARAMS.get("embed") === "1";
      let ROOM_ID = window.__NORSKEN_ROOM__ || (ROOM_NAMES[PARAMS.get("room")] ? PARAMS.get("room") : "spisestua");
      if (!ROOM_NAMES[ROOM_ID]) ROOM_ID = "spisestua";
      const IS_SALON = ROOM_ID !== "spisestua" && ROOM_ID !== "domino"; // a salon prints its map only
      if (EMBED) document.documentElement.classList.add("embed");
      const STORAGE_KEY = roomKey(ROOM_ID);
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
      // the same allergy/diet words as the app (app.js dietTags)
      const DIET_WORDS = [
        ["gluten", /glut[e]?n|c[øo]liaki|coeliac|celiac/i],
        ["laktose", /lakto|lacto|melkeallerg|melkefri|melkeprotein/i],
        ["notter", /n[øo]tt|peanut|pean[øo]tt|mandel|nut allerg|nuts\b/i],
        ["skalldyr", /skalldyr|skjell|reke|krabbe|hummer(?!\s?(aften|kveld|fest))|shellfish|bl[øo]tdyr/i],
        ["diabetes", /diabet/i],
        ["gravid", /gravid|pregnan/i],
        ["veganer", /vegan/i],
        ["vegetar", /vegetar/i],
        ["pescetar", /pesc|pesk/i],
      ];
      function dietTagsOf(text) {
        const t = String(text || "");
        if (!t) return [];
        const keys = DIET_WORDS.filter(([, re]) => re.test(t)).map(([key]) => key);
        if (!keys.length && /allerg|intoleran/i.test(t)) keys.push("annet");
        return keys;
      }
      function markOf(key) { return SEAT_MARKS.find((m) => m.key === key) || null; }
      function inkOn(hex) {
        const n = parseInt(hex.slice(1), 16);
        const srgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
          const c = v / 255;
          return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2] > 0.42 ? "#1d1812" : "#ffffff";
      }
      const DEFAULT_DIMS = {
        room: { w: 700, h: 1360 },
        small: { d: 115 },
        big: { d: 135 },
        oval: { w: 90, l: 165 },
        rect: { w: 80, l: 120 },
        plateS: { w: 37, l: 90, n: 2 },
        plateM: { w: 49.5, l: 90, n: 4 },
        plateL: { w: 55.5, l: 90, n: 2 },
        plateXL: { w: 64, l: 90, n: 1 },
        long: { w: 90, l: 105 },
        sidebord: { w: 60, l: 178 },
        aisle: 90,
        snap: 10,
        est: { small: false, big: false, oval: true, long: true, plateS: false, plateM: false, plateL: false, plateXL: false, sidebord: true },
      };

      let state = window.__NORSKEN_STATE__ || null;
      if (!state) {
        try {
          state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        } catch {
          state = {};
        }
      }
      // Dagens liste: guest names dragged onto tables live only in this
      // browser (NDA), never in the plan. Put them on the printout here.
      const arrivals = [];
      const timeOf = (text) => {
        const m = String(text || "").match(/^(\d{1,2})[:.](\d{2})\s*(.*)$/);
        return m ? { time: `${m[1].padStart(2, "0")}:${m[2]}`, name: m[3] } : { time: "", name: String(text || "") };
      };
      // The arrivals page is the whole evening: the other room's bookings too,
      // and anyone still without a table (waiting for a re-set, or another room).
      const OTHER = ROOM_ID === "domino" ? "spisestua" : "domino";
      const uiLang = state.lang === "en" ? "en" : "no";
      let otherPlan = null;
      try {
        if (!IS_SALON) otherPlan = JSON.parse(localStorage.getItem(roomKey(OTHER)) || "null");
      } catch {}
      let guestStore = null;
      try {
        if (!IS_SALON) guestStore = window.__NORSKEN_GUESTS__ || JSON.parse(localStorage.getItem("norsken-guests-v1") || "null");
      } catch {}
      // only the shift chosen in the app: Lunsj, Middag or Arrangement (app.js inShift)
      let SHIFT = window.__NORSKEN_SHIFT__;
      if (SHIFT == null) {
        try {
          SHIFT = localStorage.getItem("norsken-shift") || "";
        } catch {
          SHIFT = "";
        }
      }
      const EVENT_WORDS = /fast meny|meny for alle|selskap|arrangement|julebord|bankett|\bkurs\b|\bevent\b|konferanse/i;
      const isEvent = (g) => (g.event === true ? true : g.event === false ? false : EVENT_WORDS.test(String(g.areaLabel || g.area || "")) || EVENT_WORDS.test(String(g.note || "")));
      const inShift = (g) => {
        if (!SHIFT) return true;
        const m = String(g.time || "").match(/^(\d{1,2})[:.](\d{2})/);
        const lunch = m ? Number(m[1]) * 60 + Number(m[2]) < 15 * 60 : false;
        // same as app.js: Lunsj/Middag are the ordinary guests, «+arrangement» adds the event
        return SHIFT.split("+").some((part) => (part === "arrangement" ? isEvent(g) : !isEvent(g) && (part === "lunsj" ? lunch : !lunch)));
      };
      const guestList = (guestStore && Array.isArray(guestStore.list) ? guestStore.list : []).filter(inShift);
      const guestRoomOf = (x) => (guestStore && guestStore.room && guestStore.room[x.id]) || "spisestua";
      const placedIds = new Set();
      const partyName = (people) => {
        const byTime = new Map();
        for (const x of people.slice().sort((p, q) => (p.time || "99").localeCompare(q.time || "99"))) {
          if (!byTime.has(x.time || "")) byTime.set(x.time || "", []);
          byTime.get(x.time || "").push(x);
        }
        return [...byTime.entries()]
          .map(([time, list]) => {
            const re = list.some((x) => guestStore.redeck && guestStore.redeck[x.id]) ? "↻ " : "";
            const areas = new Set(list.map((x) => x.area || "spisestua"));
            const pax = list.reduce((sum, x) => sum + (Number(x.pax) || 0), 0);
            const group = list.length > 1 && areas.size === 1 && [...areas][0].startsWith("other:") ? list[0].areaLabel : "";
            return `${re}${time ? `${time} ` : ""}${group ? `${group} · ${pax} pers` : list.map((x) => x.name || "").filter(Boolean).join(", ")}`.trim();
          })
          .join(" / ");
      };
      const guestsOnTable = (roomId, table) =>
        guestList.filter((x) => guestStore.placed && guestStore.placed[x.id] === table.id && guestRoomOf(x) === roomId);
      const addTable = (roomId, table) => {
        const people = guestStore ? guestsOnTable(roomId, table) : [];
        if (people.length) {
          for (const x of people) {
            placedIds.add(x.id);
            arrivals.push({
              time: x.time || "",
              name: x.name || "",
              pax: x.pax || "",
              note: x.note || "",
              id: x.id,
              area: x.area || "",
              areaLabel: x.areaLabel || "",
              arrived: Boolean(guestStore.arrived && guestStore.arrived[x.id]),
              table,
              room: roomId,
              redeck: Boolean(guestStore.redeck && guestStore.redeck[x.id]),
            });
          }
          // the map shows the party, not a name typed on the table (that used to hide these rows)
          if (roomId === ROOM_ID) table.name = partyName(people);
          return;
        }
        if (roomId === ROOM_ID && table.redeck) {
          const again = timeOf(table.redeck);
          arrivals.push({ time: again.time, name: again.name, pax: table.redeckPax || table.guests, table, room: roomId, redeck: true });
        }
        if (!table.name) return;
        const parts = timeOf(table.name);
        arrivals.push({ time: parts.time, name: parts.name, pax: table.guests || table.seatCount, table, room: roomId });
      };
      for (const table of state.tables || []) {
        if (table.zone !== "room" || table.lead === false) continue;
        addTable(ROOM_ID, table);
      }
      for (const table of (otherPlan && otherPlan.tables) || []) {
        if (table.zone !== "room" || table.lead === false) continue;
        addTable(OTHER, table);
      }
      for (const x of guestList) {
        if (placedIds.has(x.id)) continue;
        const hint = guestStore.redeckHint && guestStore.redeckHint[x.id];
        const area = String(x.area || "");
        const room = guestRoomOf(x);
        let where = "";
        if (hint) where = uiLang === "en" ? `↻ table ${hint}` : `↻ bord ${hint}`;
        else if (area.startsWith("other:")) where = x.areaLabel || area.slice(6);
        else if (room !== ROOM_ID && ROOM_NAMES[room]) where = ROOM_NAMES[room][uiLang];
        arrivals.push({
          time: x.time || "",
          name: x.name || "",
          pax: x.pax || "",
          note: x.note || "",
          id: x.id,
          area: x.area || "",
          areaLabel: x.areaLabel || "",
          arrived: Boolean(guestStore.arrived && guestStore.arrived[x.id]),
          table: null,
          room,
          where,
          redeck: Boolean(hint || (guestStore.redeck && guestStore.redeck[x.id])),
        });
      }
      const lang = state.lang === "en" ? "en" : "no";
      document.title = `Norsken — ${ROOM_NAMES[ROOM_ID][lang]}`;
      const dims = (() => {
        const base = JSON.parse(JSON.stringify(DEFAULT_DIMS));
        const saved = state.dims;
        if (!saved || typeof saved !== "object") return base;
        if (saved.room) Object.assign(base.room, saved.room);
        if (saved.small) Object.assign(base.small, saved.small);
        if (saved.big) Object.assign(base.big, saved.big);
        if (saved.oval) Object.assign(base.oval, saved.oval);
        if (saved.sidebord) Object.assign(base.sidebord, saved.sidebord);
        if (saved.long) Object.assign(base.long, saved.long);
        if (saved.plateS) Object.assign(base.plateS, saved.plateS);
        if (saved.plateM) Object.assign(base.plateM, saved.plateM);
        if (saved.plateL) Object.assign(base.plateL, saved.plateL);
        if (saved.plateXL) Object.assign(base.plateXL, saved.plateXL);
        if (Number.isFinite(saved.aisle)) base.aisle = saved.aisle;
        if (saved.est) Object.assign(base.est, saved.est);
        return base;
      })();
      const r = dims.room;

      const copy =
        lang === "en"
          ? {
              kicker: "Dining room",
              listTitle: "Measurement list",
              colTable: "Table",
              colSize: "Size",
              colWindow: "From window",
              nameLabel: "Name",
              seats: "People",
              gapSuggest: "suggestion",
              gapEmpty: "no plate inserted",
              colLeft: "From left wall",
              colNearest: "Nearest table",
              small: "Small",
              big: "Large",
              oval: "Oval",
              long: "Long table",
              plateS: "small plate", plateM: "medium plate", plateL: "large plate", plateXL: "extra-large plate",
              furniture: { sidebord: "Old table" },
              gapLabel: "Gap", noPlate: "no plate fits", needPlate: "Plates needed",
              est: "est.",
              warnTitle: "Too tight for a waitress",
              warnOk: "Every gap is at least",
              scale: "1 square = 1 m",
              empty: "No tables on the floor yet.",
              none: "none",
            }
          : {
              kicker: "Spisestua",
              listTitle: "Målliste",
              colTable: "Bord",
              colSize: "Størrelse",
              colWindow: "Fra vindu",
              colLeft: "Fra venstre vegg",
              colNearest: "Nærmeste bord",
              small: "Lite",
              big: "Stort",
              oval: "Ovalt",
              long: "Langbord",
              plateS: "liten plate", plateM: "medium plate", plateL: "stor plate", plateXL: "ekstra stor plate",
              nameLabel: "Navn",
              seats: "Personer",
              gapSuggest: "forslag",
              gapEmpty: "ingen plate lagt inn",
              furniture: { sidebord: "Gammelt bord" },
              gapLabel: "Mellomrom", noPlate: "ingen plate passer", needPlate: "Trenger plate",
              est: "anslag",
              warnTitle: "For trangt for servitør",
              warnOk: "Alle avstander er minst",
              scale: "1 rute = 1 m",
              empty: "Ingen bord på gulvet ennå.",
              none: "ingen",
            };

      function fmt(cm) {
        if (cm == null || !Number.isFinite(cm)) return "–";
        const dec = lang === "en" ? "." : ",";
        const v = Math.round(cm);
        if (Math.abs(v) >= 100) return `${(v / 100).toFixed(2).replace(".", dec)} m`;
        return `${v} cm`;
      }
      const PLATES = ["plateS", "plateM", "plateL", "plateXL"];
      const isPlate = (size) => size === "long";
      function normSize(table) {
        if (PLATES.includes(table.size)) return "long"; // plates are inserts, not tables
        return dims[table.size] ? table.size : "small";
      }
      function isRound(item) {
        const spec = dims[normSize(item)];
        return spec && spec.d != null;
      }
      // The A4 is for the staff: a guest name beats a table number.
      function item0Label(table) {
        if (table.lead === false) return "";
        if (table.piece) return { flygel: lang === "en" ? "Grand piano" : "Flygel" }[table.piece] || "";
        if (EMBED) return table.label || ""; // the small Domino corner: just the number, the names are in the list
        return table.name || table.label || "";
      }
      function obstacleName(item) {
        if (item.kind === "furniture") return copy.furniture[item.size] || item.size;
        return `${copy.colTable} ${item.label}`;
      }
      function customCm(table) {
        const c = normSize(table) === "long" ? table.custom : table.own;
        return c && Number.isFinite(c.w) && Number.isFinite(c.l) ? c : null;
      }
      function sizeCm(table) {
        const own = customCm(table);
        if (own) return { w: own.w, h: own.l };
        const spec = dims[normSize(table)];
        if (spec.d != null) return { w: spec.d, h: spec.d };
        return { w: spec.w, h: spec.l };
      }
      function tableCm(table) {
        const s = sizeCm(table);
        return table.rotated ? { w: s.h, h: s.w } : { w: s.w, h: s.h };
      }
      function centerCm(table) {
        return { x: (table.x / 100) * r.w, y: (table.y / 100) * r.h };
      }
      function clearances(table) {
        const c = centerCm(table);
        const s = tableCm(table);
        return {
          top: c.y - s.h / 2,
          bottom: r.h - (c.y + s.h / 2),
          left: c.x - s.w / 2,
          right: r.w - (c.x + s.w / 2),
        };
      }
      const withChairs = state.withChairs !== false;
      function occupiedCm(item) {
        const s = tableCm(item);
        if (!withChairs || item.kind === "furniture") return s;
        if (!(item.seatsRender || []).length) return s;
        const pad = (dims.chairBig ? dims.chairBig.d : 54) * 1.12 * 2;
        return { w: s.w + pad, h: s.h + pad };
      }
      function gapCm(a, b) {
        const ca = centerCm(a);
        const cb = centerCm(b);
        const sa = occupiedCm(a);
        const sb = occupiedCm(b);
        if (isRound(a) && isRound(b)) {
          return Math.hypot(ca.x - cb.x, ca.y - cb.y) - sa.w / 2 - sb.w / 2;
        }
        const dx = Math.abs(ca.x - cb.x) - (sa.w + sb.w) / 2;
        const dy = Math.abs(ca.y - cb.y) - (sa.h + sb.h) / 2;
        if (dx > 0 && dy > 0) return Math.hypot(dx, dy);
        return Math.max(dx, dy);
      }
      function sizeLabel(table) {
        const size = normSize(table);
        const spec = dims[size];
        const tag = dims.est[size] ? ` (${copy.est})` : "";
        const own = customCm(table);
        if (own) return `${copy[size]} ${own.w}×${own.l} cm`;
        if (isPlate(size) || spec.d == null) return `${copy[size]} ${spec.w}×${spec.l} cm${tag}`;
        return `${copy[size]} ⌀${Math.round(spec.d)} cm${tag}`;
      }

      document.documentElement.lang = lang;
      document.getElementById("kicker").textContent = ROOM_NAMES[ROOM_ID][lang];
      document.getElementById("list-title").textContent = copy.listTitle;
      document.getElementById("meta").innerHTML =
        `${new Date().toLocaleString(lang === "en" ? "en-GB" : "nb-NO")}`;
      document.getElementById("print").textContent = lang === "en" ? "Print / save as PDF" : "Skriv ut / lagre som PDF";

      const room = document.getElementById("room");
      room.style.aspectRatio = `${r.w} / ${r.h}`;

      const mx = (10000 / r.w).toFixed(4);
      const my = (10000 / r.h).toFixed(4);
      const grid = document.createElement("div");
      grid.className = "grid-layer";
      grid.style.backgroundImage = [
        `repeating-linear-gradient(90deg, rgba(47,74,60,0.30) 0 1px, transparent 1px ${mx}%)`,
        `repeating-linear-gradient(180deg, rgba(47,74,60,0.30) 0 1px, transparent 1px ${my}%)`,
        `repeating-linear-gradient(90deg, rgba(47,74,60,0.12) 0 1px, transparent 1px ${(mx / 2).toFixed(4)}%)`,
        `repeating-linear-gradient(180deg, rgba(47,74,60,0.12) 0 1px, transparent 1px ${(my / 2).toFixed(4)}%)`,
      ].join(",");
      room.appendChild(grid);

      const rulers = document.createElement("div");
      rulers.className = "ruler-layer";
      for (let m = 1; m * 100 < r.w; m += 1) {
        const el = document.createElement("span");
        el.className = "top";
        el.style.left = `${((m * 100) / r.w) * 100}%`;
        el.textContent = m;
        rulers.appendChild(el);
      }
      for (let m = 1; m * 100 < r.h; m += 1) {
        const el = document.createElement("span");
        el.className = "left";
        el.style.top = `${((m * 100) / r.h) * 100}%`;
        el.textContent = m;
        rulers.appendChild(el);
      }
      // no metre numbers along the edges on paper (Danny 2026-11-13)

      const fixtures = state.fixtures || [
        { id: "double-1", wall: "left", along: 24 },
        { id: "double-2", wall: "left", along: 68 },
        { id: "waitress", wall: "bottom", along: 50 },
      ];
      for (const fixture of fixtures) {
        const el = document.createElement("div");
        el.className = `fixture door ${fixture.wall}`;
        if (fixture.wall === "left") el.style.top = `${fixture.along}%`;
        else el.style.left = `${fixture.along}%`;
        room.appendChild(el);
      }

      const furniture = []; // the old table is no longer on the map
      for (const item of furniture) {
        item.kind = "furniture";
        // against the top/bottom wall it lies along the wall (app.js syncFurniture)
        item.rotated = item.wall === "top" || item.wall === "bottom";
        const cm = tableCm(item);
        const el = document.createElement("div");
        el.className = "furniture";
        el.style.left = `${item.x}%`;
        el.style.top = `${item.y}%`;
        el.style.width = `${(cm.w / r.w) * 100}%`;
        el.style.height = `${(cm.h / r.h) * 100}%`;
        el.textContent = copy.furniture[item.size] || "";
        room.appendChild(el);
      }

      const tables = (state.tables || []).filter((item) => item.zone === "room");
      const leads = tables.filter((item) => item.lead !== false);

      // Plates laid into the gaps. app.js bakes the geometry into
      // groupInfo.strips so the print does not redo gapBand / orderGroup.
      for (const lead of leads) {
        for (const strip of (lead.groupInfo && lead.groupInfo.strips) || []) {
          const el = document.createElement("div");
          el.className = "plate-insert";
          el.style.left = strip.left + "%";
          el.style.top = strip.top + "%";
          el.style.width = strip.w + "%";
          el.style.height = strip.h + "%";
          room.appendChild(el);
        }
      }
      for (const table of tables) {
        const el = document.createElement("div");
        const cm = tableCm(table);
        el.className = `table ${isPlate(normSize(table)) ? "plate" : normSize(table) === "oval" ? "oval" : normSize(table) === "rect" ? "rect" : "round"}`;
        el.dataset.id = table.id;
        el.style.left = `${table.x}%`;
        el.style.top = `${table.y}%`;
        el.style.width = `${(cm.w / r.w) * 100}%`;
        el.style.height = `${(cm.h / r.h) * 100}%`;
        const text = item0Label(table);
        const paxWord = lang === "en" ? "pers" : "pers";
        if (table.name && table.lead !== false && !EMBED) {
          el.classList.add("named");
          const name = document.createElement("span");
          name.textContent = text;
          const sub = document.createElement("span");
          sub.className = "sub num";
          sub.textContent = `${copy.colTable} ${table.label}`;
          el.append(name, sub);
          if (table.guests) {
            const pax = document.createElement("span");
            pax.className = "pax";
            pax.textContent = `${table.guests} ${paxWord}`;
            el.appendChild(pax);
          }
          if (table.redeck) {
            const again = document.createElement("span");
            again.className = "sub";
            again.textContent = `↻ ${table.redeck}`;
            el.appendChild(again);
          }
        } else {
          el.textContent = text;
          if (text && table.lead !== false && table.guests && !EMBED) {
            const pax = document.createElement("span");
            pax.className = "pax";
            pax.textContent = `${table.guests} ${paxWord}`;
            el.appendChild(pax);
          }
        }
        room.appendChild(el);
      }

      // a langbord with no plate is one table (app.js joinLangbord)
      (function joinLangbord() {
        const groups = new Map();
        for (const t of tables) if (t.group) groups.set(t.group, [...(groups.get(t.group) || []), t]);
        for (const members of groups.values()) {
          if (members.length < 2 || members.some((m) => !isPlate(normSize(m)) || (Array.isArray(m.gapPlates) && m.gapPlates.length))) continue;
          const xs = members.map((m) => m.x);
          const ys = members.map((m) => m.y);
          const axis = Math.max(...ys) - Math.min(...ys) >= Math.max(...xs) - Math.min(...xs) ? "y" : "x";
          members.sort((a, b) => (axis === "y" ? a.y - b.y : a.x - b.x));
          members.forEach((m, i) => {
            const node = room.querySelector(`.table[data-id="${m.id}"]`);
            if (!node) return;
            const edge = (side) => {
              node.style[`border${side}Color`] = "transparent";
            };
            if (axis === "y") {
              if (i > 0) { node.style.borderTopLeftRadius = node.style.borderTopRightRadius = "0"; edge("Top"); }
              if (i < members.length - 1) { node.style.borderBottomLeftRadius = node.style.borderBottomRightRadius = "0"; edge("Bottom"); }
            } else {
              if (i > 0) { node.style.borderTopLeftRadius = node.style.borderBottomLeftRadius = "0"; edge("Left"); }
              if (i < members.length - 1) { node.style.borderTopRightRadius = node.style.borderBottomRightRadius = "0"; edge("Right"); }
            }
          });
        }
      })();

      function fitNames() {
        for (const el of room.querySelectorAll(".table.named")) {
          const name = el.firstElementChild;
          if (!name) continue;
          name.style.display = "block";
          let size = 8.5;
          const tooBig = () => name.scrollWidth > el.clientWidth - 2 || el.scrollHeight > el.clientHeight + 2;
          while (tooBig() && size > 5) {
            size -= 0.5;
            name.style.fontSize = size + "pt";
          }
        }
      }
      fitNames();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNames);

      function labelSortKey(label) {
        const m = String(label ?? "").match(/^(\d+)?(.*)$/);
        return [m[1] ? Number(m[1]) : 999, (m[2] || "").toLowerCase()];
      }
      const chairPct = {
        w: ((dims.chairBig ? dims.chairBig.d : 54) / r.w) * 100,
        h: ((dims.chairBig ? dims.chairBig.d : 54) / r.h) * 100,
      };
      const usedMarks = new Set();
      const notes = [];
      const seatNameList = [];
      let markedCount = 0;
      for (const table of tables) {
        for (const seat of state.printNoChairs ? [] : table.seatsRender || []) {
          const mark = markOf(seat.mark);
          const el = document.createElement("div");
          el.className = "seat" + (mark ? " marked" : "");
          el.style.left = seat.x + "%";
          el.style.top = seat.y + "%";
          const turn = (Number.isFinite(seat.a) ? seat.a : -90) + 90;
          el.style.transform = "translate(-50%, -50%) rotate(" + turn + "deg)";
          el.style.borderTopWidth = "2.5px";
          el.style.width = chairPct.w + "%";
          el.style.height = chairPct.h + "%";
          if (mark) {
            el.style.background = mark.color;
            el.style.borderColor = mark.color;
            el.style.color = inkOn(mark.color);
            el.innerHTML = '<span style="display:block;transform:rotate(' + -turn + 'deg)">' + mark.code + "</span>";
            usedMarks.add(mark.key);
            markedCount += 1;
          }
          if (seat.note) {
            el.style.position = "absolute";
            el.title = seat.note;
            el.insertAdjacentHTML("beforeend", '<i style="position:absolute;top:-5px;right:-5px;font-style:normal;font-size:7px;background:#ffe866;border-radius:50%;padding:0 1px;transform:rotate(' + -turn + 'deg)">✱</i>');
            notes.push({ label: table.label, note: seat.note });
          }
          room.appendChild(el);
          if (seat.name) {
            // a guest's name on one chair: a small label just outside the chair
            const rad = ((Number.isFinite(seat.a) ? seat.a : -90) * Math.PI) / 180;
            const chairCm = dims.chairBig ? dims.chairBig.d : 54;
            const tag = document.createElement("div");
            tag.className = "seat-name";
            tag.textContent = seat.name;
            tag.style.left = seat.x + ((Math.cos(rad) * chairCm * 1.15) / r.w) * 100 + "%";
            tag.style.top = seat.y + ((Math.sin(rad) * chairCm * 1.15) / r.h) * 100 + "%";
            room.appendChild(tag);
            seatNameList.push({ label: table.label, name: seat.name });
          }
        }
      }
      if (seatNameList.length) {
        const sn = document.createElement("div");
        sn.className = "plates";
        const escN = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
        sn.innerHTML = `<p class="kicker">${lang === "en" ? "Names on chairs" : "Navn på stol"}</p><ul>${seatNameList
          .map((n) => `<li>${lang === "en" ? "Table" : "Bord"} ${escN(n.label)}: ${escN(n.name)}</li>`)
          .join("")}</ul>`;
        document.querySelector("section.list").appendChild(sn);
      }

      const sorted = leads.slice().sort((a, b) => {
        const ka = labelSortKey(a.label);
        const kb = labelSortKey(b.label);
        return ka[0] - kb[0] || ka[1].localeCompare(kb[1]);
      });
      const listBody = document.getElementById("list-body");
      const escHtml = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
      if (arrivals.length) {
        const en = lang === "en";
        const shiftName = {
          lunsj: en ? "Lunch" : "Lunsj",
          middag: en ? "Dinner" : "Middag",
          arrangement: en ? "Event" : "Arrangement",
          "middag+arrangement": en ? "Dinner + Event" : "Middag + Arrangement",
          "lunsj+arrangement": en ? "Lunch + Event" : "Lunsj + Arrangement",
        }[SHIFT];
        document.getElementById("list-title").textContent = (en ? "Arrivals" : "Ankomster") + (shiftName ? ` · ${shiftName}` : "");
        arrivals.sort(
          (a, b) =>
            (a.time || "99").localeCompare(b.time || "99") ||
            (a.room === b.room ? 0 : a.room === "spisestua" ? -1 : 1) ||
            labelSortKey(a.table && a.table.label)[0] - labelSortKey(b.table && b.table.label)[0],
        );
        const total = arrivals.reduce((sum, a) => sum + (Number(a.pax) || 0), 0);
        // marks on the chairs of each table, for the comment column
        const marksAt = (table) => {
          const counts = {};
          for (const seat of table.seatsRender || []) if (markOf(seat.mark)) counts[seat.mark] = (counts[seat.mark] || 0) + 1;
          return Object.entries(counts)
            .map(([key, n]) => {
              const m = markOf(key);
              return `<span class="k" style="background:${m.color};color:${inkOn(m.color)}">${m.code}</span>${n > 1 ? `×${n}` : ""}`;
            })
            .join(" ");
        };
        const marksDone = new Set();
        // grouped by room: Spisestua, Domino, then the other rooms (Møterom, Bar, 1772 …)
        const groupOf = (a) => {
          if (a.table) return { key: a.room || ROOM_ID, label: ROOM_NAMES[a.room || ROOM_ID][en ? "en" : "no"] };
          const area = String(a.area || "");
          if (area.startsWith("other:")) return { key: area, label: a.areaLabel || area.slice(6) };
          const room = ROOM_NAMES[area] ? area : a.room || "spisestua";
          return { key: room, label: ROOM_NAMES[room] ? ROOM_NAMES[room][en ? "en" : "no"] : room };
        };
        const rank = (key) => (key === "spisestua" ? 0 : key === "domino" ? 1 : 2);
        for (const a of arrivals) a.group = groupOf(a);
        // the same name booked more than once (in two rooms, or twice): maybe a double booking
        const nameKey = (n) => String(n || "").toLowerCase().replace(/\s+/g, " ").trim();
        const byName = new Map();
        for (const a of arrivals) {
          if (!a.id || !nameKey(a.name)) continue;
          if (!byName.has(nameKey(a.name))) byName.set(nameKey(a.name), []);
          byName.get(nameKey(a.name)).push(a);
        }
        const minutes = (t) => {
          const m = String(t || "").match(/^(\d{1,2})[:.](\d{2})/);
          return m ? Number(m[1]) * 60 + Number(m[2]) : null;
        };
        // red only when the two bookings are under 1½ hours apart (booked twice by
        // mistake); otherwise just a note (cards in 1772 first, dinner later)
        const clashes = (a) => {
          const same = ((a.id && byName.get(nameKey(a.name))) || []).filter((x) => x !== a);
          const at = minutes(a.time);
          return {
            same,
            close: same.filter((x) => at == null || minutes(x.time) == null || Math.abs(minutes(x.time) - at) < 90),
          };
        };
        const doubleNote = (a) => {
          const { same, close } = clashes(a);
          if (!same.length) return "";
          const list = (xs) => escHtml(xs.map((x) => `${x.group.label} ${x.time || ""}`.trim()).join(", "));
          return close.length
            ? `<strong class="double">⚠ ${en ? "double booking?" : "dobbeltbooking?"}</strong> ${en ? "also" : "også"} ${list(close)}`
            : `↔ ${en ? "also" : "også"} ${list(same)}`;
        };
        arrivals.sort(
          (a, b) =>
            rank(a.group.key) - rank(b.group.key) ||
            a.group.label.localeCompare(b.group.label) ||
            (a.time || "99").localeCompare(b.time || "99") ||
            labelSortKey(a.table && a.table.label)[0] - labelSortKey(b.table && b.table.label)[0],
        );
        let lastGroup = null;
        const rows = arrivals
          .map((a) => {
            let head = "";
            if (a.group.key !== lastGroup) {
              lastGroup = a.group.key;
              const same = arrivals.filter((x) => x.group.key === a.group.key);
              const ppl = same.reduce((sum, x) => sum + (Number(x.pax) || 0), 0);
              head = `<tr class="grp"><td colspan="6">${escHtml(a.group.label)} <small>· ${same.length} ${en ? (same.length === 1 ? "booking" : "bookings") : same.length === 1 ? "booking" : "bookinger"} · ${ppl} ${en ? "guests" : "gjester"}</small></td></tr>`;
            }
            const where = a.table
              ? `${a.room && a.room !== ROOM_ID ? `${ROOM_NAMES[a.room][en ? "en" : "no"]} ` : ""}${escHtml(a.table.label)}`
              : a.group.key.startsWith("other:") && (!a.where || a.where === a.group.label)
                ? "–" // their own room: no table of ours
                : escHtml(a.where || (en ? "no table" : "uten bord"));
            const marks = !a.table || marksDone.has(a.table.id) ? "" : marksAt(a.table);
            if (a.table) marksDone.add(a.table.id);
            const note = [doubleNote(a), a.redeck ? `↻ ${en ? "re-set" : "dekk om"}` : "", escHtml(a.note || "")].filter(Boolean).join(" · ");
            const diet = dietTagsOf(a.note)
              .map((key) => markOf(key))
              .filter(Boolean)
              .map((m) => `<span class="k" style="background:${m.color};color:${inkOn(m.color)}">${m.code}</span>`)
              .join(" ");
            return `${head}<tr${clashes(a).close.length ? ' class="dbl"' : ""}><td class="c"><span class="box">${a.arrived ? "✓" : ""}</span></td><td class="t">${escHtml(a.time || "–")}</td><td class="nm">${escHtml(a.name || "–")}</td><td class="p">${a.pax || ""}</td><td class="b">${where}</td><td class="note">${[diet, marks].filter(Boolean).join(" ")}${(diet || marks) && note ? " " : ""}${note}</td></tr>`;
          })
          .join("");
        const seated = arrivals.filter((a) => a.table);
        const taken = new Set(seated.filter((a) => a.room === ROOM_ID).map((a) => a.table.id));
        const free = sorted.filter((t) => !taken.has(t.id) && t.label).map((t) => t.label);
        const used = new Set(seated.map((a) => `${a.room}:${a.table.id}`)).size;
        const stat = (n, word) => `<span class="stat"><b>${n}</b>${word}</span>`;
        const summary =
          `<div class="stats">${stat(arrivals.length, en ? "bookings" : "bookinger")}${stat(total, en ? "guests" : "gjester")}${stat(used, en ? "tables in use" : "bord i bruk")}` +
          `${free.length ? `<span class="stat free-t"><b>${escHtml(free.join(", "))}</b>${en ? "free tables" : "ledige bord"}</span>` : ""}</div>`;
        listBody.innerHTML =
          summary +
          `<table class="arrivals"><thead><tr><th class="c">✓</th><th>${en ? "Time" : "Tid"}</th><th>${en ? "Name" : "Navn"}</th><th>${en ? "Ppl" : "Pers"}</th><th>${en ? "Table" : "Bord"}</th><th>${en ? "Comment" : "Kommentar"}</th></tr></thead><tbody>${rows}</tbody></table>`;
        if (!EMBED) document.documentElement.classList.add("with-list");
      } else if (!sorted.length) {
        listBody.innerHTML = `<p>${copy.empty}</p>`;
      } else {
        const rows = sorted
          .map((table) => {
            const c = clearances(table);
            let near = null;
            for (const other of [...tables, ...furniture]) {
              if (other === table) continue;
              if (table.group && other.group === table.group) continue;
              const gap = gapCm(table, other);
              if (!near || gap < near.gap) near = { table: other, gap };
            }
            const nearCell = near
              ? `<span class="${near.gap < dims.aisle ? "tight" : ""}">${obstacleName(near.table)} · ${fmt(near.gap)}</span>`
              : copy.none;
            return `<tr><td class="n">${table.label}</td><td>${table.name || "&ndash;"}</td><td>${table.guests != null ? table.guests : ""}</td><td>${sizeLabel(table)}</td><td>${fmt(c.top)}</td><td>${fmt(c.left)}</td><td>${nearCell}</td></tr>`;
          })
          .join("");
        listBody.innerHTML = `<table class="measure"><thead><tr><th>${copy.colTable}</th><th>${copy.nameLabel}</th><th>${copy.seats}</th><th>${copy.colSize}</th><th>${copy.colWindow}</th><th>${copy.colLeft}</th><th>${copy.colNearest}</th></tr></thead><tbody>${rows}</tbody></table>`;
      }

      const items = [...tables, ...furniture];
      const cmNum = (value) => {
        if (!Number.isFinite(value)) return "-";
        const r1 = Math.round(value * 10) / 10;
        return Number.isInteger(r1) ? String(r1) : r1.toFixed(1).replace(".", lang === "en" ? "." : ",");
      };
      const plateLines = [];
      for (const lead of leads) {
        const info = lead.groupInfo;
        if (!info || !info.gaps || !info.gaps.length) continue;
        for (const entry of info.gaps) {
          let names = "";
          let total = 0;
          let ok = false;
          if (entry.plates && entry.plates.length) {
            const counts = new Map();
            for (const size of entry.plates) counts.set(size, (counts.get(size) || 0) + 1);
            names = [...counts.entries()]
              .map(([size, c]) => (c > 1 ? c + " x " : "") + (copy[size] || size))
              .join(" + ");
            total = cmNum(
              entry.plates.reduce((sum, size) => sum + ((dims[size] && dims[size].w) || 0), 0),
            );
            ok = true;
          } else if (entry.plate) {
            names = (entry.plate.parts || [])
              .map((p) => (p.count > 1 ? p.count + " x " : "") + (copy[p.size] || p.size))
              .join(" + ");
            total = Math.round(entry.plate.total);
            ok = entry.plate.fits;
            if (names) names = (copy.gapSuggest || "forslag") + ": " + names;
          }
          plateLines.push(
            `<li>${copy.colTable} ${lead.label}: ${copy.gapLabel} <strong>${cmNum(entry.gap)} cm</strong> &rarr; ` +
              (names ? `${names} = ${total} cm` : copy.gapEmpty || copy.noPlate) +
              (ok ? "" : ' <span class="tight">!</span>') +
              `</li>`,
          );
        }
      }

      const tight = [];
      for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
          if (items[i].kind === "furniture" && items[j].kind === "furniture") continue;
          if (items[i].group && items[i].group === items[j].group) continue;
          const gap = gapCm(items[i], items[j]);
          if (gap < dims.aisle) tight.push({ a: items[i], b: items[j], gap });
        }
      }
      tight.sort((x, y) => x.gap - y.gap);
      if (false && plateLines.length) { // not on paper any more (Danny 2026-11-18)
        const pl = document.createElement("div");
        pl.className = "plates";
        pl.innerHTML = `<p class="kicker">${copy.needPlate}</p><ul>${plateLines.join("")}</ul>`;
        document.querySelector("section.list").appendChild(pl);
      }

      if (usedMarks.size) {
        const lg = document.createElement("div");
        lg.className = "legend";
        lg.innerHTML = SEAT_MARKS.filter((m) => usedMarks.has(m.key))
          .map(
            (m) =>
              `<span><span class="k" style="background:${m.color};color:${inkOn(m.color)}">${m.code}</span>${lang === "en" ? m.en : m.no}</span>`,
          )
          .join("") + `<span><strong>${lang === "en" ? "Marked" : "Merket"}: ${markedCount}</strong></span>`;
        document.querySelector("section.list").appendChild(lg);
      }
      if (notes.length) {
        const nt = document.createElement("div");
        nt.className = "plates";
        const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
        nt.innerHTML = `<p class="kicker">✱ ${lang === "en" ? "Seat notes" : "Notater"}</p><ul>${notes
          .map((n) => `<li>${lang === "en" ? "Table" : "Bord"} ${esc(n.label)}: ${esc(n.note)}</li>`)
          .join("")}</ul>`;
        document.querySelector("section.list").appendChild(nt);
      }

      const warnEl = document.getElementById("warnings");
      if (true) {
        warnEl.innerHTML = ""; // the distance list is not printed any more
      } else if (!tight.length) {
        warnEl.innerHTML = `<p class="ok">✓ ${copy.warnOk} ${fmt(dims.aisle)}.</p>`;
      } else {
        warnEl.innerHTML =
          `<p class="warn-title">⚠ ${copy.warnTitle} (&lt; ${fmt(dims.aisle)})</p><ul>` +
          tight.map((p) => `<li>${obstacleName(p.a)} ↔ ${obstacleName(p.b)}: <strong>${fmt(p.gap)}</strong></li>`).join("") +
          `</ul>`;
      }

      // a long list is made a little smaller until it fits beside the map on one page
      function fitList() {
        if (!document.documentElement.classList.contains("with-list")) return;
        const list = document.querySelector("section.list");
        const limit = room.getBoundingClientRect().height + 4;
        let zoom = 1;
        list.style.zoom = "1";
        while (list.getBoundingClientRect().height > limit && zoom > 0.5) {
          zoom = Math.round((zoom - 0.04) * 100) / 100;
          list.style.zoom = String(zoom);
        }
      }
      fitList();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitList);
      if (document.documentElement.classList.contains("with-list")) {
        const page = document.createElement("style");
        page.textContent = "@page { size: A4 landscape; margin: 0; }";
        document.head.appendChild(page);
      }
      document.getElementById("print").addEventListener("click", () => window.print());
      // Domino on the same sheet, small, when it is in use (bookings, names or chairs)
      function dominoInUse() {
        let plan = null;
        let g = null;
        try {
          plan = JSON.parse(localStorage.getItem("norsken-layout-domino-v1") || "null");
          g = JSON.parse(localStorage.getItem("norsken-guests-v1") || "null");
        } catch {}
        if (!plan || !Array.isArray(plan.tables)) return null;
        const floor = plan.tables.filter((t) => t.zone === "room" && t.lead !== false);
        const guestThere = Boolean(g && g.placed && g.room && Object.keys(g.placed).some((id) => g.room[id] === "domino"));
        const used = guestThere || floor.some((t) => t.name || t.redeck || Number(t.seatCount) > 0 || (t.seatsRender && t.seatsRender.length));
        return used && floor.length ? plan : null;
      }
      if (!EMBED && ROOM_ID === "spisestua" && !window.__NORSKEN_STATE__) {
        const plan = dominoInUse();
        if (plan) {
          const dr = (plan.dims && plan.dims.room) || { w: 500, h: 650 };
          const wide = document.documentElement.classList.contains("with-list");
          const mainH = wide ? 188 : 252; // mm: Spisestua a bit shorter so Domino gets a column
          const border = 3.7; // mm, the 7px frame on both sides
          const mainW = (mainH * r.w) / r.h + border;
          const sideW = wide ? 48 : Math.max(40, 194 - mainW - 5);
          const sideH = ((sideW - 1.6) * dr.h) / dr.w + 1.6;
          document.getElementById("sheet").classList.add("two");
          room.style.height = mainH + "mm";
          const frame = document.getElementById("domino-frame");
          frame.style.width = sideW + "mm";
          frame.style.height = sideH + "mm";
          frame.src = "print.html?room=domino&embed=1";
          document.getElementById("side").hidden = false;
        }
      }

      if (!EMBED) window.addEventListener("load", () => setTimeout(() => window.print(), 300));
    