(() => {
  const canvas = document.querySelector('#cosmos-canvas');
  const hero = canvas?.closest('.hero');
  const context = canvas?.getContext('2d', { alpha: true });
  if (!canvas || !hero || !context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const random = (min, max) => min + Math.random() * (max - min);
  const particles = [];
  const stars = [];
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
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
      const spread = (Math.random() + Math.random() + Math.random() - 1.5) * 10;
      const warm = Math.random() > 0.29;
      particles.push({
        angle,
        spread,
        size: Math.random() > 0.965 ? random(1.1, 2.1) : random(.32, 1.1),
        alpha: random(.18, .8),
        phase: random(0, Math.PI * 2),
        speed: random(-.014, .014),
        warm
      });
    }

    const starCount = Math.max(70, Math.min(150, Math.round(width * height / 6500)));
    for (let index = 0; index < starCount; index += 1) {
      stars.push({
        x: random(8, width - 8),
        y: random(8, height - 8),
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
    const tilt = pointer.y * .012;
    const tiltX = pointer.x * .01;
    return {
      x: centerX + x + normalX * spread + tiltX * y,
      y: centerY + y + normalY * spread - tilt * x
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

  function drawOrb(x, y, radius) {
    const halo = context.createRadialGradient(x, y, radius * .15, x, y, radius * 5.5);
    halo.addColorStop(0, 'rgba(255, 246, 218, .45)');
    halo.addColorStop(.18, 'rgba(255, 207, 132, .18)');
    halo.addColorStop(1, 'rgba(255, 194, 111, 0)');
    context.fillStyle = halo;
    context.beginPath();
    context.arc(x, y, radius * 5.5, 0, Math.PI * 2);
    context.fill();

    const sphere = context.createRadialGradient(x - radius * .32, y - radius * .38, radius * .04, x + radius * .12, y + radius * .12, radius * 1.2);
    sphere.addColorStop(0, '#fffdf4');
    sphere.addColorStop(.25, '#fff2d5');
    sphere.addColorStop(.58, '#f3d59f');
    sphere.addColorStop(.84, '#c69251');
    sphere.addColorStop(1, '#68442c');
    context.fillStyle = sphere;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = 'rgba(255, 247, 220, .7)';
    context.lineWidth = 1;
    context.shadowColor = 'rgba(255, 219, 164, .8)';
    context.shadowBlur = 16;
    context.stroke();
    context.shadowBlur = 0;
  }

  function render(time = 0) {
    context.clearRect(0, 0, width, height);
    pointer.x += (pointer.targetX - pointer.x) * .035;
    pointer.y += (pointer.targetY - pointer.y) * .035;

    for (const star of stars) {
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
      const pulse = .66 + Math.sin(time * .0016 + particle.phase) * .34;
      context.globalAlpha = particle.alpha * pulse;
      context.fillStyle = particle.warm ? '#ffe8bc' : '#dcecff';
      if (particle.size > 1.5) {
        context.shadowColor = particle.warm ? 'rgba(255, 224, 172, .9)' : 'rgba(216, 233, 255, .9)';
        context.shadowBlur = 8;
      }
      context.beginPath();
      context.arc(point.x, point.y, particle.size, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    }
    context.globalAlpha = 1;

    const orbAngle = -1.13 + elapsed * .025;
    const orb = ellipsePoint(orbAngle, 0);
    drawOrb(orb.x, orb.y, Math.max(16, Math.min(25, width * .019)));

    const flare = ellipsePoint(1.8 + elapsed * .025, 0);
    drawSpark(flare.x, flare.y, Math.max(2, Math.min(3.2, width * .0023)), 'rgba(222, 238, 255, .92)');
  }

  function animate(timestamp) {
    if (document.hidden || reducedMotion) return;
    if (previousTime) elapsed += Math.min((timestamp - previousTime) / 1000, .04);
    previousTime = timestamp;
    render(timestamp);
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
      pointer.targetX = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
      pointer.targetY = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      pointer.targetX = 0;
      pointer.targetY = 0;
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
