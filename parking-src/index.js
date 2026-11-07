try {
    (() => {
        const __$$app$$__ = __$$hmAppManager$$__.currentApp;
        const __$$module$$__ = __$$app$$__.current;
        const h = new DeviceRuntimeCore.WidgetFactory(new DeviceRuntimeCore.HmDomApi(__$$app$$__, __$$module$$__));
        // «Парковка» — Amazfit Active 2. Цифры времени из машин; перед сменой минуты водители идут к машинам.
        const C = 233, STEP = 50, R = 20, WALK = 46;
        const DX = [38, 140, 250, 352], ROWS = [169, 233, 297], VY = [201, 265];
        const CORR = [25, 127, 339, 441], VDIR = [-1, 1, -1, 1];
        const SEGS = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
        const ORDER = 'agdfbec';
        const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
        const NCOL = 4, NJACKET = 4, NMEN = 14;

        function halfH(x) { const d = x - C; return Math.sqrt(Math.max(0, C * C - d * d)); }
        function segInfo(d, s) {
            const x0 = DX[d];
            if (s === 'a') return { t: 'h', x: x0 + 38, y: ROWS[0] };
            if (s === 'g') return { t: 'h', x: x0 + 38, y: ROWS[1] };
            if (s === 'd') return { t: 'h', x: x0 + 38, y: ROWS[2] };
            if (s === 'f') return { t: 'v', x: x0 + 9, y: VY[0], up: true };
            if (s === 'b') return { t: 'v', x: x0 + 67, y: VY[0], up: true };
            if (s === 'e') return { t: 'v', x: x0 + 9, y: VY[1], up: false };
            return { t: 'v', x: x0 + 67, y: VY[1], up: false };
        }
        function parkedH(d, i) {
            if (i.t === 'h') return CORR[d] > i.x ? 0 : Math.PI;
            return i.up ? Math.PI / 2 : -Math.PI / 2;
        }

        // ---------- пути ----------
        function Path() { this.p = []; this.len = 0; }
        Path.prototype.add = function (x, y) {
            const p = this.p;
            if (p.length) { const q = p[p.length - 1]; if (Math.abs(x - q.x) + Math.abs(y - q.y) < 0.5) return this; }
            p.push({ x: x, y: y, s: 0, h: 0 }); return this;
        };
        Path.prototype.line = function (x0, y0, x1, y1) {
            const n = Math.max(2, Math.ceil(Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)) / 3));
            for (let i = 0; i <= n; i++) this.add(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n);
            return this;
        };
        Path.prototype.done = function () {
            const p = this.p; let s = 0;
            for (let i = 0; i < p.length; i++) {
                if (i) { const dx = p[i].x - p[i - 1].x, dy = p[i].y - p[i - 1].y; s += Math.sqrt(dx * dx + dy * dy); }
                p[i].s = s;
                const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
                p[i].h = Math.atan2(b.y - a.y, b.x - a.x);
            }
            this.len = s; return this;
        };
        Path.prototype.at = function (s) {
            const p = this.p;
            if (s < 0) s = 0; if (s > this.len) s = this.len;
            let lo = 0, hi = p.length - 1;
            while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p[m].s < s) lo = m; else hi = m; }
            const a = p[lo], b = p[hi], t = (b.s - a.s) ? (s - a.s) / (b.s - a.s) : 0;
            let dh = b.h - a.h; if (dh > Math.PI) dh -= 2 * Math.PI; if (dh < -Math.PI) dh += 2 * Math.PI;
            return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, h: a.h + dh * t };
        };
        Path.prototype.reversed = function () {
            const P = new Path(); for (let i = this.p.length - 1; i >= 0; i--) P.add(this.p[i].x, this.p[i].y); return P.done();
        };
        function exitPathH(d, i) {
            const cx = CORR[d], v = VDIR[d], sg = cx > i.x ? 1 : -1, y = i.y;
            const P = new Path(); P.line(i.x, y, cx - sg * R, y);
            const ccx = cx - sg * R, ccy = y + v * R;
            for (let k = 0; k <= 12; k++) { const th = k / 12 * Math.PI / 2; P.add(ccx + sg * R * Math.sin(th), ccy - v * R * Math.cos(th)); }
            P.line(cx, y + v * R, cx, C + v * (halfH(cx) + 40));
            return P.done();
        }
        function vEdgeY(i) { return i.up ? C - (halfH(i.x) + 40) : C + (halfH(i.x) + 40); }
        function routeOut(d, i) { return i.t === 'h' ? exitPathH(d, i) : new Path().line(i.x, i.y, i.x, vEdgeY(i)).done(); }
        function walkToDoor(d, i) {
            const P = routeOut(d, i), W = new Path();
            for (let k = P.p.length - 1; k >= 0; k--) { if (P.p[k].s < 27) break; W.add(P.p[k].x, P.p[k].y); }
            const hh = parkedH(d, i);
            W.add(i.x + 3 * Math.cos(hh) + 15 * Math.sin(hh), i.y + 3 * Math.sin(hh) - 15 * Math.cos(hh));
            return W.done();
        }
        const EIN = function (t) { return t * t; };
        const EOUT = function (t) { return 1 - Math.pow(1 - t, 2.4); };
        const EIO = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };

        // ---------- часы ----------
        function sensor(id) { try { return hmSensor.createSensor(id); } catch (e) { return null; } }
        let ts = null, lastSec = -1, subMs = 0, fakeNow = 0;
        function nowMs() {
            try { const n = Date.now(); if (typeof n === 'number' && n > 0) return n; } catch (e) {}
            return fakeNow;
        }
        function curDigits() { const hh = ts.hour, mm = ts.minute; return [Math.floor(hh / 10), hh % 10, Math.floor(mm / 10), mm % 10]; }
        function nextDigits() {
            let hh = ts.hour, mm = ts.minute + 1; if (mm >= 60) { mm = 0; hh = (hh + 1) % 24; }
            return [Math.floor(hh / 10), hh % 10, Math.floor(mm / 10), mm % 10];
        }
        function updSub() {
            if (ts.second !== lastSec) { lastSec = ts.second; subMs = 0; } else subMs = Math.min(subMs + STEP, 980);
            if (ts.utc) subMs = ts.utc % 1000;
        }
        function msToNext() { return (59 - ts.second) * 1000 + (1000 - subMs); }

        // ---------- виджеты ----------
        let NL, AL;
        const slots = [], men = [], aodCars = [];
        let shown = [-1, -1, -1, -1], plannedKey = '';
        let dateT, aodDateT, secDot, pSigns = [], pOn = -1, clockTimer = null;

        function deg(r) { let a = Math.round(r * 180 / Math.PI) % 360; if (a < 0) a += 360; return a; }
        function slotOf(d, s) { return slots[d * 7 + ORDER.indexOf(s)]; }
        function carShow(sl, v) { if (sl.vis !== v) { sl.w.setProperty(hmUI.prop.VISIBLE, v); sl.vis = v; } }
        function carPut(sl, x, y, r, st) {
            const src = 'car_' + sl.col + '_' + st + '.png', X = Math.round(x) - 64, Y = Math.round(y) - 64, a = deg(r);
            const key = X + ',' + Y + ',' + a + ',' + src;
            if (key === sl.key) return; sl.key = key;
            sl.w.setProperty(hmUI.prop.MORE, { x: X, y: Y, w: 128, h: 128, pos_x: 0, pos_y: 28, center_x: 64, center_y: 64, angle: a, src: src });
        }
        function park(sl, st) { carPut(sl, sl.i.x, sl.i.y, sl.hp, st || 'park'); carShow(sl, true); }
        function rcol() { return Math.floor(Math.random() * NCOL); }

        function clearMen() { for (let k = 0; k < men.length; k++) { const m = men[k]; if (m.on) { m.on = false; m.w.setProperty(hmUI.prop.VISIBLE, false); m.vis = false; } } }
        function resetFlags(sl) { sl.ready = false; sl.coming = false; sl.readyAt = 0; sl.doorUntil = 0; }

        function placeAll(ds) {
            clearMen();
            for (let k = 0; k < slots.length; k++) {
                const sl = slots[k]; sl.anim = null; resetFlags(sl);
                sl.present = SEGS[ds[sl.d]].indexOf(sl.s) >= 0;
                if (sl.present) { sl.col = rcol(); park(sl); } else carShow(sl, false);
            }
            shown = ds.slice(); plannedKey = '';
        }
        function finishAll() {
            for (let k = 0; k < slots.length; k++) {
                const sl = slots[k]; if (!sl.anim) continue;
                if (sl.anim.arrive) { sl.present = true; park(sl); } else { sl.present = false; carShow(sl, false); }
                sl.anim = null; resetFlags(sl);
            }
        }

        function changeTo(ds, now) {
            finishAll();
            for (let d = 0; d < 4; d++) {
                const val = ds[d]; if (shown[d] === val) continue;
                const oldS = shown[d] < 0 ? '' : SEGS[shown[d]], newS = SEGS[val], v = VDIR[d];
                const rowOf = { a: 0, g: 1, d: 2 };
                const hOut = [], hIn = [];
                for (let k = 0; k < 3; k++) {
                    const s = 'agd'[k], was = oldS.indexOf(s) >= 0, will = newS.indexOf(s) >= 0;
                    if (was && !will) hOut.push(s); if (!was && will) hIn.push(s);
                }
                const ord = function (p, q) { return v < 0 ? rowOf[p] - rowOf[q] : rowOf[q] - rowOf[p]; };
                hOut.sort(ord); hIn.sort(ord);
                let t = now + Math.random() * 200, lastOutEnd = now;
                for (let k = 0; k < hOut.length; k++) {
                    const sl = slotOf(d, hOut[k]); if (!sl.present) continue;
                    const P = exitPathH(d, sl.i), dur = 0.5 + P.len / 170;
                    const tt = Math.max(t, sl.readyAt + 350);
                    sl.anim = { start: tt, arrive: false, ph: [{ path: P, s0: 0, s1: P.len, dur: dur, e: EIN }] };
                    lastOutEnd = tt + dur * 550; t = tt + 520;
                }
                let ta = Math.max(now + 500, lastOutEnd);
                for (let k = 0; k < hIn.length; k++) {
                    const sl = slotOf(d, hIn[k]), i = sl.i, P = exitPathH(d, i), cx = CORR[d], stopY = i.y + v * (R + 12);
                    const F = new Path().line(cx, C - v * (halfH(cx) + 40), cx, stopY).done();
                    let sStop = 0;
                    for (let q = 0; q < P.p.length; q++) { const p = P.p[q]; if ((v < 0 && p.y <= stopY) || (v > 0 && p.y >= stopY)) { sStop = p.s; break; } }
                    sl.col = rcol(); resetFlags(sl);
                    sl.anim = { start: ta, arrive: true, ph: [
                        { path: F, s0: 0, s1: F.len, dur: 0.6 + F.len / 190, e: EOUT },
                        { pause: 0.25 },
                        { path: P, s0: sStop, s1: 0, dur: 0.9 + sStop / 55, e: EIO, rev: true }] };
                    ta += 900;
                }
                for (let k = 0; k < 4; k++) {
                    const s = 'fbec'[k], was = oldS.indexOf(s) >= 0, will = newS.indexOf(s) >= 0, sl = slotOf(d, s), i = sl.i, ey = vEdgeY(i);
                    if (was && !will && sl.present) {
                        const P = new Path().line(i.x, i.y, i.x, ey).done();
                        sl.anim = { start: Math.max(now + Math.random() * 300, sl.readyAt + 350), arrive: false,
                            ph: [{ path: P, s0: 0, s1: P.len, dur: 0.6 + P.len / 95, e: EIN, flip: true, rev: true }] };
                    } else if (!was && will) {
                        const P = new Path().line(i.x, ey, i.x, i.y).done();
                        sl.col = rcol(); resetFlags(sl);
                        sl.anim = { start: now + 900 + Math.random() * 500, arrive: true,
                            ph: [{ path: P, s0: 0, s1: P.len, dur: 0.5 + P.len / 150, e: EOUT }] };
                    }
                }
            }
            shown = ds.slice();
        }

        function poseOf(an, now) {
            let t = (now - an.start) / 1000;
            if (t < 0) {
                if (an.arrive) return { hidden: true };
                const p0 = an.ph[0], q0 = p0.path.at(p0.s0);
                return { x: q0.x, y: q0.y, h: q0.h + (p0.flip ? Math.PI : 0), st: 'idle' };
            }
            for (let k = 0; k < an.ph.length; k++) {
                const ph = an.ph[k], dur = ph.pause !== undefined ? ph.pause : ph.dur;
                if (t < dur) {
                    if (ph.pause !== undefined) { const pv = an.ph[k - 1], q = pv.path.at(pv.s1); return { x: q.x, y: q.y, h: q.h, st: 'idle' }; }
                    const u = ph.e(t / dur), q = ph.path.at(ph.s0 + (ph.s1 - ph.s0) * u);
                    return { x: q.x, y: q.y, h: q.h + (ph.flip ? Math.PI : 0), st: ph.rev ? 'rev' : 'fwd' };
                }
                t -= dur;
            }
            return null;
        }

        // ---------- водители ----------
        function spawnMan(path, start, onEnd, now) {
            for (let k = 0; k < men.length; k++) {
                const m = men[k]; if (m.on) continue;
                m.on = true; m.path = path; m.start = start; m.dur = path.len / WALK; m.onEnd = onEnd;
                m.jk = Math.floor(Math.random() * NJACKET); m.key = ''; return true;
            }
            if (onEnd) onEnd(now);
            return false;
        }
        function driverTo(sl, arriveBy, now) {
            const W = walkToDoor(sl.d, sl.i), dur = W.len / WALK;
            const start = Math.max(now, arriveBy - dur * 1000 - 900);
            sl.coming = true; sl.readyAt = start + dur * 1000 + 500;
            spawnMan(W, start, function (t) { sl.doorUntil = t + 700; sl.ready = true; }, now);
        }
        function driverOut(sl, now) {
            sl.doorUntil = now + 1000;
            spawnMan(walkToDoor(sl.d, sl.i).reversed(), now + 450, null, now);
        }
        function updateMen(now) {
            for (let k = 0; k < men.length; k++) {
                const m = men[k]; if (!m.on) continue;
                const t = (now - m.start) / 1000;
                if (t >= m.dur) {
                    m.on = false; if (m.vis) { m.w.setProperty(hmUI.prop.VISIBLE, false); m.vis = false; }
                    if (m.onEnd) m.onEnd(now);
                    continue;
                }
                if (t < 0) { if (m.vis) { m.w.setProperty(hmUI.prop.VISIBLE, false); m.vis = false; } continue; }
                const q = m.path.at(m.path.len * t / m.dur), fr = Math.floor(t * 4) % 2;
                const src = 'man_' + m.jk + '_' + fr + '.png', X = Math.round(q.x) - 16, Y = Math.round(q.y) - 16, a = deg(q.h);
                const key = X + ',' + Y + ',' + a + ',' + src;
                if (key !== m.key) {
                    m.key = key;
                    m.w.setProperty(hmUI.prop.MORE, { x: X, y: Y, w: 32, h: 32, pos_x: 0, pos_y: 0, center_x: 16, center_y: 16, angle: a, src: src });
                }
                if (!m.vis) { m.w.setProperty(hmUI.prop.VISIBLE, true); m.vis = true; }
            }
        }
        function planDrivers(now) {
            const nd = nextDigits(), key = nd.join('');
            if (plannedKey === key) return; plannedKey = key;
            const arriveBy = now + msToNext();
            for (let d = 0; d < 4; d++) {
                if (shown[d] < 0 || shown[d] === nd[d]) continue;
                const a = SEGS[shown[d]], b = SEGS[nd[d]];
                for (let k = 0; k < a.length; k++) {
                    const s = a[k]; if (b.indexOf(s) >= 0) continue;
                    const sl = slotOf(d, s); if (sl.present && !sl.anim && !sl.coming) driverTo(sl, arriveBy, now);
                }
            }
        }

        // ---------- кадр ----------
        function updateDate() {
            if (!ts) return;
            const t = DAYS[((ts.week || 1) - 1 + 7) % 7] + ' · ' + String(ts.day).padStart(2, '0');
            dateT.setProperty(hmUI.prop.TEXT, t); aodDateT.setProperty(hmUI.prop.TEXT, t);
        }
        function updateAod() {
            if (!ts) return;
            const ds = curDigits();
            for (let k = 0; k < aodCars.length; k++) {
                const c = aodCars[k], v = SEGS[ds[c.d]].indexOf(c.s) >= 0;
                if (c.vis !== v) { c.w.setProperty(hmUI.prop.VISIBLE, v); c.vis = v; }
            }
            updateDate();
        }
        function tick() {
            if (!ts) return;
            fakeNow += STEP;
            updSub();
            const now = nowMs(), ds = curDigits();
            if (ds[0] !== shown[0] || ds[1] !== shown[1] || ds[2] !== shown[2] || ds[3] !== shown[3]) { changeTo(ds, now); updateDate(); }
            if (msToNext() < 6500) planDrivers(now);
            for (let k = 0; k < slots.length; k++) {
                const sl = slots[k];
                if (sl.anim) {
                    const p = poseOf(sl.anim, now);
                    if (p === null) {
                        const arrive = sl.anim.arrive; sl.anim = null; resetFlags(sl);
                        if (arrive) { sl.present = true; park(sl); driverOut(sl, now); }
                        else { sl.present = false; carShow(sl, false); }
                    } else if (p.hidden) carShow(sl, false);
                    else { carPut(sl, p.x, p.y, p.h, p.st); carShow(sl, true); }
                } else if (sl.present) {
                    park(sl, now < sl.doorUntil ? 'door' : (sl.ready ? 'idle' : 'park'));
                }
            }
            updateMen(now);
            const sec = (ts.second * 1000 + subMs) / 60000, an = sec * 2 * Math.PI - Math.PI / 2;
            secDot.setProperty(hmUI.prop.MORE, { x: Math.round(C + Math.cos(an) * 221) - 32, y: Math.round(C + Math.sin(an) * 221) - 32, w: 64, h: 64,
                pos_x: 0, pos_y: 0, center_x: 32, center_y: 32, angle: deg(an + Math.PI / 2), src: 'sec_car.png' });
            const on = Math.floor((ts.second * 1000 + subMs) / 500) % 2;
            if (on !== pOn) { pOn = on; for (let k = 0; k < pSigns.length; k++) pSigns[k].setProperty(hmUI.prop.SRC, on ? 'p_off.png' : 'p_on.png'); }
        }
        function snap() {
            if (!ts) return;
            finishAll(); clearMen();
            const ds = curDigits();
            if (ds.join('') !== shown.join('')) placeAll(ds);
            else { for (let k = 0; k < slots.length; k++) resetFlags(slots[k]); plannedKey = ''; }
            updateDate(); updateAod();
        }
        function replay() {
            if (!ts) return;
            finishAll(); clearMen();
            for (let k = 0; k < slots.length; k++) { const sl = slots[k]; sl.present = false; resetFlags(sl); carShow(sl, false); }
            shown = [-1, -1, -1, -1]; plannedKey = '';
            changeTo(curDigits(), nowMs());
        }
        function startClock() { if (!clockTimer) { tick(); clockTimer = timer.createTimer(0, STEP, tick); } }
        function stopClock() { if (clockTimer) { timer.stopTimer(clockTimer); clockTimer = null; } }

        __$$module$$__.module = DeviceRuntimeCore.WatchFace({
            init_view() {
                NL = hmUI.show_level.ONLY_NORMAL; AL = hmUI.show_level.ONAL_AOD;
                ts = sensor(hmSensor.id.TIME);
                hmUI.createWidget(hmUI.widget.IMG, { x: 0, y: 0, w: 466, h: 466, src: 'bg.png', show_level: NL });
                dateT = hmUI.createWidget(hmUI.widget.TEXT, { x: 133, y: 100, w: 200, h: 36, color: 0xe9e7e1, text_size: 26,
                    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V, text: '', show_level: NL });
                for (let k = 0; k < 2; k++) pSigns.push(hmUI.createWidget(hmUI.widget.IMG, { x: C - 10, y: VY[k] - 10, w: 20, h: 20, src: 'p_on.png', show_level: NL }));
                for (let d = 0; d < 4; d++) for (let k = 0; k < 7; k++) {
                    const s = ORDER[k], i = segInfo(d, s), hp = parkedH(d, i);
                    const w = hmUI.createWidget(hmUI.widget.IMG, { x: Math.round(i.x) - 64, y: Math.round(i.y) - 64, w: 128, h: 128,
                        pos_x: 0, pos_y: 28, center_x: 64, center_y: 64, angle: deg(hp), src: 'car_0_park.png', show_level: NL });
                    w.setProperty(hmUI.prop.VISIBLE, false);
                    slots.push({ d: d, s: s, i: i, hp: hp, w: w, vis: false, key: '', col: 0, present: false, anim: null,
                        ready: false, coming: false, readyAt: 0, doorUntil: 0 });
                }
                for (let k = 0; k < NMEN; k++) {
                    const w = hmUI.createWidget(hmUI.widget.IMG, { x: 0, y: 0, w: 32, h: 32, pos_x: 0, pos_y: 0, center_x: 16, center_y: 16,
                        angle: 0, src: 'man_0_0.png', show_level: NL });
                    w.setProperty(hmUI.prop.VISIBLE, false);
                    men.push({ w: w, on: false, vis: false, key: '' });
                }
                secDot = hmUI.createWidget(hmUI.widget.IMG, { x: C - 32, y: -20, w: 64, h: 64, pos_x: 0, pos_y: 0, center_x: 32, center_y: 32,
                    angle: 90, src: 'sec_car.png', show_level: NL });
                // касание двоеточия — машины съезжаются заново
                hmUI.createWidget(hmUI.widget.BUTTON, { x: C - 30, y: 170, w: 60, h: 126, text: '',
                    normal_src: 'transparent.png', press_src: 'transparent.png', show_level: NL, click_func: replay });

                aodDateT = hmUI.createWidget(hmUI.widget.TEXT, { x: 133, y: 100, w: 200, h: 36, color: 0x8d9098, text_size: 24,
                    align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V, text: '', show_level: AL });
                for (let d = 0; d < 4; d++) for (let k = 0; k < 7; k++) {
                    const s = ORDER[k], i = segInfo(d, s);
                    const w = hmUI.createWidget(hmUI.widget.IMG, { x: Math.round(i.x) - 24, y: Math.round(i.y) - 24, w: 48, h: 48,
                        pos_x: 0, pos_y: 12, center_x: 24, center_y: 24, angle: deg(parkedH(d, i)), src: 'aod_car.png', show_level: AL });
                    w.setProperty(hmUI.prop.VISIBLE, false);
                    aodCars.push({ d: d, s: s, w: w, vis: false });
                }

                hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, {
                    resume_call: function () {
                        snap();
                        if (hmSetting.getScreenType() == hmSetting.screen_type.AOD) stopClock(); else startClock();
                    },
                    pause_call: function () { stopClock(); }
                });
                if (ts && ts.addEventListener && ts.event && ts.event.MINUTEEND) ts.addEventListener(ts.event.MINUTEEND, function () { updateAod(); });
                if (ts) placeAll(curDigits());
                updateAod();
                startClock();
            },
            onInit() {}, build() { this.init_view(); }, onDestroy() { stopClock(); }
        });
    })();
} catch (e) { console.log('Mini Program Error', e); }
