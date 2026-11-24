(() => {
  const canvas = document.querySelector('#network-canvas');
  const context = canvas?.getContext('2d', { alpha: true });
  if (!canvas || !context) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stars = [];
  const pointer = { x: -1000, y: -1000, active: false };
  let width = 0;
  let height = 0;
  let animationFrame = 0;

  function paint() {
    context.clearRect(0, 0, width, height);

    if (pointer.active && !prefersReducedMotion) {
      const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 210);
      glow.addColorStop(0, 'rgba(255, 225, 178, .13)');
      glow.addColorStop(.48, 'rgba(255, 244, 225, .055)');
      glow.addColorStop(1, 'rgba(255, 244, 225, 0)');
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
    }

    for (let first = 0; first < stars.length; first += 1) {
      const star = stars[first];
      for (let second = first + 1; second < stars.length; second += 1) {
        const neighbor = stars[second];
        const distance = Math.hypot(neighbor.x - star.x, neighbor.y - star.y);
        if (distance < 118) {
          context.beginPath();
          context.moveTo(star.x, star.y);
          context.lineTo(neighbor.x, neighbor.y);
          context.strokeStyle = `${star.linkColor}${((1 - distance / 118) * .24).toFixed(3)})`;
          context.lineWidth = .65;
          context.stroke();
        }
      }

      if (pointer.active && !prefersReducedMotion) {
        const distanceToPointer = Math.hypot(star.x - pointer.x, star.y - pointer.y);
        if (distanceToPointer < 170) {
          context.beginPath();
          context.moveTo(pointer.x, pointer.y);
          context.lineTo(star.x, star.y);
          context.strokeStyle = `rgba(255, 224, 179, ${(1 - distanceToPointer / 170) * .3})`;
          context.lineWidth = .8;
          context.stroke();
        }
      }

      context.beginPath();
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.globalAlpha = star.alpha + (Math.sin(star.phase) + 1) * .08;
      context.fillStyle = star.tint;
      context.fill();
      context.globalAlpha = 1;

      if (!prefersReducedMotion) {
        star.x += star.vx;
        star.y += star.vy;
        star.phase += .018;
        if (star.x < -3 || star.x > width + 3) star.vx *= -1;
        if (star.y < -3 || star.y > height + 3) star.vy *= -1;
      }
    }
  }

  function animate() {
    if (document.hidden || prefersReducedMotion) return;
    paint();
    animationFrame = window.requestAnimationFrame(animate);
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const count = Math.max(28, Math.min(70, Math.round((width * height) / 17000)));
    stars.length = 0;
    for (let index = 0; index < count; index += 1) {
      const tintIndex = index % 8;
      const tint = tintIndex === 0 ? '#f3d6a5' : tintIndex < 4 ? '#f4f0e8' : '#d9c8a7';
      const linkColor = tintIndex === 0 ? 'rgba(243, 214, 165, ' : tintIndex < 4 ? 'rgba(244, 240, 232, ' : 'rgba(217, 200, 167, ';
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - .5) * .22,
        vy: (Math.random() - .5) * .22,
        radius: .6 + Math.random() * 1.2,
        alpha: .25 + Math.random() * .48,
        phase: Math.random() * Math.PI * 2,
        tint,
        linkColor
      });
    }
    paint();
    if (!prefersReducedMotion && !document.hidden) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(animate);
    }
  }

  if (!prefersReducedMotion) {
    window.addEventListener('pointermove', (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    }, { passive: true });
    window.addEventListener('blur', () => { pointer.active = false; });
  }
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.cancelAnimationFrame(animationFrame);
    else if (!prefersReducedMotion) animationFrame = window.requestAnimationFrame(animate);
  });
  resize();
})();
