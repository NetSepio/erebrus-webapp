// erebrus-globe.js — portable canvas globe from transformation/handover (prototype verbatim)

export const DEFAULT_NODES = [
  { id: 'fra', city: 'Frankfurt',     country: 'Germany',        cc: 'DE', lat: 50.1,  lng: 8.7,    ping: 18,  load: 42, access: 'Public'  },
  { id: 'ams', city: 'Amsterdam',     country: 'Netherlands',    cc: 'NL', lat: 52.4,  lng: 4.9,    ping: 24,  load: 31, access: 'Public'  },
  { id: 'lon', city: 'London',        country: 'United Kingdom', cc: 'GB', lat: 51.5,  lng: -0.1,   ping: 29,  load: 58, access: 'Public'  },
  { id: 'nyc', city: 'New York',      country: 'United States',  cc: 'US', lat: 40.7,  lng: -74.0,  ping: 88,  load: 67, access: 'Public'  },
  { id: 'sfo', city: 'San Francisco', country: 'United States',  cc: 'US', lat: 37.8,  lng: -122.4, ping: 142, load: 49, access: 'Public'  },
  { id: 'sgp', city: 'Singapore',     country: 'Singapore',      cc: 'SG', lat: 1.35,  lng: 103.8,  ping: 171, load: 38, access: 'Public'  },
  { id: 'tyo', city: 'Tokyo',         country: 'Japan',          cc: 'JP', lat: 35.7,  lng: 139.7,  ping: 198, load: 44, access: 'Public'  },
  { id: 'blr', city: 'Bangalore',     country: 'India',          cc: 'IN', lat: 12.97, lng: 77.6,   ping: 134, load: 72, access: 'Public'  },
  { id: 'syd', city: 'Sydney',        country: 'Australia',      cc: 'AU', lat: -33.9, lng: 151.2,  ping: 243, load: 21, access: 'Public'  },
  { id: 'gru', city: 'São Paulo',     country: 'Brazil',         cc: 'BR', lat: -23.5, lng: -46.6,  ping: 176, load: 29, access: 'Public'  },
  { id: 'jnb', city: 'Johannesburg',  country: 'South Africa',   cc: 'ZA', lat: -26.2, lng: 28.0,   ping: 211, load: 18, access: 'Public'  },
  { id: 'dxb', city: 'Dubai',         country: 'UAE',            cc: 'AE', lat: 25.2,  lng: 55.3,   ping: 119, load: 35, access: 'Private' },
];

function project(lat, lng, rr, rot) {
  const phi = (90 - lat) * Math.PI / 180;
  const th  = (lng + rot) * Math.PI / 180;
  return {
    x: rr * Math.sin(phi) * Math.cos(th),
    y: rr * Math.cos(phi),
    z: rr * Math.sin(phi) * Math.sin(th),
  };
}

function setupCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    canvas.width  = r.width  * dpr;
    canvas.height = r.height * dpr;
  };
  resize();
  window.addEventListener('resize', resize);
  return { dpr, resize };
}

export function createNodeGlobe(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  let nodes = opts.nodes ? opts.nodes.slice() : DEFAULT_NODES.slice();
  let selectedId = opts.selectedId || (nodes[0] && nodes[0].id);
  const getSelectedId = opts.getSelectedId || (() => selectedId);
  const aurora = opts.aurora !== false;
  let rot = 0, raf = 0, alive = true;
  const { dpr, resize } = setupCanvas(canvas);

  const draw = () => {
    if (!alive) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.38;

    for (let la = -80; la <= 80; la += 20) {
      for (let lo = 0; lo < 360; lo += 12) {
        const p = project(la, lo, R, rot);
        if (p.z <= -R * 0.15) continue;
        const sx = cx + p.x, sy = cy - p.y;
        const depth = (p.z + R) / (2 * R);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.1 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.04 + depth * 0.10})`;
        ctx.fill();
      }
    }

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = aurora ? 'rgba(255,126,68,0.18)' : 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    const selId = getSelectedId();
    const sel = nodes.find(n => n.id === selId) || nodes[0];

    nodes.forEach(n => {
      const p = project(n.lat, n.lng, R, rot);
      const front = p.z > -R * 0.15;
      const sx = cx + p.x, sy = cy - p.y;
      const isSel = sel && n.id === sel.id;
      if (!front && !isSel) return;
      const depth = Math.max(0, (p.z + R) / (2 * R));
      const baseA = front ? (0.5 + depth * 0.5) : 0.25;
      const rad = (isSel ? 4.5 : 2.6) * dpr;

      ctx.beginPath();
      ctx.arc(sx, sy, rad, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? `rgba(255,107,53,${baseA})` : `rgba(255,150,90,${baseA * 0.8})`;
      ctx.fill();

      if (isSel && front) {
        const pulse = (Math.sin(Date.now() / 350) + 1) / 2;
        ctx.beginPath();
        ctx.arc(sx, sy, rad + (4 + pulse * 7) * dpr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,107,53,${0.5 * (1 - pulse)})`;
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
        ctx.shadowBlur = 18 * dpr;
        ctx.shadowColor = 'rgba(255,107,53,0.9)';
        ctx.beginPath();
        ctx.arc(sx, sy, rad, 0, Math.PI * 2);
        ctx.fillStyle = '#FF6B35';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    rot += 0.12;
    raf = requestAnimationFrame(draw);
  };

  draw();

  return {
    setNodes(arr) { nodes = arr.slice(); },
    setSelected(id) { selectedId = id; },
    destroy() {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    },
  };
}

export function createHeroGlobe(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  let nodes = opts.nodes ? opts.nodes.slice() : DEFAULT_NODES.slice();
  const hubId = opts.hubId || 'fra';
  let rot = 0, raf = 0, alive = true;
  const { dpr, resize } = setupCanvas(canvas);

  const draw = () => {
    if (!alive) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.40;

    for (let la = -80; la <= 80; la += 18) {
      for (let lo = 0; lo < 360; lo += 10) {
        const p = project(la, lo, R, rot);
        if (p.z <= -R * 0.12) continue;
        const sx = cx + p.x, sy = cy - p.y;
        const depth = (p.z + R) / (2 * R);
        ctx.beginPath();
        ctx.arc(sx, sy, 1 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.03 + depth * 0.09})`;
        ctx.fill();
      }
    }
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,126,68,0.14)';
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    const pts = nodes.map(n => {
      const p = project(n.lat, n.lng, R, rot);
      return { n, sx: cx + p.x, sy: cy - p.y, front: p.z > -R * 0.12, depth: Math.max(0, (p.z + R) / (2 * R)) };
    });

    const hub = pts.find(q => q.n.id === hubId) || pts[0];
    pts.forEach(q => {
      if (q === hub || !(q.front && hub.front)) return;
      const mx = (q.sx + hub.sx) / 2, my = (q.sy + hub.sy) / 2 - R * 0.28;
      ctx.beginPath();
      ctx.moveTo(hub.sx, hub.sy);
      ctx.quadraticCurveTo(mx, my, q.sx, q.sy);
      ctx.strokeStyle = `rgba(255,107,53,${0.10 + q.depth * 0.10})`;
      ctx.lineWidth = 1 * dpr;
      ctx.stroke();
    });

    const t = Date.now() / 400;
    pts.forEach((q, i) => {
      if (!q.front) return;
      const pulse = (Math.sin(t + i) + 1) / 2;
      const a = 0.5 + q.depth * 0.5;
      const rad = 2.6 * dpr;
      ctx.beginPath();
      ctx.arc(q.sx, q.sy, rad + (2 + pulse * 5) * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,107,53,${0.35 * (1 - pulse) * a})`;
      ctx.lineWidth = 1.2 * dpr;
      ctx.stroke();
      ctx.shadowBlur = 10 * dpr;
      ctx.shadowColor = 'rgba(255,107,53,0.8)';
      ctx.beginPath();
      ctx.arc(q.sx, q.sy, rad, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,120,60,${a})`;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    rot += 0.10;
    raf = requestAnimationFrame(draw);
  };

  draw();

  return {
    setNodes(arr) { nodes = arr.slice(); },
    setSelected() {},
    destroy() {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    },
  };
}