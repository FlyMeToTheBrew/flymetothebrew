/* =========================================================
   HOURS: edit here if the stand's hours change.
   Index 0 = Sunday ... 6 = Saturday. Each entry is a list of
   [open, close] in 24h decimal hours (9.5 = 9:30 AM), Orlando time.
   null = closed. The hero card, the floating button and the
   hours list on the page all read from this one object.
   ========================================================= */
const HOURS = {
  0: null,
  1: [[6, 11]],
  2: [[6, 11]],
  3: [[9.5, 19]],
  4: [[9.5, 19]],
  5: [[9.5, 13], [16, 19]],
  6: [[8, 14]],
};
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SLIDE_MS = 1500;   // the hero slider changes every 1.5 seconds

(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Phone number is never in the page source in plain form: each digit is
  // shifted by 5 (mod 10, so the same shift decodes it) and rebuilt here.
  // Keeps simple scrapers that regex raw HTML for phone patterns from finding it.
  const decodePhone = e => e.split('').map(c => (+c + 5) % 10).join('');
  document.querySelectorAll('[data-phone]').forEach(el => {
    const d = decodePhone(el.getAttribute('data-phone'));
    if (el.hasAttribute('data-phone-link')) el.setAttribute('href', 'tel:+1' + d);
    if (el.hasAttribute('data-phone-text')) el.textContent = '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
  });

  // ---------- phone menu ----------
  const burger = document.getElementById('burger'), mnav = document.getElementById('mnav');
  const setMenu = open => {
    mnav.hidden = !open; document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', () => setMenu(mnav.hidden));
  addEventListener('keydown', e => { if (e.key === 'Escape'){ setMenu(false); closeCall(); } });
  addEventListener('resize', () => { if (innerWidth > 860) setMenu(false); });

  // ---------- every in-page link scrolls to its section (below the sticky header) ----------
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2 && !a.classList.contains('logo')) return;   // "#" placeholders are filled by the phone decoder
    e.preventDefault();
    setMenu(false);
    const t = id.length < 2 ? null : document.querySelector(id);
    const y = t ? t.getBoundingClientRect().top + scrollY - (t.id === 'hero' ? 0 : 64) : 0;
    scrollTo({top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth'});
  });

  // ---------- Call buttons: phones dial; computers get a small card with the number ----------
  const callbox = document.getElementById('callbox');
  const canDial = matchMedia('(pointer:coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const closeCall = () => { callbox.hidden = true; };
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-phone-link]');
    if (!a || canDial || a.closest('#callbox')) return;
    e.preventDefault(); setMenu(false); callbox.hidden = false;
    document.getElementById('cb-hint').textContent = 'On a computer? Copy it, or open this page on your phone and tap Call.';
    document.getElementById('cb-copy').focus();
  });
  callbox.addEventListener('click', e => { if (e.target === callbox || e.target.closest('[data-close]')) closeCall(); });
  document.getElementById('cb-copy').addEventListener('click', async () => {
    const num = document.getElementById('cb-num').textContent, h = document.getElementById('cb-hint');
    try { await navigator.clipboard.writeText(num); h.textContent = 'Copied ' + num + '. Paste it into your phone.'; }
    catch { const r = document.createRange(); r.selectNodeContents(document.getElementById('cb-num')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); h.textContent = 'Number selected. Press Ctrl/Cmd+C to copy it.'; }
  });

  // header: background on scroll, hides scrolling down, shows scrolling up
  const top = document.getElementById('top');
  const setHH = () => document.documentElement.style.setProperty('--hh', top.classList.contains('hide') ? '0px' : top.offsetHeight + 'px');
  setHH();
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    top.classList.toggle('scrolled', y > 20);
    top.classList.toggle('hide', y > 400 && y > lastY);
    setHH();
    lastY = y;
  }, {passive:true});

  // hero carousel: centre drink + big word change together, every SLIDE_MS
  const hero = document.getElementById('hero');
  const stage = document.getElementById('stage');
  const prods = [...stage.querySelectorAll('.prod')], words = [...stage.querySelectorAll('.w')], dots = document.getElementById('dots');
  const curEl = document.getElementById('cur'), nameEl = document.getElementById('slide-name');
  const n = prods.length; let cur = 0, auto, swiped = false;
  const go = k => {
    cur = (k + n) % n;
    prods.forEach((p, i) => {
      let d = i - cur; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
      p.dataset.pos = Math.max(-2, Math.min(2, d));
      p.tabIndex = d === 0 ? -1 : 0;
    });
    words.forEach((w, i) => w.classList.toggle('on', i === cur));
    // re-trigger the little timer fill inside the active dot
    [...dots.children].forEach((b, i) => {
      b.setAttribute('aria-current', i === cur);
      const t = b.querySelector('.tick'); t.style.animation = 'none'; if (i === cur){ void t.offsetWidth; t.style.animation = ''; }
    });
    curEl.textContent = String(cur + 1).padStart(2, '0');
    nameEl.textContent = words[cur].textContent;
  };
  // always auto-rotating; a click or swipe just restarts the timer
  const play = () => { clearInterval(auto); if (!reduce) auto = setInterval(() => go(cur + 1), SLIDE_MS); };
  prods.forEach((p, i) => {
    p.addEventListener('click', () => { if (swiped) return; if (i !== cur){ go(i); play(); } });
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', words[i].textContent);
    b.innerHTML = '<i class="tick"></i>';
    b.onclick = () => { go(i); play(); };
    dots.appendChild(b);
  });
  go(0); play();
  // stop spinning the carousel while the tab is hidden (saves battery)
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearInterval(auto); else play(); });

  // swipe / drag left-right to change drink, plus arrow keys
  let sx = 0, sy = 0, dx = 0, down = false;
  hero.addEventListener('pointerdown', e => {
    if (e.target.closest('a, .dots') || (e.pointerType === 'mouse' && e.button !== 0)) return;
    down = true; swiped = false; sx = e.clientX; sy = e.clientY; dx = 0;
  });
  addEventListener('pointermove', e => {
    if (!down) return;
    dx = e.clientX - sx;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - sy)){
      swiped = true; hero.classList.add('dragging');
      stage.style.setProperty('--drag', dx * .6 + 'px');
    }
  });
  const end = () => {
    if (!down) return;
    down = false; hero.classList.remove('dragging'); stage.style.setProperty('--drag', '0px');
    if (swiped && Math.abs(dx) > 45){ go(cur + (dx < 0 ? 1 : -1)); play(); }
    setTimeout(() => swiped = false, 0);
  };
  addEventListener('pointerup', end); addEventListener('pointercancel', end);
  hero.addEventListener('dragstart', e => e.preventDefault());
  addEventListener('keydown', e => {
    if (scrollY > innerHeight * .6) return;
    if (e.key === 'ArrowRight'){ go(cur + 1); play(); }
    if (e.key === 'ArrowLeft'){ go(cur - 1); play(); }
  });

  // ---------- open now / hours (always read in Orlando time) ----------
  const nowET = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {timeZone:'America/New_York', weekday:'short', hour:'numeric', minute:'numeric', hour12:false}).formatToParts(new Date()).map(x => [x.type, x.value]));
    const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(p.weekday);
    return {day, t: (+p.hour % 24) + (+p.minute) / 60};
  };
  const fmt = h => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60), ap = hh >= 12 ? 'PM' : 'AM'; return ((hh + 11) % 12 + 1) + (mm ? ':' + String(mm).padStart(2, '0') : '') + ' ' + ap; };
  const nb = t => t.replace(/ /g, '\u00a0');   // never break "4 PM" across lines
  const spans = d => HOURS[d] ? HOURS[d].map(([a, b]) => nb(fmt(a) + ' – ' + fmt(b))).join('<br>') : 'Closed';
  const status = () => {
    const {day, t} = nowET();
    for (const [a, b] of (HOURS[day] || [])){
      if (t >= a && t < b) return {open:true, line:'Open now', sub:'until ' + fmt(b)};
      if (t < a) return {open:false, line:'Opens today', sub:'at ' + fmt(a)};
    }
    for (let i = 1; i <= 7; i++){
      const d = (day + i) % 7;
      if (HOURS[d]) return {open:false, line:'Closed now', sub:'opens ' + (i === 1 ? 'tomorrow' : DAYS[d]) + ' ' + fmt(HOURS[d][0][0])};
    }
    return {open:false, line:'Closed', sub:''};
  };
  const paintStatus = () => {
    const s = status(), card = document.getElementById('open-card'), of = document.getElementById('order-float');
    card.classList.toggle('closed', !s.open);
    const big = s.sub ? s.sub.charAt(0).toUpperCase() + s.sub.slice(1) : 'Inside the YMCA lobby';
    card.querySelector('.td-text').innerHTML = `<small>${s.line}</small><b>${big}</b><span>Inside the YMCA lobby · tap for hours</span>`;
    of.classList.toggle('is-closed', !s.open);
    document.getElementById('cb-status').textContent = s.line + (s.sub ? ' · ' + s.sub : '') + ' · inside the YMCA lobby';
    document.getElementById('of-status').textContent = s.line + (s.sub ? ' · ' + s.sub : '');
  };
  paintStatus(); setInterval(paintStatus, 60000);

  // ---------- 1. departures board: the hours as split-flap rows, built from HOURS ----------
  const FD = 60;                                  // one half-flip, in ms
  const h24 = h => { const m = Math.round(h * 60); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  const put = (c, ch) => { c._c = ch; for (const i of c.children) i.textContent = ch; c.classList.toggle('blank', ch === ' '); };
  const mkCell = () => { const c = document.createElement('span'); c.className = 'fc blank'; c.innerHTML = '<i class="a"></i><i class="b"></i><i class="ft"></i><i class="fb"></i>'; c._c = ' '; return c; };
  const mkGroup = (n, cls) => { const g = document.createElement('span'); g.className = 'g ' + (cls || ''); for (let i = 0; i < n; i++) g.appendChild(mkCell()); return g; };
  // flip one character: the top flap falls, the new bottom flap swings down behind it
  const flip = (c, ch) => {
    if (c._c === ch) return;
    if (reduce){ put(c, ch); return; }
    if (c._busy){ c._want = ch; return; }
    const [a, b, ft, fb] = c.children, old = c._c;
    a.textContent = ch; fb.textContent = ch; ft.textContent = old; b.textContent = old;
    c.classList.remove('blank', 'go'); void c.offsetWidth; c.classList.add('go'); c._busy = true;
    setTimeout(() => {
      put(c, ch); c.classList.remove('go'); c._busy = false;
      const w = c._want; c._want = null; if (w != null && w !== c._c) flip(c, w);
    }, FD * 2 + 20);
  };
  // write a word into a group of cells; letters/digits spin through a few random ones first
  const setText = (g, text, anim, delay = 0) => {
    const chars = text.padEnd(g.children.length, ' ').slice(0, g.children.length).split('');
    [...g.children].forEach((c, i) => {
      const ch = chars[i];
      if (!anim || reduce){ put(c, ch); return; }
      if (!/[A-Z0-9]/.test(ch)){ setTimeout(() => flip(c, ch), delay + i * 20); return; }
      const pool = /\d/.test(ch) ? '0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let k = 0; const steps = 3 + (i * 5 + 3) % 5;
      const tick = () => { if (k++ < steps){ flip(c, pool[Math.random() * pool.length | 0]); setTimeout(tick, FD * 2 + 25); } else flip(c, ch); };
      setTimeout(tick, delay + i * 22);
    });
  };

  const hoursEl = document.getElementById('hours'), srEl = document.getElementById('hours-sr'), clockEl = document.getElementById('dep-clock');
  const flights = [];
  [1, 2, 3, 4, 5, 6, 0].forEach(d => HOURS[d] ? HOURS[d].forEach(([a, b]) => flights.push({d, a, b})) : flights.push({d}));
  const depStatus = (f, now) => {
    if (f.a == null) return 'CANCELLED';
    if (f.d !== now.day || now.t < f.a) return 'ON TIME';
    return now.t < f.b ? 'BOARDING' : 'DEPARTED';
  };
  clockEl.appendChild(mkGroup(5)); const clockG = clockEl.firstChild;
  flights.forEach(f => {
    const r = document.createElement('div'); r.className = 'dep-row';
    const tm = document.createElement('div'); tm.className = 'tm';
    f.dy = mkGroup(3, 'dy'); f.tg = mkGroup(11); f.st = mkGroup(9, 'st');
    f.t12 = document.createElement('small'); f.t12.className = 't12';
    tm.append(f.tg, f.t12); r.append(f.dy, tm, f.st); hoursEl.appendChild(r); f.row = r;
  });
  let boardOn = false;
  const paintBoard = (anim, stagger) => {
    const now = nowET();
    clockG.parentNode && setText(clockG, h24(now.t), anim);
    srEl.innerHTML = '';
    flights.forEach((f, i) => {
      const s = depStatus(f, now), base = stagger ? i * 150 : 0;
      f.row.dataset.s = s.toLowerCase().replace(' ', '');
      f.row.classList.toggle('is-today', f.d === now.day);
      f.t12.textContent = f.a == null ? 'Closed all day' : nb(fmt(f.a) + ' – ' + fmt(f.b));
      setText(f.dy, DAYS[f.d].slice(0, 3).toUpperCase(), anim, base);
      setText(f.tg, f.a == null ? '——' : h24(f.a) + '–' + h24(f.b), anim, base + 60);
      setText(f.st, s, anim, base + 260);
      const li = document.createElement('li');
      li.textContent = DAYS[f.d] + ': ' + (f.a == null ? 'closed' : fmt(f.a) + ' to ' + fmt(f.b)) + ', ' + s.toLowerCase() + (f.d === now.day ? ' (today)' : '');
      srEl.appendChild(li);
    });
  };
  if (reduce){ boardOn = true; paintBoard(false); }
  else new IntersectionObserver((es, o) => { if (es[0].isIntersecting){ o.disconnect(); boardOn = true; paintBoard(true, true); } }, {threshold:.2}).observe(document.getElementById('dep'));
  // statuses (boarding / departed) and the clock keep up with the real time
  setInterval(() => { if (boardOn && !document.hidden) paintBoard(true, false); }, 20000);


  // ---------- 2. hot / iced flip cards (the switch flips every card at once) ----------
  const fcards = [...document.querySelectorAll('.flipcard')], tsw = document.getElementById('tempswitch');
  const setFlip = (card, on) => {
    card.classList.toggle('flipped', on);
    const [fr, bk] = card.querySelectorAll('.face');
    fr.toggleAttribute('inert', on); bk.toggleAttribute('inert', !on);
    fr.setAttribute('aria-hidden', on); bk.setAttribute('aria-hidden', !on);
  };
  const syncSwitch = () => {
    const n = fcards.filter(c => c.classList.contains('flipped')).length;
    tsw.querySelector('[data-temp="hot"]').setAttribute('aria-pressed', n === 0);
    tsw.querySelector('[data-temp="iced"]').setAttribute('aria-pressed', n === fcards.length);
  };
  fcards.forEach(card => {
    setFlip(card, false);
    card.addEventListener('click', e => {
      if (e.target.closest('a') || String(getSelection()).length) return;
      setFlip(card, !card.classList.contains('flipped')); syncSwitch();
    });
  });
  tsw.addEventListener('click', e => {
    const b = e.target.closest('[data-temp]'); if (!b) return;
    fcards.forEach(c => setFlip(c, b.dataset.temp === 'iced')); syncSwitch();
  });
  // a little peek the first time each card scrolls in, so people know it flips
  if (!reduce){
    const peekIO = new IntersectionObserver((es, o) => es.forEach(e => {
      if (!e.isIntersecting) return; o.unobserve(e.target);
      setTimeout(() => {
        if (e.target.classList.contains('flipped')) return;
        e.target.classList.add('peek');
        e.target.firstElementChild.addEventListener('animationend', () => e.target.classList.remove('peek'), {once:true});
      }, 900);
    }), {threshold:.6});
    fcards.forEach(c => peekIO.observe(c));
  }

  // reveal on entering the viewport
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  }), {threshold:.15, rootMargin:'0px 0px -6% 0px'});
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

  // ---------- 4. a plane that flies as you scroll and lands at "Find us" ----------
  const fl = document.getElementById('flight'), flPlane = document.getElementById('fl-plane'), flPin = document.getElementById('fl-pin'), flRect = document.getElementById('fl-rect');
  const findUs = document.getElementById('find-us');
  let stops = [];                                  // the Hours / Menu stops, filled in below
  let narrow = innerWidth <= 560;
  const waveY = x => (narrow ? 19 : 23) + (narrow ? 4 : 6) * Math.sin(x / 70);
  let fx0 = 22, fx1 = 300, flRaf = 0;
  const buildFlight = () => {
    narrow = innerWidth <= 560; fx0 = 40; fx1 = Math.max(fx0 + 60, flPin.getBoundingClientRect().left - 40);
    let d = '';
    for (let x = fx0; x <= fx1 + 4; x += 6) d += (d ? 'L' : 'M') + x.toFixed(1) + ' ' + waveY(x).toFixed(2);
    ['fl-ol', 'fl-dots', 'fl-done'].forEach(id => document.getElementById(id).setAttribute('d', d));
  };
  const flyNow = () => {
    flRaf = 0;
    const endY = Math.max(1, findUs.getBoundingClientRect().top + scrollY - 70), p = Math.min(1, Math.max(0, scrollY / endY));
    const x = fx0 + p * (fx1 - fx0), y = waveY(x), ang = Math.atan2(waveY(x + 3) - waveY(x - 3), 6) * 180 / Math.PI;
    flPlane.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${ang.toFixed(1)}deg)`;
    flRect.setAttribute('width', x.toFixed(1));
    fl.classList.toggle('landed', p > .985);
    fl.classList.toggle('show', scrollY > 90);
    stops.forEach(st => {
      const top = st.el.getBoundingClientRect().top + scrollY - 90, sp = Math.min(1, Math.max(0, top / endY)), sx = fx0 + sp * (fx1 - fx0);
      st.a.style.left = sx.toFixed(1) + 'px'; st.a.style.top = waveY(sx).toFixed(1) + 'px';
      st.a.classList.toggle('hit', scrollY >= top - 4);
    });
  };
  const flyQ = () => { if (!flRaf) flRaf = requestAnimationFrame(flyNow); };
  addEventListener('scroll', flyQ, {passive:true});
  addEventListener('resize', () => { buildFlight(); flyQ(); });
  addEventListener('load', () => { buildFlight(); flyNow(); });
  buildFlight(); flyNow();

  // ---------- 5. fly-through: layers drift at different speeds, cloud banks slide past, plane stops light up ----------
  const parEls = [...document.querySelectorAll('[data-par]')], scrEls = [...document.querySelectorAll('[data-scroll]')], bands = [...document.querySelectorAll('.cloudband')];
  const stopsEl = document.getElementById('fl-stops');
  stops = [['departures', 'Hours'], ['menu', 'Menu']].map(([id, label]) => {
    const a = document.createElement('a'); a.className = 'fl-stop'; a.href = '#' + id; a.tabIndex = -1; a.innerHTML = '<span>' + label + '</span>';
    stopsEl.appendChild(a); return {a, el: document.getElementById(id)};
  });
  let bases = [], vh = innerHeight, pw = 1;
  const measure = () => {
    vh = innerHeight; pw = innerWidth <= 760 ? .55 : 1;
    parEls.forEach(e => e.style.translate = '');
    bases = parEls.map(e => { const r = e.getBoundingClientRect(); return r.top + scrollY + r.height / 2; });
  };
  const flythrough = () => {
    const y = scrollY;
    if (reduce) return;
    parEls.forEach((e, i) => {
      const d = bases[i] - (y + vh / 2);
      if (Math.abs(d) > vh * 1.3) return;
      e.style.translate = '0 ' + (d * +e.dataset.par * pw).toFixed(1) + 'px';
    });
    if (y < vh * 1.3) scrEls.forEach(e => {
      e.style.translate = '0 ' + (y * +e.dataset.scroll * pw).toFixed(1) + 'px';
      e.style.scale = (1 - Math.min(y / vh, 1) * .08).toFixed(3);
    });
    bands.forEach(b => { const t = b.getBoundingClientRect().top - vh / 2; if (Math.abs(t) < vh) b.style.setProperty('--cx', (t * .35).toFixed(1)); });
  };
  let flyRaf = 0;
  const flyQ2 = () => { if (!flyRaf) flyRaf = requestAnimationFrame(() => { flyRaf = 0; flythrough(); }); };
  addEventListener('scroll', flyQ2, {passive:true});
  addEventListener('resize', () => { measure(); flyQ2(); });
  addEventListener('load', () => { measure(); flythrough(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); flythrough(); });
  measure(); flythrough(); flyQ();

  if (reduce) document.querySelectorAll('.map svg').forEach(s => s.pauseAnimations());
  // floating call button: shows once you scroll past the hero, hides over the footer
  const of = document.getElementById('order-float'), foot = document.querySelector('.foot');
  const ofUpdate = () => {
    const pastHero = scrollY > innerHeight * .7;
    const footerVisible = foot.getBoundingClientRect().top < innerHeight - 40;
    of.classList.toggle('show', pastHero && !footerVisible);
  };
  addEventListener('scroll', ofUpdate, {passive:true}); addEventListener('resize', ofUpdate); ofUpdate();

  document.getElementById('yr').textContent = new Date().getFullYear();
})();
