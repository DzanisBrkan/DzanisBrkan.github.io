/* Portfolio v2 — vanilla JS, no dependencies */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Nav: background on scroll, mobile menu, active link ---------- */
  const nav = $('.nav');
  const toggle = $('.nav__toggle');
  const links = $('#nav-links');
  const onScrollNav = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    nav.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      links.classList.remove('open');
      nav.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  const navLinks = $$('a', links);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => spy.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        const el = en.target;
        el.classList.add('is-visible'); revealer.unobserve(el);
        setTimeout(() => { el.style.transitionDelay = ''; }, 1200); // keep hover/tilt instant afterwards
      }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el, i) => {
    // small stagger for siblings revealed together
    el.style.transitionDelay = (el.parentElement.children.length > 1 ? (i % 4) * 80 : 0) + 'ms';
    revealer.observe(el);
  });

  /* ---------- 2. Typing role text ---------- */
  const words = ['React apps.', 'hall plans.', 'Angular apps.', 'clean designs.'];
  const typer = $('.typer__text');
  if (reduceMotion) {
    typer.textContent = words[0];
  } else {
    let w = 0, i = 0, deleting = false;
    const tick = () => {
      const word = words[w];
      i += deleting ? -1 : 1;
      typer.textContent = word.slice(0, i);
      let delay = deleting ? 35 : 75;
      if (!deleting && i === word.length) { deleting = true; delay = 1700; }
      else if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; delay = 300; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 600);
  }

  /* ---------- 4. Count-up stats ---------- */
  const counter = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target, end = +el.dataset.count;
      counter.unobserve(el);
      if (reduceMotion) { el.textContent = end; return; }
      const dur = 1400, t0 = performance.now();
      const step = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => counter.observe(el));

  /* ---------- 3. Timeline that draws itself on scroll ---------- */
  const timeline = $('.timeline');
  const jobs = $$('.job', timeline);
  const updateTimeline = () => {
    const r = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = reduceMotion ? 1 : Math.min(Math.max((vh * 0.65 - r.top) / r.height, 0), 1);
    timeline.style.setProperty('--progress', p.toFixed(4));
    const reach = p * r.height;
    jobs.forEach((job) => job.classList.toggle('lit', job.offsetTop + 30 <= reach + 1));
  };
  let tlQueued = false;
  window.addEventListener('scroll', () => {
    if (tlQueued) return;
    tlQueued = true;
    requestAnimationFrame(() => { updateTimeline(); tlQueued = false; });
  }, { passive: true });
  window.addEventListener('resize', updateTimeline);
  updateTimeline();

  /* ---------- 1. Interactive hall plan (canvas) ---------- */
  const canvas = $('.hero__plan');
  const hero = $('.hero');
  const ctx = canvas.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const triplet = (name) => css.getPropertyValue(name).split(',').map((n) => +n.trim());
  const COL_A = triplet('--plan-a'), COL_B = triplet('--plan-b'), INK = triplet('--plan-ink');
  const GLOW_FILL = +css.getPropertyValue('--plan-fill') || 0.45;
  let W = 0, H = 0, dpr = 1, booths = [], hall = null, aisles = [], visitors = [];
  let start = performance.now(), running = false, lastPulse = 0;
  const mouse = { x: -9999, y: -9999 };

  // Booth layouts for a 4×2 block, in grid units: [col, row, width, height]
  const PATTERNS = [
    [[0,0,1,1],[1,0,1,1],[2,0,1,1],[3,0,1,1],[0,1,1,1],[1,1,1,1],[2,1,1,1],[3,1,1,1]],
    [[0,0,2,1],[2,0,1,1],[3,0,1,1],[0,1,1,1],[1,1,1,1],[2,1,2,1]],
    [[0,0,2,2],[2,0,1,1],[3,0,1,1],[2,1,2,1]],
    [[0,0,1,1],[1,0,1,1],[2,0,2,2],[0,1,2,1]],
    [[0,0,4,2]],
    [[0,0,1,2],[1,0,2,1],[3,0,1,1],[1,1,1,1],[2,1,1,1],[3,1,1,1]],
  ];
  const WEIGHTS = [3, 3, 2, 2, 1, 2];
  const pickPattern = () => {
    let r = Math.random() * WEIGHTS.reduce((a, b) => a + b, 0);
    for (let i = 0; i < PATTERNS.length; i++) { r -= WEIGHTS[i]; if (r <= 0) return PATTERNS[i]; }
    return PATTERNS[0];
  };

  function buildPlan() {
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const u = Math.max(40, Math.min(70, W / 20));      // one booth unit
    const aisle = Math.round(u * 0.7);
    const blockW = 4 * u, blockH = 2 * u;
    const margin = 36;
    const cols = Math.max(1, Math.floor((W - margin * 2 + aisle) / (blockW + aisle)));
    const rows = Math.max(1, Math.floor((H - margin * 2 + aisle) / (blockH + aisle)));
    const planW = cols * blockW + (cols - 1) * aisle;
    const planH = rows * blockH + (rows - 1) * aisle;
    const ox = W - planW - margin, oy = (H - planH) / 2;   // anchor right, the text sits left
    hall = { x: ox - 18, y: oy - 18, w: planW + 36, h: planH + 36 };

    booths = []; aisles = [];
    const originX = W, originY = 0;
    const maxD = Math.hypot(W, H);
    let n = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bx = ox + c * (blockW + aisle), by = oy + r * (blockH + aisle);
        for (const [pc, pr, pw, ph] of pickPattern()) {
          const x = bx + pc * u + 3, y = by + pr * u + 3, w = pw * u - 6, h = ph * u - 6;
          const d = Math.hypot(x + w / 2 - originX, y + h / 2 - originY) / maxD;
          booths.push({
            x, y, w, h,
            delay: d * 1800 + Math.random() * 250 + 300,
            color: Math.random() < 0.28 ? COL_B : COL_A,
            heat: 0, pulse: 0,
            label: String.fromCharCode(65 + r) + (n++),
          });
        }
      }
      n = 1;
    }
    // horizontal aisles (between block rows) for the walking visitors
    for (let r = 0; r < rows - 1; r++) aisles.push(oy + (r + 1) * blockH + r * aisle + aisle / 2);
    if (!aisles.length) aisles.push(oy - 9);
    visitors = reduceMotion ? [] : Array.from({ length: Math.min(4, aisles.length + 2) }, (_, i) => ({
      y: aisles[i % aisles.length],
      x: hall.x + Math.random() * hall.w,
      v: (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 22),
    }));
    start = performance.now();
  }

  // Stroke the first `f` (0..1) of a rectangle's outline
  function partialRect(x, y, w, h, f) {
    const per = 2 * (w + h);
    let len = per * f;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segs = [[x + w, y, w], [x + w, y + h, h], [x, y + h, w], [x, y, h]];
    let px = x, py = y;
    for (const [tx, ty, sl] of segs) {
      if (len <= 0) break;
      const k = Math.min(len / sl, 1);
      ctx.lineTo(px + (tx - px) * k, py + (ty - py) * k);
      len -= sl; px = tx; py = ty;
    }
    ctx.stroke();
  }

  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  let lastT = performance.now();

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    const t = reduceMotion ? 1e9 : now - start;
    ctx.clearRect(0, 0, W, H);

    // hall outline
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = rgba(INK, 0.16);
    partialRect(hall.x, hall.y, hall.w, hall.h, Math.min(t / 1400, 1));

    // ambient pulses so something happens without a cursor
    if (!reduceMotion && now - lastPulse > 650 && t > 2200) {
      lastPulse = now;
      const b = booths[(Math.random() * booths.length) | 0];
      if (b) b.pulse = 1;
    }

    ctx.font = '600 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const b of booths) {
      const p = Math.min(Math.max((t - b.delay) / 700, 0), 1);
      if (p <= 0) continue;
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const d = Math.hypot(mouse.x - cx, mouse.y - cy);
      const target = Math.max(0, 1 - d / 160);
      b.heat += (target - b.heat) * Math.min(dt * 8, 1);
      b.pulse = Math.max(0, b.pulse - dt * 0.9);
      const glow = Math.max(b.heat, b.pulse * 0.8);

      if (glow > 0.01) {
        ctx.fillStyle = rgba(b.color, glow * GLOW_FILL);
        ctx.shadowColor = rgba(b.color, glow);
        ctx.shadowBlur = 24 * glow;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.shadowBlur = 0;
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = glow > 0.05 ? rgba(b.color, 0.25 + glow * 0.7) : rgba(INK, 0.2);
      partialRect(b.x, b.y, b.w, b.h, p);

      if (p === 1 && b.w > 34) {
        ctx.fillStyle = rgba(INK, 0.14 + glow * 0.75);
        ctx.fillText(b.label, cx, cy);
      }
    }

    // visitors walking the aisles
    if (t > 2000) {
      for (const v of visitors) {
        v.x += v.v * dt;
        if (v.x < hall.x) { v.x = hall.x; v.v *= -1; }
        if (v.x > hall.x + hall.w) { v.x = hall.x + hall.w; v.v *= -1; }
        ctx.beginPath();
        ctx.fillStyle = rgba(COL_B, 0.95);
        ctx.shadowColor = rgba(COL_B, 1);
        ctx.shadowBlur = 12;
        ctx.arc(v.x, v.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // cursor spotlight
    if (mouse.x > -999) {
      const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 220);
      g.addColorStop(0, rgba(COL_A, 0.14));
      g.addColorStop(1, rgba(COL_A, 0));
      ctx.fillStyle = g;
      ctx.fillRect(mouse.x - 220, mouse.y - 220, 440, 440);
    }

    requestAnimationFrame(frame);
  }

  const setRunning = (on) => {
    if (on === running) return;
    running = on;
    if (on) { lastT = performance.now(); requestAnimationFrame(frame); }
  };

  hero.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

  new IntersectionObserver(([en]) => setRunning(en.isIntersecting && !document.hidden)).observe(hero);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setRunning(false);
    else if (hero.getBoundingClientRect().bottom > 0) setRunning(true);
  });

  let rz;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    // ignore height-only changes (mobile address bar) so the plan doesn't redraw
    rz = setTimeout(() => { if (canvas.getBoundingClientRect().width !== W) buildPlan(); }, 200);
  });

  buildPlan();

  /* ---------- 7a. Scroll progress bar ---------- */
  const bar = $('.progress');
  const updateBar = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };
  window.addEventListener('scroll', updateBar, { passive: true });
  updateBar();

  /* ---------- 7b. Background tone shifts between sections ---------- */
  const tones = {};
  for (let i = 1; i <= 4; i++) tones[i] = css.getPropertyValue('--tone-' + i).trim();
  const toneSpy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) document.body.style.backgroundColor = tones[en.target.dataset.tone] || '';
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  $$('section[data-tone]').forEach((s) => toneSpy.observe(s));

  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (finePointer && !reduceMotion) {
    /* ---------- 7c. Cursor glow ---------- */
    const glow = $('.cursor-glow');
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, glowing = false;
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!glowing) { glowing = true; glow.classList.add('on'); requestAnimationFrame(moveGlow); }
    }, { passive: true });
    document.addEventListener('pointerleave', () => glow.classList.remove('on'));
    document.addEventListener('pointerenter', () => glow.classList.add('on'));
    function moveGlow() {
      gx += (tx - gx) * 0.15; gy += (ty - gy) * 0.15;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(moveGlow);
    }

    /* ---------- 7d. Magnetic buttons ---------- */
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.classList.add('pulled');
        el.style.transform = `translate(${dx * 0.3}px, ${dy * 0.4}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.classList.remove('pulled');
        el.style.transform = '';
      });
    });

    /* ---------- 6. Tilt cards ---------- */
    $$('.tilt').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.classList.add('tilting');
        card.style.setProperty('--ry', ((px - 0.5) * 10).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - py) * 10).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }
})();
