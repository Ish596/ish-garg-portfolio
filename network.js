(() => {
  const canvas = document.querySelector('#network-canvas');
  const surface = canvas?.closest('.hero-art');
  const context = canvas?.getContext('2d', { alpha: true });
  if (!canvas || !surface || !context) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const points = [];
  const pointer = { x: -1000, y: -1000, active: false };
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let animationFrame = 0;

  function draw() {
    context.clearRect(0, 0, width, height);

    if (pointer.active && !prefersReducedMotion) {
      const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 165);
      glow.addColorStop(0, 'rgba(191, 156, 255, .11)');
      glow.addColorStop(1, 'rgba(191, 156, 255, 0)');
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
    }

    for (let first = 0; first < points.length; first += 1) {
      const point = points[first];
      for (let second = first + 1; second < points.length; second += 1) {
        const other = points[second];
        const dx = other.x - point.x;
        const dy = other.y - point.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 105) {
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(other.x, other.y);
          context.strokeStyle = `rgba(167, 255, 117, ${(1 - distance / 105) * .2})`;
          context.lineWidth = .7;
          context.stroke();
        }
      }

      if (pointer.active && !prefersReducedMotion) {
        const distanceToPointer = Math.hypot(point.x - pointer.x, point.y - pointer.y);
        if (distanceToPointer < 145) {
          context.beginPath();
          context.moveTo(pointer.x, pointer.y);
          context.lineTo(point.x, point.y);
          context.strokeStyle = `rgba(191, 156, 255, ${(1 - distanceToPointer / 145) * .32})`;
          context.lineWidth = .9;
          context.stroke();
        }
      }

      context.beginPath();
      context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      context.fillStyle = point.tint;
      context.globalAlpha = point.alpha;
      context.fill();
      context.globalAlpha = 1;

      if (!prefersReducedMotion) {
        point.x += point.vx;
        point.y += point.vy;
        if (point.x < -4 || point.x > width + 4) point.vx *= -1;
        if (point.y < -4 || point.y > height + 4) point.vy *= -1;
      }
    }
  }

  function animate() {
    if (document.hidden || prefersReducedMotion) return;
    draw();
    animationFrame = window.requestAnimationFrame(animate);
  }

  function resize() {
    const bounds = surface.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const count = Math.max(25, Math.min(58, Math.round((width * height) / 6800)));
    points.length = 0;
    for (let index = 0; index < count; index += 1) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - .5) * .32,
        vy: (Math.random() - .5) * .32,
        radius: .8 + Math.random() * 1.3,
        alpha: .35 + Math.random() * .45,
        tint: index % 6 === 0 ? '#bf9cff' : '#a7ff75'
      });
    }
    draw();
    if (!prefersReducedMotion && !document.hidden) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(animate);
    }
  }

  if (!prefersReducedMotion) {
    surface.addEventListener('pointermove', (event) => {
      const bounds = surface.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    }, { passive: true });
    surface.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });
  }

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.cancelAnimationFrame(animationFrame);
    else if (!prefersReducedMotion) animationFrame = window.requestAnimationFrame(animate);
  });
  resize();
})();
