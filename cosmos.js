(() => {
  const canvas = document.querySelector('#cosmos-canvas');
  const context = canvas?.getContext('2d', { alpha: true });
  if (!canvas || !context) return;

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
  let frame = 0;
  let previousTime = 0;

  function addParticle(x, y, vx, vy, life, size, color, streak = false) {
    particles.push({ x, y, vx, vy, age: 0, life, size, color, streak, phase: random(0, Math.PI * 2) });
    if (particles.length > 440) particles.splice(0, particles.length - 440);
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
    const steps = Math.max(1, Math.ceil(distance / 7));

    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      const x = fromX + dx * t;
      const y = fromY + dy * t;
      const strands = distance > 22 ? 2 : 1;
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
    const delta = previousTime ? Math.min((timestamp - previousTime) / 1000, .04) : 1 / 60;
    const frameScale = delta * 60;
    previousTime = timestamp;
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = 'screen';

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
      context.shadowColor = particle.color;
      context.shadowBlur = particle.size > 1.3 ? 9 : 4;

      if (particle.streak) {
        context.strokeStyle = particle.color;
        context.lineWidth = Math.max(.45, particle.size * .65);
        context.beginPath();
        context.moveTo(particle.x - particle.vx * 2, particle.y - particle.vy * 2);
        context.lineTo(particle.x, particle.y);
        context.stroke();
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
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
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
