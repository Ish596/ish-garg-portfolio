(() => {
  const canvas = document.querySelector('#cosmos-canvas');
  const hero = document.querySelector('.hero');
  const context = canvas?.getContext('2d', { alpha: true });
  if (!canvas || !context) return;

  const ringCanvas = document.createElement('canvas');
  const ringContext = ringCanvas.getContext('2d', { alpha: true });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const random = (min, max) => min + Math.random() * (max - min);
  const colors = ['#fff8eb', '#f4dfb7', '#e3c386', '#ffffff'];
  const particles = [];
  const pointer = {
    x: 0, y: 0, lastX: 0, lastY: 0,
    dirX: 1, dirY: 0, active: false, down: false, hasPosition: false
  };
  let width = 0;
  let height = 0;
  let ringWidth = 0;
  let ringHeight = 0;
  let ringPixelRatio = 1;
  let elapsed = 0;
  let frame = 0;
  let previousTime = 0;

  function addParticle(x, y, vx, vy, life, size, color, streak = false) {
    particles.push({ x, y, vx, vy, age: 0, life, size, color, streak, phase: random(0, Math.PI * 2) });
    if (particles.length > 300) particles.splice(0, particles.length - 300);
  }

  function emitTrail(fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.hypot(dx, dy);
    if (distance < .8) return;

    pointer.dirX = dx / distance;
    pointer.dirY = dy / distance;
    const sideX = -pointer.dirY;
    const sideY = pointer.dirX;
    const steps = Math.max(1, Math.ceil(distance / 10));

    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      const x = fromX + dx * t;
      const y = fromY + dy * t;
      const strands = distance > 32 ? 2 : 1;
      for (let strand = 0; strand < strands; strand += 1) {
        const offset = random(-5, 5);
        const drift = random(.35, 1.65);
        addParticle(
          x + sideX * offset - pointer.dirX * random(0, 5),
          y + sideY * offset - pointer.dirY * random(0, 5),
          -pointer.dirX * drift + sideX * random(-.55, .55),
          -pointer.dirY * drift + sideY * random(-.55, .55),
          random(.42, .95), random(.55, 1.75), colors[Math.floor(random(0, colors.length))], Math.random() > .68
        );
      }
    }
  }

  function burst(x, y) {
    for (let index = 0; index < 48; index += 1) {
      const angle = random(0, Math.PI * 2);
      const speed = random(1.1, 5.2);
      addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        random(.38, .88), random(.7, 2), colors[Math.floor(random(0, colors.length))], Math.random() > .48);
    }
  }

  function drawFixedFlare(x, y, size, color) {
    const glow = ringContext.createRadialGradient(x, y, 0, x, y, size * 9);
    glow.addColorStop(0, color);
    glow.addColorStop(.18, color.replace(/, [\d.]+\)$/, ', .3)'));
    glow.addColorStop(1, 'rgba(255, 239, 204, 0)');
    ringContext.fillStyle = glow;
    ringContext.beginPath();
    ringContext.arc(x, y, size * 9, 0, Math.PI * 2);
    ringContext.fill();
    ringContext.strokeStyle = color;
    ringContext.globalAlpha = .72;
    ringContext.lineWidth = .7;
    ringContext.beginPath();
    ringContext.moveTo(x - size * 5, y);
    ringContext.lineTo(x + size * 5, y);
    ringContext.moveTo(x, y - size * 5);
    ringContext.lineTo(x, y + size * 5);
    ringContext.stroke();
    ringContext.globalAlpha = 1;
    ringContext.fillStyle = '#fffdf7';
    ringContext.beginPath();
    ringContext.arc(x, y, size * .68, 0, Math.PI * 2);
    ringContext.fill();
  }

  function buildGalaxyRing() {
    if (!hero || !ringContext) return;
    ringWidth = hero.clientWidth;
    ringHeight = hero.clientHeight;
    ringPixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
    ringCanvas.width = Math.max(1, Math.round(ringWidth * ringPixelRatio));
    ringCanvas.height = Math.max(1, Math.round(ringHeight * ringPixelRatio));
    ringContext.setTransform(ringPixelRatio, 0, 0, ringPixelRatio, 0, 0);
    ringContext.clearRect(0, 0, ringWidth, ringHeight);

    const centerX = ringWidth * .5;
    const centerY = ringHeight * .51;
    const radiusX = ringWidth * .47;
    const radiusY = ringHeight * .38;
    const count = Math.max(680, Math.min(1320, Math.round(ringWidth * ringHeight / 620)));
    for (let index = 0; index < count; index += 1) {
      const angle = random(0, Math.PI * 2);
      const spread = (Math.random() + Math.random() + Math.random() - 1.5) * 13;
      const nx = Math.cos(angle) / radiusX;
      const ny = Math.sin(angle) / radiusY;
      const normalLength = Math.hypot(nx, ny) || 1;
      const x = centerX + Math.cos(angle) * radiusX + (nx / normalLength) * spread;
      const y = centerY + Math.sin(angle) * radiusY + (ny / normalLength) * spread;
      const size = Math.random() > .972 ? random(1.1, 2.1) : random(.35, 1.05);
      ringContext.globalAlpha = random(.24, .77);
      ringContext.fillStyle = Math.random() > .28 ? '#fff0d2' : '#f7f5ef';
      if (size > 1.35) {
        ringContext.shadowColor = '#f5d99f';
        ringContext.shadowBlur = 7;
      }
      ringContext.beginPath();
      ringContext.arc(x, y, size, 0, Math.PI * 2);
      ringContext.fill();
      ringContext.shadowBlur = 0;
    }
    ringContext.globalAlpha = 1;
    drawFixedFlare(centerX + Math.cos(-2.42) * radiusX, centerY + Math.sin(-2.42) * radiusY, 1.8, 'rgba(255, 239, 203, .94)');
    drawFixedFlare(centerX + Math.cos(1.72) * radiusX, centerY + Math.sin(1.72) * radiusY, 2.1, 'rgba(255, 246, 226, .96)');
  }

  function drawGalaxyRing() {
    if (!hero || !ringCanvas.width || !ringCanvas.height) return;
    const bounds = hero.getBoundingClientRect();
    if (bounds.bottom <= 0 || bounds.top >= height) return;
    context.globalAlpha = .92;
    context.drawImage(ringCanvas, 0, 0, ringCanvas.width, ringCanvas.height,
      bounds.left, bounds.top, ringWidth, ringHeight);
    drawOrbitingComet(bounds);
    context.globalAlpha = 1;
  }

  function drawOrbitingComet(bounds) {
    const centerX = bounds.left + bounds.width * .5;
    const centerY = bounds.top + bounds.height * .51;
    const radiusX = bounds.width * .47;
    const radiusY = bounds.height * .38;
    const angle = elapsed * .42 - Math.PI * .5;
    const tailArc = .62;
    const pointAt = (theta) => ({
      x: centerX + Math.cos(theta) * radiusX,
      y: centerY + Math.sin(theta) * radiusY
    });
    const head = pointAt(angle);
    const tail = pointAt(angle - tailArc);
    const gradient = context.createLinearGradient(tail.x, tail.y, head.x, head.y);
    gradient.addColorStop(0, 'rgba(224, 190, 128, 0)');
    gradient.addColorStop(.5, 'rgba(234, 207, 158, .3)');
    gradient.addColorStop(1, 'rgba(255, 250, 239, .94)');
    context.strokeStyle = gradient;
    context.lineCap = 'round';
    context.lineWidth = 3;
    context.shadowColor = 'rgba(246, 216, 162, .8)';
    context.shadowBlur = 12;
    context.beginPath();
    for (let step = 0; step <= 28; step += 1) {
      const point = pointAt(angle - tailArc + (tailArc * step) / 28);
      if (step === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    }
    context.stroke();
    context.shadowBlur = 0;

    for (let step = 2; step < 23; step += 2) {
      const progress = step / 23;
      const point = pointAt(angle - tailArc + tailArc * progress);
      context.globalAlpha = progress * .72;
      context.fillStyle = step % 4 === 0 ? '#fff4da' : '#e7ca91';
      context.beginPath();
      context.arc(point.x, point.y, .65 + progress * .85, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;

    const glow = context.createRadialGradient(head.x, head.y, 0, head.x, head.y, 30);
    glow.addColorStop(0, 'rgba(255, 255, 248, .98)');
    glow.addColorStop(.12, 'rgba(255, 237, 196, .72)');
    glow.addColorStop(1, 'rgba(255, 220, 156, 0)');
    context.fillStyle = glow;
    context.beginPath();
    context.arc(head.x, head.y, 30, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#fffef9';
    context.beginPath();
    context.arc(head.x, head.y, 2.8, 0, Math.PI * 2);
    context.fill();
  }

  function drawCometHead() {
    if (!pointer.active) return;
    const tailX = pointer.x - pointer.dirX * 92;
    const tailY = pointer.y - pointer.dirY * 92;
    const streak = context.createLinearGradient(tailX, tailY, pointer.x, pointer.y);
    streak.addColorStop(0, 'rgba(222, 190, 132, 0)');
    streak.addColorStop(.62, 'rgba(231, 203, 154, .12)');
    streak.addColorStop(1, 'rgba(255, 249, 235, .72)');
    context.strokeStyle = streak;
    context.lineWidth = 2.2;
    context.beginPath();
    context.moveTo(tailX, tailY);
    context.lineTo(pointer.x, pointer.y);
    context.stroke();

    const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 24);
    glow.addColorStop(0, 'rgba(255, 252, 242, .95)');
    glow.addColorStop(.12, 'rgba(255, 233, 190, .58)');
    glow.addColorStop(1, 'rgba(255, 221, 164, 0)');
    context.fillStyle = glow;
    context.beginPath();
    context.arc(pointer.x, pointer.y, 24, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#fffdf8';
    context.beginPath();
    context.arc(pointer.x, pointer.y, 2, 0, Math.PI * 2);
    context.fill();
  }

  function render(timestamp) {
    if (document.hidden) return;
    if (previousTime && timestamp - previousTime < 1000 / 30) {
      frame = window.requestAnimationFrame(render);
      return;
    }
    const delta = previousTime ? Math.min((timestamp - previousTime) / 1000, .05) : 1 / 30;
    const frameScale = delta * 60;
    previousTime = timestamp;
    elapsed += delta;
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = 'screen';
    drawGalaxyRing();

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.age += delta;
      if (particle.age >= particle.life) {
        particles.splice(index, 1);
        continue;
      }

      particle.x += particle.vx * frameScale;
      particle.y += particle.vy * frameScale;
      particle.vx *= .986 ** frameScale;
      particle.vy *= .986 ** frameScale;
      const fade = 1 - particle.age / particle.life;
      const twinkle = .76 + Math.sin(timestamp * .012 + particle.phase) * .24;
      context.globalAlpha = fade * fade * twinkle;
      context.fillStyle = particle.color;
      context.shadowBlur = 0;

      if (particle.streak) {
        context.shadowColor = particle.color;
        context.shadowBlur = particle.size > 1.3 ? 5 : 0;
        context.strokeStyle = particle.color;
        context.lineWidth = Math.max(.45, particle.size * .65);
        context.beginPath();
        context.moveTo(particle.x - particle.vx * 2, particle.y - particle.vy * 2);
        context.lineTo(particle.x, particle.y);
        context.stroke();
        context.shadowBlur = 0;
      }
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size * Math.sqrt(fade), 0, Math.PI * 2);
      context.fill();
    }

    context.globalAlpha = 1;
    context.shadowBlur = 0;
    drawCometHead();
    context.globalCompositeOperation = 'source-over';
    frame = window.requestAnimationFrame(render);
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    buildGalaxyRing();
  }

  if (!reducedMotion) {
    window.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch' && !pointer.down) return;
      const x = event.clientX;
      const y = event.clientY;
      if (pointer.hasPosition) emitTrail(pointer.lastX, pointer.lastY, x, y);
      pointer.lastX = pointer.x = x;
      pointer.lastY = pointer.y = y;
      pointer.hasPosition = true;
      pointer.active = true;
    }, { passive: true });

    window.addEventListener('pointerdown', (event) => {
      pointer.x = pointer.lastX = event.clientX;
      pointer.y = pointer.lastY = event.clientY;
      pointer.hasPosition = true;
      pointer.down = true;
      pointer.active = true;
      burst(pointer.x, pointer.y);
    }, { passive: true });

    window.addEventListener('pointerup', (event) => {
      pointer.down = false;
      if (event.pointerType === 'touch') pointer.active = false;
    }, { passive: true });

    window.addEventListener('pointercancel', () => {
      pointer.down = false;
      pointer.active = false;
    }, { passive: true });

    document.documentElement.addEventListener('pointerleave', () => {
      pointer.down = false;
      pointer.active = false;
    }, { passive: true });

    window.addEventListener('blur', () => {
      pointer.down = false;
      pointer.active = false;
    });
  }

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.cancelAnimationFrame(frame);
      previousTime = 0;
    } else if (!reducedMotion) {
      frame = window.requestAnimationFrame(render);
    }
  });
  resize();
  if (!reducedMotion) frame = window.requestAnimationFrame(render);
})();
