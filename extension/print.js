      const ROOM_NAMES = { spisestua: { no: "Spisestua", en: "Dining room" }, domino: { no: "Domino", en: "Domino" } };
      let ROOM_ID = window.__NORSKEN_ROOM__ || "spisestua";
      if (!window.__NORSKEN_ROOM__) {
        try {
          const v = localStorage.getItem("norsken-room");
          if (ROOM_NAMES[v]) ROOM_ID = v;
        } catch {}
      }
      const STORAGE_KEY = ROOM_ID === "domino" ? "norsken-layout-domino-v1" : "norsken-layout-v3";
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
      for (const table of state.tables || []) {
        if (table.zone !== "room" || table.lead === false) continue;
        if (table.redeck) {
          const again = timeOf(table.redeck);
          arrivals.push({ time: again.time, name: again.name, pax: table.redeckPax || table.guests, table, room: ROOM_ID, redeck: true });
        }
        if (!table.name) continue;
        const parts = timeOf(table.name);
        arrivals.push({ time: parts.time, name: parts.name, pax: table.guests, table, room: ROOM_ID });
      }
      // The arrivals page is the whole evening: the other room's bookings too.
      const OTHER = ROOM_ID === "domino" ? "spisestua" : "domino";
      let otherPlan = null;
      try {
        otherPlan = JSON.parse(localStorage.getItem(OTHER === "domino" ? "norsken-layout-domino-v1" : "norsken-layout-v3") || "null");
      } catch {}
      let guestStore = null;
      try {
        guestStore = window.__NORSKEN_GUESTS__ || JSON.parse(localStorage.getItem("norsken-guests-v1") || "null");
      } catch {}
      for (const table of (otherPlan && otherPlan.tables) || []) {
        if (table.zone !== "room" || table.lead === false) continue;
        if (table.name) {
          const parts = timeOf(table.name);
          arrivals.push({ time: parts.time, name: parts.name, pax: table.guests || table.seatCount, table, room: OTHER });
        }
        if (guestStore && guestStore.placed && Array.isArray(guestStore.list)) {
          for (const x of guestStore.list) {
            if (guestStore.placed[x.id] === table.id && ((guestStore.room && guestStore.room[x.id]) || "spisestua") === OTHER) {
              arrivals.push({ time: x.time || "", name: x.name || "", pax: x.pax || table.guests, table, room: OTHER });
            }
          }
        }
      }
      try {
        const g = window.__NORSKEN_GUESTS__ || JSON.parse(localStorage.getItem("norsken-guests-v1") || "null");
        if (g && g.placed && Array.isArray(g.list)) {
          for (const table of state.tables || []) {
            if (table.name || table.zone !== "room") continue;
            const on = g.list.filter((x) => g.placed[x.id] === table.id && ((g.room && g.room[x.id]) || "spisestua") === ROOM_ID);
            for (const x of on) arrivals.push({ time: x.time || "", name: x.name || "", pax: x.pax || table.guests, table, room: ROOM_ID });
            if (on.length) table.name = on.map((x) => `${x.time ? `${x.time} ` : ""}${x.name || ""}`.trim()).join(" / ");
          }
        }
      } catch {}
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
        return table.name || table.label || "";
      }
      function obstacleName(item) {
        if (item.kind === "furniture") return copy.furniture[item.size] || item.size;
        return `${copy.colTable} ${item.label}`;
      }
      function customCm(table) {
        const c = normSize(table) === "long" ? table.custom : null;
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
      room.appendChild(rulers);

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
        el.style.left = `${table.x}%`;
        el.style.top = `${table.y}%`;
        el.style.width = `${(cm.w / r.w) * 100}%`;
        el.style.height = `${(cm.h / r.h) * 100}%`;
        const text = item0Label(table);
        const paxWord = lang === "en" ? "pers" : "pers";
        if (table.name && table.lead !== false) {
          el.classList.add("named");
          const name = document.createElement("span");
          name.textContent = text;
          const sub = document.createElement("span");
          sub.className = "sub";
          sub.textContent = `${copy.colTable} ${table.label} · ${table.guests} ${paxWord}`;
          el.append(name, sub);
          if (table.redeck) {
            const again = document.createElement("span");
            again.className = "sub";
            again.textContent = `↻ ${table.redeck}`;
            el.appendChild(again);
          }
        } else {
          el.textContent = text;
          if (text && table.lead !== false && table.guests) {
            const pax = document.createElement("span");
            pax.className = "pax";
            pax.textContent = `${table.guests} ${paxWord}`;
            el.appendChild(pax);
          }
        }
        room.appendChild(el);
      }

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
        for (const seat of table.seatsRender || []) {
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
        document.getElementById("list-title").textContent = en ? "Arrivals" : "Ankomster";
        arrivals.sort(
          (a, b) =>
            (a.time || "99").localeCompare(b.time || "99") ||
            (a.room === b.room ? 0 : a.room === "spisestua" ? -1 : 1) ||
            labelSortKey(a.table.label)[0] - labelSortKey(b.table.label)[0],
        );
        const total = arrivals.reduce((sum, a) => sum + (Number(a.pax) || 0), 0);
        const rows = arrivals
          .map(
            (a) =>
              `<tr><td class="t">${escHtml(a.time || "–")}</td><td>${escHtml(a.name || "–")}</td><td>${a.pax || ""}</td><td>${escHtml(ROOM_NAMES[a.room || ROOM_ID][en ? "en" : "no"])}</td><td class="b">${escHtml(a.table.label)}${a.redeck ? ` <small>↻ ${en ? "re-set" : "dekk om"}</small>` : ""}</td></tr>`,
          )
          .join("");
        const taken = new Set(arrivals.map((a) => a.table.id));
        const free = sorted.filter((t) => !taken.has(t.id) && t.label).map((t) => t.label);
        listBody.innerHTML =
          `<table class="arrivals"><thead><tr><th>${en ? "Time" : "Tid"}</th><th>${en ? "Name" : "Navn"}</th><th>${en ? "People" : "Pers."}</th><th>${en ? "Room" : "Rom"}</th><th>${en ? "Table" : "Bord"}</th></tr></thead><tbody>${rows}</tbody></table>` +
          `<p class="free"><strong>${en ? "Bookings" : "Bookinger"}: ${arrivals.length} · ${en ? "people" : "personer"}: ${total}</strong>${
            free.length ? ` &nbsp;·&nbsp; ${en ? "Free tables" : "Ledige bord"}: ${escHtml(free.join(", "))}` : ""
          }</p>`;
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
      if (plateLines.length) {
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

      document.getElementById("print").addEventListener("click", () => window.print());
      window.addEventListener("load", () => setTimeout(() => window.print(), 300));
    