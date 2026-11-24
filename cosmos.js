(() => {
  const canvas = document.querySelector('#cosmos-canvas');
  const hero = canvas?.closest('.hero');
  const context = canvas?.getContext('2d', { alpha: true });
  if (!canvas || !hero || !context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const random = (min, max) => min + Math.random() * (max - min);
  const particles = [];
  const stars = [];
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, active: false, down: false, burst: 0 };
  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;
  let radiusX = 0;
  let radiusY = 0;
  let frame = 0;
  let elapsed = 0;
  let previousTime = 0;

  function createField() {
    particles.length = 0;
    stars.length = 0;

    const count = Math.max(780, Math.min(1500, Math.round(width * height / 560)));
    for (let index = 0; index < count; index += 1) {
      const angle = random(0, Math.PI * 2);
      const spread = (Math.random() + Math.random() + Math.random() - 1.5) * 16;
      const warm = Math.random() > 0.29;
      particles.push({
        angle,
        spread,
        size: Math.random() > 0.965 ? random(1.1, 2.1) : random(.32, 1.1),
        alpha: random(.18, .8),
        phase: random(0, Math.PI * 2),
        speed: random(.008, .024),
        x: Number.NaN,
        y: Number.NaN,
        vx: 0,
        vy: 0,
        warm
      });
    }

    const starCount = Math.max(70, Math.min(150, Math.round(width * height / 6500)));
    for (let index = 0; index < starCount; index += 1) {
      const x = random(8, width - 8);
      const y = random(8, height - 8);
      stars.push({
        x,
        y,
        homeX: x,
        homeY: y,
        vx: 0,
        vy: 0,
        size: Math.random() > .94 ? random(1.1, 1.8) : random(.35, .95),
        alpha: random(.12, .58),
        phase: random(0, Math.PI * 2),
        warm: Math.random() > .45
      });
    }
  }

  function ellipsePoint(angle, spread = 0) {
    const x = Math.cos(angle) * radiusX;
    const y = Math.sin(angle) * radiusY;
    const normalLength = Math.hypot(Math.cos(angle) / radiusX, Math.sin(angle) / radiusY) || 1;
    const normalX = (Math.cos(angle) / radiusX) / normalLength;
    const normalY = (Math.sin(angle) / radiusY) / normalLength;
    const followX = pointer.active && !pointer.down ? (pointer.x - centerX) * .2 : 0;
    const followY = pointer.active && !pointer.down ? (pointer.y - centerY) * .16 : 0;
    return {
      x: centerX + followX + x + normalX * spread,
      y: centerY + followY + y + normalY * spread
    };
  }

  function drawSpark(x, y, size, tint) {
    const glow = context.createRadialGradient(x, y, 0, x, y, size * 8);
    glow.addColorStop(0, tint);
    glow.addColorStop(.16, tint.replace(/, [\d.]+\)$/, ', .32)'));
    glow.addColorStop(1, 'rgba(255, 239, 204, 0)');
    context.fillStyle = glow;
    context.beginPath();
    context.arc(x, y, size * 8, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = tint;
    context.globalAlpha = .7;
    context.lineWidth = .7;
    context.beginPath();
    context.moveTo(x - size * 5, y);
    context.lineTo(x + size * 5, y);
    context.moveTo(x, y - size * 5);
    context.lineTo(x, y + size * 5);
    context.stroke();
    context.globalAlpha = 1;
    context.fillStyle = '#fffdf7';
    context.beginPath();
    context.arc(x, y, size * .72, 0, Math.PI * 2);
    context.fill();
  }

  function render(time = 0, frameScale = 1) {
    context.clearRect(0, 0, width, height);
    pointer.x += (pointer.targetX - pointer.x) * .035;
    pointer.y += (pointer.targetY - pointer.y) * .035;
    pointer.burst *= .978;

    for (const star of stars) {
      const dx = star.x - pointer.x;
      const dy = star.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const strength = pointer.down ? 1 : pointer.active ? .68 : pointer.burst;
      if (distance < 118 && distance > .1 && strength > .01) {
        const force = (1 - distance / 118) ** 2 * strength * 5.6 * frameScale;
        star.vx += dx / distance * force;
        star.vy += dy / distance * force;
      }
      star.vx += (star.homeX - star.x) * .025 * frameScale;
      star.vy += (star.homeY - star.y) * .025 * frameScale;
      star.vx *= .86 ** frameScale;
      star.vy *= .86 ** frameScale;
      star.x += star.vx * frameScale;
      star.y += star.vy * frameScale;
      const alpha = star.alpha * (.74 + Math.sin(time * .0014 + star.phase) * .26);
      context.globalAlpha = alpha;
      context.fillStyle = star.warm ? '#fff1d6' : '#c8d9ee';
      context.beginPath();
      context.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;

    for (const particle of particles) {
      const angle = particle.angle + elapsed * particle.speed;
      const point = ellipsePoint(angle, particle.spread);
      if (!Number.isFinite(particle.x)) {
        particle.x = point.x;
        particle.y = point.y;
      }

      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const interactionRadius = 142;
      const strength = pointer.down ? 1 : pointer.active ? .68 : pointer.burst;
      if (distance < interactionRadius && distance > .1 && strength > .01) {
        const force = (1 - distance / interactionRadius) ** 2 * strength * 6.5 * frameScale;
        particle.vx += dx / distance * force;
        particle.vy += dy / distance * force;
      }

      particle.vx += (point.x - particle.x) * .018 * frameScale;
      particle.vy += (point.y - particle.y) * .018 * frameScale;
      particle.vx *= .88 ** frameScale;
      particle.vy *= .88 ** frameScale;
      particle.x += particle.vx * frameScale;
      particle.y += particle.vy * frameScale;

      const pulse = .66 + Math.sin(time * .0016 + particle.phase) * .34;
      context.globalAlpha = particle.alpha * pulse;
      context.fillStyle = particle.warm ? '#ffe8bc' : '#dcecff';
      if (particle.size > 1.5) {
        context.shadowColor = particle.warm ? 'rgba(255, 224, 172, .9)' : 'rgba(216, 233, 255, .9)';
        context.shadowBlur = 8;
        const tangentX = -Math.sin(angle);
        const tangentY = Math.cos(angle);
        context.beginPath();
        context.moveTo(particle.x - tangentX * particle.size * 4, particle.y - tangentY * particle.size * 4);
        context.lineTo(particle.x, particle.y);
        context.strokeStyle = context.fillStyle;
        context.lineWidth = particle.size * .7;
        context.stroke();
      }
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    }
    context.globalAlpha = 1;

    const featuredStar = ellipsePoint(-1.13 + elapsed * .025, 0);
    drawSpark(featuredStar.x, featuredStar.y, 2.8, 'rgba(255, 239, 203, .96)');

    const flare = ellipsePoint(1.8 + elapsed * .025, 0);
    drawSpark(flare.x, flare.y, Math.max(2, Math.min(3.2, width * .0023)), 'rgba(222, 238, 255, .92)');
  }

  function animate(timestamp) {
    if (document.hidden || reducedMotion) return;
    let frameScale = 1;
    if (previousTime) {
      const delta = Math.min((timestamp - previousTime) / 1000, .04);
      elapsed += delta;
      frameScale = delta * 60;
    }
    previousTime = timestamp;
    render(timestamp, frameScale);
    frame = window.requestAnimationFrame(animate);
  }

  function resize() {
    const bounds = hero.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    centerX = width * .5;
    centerY = height * .51;
    radiusX = width * .47;
    radiusY = height * .38;
    createField();
    render();
    if (!reducedMotion && !document.hidden) {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(animate);
    }
  }

  if (!reducedMotion) {
    hero.addEventListener('pointermove', (event) => {
      const bounds = hero.getBoundingClientRect();
      pointer.targetX = event.clientX - bounds.left;
      pointer.targetY = event.clientY - bounds.top;
      pointer.active = event.pointerType !== 'touch' || pointer.down;
    }, { passive: true });
    hero.addEventListener('pointerdown', (event) => {
      const bounds = hero.getBoundingClientRect();
      pointer.targetX = event.clientX - bounds.left;
      pointer.targetY = event.clientY - bounds.top;
      pointer.down = true;
      pointer.active = true;
      pointer.burst = 1;
    }, { passive: true });
    hero.addEventListener('pointerup', (event) => {
      pointer.down = false;
      pointer.active = event.pointerType !== 'touch';
      pointer.burst = 1;
    }, { passive: true });
    hero.addEventListener('pointercancel', () => {
      pointer.down = false;
      pointer.active = false;
      pointer.burst = 1;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      pointer.down = false;
      pointer.active = false;
      pointer.burst = Math.max(pointer.burst, .65);
    }, { passive: true });
  }

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.cancelAnimationFrame(frame);
      previousTime = 0;
    } else if (!reducedMotion) {
      frame = window.requestAnimationFrame(animate);
    }
  });
  resize();
})();
