      (function () {
        const printBtn = document.getElementById("print");
        if (printBtn) printBtn.addEventListener("click", () => window.print());
        try {
          if (new URLSearchParams(location.search).get("noprint") !== "1") window.addEventListener("load", () => setTimeout(() => window.print(), 350));
        } catch (e) {
          /* no url: no auto print */
        }
        try {
          build();
        } catch (e) {
          /* never throw: the sheet prints what it has */
        }
      })();
      function build() {
        const read = (key) => {
          try {
            return JSON.parse(localStorage.getItem(key) || "null");
          } catch (e) {
            return null;
          }
        };
        const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);
        let data = null;
        let store = null;
        try {
          data = obj(window.__NORSKEN_APERO__) || obj(read("norsken-apero-sheet"));
        } catch (e) {
          data = null;
        }
        try {
          store = obj(window.__NORSKEN_GUESTS__) || obj(read("norsken-guests-v1"));
        } catch (e) {
          store = null;
        }
        data = data || {};
        store = store || {};
        const en = data.lang === "en";
        const T = (no, e) => (en ? e : no);
        const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
        const num = (v) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        };
        const $ = (id) => document.getElementById(id);
        const MM = 96 / 25.4;
        const PT = 96 / 72;

        // allergy / diet words – the same as the table plans (print.html DIET_WORDS / dietTagsOf)
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
          const t = String(text == null ? "" : text);
          if (!t) return [];
          const keys = DIET_WORDS.filter(([, re]) => re.test(t)).map(([key]) => key);
          if (!keys.length && /allerg|intoleran/i.test(t)) keys.push("annet");
          return keys;
        }
        // code (when the word does not fit) · short word NO · short word EN · legend word NO · EN
        // never a lone «D» for diabetes: «D 2» is Domino table 2
        const MARKS = {
          gluten: ["G", "gluten", "gluten"],
          laktose: ["L", "laktose", "lactose"],
          notter: ["N", "nøtter", "nuts"],
          skalldyr: ["S", "skalldyr", "shellfish"],
          diabetes: ["Dia", "diabetes", "diabetes"],
          gravid: ["Gr", "gravid", "pregnant"],
          vegetar: ["V", "vegetar", "vegetarian"],
          veganer: ["Vg", "vegan", "vegan"],
          pescetar: ["P", "pescetar", "pescetarian"],
          annet: ["A", "allergi", "allergy"],
        };
        const dietWord = (k) => (en ? MARKS[k][2] : MARKS[k][1]);
        // marks above a capital («Å», «É») or a tail below the line («g», «y»): a name on two lines
        // keeps room for them (td.nm.two.acc / .tail)
        const hasAcc = (t) => [...String(t)].some((c) => c !== c.toLocaleLowerCase() && c.normalize("NFD").length > 1);
        const hasTail = (t) => /[gjpqyçŋ]/.test(String(t));
        const dietText = (keys) =>
          keys
            .filter((k) => MARKS[k])
            .map(dietWord)
            .join(" ");
        const glyphCls = (t) => `${hasAcc(t) ? " acc" : ""}${hasTail(t) ? " tail" : ""}`;
        const dietHtml = (keys) =>
          keys
            .filter((k) => MARKS[k])
            .map((k) => `<i class="dw" data-k="${esc(k)}">${esc(dietWord(k))}</i>`)
            .join("");

        // ---- the data: guests (names live only here) joined with the app's rows ----
        const arrived = obj(store.arrived) || {};
        const byId = new Map();
        for (const g of Array.isArray(store.list) ? store.list : []) if (obj(g) && g.id != null) byId.set(String(g.id), g);
        const rows = [];
        for (const r of Array.isArray(data.rows) ? data.rows : []) {
          if (!obj(r) || r.id == null) continue;
          const g = byId.get(String(r.id));
          if (!g) continue;
          rows.push({
            id: String(r.id),
            place: r.place ? String(r.place) : "",
            label: r.label ? String(r.label) : "",
            table: r.table == null ? "" : String(r.table).trim(),
            name: String(g.name == null || g.name === "" ? "–" : g.name),
            pax: num(g.pax),
            time: g.time == null ? "" : String(g.time),
            diet: dietTagsOf(g.note),
            here: arrived[g.id] === true,
          });
        }

        const rooms = [];
        for (const room of Array.isArray(data.rooms) ? data.rooms : []) {
          if (!obj(room)) continue;
          const items = [];
          for (const it of Array.isArray(room.items) ? room.items : []) {
            if (!obj(it) || it.id == null) continue;
            items.push({
              id: String(it.id),
              label: it.label == null ? "" : String(it.label),
              shape: String(it.shape || ""),
              piece: it.piece ? String(it.piece) : it.shape === "furniture" ? "furniture" : "",
              x: num(it.x),
              y: num(it.y),
              w: Math.max(1, num(it.w)),
              h: Math.max(1, num(it.h)),
              reserved: it.reserved === true,
              share: it.share === true,
              cap: Math.max(0, num(it.cap)),
              extra: Math.max(0, num(it.extra)),
            });
          }
          rooms.push({
            id: String(room.id == null ? "" : room.id),
            name: String((en ? room.nameEn || room.name : room.name) || room.id || "?"),
            w: num(room.w) > 0 ? num(room.w) : 100,
            h: num(room.h) > 0 ? num(room.h) : 100,
            items,
          });
        }
        const isTable = (it) => !it.piece;
        const items = new Map();
        for (const room of rooms) for (const it of room.items) items.set(it.id, { room, it });
        const atPlace = new Map();
        for (const r of rows) {
          if (!r.place) continue;
          if (!atPlace.has(r.place)) atPlace.set(r.place, []);
          atPlace.get(r.place).push(r);
        }
        const byLabel = (a, b) => (a.label === "") - (b.label === "") || a.label.localeCompare(b.label, "nb", { numeric: true });
        const paxAt = (id) => (atPlace.get(id) || []).reduce((n, r) => n + r.pax, 0);

        // the room as the staff say it: full words, «Blå» for Blå værelset
        const SHORT = { kristiania: T("Blå", "Blue") };
        const roomWord = (room) => SHORT[room.id] || room.name;
        // the dinner table as the staff say it: «6», «D 2» (Domino)
        const dinner = (t) => String(t || "").replace(/^D\s*/i, "D ");
        const seatsWord = (cap, extra) => (cap || extra ? `${cap}${extra ? `–${cap + extra}` : ""} ${T("pl.", "seats")}` : "");

        // A–Å like a phone book: plain letters first, then Æ Ø Å. «Aas» stays under A (the
        // Norwegian aa = å rule would hide it at the very end, where nobody at the door looks).
        let collator = null;
        try {
          collator = new Intl.Collator("nb", { sensitivity: "base", numeric: true });
        } catch (e) {
          collator = null;
        }
        const LAST = { æ: "{", ä: "{", ø: "|", ö: "|", å: "}" };
        const plain = (v) =>
          String(v)
            .toLocaleLowerCase("nb")
            .replace(/[æäøöå]/g, (c) => LAST[c])
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/\d+/g, (d) => d.padStart(8, "0"));
        const cmpName = (a, b) => {
          const x = plain(a);
          const y = plain(b);
          if (x !== y) return x < y ? -1 : 1;
          return collator ? collator.compare(a, b) : 0;
        };
        const sortKey = (r) => r.name.trim().replace(/^[^\p{L}\p{N}]+/u, "");
        // the gutter letter is the letter the name is filed under: «Élodie» under E, «Öberg» under Ø
        const initialOf = (r) => {
          const c = sortKey(r).charAt(0);
          if (!c) return "#";
          if (/\d/.test(c)) return c;
          const k = plain(c).charAt(0);
          return { "{": "Æ", "|": "Ø", "}": "Å" }[k] || (k || c).toLocaleUpperCase("nb");
        };

        // ---- top: day, counts, pling ----
        const dayText = (() => {
          const m = String(data.day || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
          const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date();
          try {
            return d.toLocaleDateString(en ? "en-GB" : "nb-NO", { weekday: "long", day: "numeric", month: "long" });
          } catch (e) {
            return String(data.day || "");
          }
        })();
        const people = rows.reduce((n, r) => n + r.pax, 0);
        const pling = String(data.pling || "").trim();
        const BELL =
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c-.9 0-1.6.7-1.6 1.6v.6C7.6 5.4 5.8 8 5.8 11v4.3L3.7 18v1.1h16.6V18l-2.1-2.7V11c0-3-1.8-5.6-4.6-6.3v-.6c0-.9-.7-1.6-1.6-1.6zM9.6 20.2a2.4 2.4 0 0 0 4.8 0z" fill="#000"/></svg>';
        $("top").innerHTML = `<div class="title"><h1>${T("Aperitiff", "Aperitif")}</h1><div class="day">${esc(dayText)}</div></div>
          <div class="count"><b>${rows.length}</b> ${rows.length === 1 ? T("selskap", "party") : T("selskap", "parties")}<br><b>${people}</b> ${T("gjester", "guests")}</div>
          <div class="pling">${BELL}<div><div class="when">${esc(pling ? `Pling ${pling}` : "Pling")}</div><div class="what">${T("da går alle til bordet under <b>→ Bord</b>", "then everyone goes to the table under <b>→ Table</b>")}</div></div></div>`;

        // what the legend must explain
        const seen = { busy: false, free: false, res: false, chip: false, wr: false, codes: new Set() };

        // ---- one block per salon ----
        function roomRows(room) {
          const out = [];
          const used = new Set();
          for (const t of room.items.filter(isTable).sort(byLabel)) {
            const here = (atPlace.get(t.id) || []).slice();
            if (!t.label && !here.length) continue; // part of a joined table: drawn, not listed
            const label = t.label || "–";
            here.forEach((r, i) => {
              used.add(r.id);
              out.push({ kind: i ? "cont" : "party", pl: label, r });
            });
            const left = t.cap + t.extra - here.reduce((n, r) => n + r.pax, 0);
            if (!here.length) out.push(t.reserved ? { kind: "res", pl: label } : { kind: "free", pl: label, seats: seatsWord(t.cap, t.extra) });
            else if (t.share && left > 0) out.push({ kind: "free", pl: label, cont: true, seats: `${left} ${T("pl.", "seats")}` });
          }
          // a party at something that is no table (should not happen): still listed
          for (const it of room.items) for (const r of atPlace.get(it.id) || []) if (!used.has(r.id)) out.push({ kind: "party", pl: it.label || "–", r });
          return out;
        }
        const PIECE_WORD = {
          peis: T("peis", "fireplace"),
          vindu: T("vindu", "window"),
          flygel: T("flygel", "piano"),
          bardisk: T("bardisk", "bar"),
          sofa: "",
          furniture: "",
        };
        const pieceWord = (p) => (Object.prototype.hasOwnProperty.call(PIECE_WORD, p) ? PIECE_WORD[p] : p);
        const fmt = (v) => Math.round(v * 100) / 100;
        function roomBlock(room, index) {
          const box = document.createElement("section");
          box.className = "room";
          const list = roomRows(room);
          const parties = list.filter((x) => x.r);
          const ppl = parties.reduce((n, x) => n + x.r.pax, 0);
          const tables = room.items.filter((it) => isTable(it) && it.label);
          const freeT = tables.filter((t) => !t.reserved && !(atPlace.get(t.id) || []).length).length;
          const resT = tables.filter((t) => t.reserved && !(atPlace.get(t.id) || []).length).length;
          const sum = parties.length
            ? `${parties.length} ${T("selskap", parties.length === 1 ? "party" : "parties")} · ${ppl} ${T("pers.", "ppl")}${freeT ? ` · ${freeT} ${T("ledig", "free")}` : ""}`
            : !tables.length
              ? ""
              : !resT
                ? T("ingen ennå – alle bord ledige", "nobody yet – all tables free")
                : `${T("ingen ennå", "nobody yet")} – ${freeT} ${T("ledig", "free")} · ${resT} ${T("reservert", "reserved")}`;
          // the map
          const shapes = [];
          const tags = [];
          const pc = (v, of) => (v / of) * 100;
          for (const it of room.items) {
            const x = it.x - it.w / 2;
            const y = it.y - it.h / 2;
            const here = atPlace.get(it.id) || [];
            const table = isTable(it);
            const hatch = table && it.reserved && !here.length;
            const fill = hatch ? ` style="fill:url(#hatch-${index})"` : "";
            const cls = table ? `t${here.length ? " busy" : ""}` : "p";
            const sid = table
              ? ` data-id="${esc(it.id)}" data-cx="${fmt(it.x)}" data-cy="${fmt(it.y)}" data-w="${fmt(it.w)}" data-h="${fmt(it.h)}" data-label="${esc(it.label)}"`
              : ` data-piece="${esc(it.id)}"`;
            if (table) {
              if (here.length) seen.busy = true;
              else if (hatch) seen.res = true;
              else seen.free = true;
            }
            if (it.shape === "round" || it.shape === "oval") {
              shapes.push(`<ellipse class="${cls}"${sid}${fill} cx="${fmt(it.x)}" cy="${fmt(it.y)}" rx="${fmt(it.w / 2)}" ry="${fmt(it.h / 2)}"/>`);
            } else {
              const rad = it.piece === "sofa" ? Math.min(it.w, it.h) * 0.25 : 0;
              shapes.push(`<rect class="${cls}"${sid}${fill} x="${fmt(x)}" y="${fmt(y)}" width="${fmt(it.w)}" height="${fmt(it.h)}" rx="${fmt(rad)}"/>`);
            }
            const pos = `left:${fmt(pc(it.x, room.w))}%;top:${fmt(pc(it.y, room.h))}%`;
            if (it.piece === "vindu") {
              shapes.push(it.h >= it.w ? `<line class="w" x1="${fmt(it.x)}" y1="${fmt(y)}" x2="${fmt(it.x)}" y2="${fmt(y + it.h)}"/>` : `<line class="w" x1="${fmt(x)}" y1="${fmt(it.y)}" x2="${fmt(x + it.w)}" y2="${fmt(it.y)}"/>`);
            }
            if (!table) {
              const word = pieceWord(it.piece);
              if (word) tags.push(`<span class="piece${it.piece === "vindu" ? " win" : ""}" data-for="${esc(it.id)}" style="${pos}">${esc(word)}</span>`);
              continue;
            }
            if (it.label) tags.push(`<span class="num${hatch ? " on-hatch" : ""}" style="${pos}">${esc(it.label)}</span>`);
            const tab = `<b class="tab">${esc(it.label)}</b>`;
            if (here.length) {
              tags.push(
                `<div class="names${here.length > 1 && it.label ? " tabbed" : ""}" data-id="${esc(it.id)}" data-label="${it.label ? 1 : 0}"><div class="who">${tab}<div class="ln">${here
                  .map((r) => `<div class="nl"><span class="gn">${esc(r.name)}</span><i>${r.pax || ""}</i></div>`)
                  .join("")}</div></div></div>`,
              );
            } else if (hatch) {
              tags.push(`<div class="names res" data-id="${esc(it.id)}" data-label="0"><div class="who"><div class="ln"><span>${T("reservert", "reserved")}</span></div></div></div>`);
            }
          }
          const map = room.items.length
            ? `<div class="stage" data-aspect="${room.h / room.w}"><div class="map" data-w="${room.w}" data-h="${room.h}">
                <svg viewBox="0 0 ${room.w} ${room.h}" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="hatch-${index}" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)"><rect width="14" height="14" fill="#fff"/><rect width="3.5" height="14" fill="#000"/></pattern></defs>
                <rect class="wall" x="0" y="0" width="${room.w}" height="${room.h}"/>${shapes.join("")}</svg>${tags.join("")}</div></div>`
            : `<div class="stage"><p class="no-map">${T("Ingen bord tegnet", "No tables drawn")}</p></div>`;
          // its list
          const wr = '<span class="wr"></span>';
          const body = list
            .map((x) => {
              if (x.r) {
                const r = x.r;
                if (!r.table) seen.wr = true;
                return `<tr class="${x.kind}"><td class="pl">${esc(x.pl)}</td><td class="nm${glyphCls(`${r.name} ${dietText(r.diet)}`)}"><div class="fit"><span class="gn">${esc(r.name)}</span>${dietHtml(r.diet)}</div></td><td class="px">${r.pax || ""}</td><td class="to">${r.table ? esc(dinner(r.table)) : wr}</td></tr>`;
              }
              if (x.kind === "res") return `<tr class="res"><td class="pl">${esc(x.pl)}</td><td class="nm" colspan="3">${T("reservert", "reserved")}</td></tr>`;
              return `<tr class="free${x.cont ? " cont" : ""}"><td class="pl">${esc(x.pl)}</td><td class="nm"><span class="free-word">${x.cont ? "+ " : ""}${T("ledig", "free")}${x.seats ? ` · ${esc(x.seats)}` : ""}</span></td><td class="px"></td><td class="to"></td></tr>`;
            })
            .join("");
          box.innerHTML = `<h2 class="band"><span>${esc(room.name)}</span><small>${esc(sum)}</small></h2>
            <div class="inner">${map}
              <table class="rl"><colgroup><col class="col-pl"><col><col class="col-px"><col class="col-to"></colgroup>
                <thead><tr><th class="px">${T("Nr.", "No.")}</th><th>${T("Gjest", "Guest")}</th><th class="px">${T("Pers", "Ppl")}</th><th class="to">→ ${T("Bord", "Table")}</th></tr></thead>
                <tbody>${body || `<tr><td colspan="4" class="nm"><span class="free-word">${T("Ingen bord", "No tables")}</span></td></tr>`}</tbody>
              </table></div>`;
          return box;
        }

        const roomsEl = $("rooms");
        rooms.forEach((room, i) => roomsEl.appendChild(roomBlock(room, i)));
        if (!rooms.length) {
          roomsEl.innerHTML = `<section class="room"><h2 class="band"><span>${T("Salongene", "The salons")}</span></h2><p class="empty-note">${T(
            "Ingen salong har bordkart ennå. Tegn dem i Norsken under «Innover ▾» → «Flytt bord».",
            "No salon has a table map yet. Draw them in Norsken under «Innover ▾» → «Move tables».",
          )}</p></section>`;
        }

        // ---- the door list: A–Å, tick, where to now (salon), where at the pling (table) ----
        const door = $("door");
        const sorted = rows.slice().sort((a, b) => cmpName(sortKey(a), sortKey(b)) || a.time.localeCompare(b.time));
        let prevL = null;
        const placeCell = (r) => {
          if (!r.place) {
            seen.wr = true;
            return '<span class="wr"></span>';
          }
          const hit = items.get(r.place);
          if (!hit) return `<span class="rw">${esc(r.label || r.place)}</span>`;
          if (hit.it.label) seen.chip = true;
          return `<span class="rw">${esc(roomWord(hit.room))}</span>${hit.it.label ? `<span class="chip">${esc(hit.it.label)}</span>` : ""}`;
        };
        const doorRows = sorted
          .map((r, i) => {
            const L = initialOf(r);
            const first = L !== prevL;
            prevL = L;
            if (!r.table) seen.wr = true;
            const cls = [first ? "first" : "", i === 0 ? "top1" : ""].filter(Boolean).join(" ");
            return `<tr${cls ? ` class="${cls}"` : ""}><td class="L">${first ? esc(L) : ""}</td><td class="tick"><span class="box">${r.here ? "✓" : ""}</span></td><td class="nm${glyphCls(r.place ? r.name : `${r.name} ${dietText(r.diet)}`)}"><div class="fit"><span class="gn">${esc(r.name)}</span>${r.place ? "" : dietHtml(r.diet)}</div></td><td class="c">${r.pax || ""}</td><td class="c tm">${esc(r.time)}</td><td class="pl"><div class="fit">${placeCell(r)}</div></td><td class="to">${r.table ? esc(dinner(r.table)) : '<span class="wr"></span>'}</td></tr>`;
          })
          .join("");

        // the tables still free, room by room: where a walk-in can sit
        const freeBits = [];
        for (const room of rooms) {
          const bits = [];
          for (const t of room.items.filter(isTable).sort(byLabel)) {
            if (!t.label) continue;
            const here = atPlace.get(t.id) || [];
            const lo = t.cap;
            const hi = t.cap + t.extra;
            if (!here.length) {
              if (t.reserved) continue;
              bits.push(`${esc(t.label)}${hi ? `&nbsp;(${!lo || lo === hi ? hi : `${lo}–${hi}`})` : ""}`);
            } else if (t.share && hi > paxAt(t.id)) {
              bits.push(`${esc(t.label)}&nbsp;(+${hi - paxAt(t.id)})`);
            }
          }
          if (bits.length) freeBits.push(bits.map((b, i) => `${i ? "" : `<b>${esc(roomWord(room))}</b>&nbsp;`}${b}${i < bits.length - 1 ? "," : ""}`));
        }
        // one nowrap span per entry; a line may only break between entries
        const freeHtml = freeBits.map((bits, ri) => bits.map((b, i) => `<span class="nw">${b}${ri < freeBits.length - 1 && i === bits.length - 1 ? "&nbsp;·" : ""}</span>`).join(" ")).join(" ");
        const anyTable = rooms.some((room) => room.items.some(isTable));
        const freeText = freeBits.length ? freeHtml : anyTable ? T("ingen – alle bord er tatt", "none – every table is taken") : T("ingen bord tegnet", "no tables drawn");

        door.innerHTML = `<h2 class="band"><span>${T("Gjesteliste", "Guest list")}</span><small>${T("A–Å · kryss av når de kommer", "A–Z · tick when they arrive")}</small></h2>
          <div class="rows"><table>
            <colgroup><col class="col-L"><col class="col-tick"><col><col class="col-px"><col class="col-time"><col class="col-pl"><col class="col-to"></colgroup>
            <thead><tr><th></th><th></th><th>${T("Navn", "Name")}</th><th class="c">${T("Pers", "Ppl")}</th><th class="c">${T("Tid", "Time")}</th><th>${T("Plass", "Place")}</th><th class="to">→ ${T("Bord", "Table")}</th></tr></thead>
            <tbody>${doorRows || `<tr class="none"><td></td><td colspan="6">${T("Ingen bookinger ennå.", "No bookings yet.")}</td></tr>`}</tbody>
          </table></div>`;

        // the walk-in part, in two dresses: under the guest list (same columns), or as its own
        // block under the salons when a busy night needs the whole right column for names
        const freeRow = (span) => `<tr class="freeline"><td colspan="${span}"><span class="lab">${T("Ledige bord", "Free tables")}:</span> ${freeText}</td></tr>`;
        const headCells = `<td class="c">${T("Pers", "Ppl")}</td><td class="c">${T("Tid", "Time")}</td><td>${T("Plass", "Place")}</td><td class="c">→ ${T("Bord", "Table")}</td>`;
        const walkRight = document.createElement("table");
        walkRight.className = "wk";
        walkRight.innerHTML = `<colgroup><col><col class="w-px"><col class="w-tm"><col class="w-pl"><col class="w-to"></colgroup>
          <tbody>${freeRow(5)}<tr class="walkh"><td class="lab">${T("Uten booking", "Walk-ins")}</td>${headCells}</tr></tbody>`;
        const walkLeft = document.createElement("section");
        walkLeft.className = "room walk";
        walkLeft.innerHTML = `<h2 class="band"><span>${T("Uten booking", "Walk-ins")}</span><small>${T("skriv navn, antall og plass", "write name, guests and place")}</small></h2>
          <div class="wkin"><table class="wk"><colgroup><col><col class="w-px"><col class="w-tm"><col class="w-pl"><col class="w-to"></colgroup>
          <tbody>${freeRow(5)}<tr class="walkh"><td>${T("Navn", "Name")}</td>${headCells}</tr></tbody></table></div>`;
        const blankRow = () => `<td><i></i></td><td><i></i></td><td><i></i></td><td><i></i></td><td><i></i></td>`;
        const walkPtr = document.createElement("div");
        walkPtr.className = "walk-ptr";
        walkPtr.innerHTML = `<span class="arr" aria-hidden="true">←</span><b>${T("Uten booking", "Walk-ins")}</b><span>${T("og ledige bord: nederst til venstre", "and free tables: bottom left")}</span>`;
        function putWalk(left) {
          walkRight.remove();
          walkLeft.remove();
          walkPtr.remove();
          for (const w of [walkRight, walkLeft]) for (const tr of [...w.querySelectorAll("tr.blank")]) tr.remove();
          if (left) {
            roomsEl.appendChild(walkLeft);
            door.querySelector(".rows").appendChild(walkPtr);
          } else door.querySelector(".rows").appendChild(walkRight);
        }
        function addBlanks(left, count) {
          const tb = (left ? walkLeft : walkRight).querySelector("tbody");
          for (let i = 0; i < count; i += 1) {
            const tr = document.createElement("tr");
            tr.className = "blank";
            tr.innerHTML = blankRow();
            tb.appendChild(tr);
          }
        }

        document.documentElement.lang = en ? "en" : "no";
        document.title = T("Norsken — Aperitiff", "Norsken — Aperitif");
        $("print").textContent = T("Skriv ut", "Print");
        $("hint").textContent = T(
          "A4 stående. Hver salong har kart og egen liste til pling. Gjestelisten står A–Å, med ledige bord og linjer til walk-ins under (en travel kveld: under salongene).",
          "A4 portrait. Each salon has a map and its own list for the pling. The guest list is A–Z, with free tables and walk-in lines below it (on a busy night: below the salons).",
        );

        // ---- fitting it all on one page ----
        const FEW = rows.length <= 20; // then every name stays at 7.5 pt or more
        const FLOOR = FEW ? 7.5 : 7;
        const QUIET = rows.length <= 24; // tall rows: long names wrap, nothing is cut
        // a name on two lines: 2 × line-height 1.04, plus room for «Å» above and «g» below when the
        // name has them (td.nm.two.acc / .tail in the CSS)
        const twoEm = (t) => 2 * 1.04 + (hasAcc(t) ? 0.17 : 0) + (hasTail(t) ? 0.11 : 0);
        const twoEmOf = (td) => 2 * 1.04 + (td.classList.contains("acc") ? 0.17 : 0) + (td.classList.contains("tail") ? 0.11 : 0);
        let canvasCtx = null;
        let family = "";
        const widths = new Map();
        const textW = (text, weight, pt) => {
          const key = `${weight}|${pt}|${text}`;
          if (widths.has(key)) return widths.get(key);
          let w;
          try {
            if (!canvasCtx) {
              canvasCtx = document.createElement("canvas").getContext("2d");
              family = getComputedStyle(document.body).fontFamily;
            }
            canvasCtx.font = `${weight} ${pt * PT}px ${family}`;
            w = canvasCtx.measureText(String(text)).width;
          } catch (e) {
            w = String(text).length * pt * PT * 0.6;
          }
          widths.set(key, w);
          return w;
        };

        // is this text cut? scrollWidth and clientWidth are whole pixels, so a name 0.2 px too long
        // still reads as «fits» – and then prints with an ellipsis. Measure the text itself.
        let meas = null;
        const natW = (el, text) => {
          try {
            if (!meas) {
              meas = document.createElement("span");
              meas.setAttribute("aria-hidden", "true");
              meas.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;padding:0;border:0";
              document.body.appendChild(meas);
            }
            const cs = getComputedStyle(el);
            meas.style.fontFamily = cs.fontFamily;
            meas.style.fontSize = cs.fontSize;
            meas.style.fontWeight = cs.fontWeight;
            meas.style.fontStyle = cs.fontStyle;
            meas.style.letterSpacing = cs.letterSpacing;
            meas.textContent = text == null ? el.textContent : text;
            return meas.getBoundingClientRect().width;
          } catch (e) {
            return el.scrollWidth;
          }
        };
        const isCut = (el) => el.scrollWidth > el.clientWidth + 0.5 || natW(el) > el.getBoundingClientRect().width + 0.05;

        // the salons: one row height for every list; maps of quiet rooms give way first, so the
        // busy rooms keep big text. Returns the row height and the height left over.
        function fitRooms() {
          const blocks = [...roomsEl.querySelectorAll(".room:not(.walk)")];
          const stages = [...roomsEl.querySelectorAll(".stage[data-aspect]")];
          const walk = roomsEl.querySelector(".room.walk");
          const gap = parseFloat(getComputedStyle(roomsEl).rowGap) || 0;
          roomsEl.classList.add("measure");
          const avail = roomsEl.clientHeight - (walk ? walk.getBoundingClientRect().height + gap : 0);
          if (!blocks.length) {
            roomsEl.classList.remove("measure");
            return { rh: 7, left: avail };
          }
          const setRh = (rh) => {
            roomsEl.style.setProperty("--rh", `${rh.toFixed(2)}mm`);
            roomsEl.style.setProperty("--rfs", `${Math.max(7, Math.min(10, rh * 1.48)).toFixed(2)}pt`);
          };
          const info = blocks.map((b) => {
            const st = b.querySelector(".stage[data-aspect]");
            return { b, st, tb: b.querySelector(".rl"), nat: st ? st.getBoundingClientRect().width * Number(st.dataset.aspect) + 2 * MM : 0, fixed: 0 };
          });
          for (const st of stages) st.style.minHeight = "0px";
          const minStage = 18 * MM;
          // the fixed part of a block (band, padding, borders) does not change with rh or scale
          const fixedOf = (x) => {
            const inner = x.b.querySelector(".inner");
            if (!inner) return x.b.getBoundingClientRect().height;
            const ics = getComputedStyle(inner);
            return x.b.getBoundingClientRect().height - inner.getBoundingClientRect().height + parseFloat(ics.paddingTop) + parseFloat(ics.paddingBottom);
          };
          const need = (scale) =>
            info.reduce((n, x) => {
              const list = x.tb ? x.tb.getBoundingClientRect().height : 0;
              const map = x.st ? Math.max(minStage, x.nat * scale) : 0;
              return n + x.fixed + Math.max(list, map);
            }, 0) +
            gap * Math.max(0, blocks.length - 1);
          // maps may shrink to 60 % before the text gets smaller; then both, a step at a time
          let rh = 7;
          let sMin = 0.6;
          for (let i = 0; i < 120; i += 1) {
            setRh(rh);
            for (const x of info) x.fixed = fixedOf(x);
            if (need(sMin) <= avail - 1) break;
            if (rh > 5.3) rh -= 0.1;
            else if (sMin > 0.5) sMin -= 0.05;
            else if (rh > 4.4) rh -= 0.1;
            else if (sMin > 0.3) sMin -= 0.05;
            else if (rh > 4) rh -= 0.1;
            else break;
          }
          let scale = 1;
          while (scale > sMin && need(scale) > avail - 1) scale -= 0.02;
          for (const x of info) if (x.st) x.st.style.minHeight = `${Math.max(minStage, x.nat * scale)}px`;
          const left = avail - need(scale);
          roomsEl.classList.remove("measure");
          return { rh, left };
        }

        // the maps: drawn to fit; furniture words, names beside their tables
        const overlap = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
        const grow = (a, p) => ({ l: a.l - p, t: a.t - p, r: a.r + p, b: a.b + p });
        const gapBetween = (a, b) => Math.hypot(Math.max(0, a.l - b.r, b.l - a.r), Math.max(0, a.t - b.b, b.t - a.b));
        const relRect = (el, o) => {
          const r = el.getBoundingClientRect();
          return { l: r.left - o.left, t: r.top - o.top, r: r.right - o.left, b: r.bottom - o.top };
        };
        function placeLabels(map) {
          const o = map.getBoundingClientRect();
          const stage = relRect(map.parentElement, o);
          const bounds = { l: stage.l + 0.3 * MM, t: stage.t + 0.3 * MM, r: stage.r - 0.3 * MM, b: stage.b - 0.3 * MM };
          const tables = [...map.querySelectorAll("svg [data-id]")].map((el) => ({ id: el.dataset.id, r: relRect(el, o) }));
          const words = [...map.querySelectorAll(".piece")].filter((p) => p.style.display !== "none").map((p) => relRect(p, o));
          const pieces = [...map.querySelectorAll("svg [data-piece]")].map((p) => relRect(p, o));
          const wall = { l: 0, t: 0, r: o.width, b: o.height };
          const nums = [...map.querySelectorAll(".num")].map((n) => relRect(n, o));
          const labels = [...map.querySelectorAll(".names")];
          // the biggest boxes first: they have the fewest good spots; «reservert» last
          labels.sort((a, b) => (a.classList.contains("res") - b.classList.contains("res")) || b.offsetHeight * b.offsetWidth - a.offsetHeight * a.offsetWidth);
          const placed = [];
          const g = 0.6 * MM;
          const res = [];
          for (const el of labels) {
            const own = tables.find((t) => t.id === el.dataset.id);
            if (!own) continue;
            const T0 = own.r;
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            const cx = (T0.l + T0.r) / 2;
            const cy = (T0.t + T0.b) / 2;
            const cands = [
              [cx - w / 2, T0.b + g],
              [T0.r + g, cy - h / 2],
              [T0.l - g - w, cy - h / 2],
              [cx - w / 2, T0.t - g - h],
              [T0.l, T0.b + g],
              [T0.r - w, T0.b + g],
              [T0.l, T0.t - g - h],
              [T0.r - w, T0.t - g - h],
              [T0.r + g, T0.t],
              [T0.r + g, T0.b - h],
              [T0.l - g - w, T0.t],
              [T0.l - g - w, T0.b - h],
              [T0.r + g, T0.b + g],
              [T0.l - g - w, T0.b + g],
              [T0.r + g, T0.t - g - h],
              [T0.l - g - w, T0.t - g - h],
            ];
            // a box that carries its table's number may also sit in a free spot further away
            if (el.classList.contains("tabbed")) {
              const nx = 15;
              const ny = 15;
              for (let iy = 0; iy < ny; iy += 1)
                for (let ix = 0; ix < nx; ix += 1)
                  cands.push([bounds.l + ((bounds.r - bounds.l - w) * ix) / (nx - 1), bounds.t + ((bounds.b - bounds.t - h) * iy) / (ny - 1)]);
            }
            let best = null;
            cands.forEach(([x0, y0], i) => {
              const x = Math.max(bounds.l, Math.min(bounds.r - w, x0));
              const y = Math.max(bounds.t, Math.min(bounds.b - h, y0));
              const r = { l: x, t: y, r: x + w, b: y + h };
              const out = Math.max(0, bounds.l - r.l) + Math.max(0, r.r - bounds.r) + Math.max(0, bounds.t - r.t) + Math.max(0, r.b - bounds.b);
              let hit = out * h * 4;
              // «hard»: really covers a table, a number, another box or runs off the map
              let hard = out * h;
              for (const t of tables) {
                hit += t.id === own.id ? overlap(r, t.r) * 3 : overlap(r, grow(t.r, 0.4 * MM)) * 4;
                hard += overlap(r, t.r);
              }
              for (const n of nums) {
                hit += overlap(r, n) * 2;
                hard += overlap(r, n) * 3;
              }
              for (const p of words) hit += overlap(r, p) * 3;
              // furniture is no table, but a box on it (or tight against it) hides its word; a box
              // across the wall looks lost
              for (const p of pieces) hit += overlap(r, grow(p, 0.3 * MM)) * 2.5;
              const inside = overlap(r, wall);
              if (inside > 0 && inside < w * h) hit += Math.min(inside, w * h - inside) * 1.5;
              for (const p of placed) {
                hit += overlap(r, p) * 8;
                hard += overlap(r, grow(p, -0.4 * MM));
              }
              const cost = hit + gapBetween(r, T0) * h * (i < 16 ? 0.6 : 1.2) + i * 0.01;
              // a spot that covers nothing that matters (tables, numbers, other boxes) beats any spot
              // that does, however tidy – so the tidiness weights above never hide names
              const okay = hard <= 2 * MM * MM;
              if (!best || okay > best.okay || (okay === best.okay && cost < best.cost)) best = { cost, hit, hard, okay, x, y, r };
            });
            el.style.left = `${best.x}px`;
            el.style.top = `${best.y}px`;
            placed.push(grow(best.r, 0.4 * MM));
            // tight against its own table and nearer to it than to any other table?
            const dOwn = gapBetween(best.r, T0);
            const dOther = tables.filter((t) => t.id !== own.id).reduce((m, t) => Math.min(m, gapBetween(best.r, t.r)), Infinity);
            res.push({ el, hit: best.hard, loose: dOwn > 1.2 * MM || dOther <= dOwn + 1 * MM });
          }
          return res;
        }
        function unwrap(box) {
          for (const nl of box.querySelectorAll(".nl.wrap")) {
            nl.classList.remove("wrap");
            const g = nl.querySelector(".gn");
            if (g) g.style.maxWidth = "";
          }
        }
        function fitMaps() {
          for (const map of document.querySelectorAll(".map")) {
            const stage = map.parentElement.getBoundingClientRect();
            const w = Number(map.dataset.w) || 1;
            const h = Number(map.dataset.h) || 1;
            const k = Math.max(0.0001, Math.min((stage.width - 0.6 * MM) / w, (stage.height - 0.6 * MM) / h));
            map.style.width = `${w * k}px`;
            map.style.height = `${h * k}px`;
            map.classList.remove("nonames");
            // a table is never drawn smaller than the number written on it
            for (const el of map.querySelectorAll("svg [data-id]")) {
              const cx = Number(el.dataset.cx) || 0;
              const cy = Number(el.dataset.cy) || 0;
              const min = Math.max(3.6 * MM, textW(el.dataset.label || "", 800, 8) + 1.6 * MM) / k;
              const tw = Math.max(Number(el.dataset.w) || 1, min);
              const th = Math.max(Number(el.dataset.h) || 1, min);
              if (el.tagName.toLowerCase() === "ellipse") {
                el.setAttribute("rx", fmt(tw / 2));
                el.setAttribute("ry", fmt(th / 2));
              } else {
                el.setAttribute("x", fmt(cx - tw / 2));
                el.setAttribute("y", fmt(cy - th / 2));
                el.setAttribute("width", fmt(tw));
                el.setAttribute("height", fmt(th));
              }
            }
            for (const el of map.querySelectorAll(".names")) el.style.display = "";
          }
          // the furniture words: inside the piece, turned along it, or across its edge – always written
          for (const p of document.querySelectorAll(".piece")) {
            const map = p.parentElement;
            const shape = [...map.querySelectorAll("svg [data-piece]")].find((el) => el.dataset.piece === p.dataset.for);
            p.classList.remove("over");
            p.style.transform = "translate(-50%, -50%)";
            p.style.display = "";
            if (!shape) continue;
            const s = shape.getBoundingClientRect();
            const r = p.getBoundingClientRect();
            const m = 0.5 * MM;
            if (r.width <= s.width - m && r.height <= s.height - m) continue;
            if (r.width <= s.height - m && r.height <= s.width - m) {
              p.style.transform = "translate(-50%, -50%) rotate(-90deg)";
              continue;
            }
            p.classList.add("over");
            if (s.height > s.width && r.width <= s.height) p.style.transform = "translate(-50%, -50%) rotate(-90deg)";
          }
          // names: 7.5 pt on a normal evening, never under 7 pt; a long name takes two lines
          // (the party size stays on every line)
          // two lines, split where the longer line is shortest – so the box is no wider than that
          const wrapName = (g) => {
            const t = g.textContent.trim();
            let best = Infinity;
            for (let i = 1; i < t.length; i += 1) {
              if (t[i] !== " " && t[i - 1] !== "-") continue;
              best = Math.min(best, Math.max(natW(g, t.slice(0, i).trimEnd()), natW(g, t.slice(i).trimStart())));
            }
            g.parentElement.classList.add("wrap");
            if (best < Infinity) g.style.maxWidth = `${Math.ceil(best) + 1}px`;
          };
          const fitWho = (who) => {
            unwrap(who);
            let fs = Math.min(7.5, parseFloat(who.style.fontSize) || 7.5);
            who.style.fontSize = `${fs}pt`;
            const cut = () => [...who.querySelectorAll(".nl > .gn")].filter((g) => isCut(g));
            while (fs > FLOOR && cut().length) {
              fs -= 0.25;
              who.style.fontSize = `${fs}pt`;
            }
            for (const g of cut()) if (/[\s-]/.test(g.textContent.trim())) wrapName(g);
          };
          for (const who of document.querySelectorAll(".names:not(.res) .who")) {
            who.style.fontSize = "";
            fitWho(who);
          }
          for (const map of document.querySelectorAll(".map")) {
            const crowded = (x) => !x.el.classList.contains("res") && x.hit > 2 * MM * MM;
            let res = placeLabels(map);
            // a box that is not tight against its table (or finds no free spot there) gets the
            // table's number as a tab – then it may also move to free space further off
            let again = false;
            for (const x of res) {
              if ((x.loose || crowded(x)) && x.el.dataset.label === "1" && !x.el.classList.contains("tabbed") && !x.el.classList.contains("res")) {
                x.el.classList.add("tabbed");
                again = true;
              }
            }
            if (again) res = placeLabels(map);
            // no room for a long name on two lines: one line again, cut, the size kept
            if (res.some(crowded) && map.querySelector(".nl.wrap")) {
              unwrap(map);
              res = placeLabels(map);
            }
            // too crowded for names at a readable size: the map keeps its grey numbered tables,
            // the list beside it has the names
            // still crowded: every box at the smallest allowed size, then once more
            if (res.some(crowded) && FLOOR < 7.5) {
              for (const who of map.querySelectorAll(".names:not(.res) .who")) {
                who.style.fontSize = `${FLOOR}pt`;
                fitWho(who);
              }
              res = placeLabels(map);
              if (res.some(crowded) && map.querySelector(".nl.wrap")) {
                unwrap(map);
                res = placeLabels(map);
              }
            }
            const bad = res.some(crowded);
            if (bad) {
              map.classList.add("nonames");
              for (const el of map.querySelectorAll(".names:not(.res)")) el.style.display = "none";
              placeLabels(map);
            } else {
              // a name that is still cut would be a scrap: that box goes – the table keeps its grey
              // number and the list beside the map has the whole name
              let gone = false;
              for (const el of map.querySelectorAll(".names:not(.res)")) {
                const g = [...el.querySelectorAll(".nl > .gn")];
                if (g.some((x) => isCut(x) || x.scrollHeight > x.clientHeight + 1)) {
                  el.style.display = "none";
                  gone = true;
                }
              }
              if (gone) placeLabels(map);
            }
          }
        }

        // the salon lists: the diet word if it fits, else its code; then a little smaller, then cut
        function fitRoomNames() {
          const base = parseFloat(getComputedStyle(roomsEl).getPropertyValue("--rfs")) || 9.5;
          const rhPx = (parseFloat(getComputedStyle(roomsEl).getPropertyValue("--rh")) || 6) * MM;
          for (const block of roomsEl.querySelectorAll(".room:not(.walk)")) {
            const tb = block.querySelector(".rl");
            const inner = block.querySelector(".inner");
            if (!tb || !inner) continue;
            // the white space under a short list (the map is taller): a two-line name may use some of it
            const ics = getComputedStyle(inner);
            let slack = Math.max(0, inner.clientHeight - parseFloat(ics.paddingTop) - parseFloat(ics.paddingBottom) - tb.getBoundingClientRect().height - 0.4 * MM);
            for (const td of tb.querySelectorAll("td.nm")) {
              const fit = td.querySelector(".fit");
              if (!fit) continue;
              const gn = fit.querySelector(".gn");
              // the diet in words (or as codes, when the words take too much of the name's room)
              const setMarks = (codes) => {
                for (const el of [...fit.querySelectorAll(codes ? ".dw" : ".k")]) {
                  const k = el.dataset.k;
                  const m = document.createElement(codes ? "span" : "i");
                  m.className = codes ? "k" : "dw";
                  m.dataset.k = k;
                  m.textContent = codes ? (MARKS[k] ? MARKS[k][0] : "?") : MARKS[k] ? dietWord(k) : "";
                  el.replaceWith(m);
                }
              };
              td.style.fontSize = "";
              td.classList.remove("two");
              setMarks(false);
              const wide = () => isCut(gn);
              if (!wide()) continue;
              const breakable = /[\s-]/.test(gn.textContent.trim());
              // the row as it stands, plus some of the white space under the list
              const rowH = Math.max(rhPx, td.getBoundingClientRect().height);
              const hMax = rowH + Math.min(slack, 2.5 * MM);
              // one line: the biggest size that fits (or the smallest, cut)
              const one = () => {
                td.classList.remove("two");
                td.style.fontSize = "";
                let f = base;
                while (f > FLOOR + 0.01 && wide()) {
                  f = Math.max(FLOOR, f - 0.25);
                  td.style.fontSize = `${f}pt`;
                }
                return { two: false, f, ok: !wide() };
              };
              // two lines on a tall row (a quiet night, or white space under a short list), like the door list
              const two = () => {
                td.classList.remove("two");
                td.style.fontSize = "";
                const twoMax = Math.min(base, (hMax - 0.15 * MM) / (twoEmOf(td) * PT));
                if (!breakable || twoMax < FLOOR) return null;
                td.classList.add("two");
                let f = twoMax;
                const ok2 = () => gn.scrollHeight <= gn.clientHeight + 1 && td.getBoundingClientRect().height <= hMax + 0.5 && gn.scrollWidth <= gn.clientWidth;
                td.style.fontSize = `${f}pt`;
                while (f > FLOOR && !ok2()) {
                  f = Math.max(FLOOR, f - 0.25);
                  td.style.fontSize = `${f}pt`;
                }
                // too long even on two lines: two lines at the smallest size, cut at the end of the
                // second, still show more of the name than one cut line (when the row has the height)
                const res = ok2() ? { two: true, f, ok: true } : td.getBoundingClientRect().height <= hMax + 0.5 ? { two: true, f, ok: false } : null;
                td.classList.remove("two");
                td.style.fontSize = "";
                return res;
              };
              // two lines only when they are clearly bigger than one line (or one line is cut)
              const best = () => {
                const a = one();
                const b = two();
                return b && (b.ok ? !a.ok || b.f >= a.f + 0.75 : !a.ok) ? b : a;
              };
              let pick = best();
              // the diet in words while the name keeps most of its size; else as codes
              if (fit.querySelector(".dw") && (!pick.ok || pick.f < base - 2 - 0.01)) {
                setMarks(true);
                const c = best();
                if (c.ok !== pick.ok ? c.ok : !c.ok || c.f > pick.f + 0.25) pick = c;
                else setMarks(false);
              }
              td.classList.toggle("two", pick.two);
              td.style.fontSize = pick.two || pick.f < base - 0.01 ? `${pick.f}pt` : "";
              if (pick.two) slack -= Math.max(0, td.getBoundingClientRect().height - rowH);
            }
          }
          for (const k of roomsEl.querySelectorAll(".k")) seen.codes.add(k.dataset.k);
          for (const k of door.querySelectorAll("td.nm .k")) if (k.style.display !== "none") seen.codes.add(k.dataset.k);
        }

        // the door list: row height from the space left after the walk-in part
        function fitDoor() {
          const wrap = door.querySelector(".rows");
          const table = wrap && wrap.querySelector("table");
          const tbody = table && table.querySelector("tbody");
          if (!tbody) return 0;
          const n = rows.length;
          const H = wrap.clientHeight - parseFloat(getComputedStyle(wrap).paddingTop) - 0.5;
          // the widest «room word + number» in the list, measured as printed
          const plCells = [...tbody.querySelectorAll("td.pl .fit")].filter((f) => !f.querySelector(".wr"));
          const writeIn = rows.some((r) => !r.place);
          const plNeed = () =>
            plCells.reduce((m, f) => {
              let w = 0;
              for (const c of f.children) {
                const cs = getComputedStyle(c);
                w += (c.classList.contains("rw") ? natW(c) : c.getBoundingClientRect().width) + parseFloat(cs.marginLeft) + parseFloat(cs.marginRight);
              }
              return Math.max(m, w);
            }, 0) + 1.3 * MM;
          const widestTo = rows.reduce((m, r) => Math.max(m, dinner(r.table).length), 1);
          const tableW = table.getBoundingClientRect().width;
          const nameWs = rows.map((r) => r.name.trim());
          // two lines: the best place to break (at a space or after a hyphen) at the size f
          const splitW = (t, f) => {
            let best = Infinity;
            for (let i = 1; i < t.length; i += 1) {
              if (t[i] !== " " && t[i - 1] !== "-") continue;
              best = Math.min(best, Math.max(textW(t.slice(0, i).trimEnd(), 700, f), textW(t.slice(i).trimStart(), 700, f)));
            }
            return best;
          };
          // how wide the name column must be for every name to stay at full size on one line or –
          // on a tall row – on two lines half a point under the most the row allows (least: every
          // name at the smallest size, on one line or two)
          const nameNeed = (dh, dfs, least) => {
            if (!nameWs.length) return 22 * MM;
            return (
              Math.max(
                18 * MM,
                ...nameWs.map((t) => {
                  const twoPt = (dh * MM - 0.2 * MM) / (twoEm(t) * PT);
                  const f2 = twoPt < FLOOR ? 0 : least ? FLOOR : Math.max(FLOOR, Math.min(dfs, twoPt) - 0.5);
                  return Math.min(textW(t, 700, least ? FLOOR : dfs), f2 ? splitW(t, f2) : Infinity);
                }),
              ) +
              1.6 * MM
            );
          };
          // the widest «room word + number» at a given size
          const plCache = new Map();
          const plAt = (f) => {
            const k = f.toFixed(2);
            if (!plCache.has(k)) {
              door.style.setProperty("--plfs", `${k}pt`);
              plCache.set(k, plNeed());
            }
            return plCache.get(k);
          };
          const apply = (dh, bh) => {
            const dfs = Math.max(7, Math.min(10.5, dh * 1.62));
            door.style.setProperty("--dh", `${dh.toFixed(2)}mm`);
            door.style.setProperty("--dfs", `${dfs.toFixed(2)}pt`);
            door.style.setProperty("--bh", `${bh.toFixed(2)}mm`);
            const bx = Math.max(3.4, Math.min(6, dh - 0.55));
            door.style.setProperty("--bx", `${bx.toFixed(2)}mm`);
            door.style.setProperty("--kw", `${(bx + 1.3).toFixed(2)}mm`);
            const tpt = Math.max(7, dfs * 0.8);
            door.style.setProperty("--pxw", `${(Math.max(textW(T("Pers", "Ppl"), 700, 8), textW("88", 400, dfs)) / MM + 1.4).toFixed(2)}mm`);
            door.style.setProperty("--tw", `${(Math.max(textW(T("Tid", "Time"), 700, 8), textW("17:45", 400, tpt)) / MM + 1.4).toFixed(2)}mm`);
            const toPt = dfs * 1.1;
            door.style.setProperty("--tow", `${(Math.max(textW(`→ ${T("Bord", "Table")}`, 700, 8), textW("D 88".slice(0, Math.max(2, widestTo + 1)), 800, toPt)) / MM + 1.6).toFixed(2)}mm`);
            // the salon: one size for every row, set by the longest room word. The names come first
            // (the door searches for them): every name at full size, or on a tall row two lines half
            // a point under the most the row allows. The salon gets the rest: 8 pt up to the names'
            // size – and on a quiet night down to the names' floor when that saves a name from being cut.
            const fixedW = (4.2 + bx + 1.3) * MM + ["--pxw", "--tw", "--tow"].reduce((n, v) => n + parseFloat(door.style.getPropertyValue(v)) * MM, 0);
            const avail = tableW - fixedW;
            const wantName = nameNeed(dh, dfs, false);
            const plTop = Math.min(30 * MM, plAt(Math.min(10, dfs)));
            const plGood = Math.min(plTop, plAt(Math.min(8, dfs)));
            let plMax = Math.min(plTop, Math.max(plGood, avail - wantName));
            const minName = nameNeed(dh, dfs, true);
            if (QUIET && avail - plMax < minName && avail - plAt(FLOOR) >= minName) plMax = Math.max(plAt(FLOOR), avail - minName);
            let plfs = Math.floor(Math.min(10, dfs) * 4) / 4;
            door.style.setProperty("--plfs", `${plfs.toFixed(2)}pt`);
            while (plfs > 7 && plNeed() > plMax) {
              plfs -= 0.25;
              door.style.setProperty("--plfs", `${plfs.toFixed(2)}pt`);
            }
            // a party with no salon yet: room to write «Atheneum 4» by hand
            const plW = Math.max(textW(T("Plass", "Place"), 700, 8) + 1.2 * MM, Math.min(plMax, plNeed()), writeIn ? Math.min(22 * MM, Math.max(12 * MM, avail - wantName)) : 12 * MM);
            door.style.setProperty("--plw", `${(plW / MM).toFixed(2)}mm`);
          };
          const walkHere = Boolean(door.querySelector(".wk"));
          const ptr = door.querySelector(".walk-ptr");
          const used = () =>
            table.getBoundingClientRect().height +
            (walkHere ? walkRight.getBoundingClientRect().height : 0) +
            (ptr ? ptr.getBoundingClientRect().height + parseFloat(getComputedStyle(ptr).marginTop) : 0);
          let dh = 7.6;
          let bh = 6.4;
          for (let i = 0; i < 60; i += 1) {
            bh = Math.max(5.6, Math.min(6.6, dh));
            apply(dh, bh);
            const over = used() + (walkHere ? 5 * bh * MM : 0) - H;
            if (over <= 0 || dh <= 3.5) break;
            dh -= Math.max(0.05, Math.min(0.5, over / MM / Math.max(1, n) - 0.01));
            dh = Math.max(3.5, dh);
          }
          // the rest of the box: lines for walk-ins, at least five
          if (walkHere) {
            if (used() + 5 * bh * MM > H) {
              bh = Math.max(4.6, (H - used()) / MM / 5 - 0.05);
              apply(dh, bh);
            }
            addBlanks(false, Math.max(5, Math.floor((H - used()) / (bh * MM))));
          }
          // names: one line if it fits; on tall rows two lines; then smaller; cut last
          const dhPx = dh * MM;
          const dfs = parseFloat(getComputedStyle(door).getPropertyValue("--dfs")) || 9;
          for (const td of tbody.querySelectorAll("td.nm")) {
            const gn = td.querySelector(".gn");
            if (!gn) continue;
            td.classList.remove("two");
            td.style.fontSize = "";
            // a party with no salon place has its diet beside its name: in words, else as codes, else
            // not at all – the name is what the door looks for, so it never shrinks for the diet
            const marks = () => [...td.querySelectorAll(".dw, .k")];
            for (const m of marks()) {
              const w = document.createElement("i");
              w.className = "dw";
              w.dataset.k = m.dataset.k;
              w.textContent = MARKS[m.dataset.k] ? dietWord(m.dataset.k) : "";
              m.replaceWith(w);
            }
            if (isCut(gn) && marks().length) {
              for (const m of marks()) {
                const k = document.createElement("span");
                k.className = "k";
                k.dataset.k = m.dataset.k;
                k.textContent = MARKS[m.dataset.k] ? MARKS[m.dataset.k][0] : "?";
                m.replaceWith(k);
              }
              if (isCut(gn)) for (const m of marks()) m.style.display = "none";
            }
            if (!isCut(gn)) continue;
            // the biggest size that fits on one line
            let f1 = dfs;
            const room = gn.getBoundingClientRect().width;
            const one = () => textW(gn.textContent, 700, f1) <= room - 0.5;
            while (f1 > FLOOR && !one()) f1 = Math.max(FLOOR, f1 - 0.25);
            const fits1 = one();
            // two lines, if the row is tall enough
            let f2 = 0;
            let fits2 = false;
            const twoMax = (dhPx - 0.15 * MM) / (twoEmOf(td) * PT);
            if (twoMax >= FLOOR) {
              // the row as it stands (a thick rule above it adds a little): two lines must not make it taller
              const rowH = td.getBoundingClientRect().height;
              td.classList.add("two");
              f2 = Math.min(dfs, twoMax);
              const ok2 = () => gn.scrollHeight <= gn.clientHeight + 1 && td.getBoundingClientRect().height <= rowH + 0.1 && gn.scrollWidth <= gn.clientWidth;
              td.style.fontSize = `${f2}pt`;
              while (f2 > FLOOR && !ok2()) {
                f2 = Math.max(FLOOR, f2 - 0.25);
                td.style.fontSize = `${f2}pt`;
              }
              fits2 = ok2();
            }
            // two lines only when they are clearly bigger than one line (or one line is cut)
            if (fits2 && (!fits1 || f2 >= f1 + 0.75)) {
              td.style.fontSize = `${f2}pt`;
            } else if (fits1 || twoMax < FLOOR) {
              td.classList.remove("two");
              td.style.fontSize = `${f1}pt`;
              // canvas and page may differ by a hair: then one more small step
              while (f1 > FLOOR && isCut(gn)) {
                f1 = Math.max(FLOOR, f1 - 0.25);
                td.style.fontSize = `${f1}pt`;
              }
            } else {
              // too long for anything: two lines at the smallest size, cut at the end of the second
              td.style.fontSize = `${FLOOR}pt`;
            }
          }
          return dh;
        }

        // ---- legend: plain words, only what is on the page ----
        function buildLegend() {
          // [text, how much it matters]: on a crowded day the least needed go first
          const leg = [];
          if (seen.busy) leg.push([`<span class="sw busy"></span>${T("opptatt", "taken")}`, 5]);
          if (seen.free) leg.push([`<span class="sw"></span>${T("ledig", "free")}`, 5]);
          if (seen.res) leg.push([`<span class="sw res"></span>${T("reservert", "reserved")}`, 4]);
          const ex = rows.map((r) => items.get(r.place)).find((hit) => hit && hit.it.label);
          if (seen.chip && ex) leg.push([`${esc(roomWord(ex.room))} <span class="chip">${esc(ex.it.label)}</span> = ${esc(ex.room.name)}, ${T("bord", "table")} ${esc(ex.it.label)}`, 2]);
          const dom = rows.map((r) => dinner(r.table)).find((t) => /^D \S/.test(t));
          if (dom) leg.push([`<b>${esc(dom)}</b> = Domino, ${T("bord", "table")} ${esc(dom.slice(2))}`, 3]);
          if (seen.wr) leg.push([`<span class="sw wr"></span>${T("skriv inn", "write in")}`, 4]); // the dashed lines need it
          const codes = [...seen.codes].filter((k) => MARKS[k]);
          if (codes.length) leg.push([codes.map((k) => `<span class="k">${esc(MARKS[k][0])}</span>&nbsp;${esc(dietWord(k))}`).join(" &nbsp;"), 6]);
          const el = $("legend");
          const draw = (list) => {
            el.innerHTML = list.map(([h]) => `<span>${h}</span>`).join("") || "&nbsp;";
          };
          let list = leg.slice();
          draw(list);
          // one line: tighter gaps, then the least needed words go
          let gap = 4;
          el.style.gap = `${gap}mm`;
          while (el.scrollWidth > el.clientWidth + 1 && gap > 2.5) {
            gap -= 0.5;
            el.style.gap = `${gap}mm`;
          }
          while (el.scrollWidth > el.clientWidth + 1 && list.length > 1) {
            const low = list.reduce((m, x) => (x[1] < m[1] ? x : m), list[0]);
            list = list.filter((x) => x !== low);
            draw(list);
          }
        }

        function layout() {
          const run = (f, ...a) => {
            try {
              return f(...a);
            } catch (e) {
              return null; /* a sheet with odd data still prints what it has */
            }
          };
          seen.codes = new Set();
          widths.clear(); // fonts may have arrived since the last run
          // the walk-ins go under the guest list – unless the names then get too cramped for a
          // 5 mm tick box: then under the salons, taking the room from the maps and white space
          run(putWalk, false);
          run(fitRooms);
          const dh = run(fitDoor);
          if (rows.length && typeof dh === "number" && dh < 5.65) {
            run(putWalk, true);
            walkLeft.style.setProperty("--bh", "6mm");
            run(addBlanks, true, 5);
            const fit = run(fitRooms);
            if (fit && fit.rh >= 5) {
              const more = Math.min(8, Math.floor((fit.left - 0.5 * MM) / (6 * MM)));
              if (more > 0) {
                run(addBlanks, true, more);
                run(fitRooms);
              }
              run(fitDoor);
            } else {
              run(putWalk, false);
              run(fitRooms);
              run(fitDoor);
            }
          }
          run(fitMaps);
          run(fitRoomNames);
          run(buildLegend);
        }
        buildLegend();
        layout();
        try {
          if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
        } catch (e) {
          /* no font api */
        }
        window.addEventListener("resize", layout);
        window.addEventListener("beforeprint", layout);
      }
    