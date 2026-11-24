(() => {
  const canvas = document.querySelector('#globe-canvas');
  const surface = canvas?.closest('.hero-art');
  const context = canvas?.getContext('2d', { alpha: true });
  if (!canvas || !surface || !context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: 0, y: 0, active: false };
  let width = 0;
  let height = 0;
  let radius = 0;
  let centerX = 0;
  let centerY = 0;
  let spin = 0.25;
  let tiltX = -0.2;
  let tiltY = 0.12;
  let targetTiltX = tiltX;
  let targetTiltY = tiltY;
  let frame = 0;

  const radians = (degrees) => degrees * Math.PI / 180;

  function spherePoint(latitude, longitude) {
    const lat = radians(latitude);
    const lon = radians(longitude) + spin;
    const cosLat = Math.cos(lat);
    const x = cosLat * Math.sin(lon);
    let y = Math.sin(lat);
    let z = cosLat * Math.cos(lon);

    const tiltedY = y * Math.cos(tiltX) - z * Math.sin(tiltX);
    const tiltedZ = y * Math.sin(tiltX) + z * Math.cos(tiltX);
    const rotatedX = x * Math.cos(tiltY) + tiltedZ * Math.sin(tiltY);
    const rotatedZ = -x * Math.sin(tiltY) + tiltedZ * Math.cos(tiltY);
    y = tiltedY;
    z = rotatedZ;

    return { x: centerX + rotatedX * radius, y: centerY - y * radius, z };
  }

  function drawCurve(points, color, lineWidth, dash = []) {
    for (const front of [false, true]) {
      context.beginPath();
      let drawing = false;
      for (let index = 0; index < points.length - 1; index += 1) {
        const from = points[index];
        const to = points[index + 1];
        const segmentIsFront = from.z >= 0 && to.z >= 0;
        const segmentIsBack = from.z < 0 && to.z < 0;
        if ((front && segmentIsFront) || (!front && segmentIsBack)) {
          if (!drawing) context.moveTo(from.x, from.y);
          context.lineTo(to.x, to.y);
          drawing = true;
        } else {
          drawing = false;
        }
      }
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      context.setLineDash(front ? [] : dash);
      context.stroke();
    }
    context.setLineDash([]);
  }

  function orbitPoint(angle, phase, inclination, orbitRadius) {
    const t = angle + phase;
    const x = Math.cos(t) * orbitRadius;
    const y = Math.sin(t) * orbitRadius * Math.cos(inclination);
    const z = Math.sin(t) * orbitRadius * Math.sin(inclination);
    const turnedX = x * Math.cos(tiltY) + z * Math.sin(tiltY);
    const turnedZ = -x * Math.sin(tiltY) + z * Math.cos(tiltY);
    return { x: centerX + turnedX * radius, y: centerY - y * radius, z: turnedZ };
  }

  function drawOrbit(phase, inclination, orbitRadius, color, lineWidth, front) {
    const points = [];
    for (let index = 0; index <= 160; index += 1) {
      points.push(orbitPoint(index / 160 * Math.PI * 2, phase, inclination, orbitRadius));
    }
    context.beginPath();
    let drawing = false;
    for (let index = 0; index < points.length - 1; index += 1) {
      const from = points[index];
      const to = points[index + 1];
      const isFront = from.z >= 0 && to.z >= 0;
      const isBack = from.z < 0 && to.z < 0;
      if ((front && isFront) || (!front && isBack)) {
        if (!drawing) context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        drawing = true;
      } else {
        drawing = false;
      }
    }
    context.strokeStyle = front ? color : 'rgba(101, 174, 255, .22)';
    context.lineWidth = front ? lineWidth : Math.max(1, lineWidth * .65);
    context.shadowColor = front ? color : 'transparent';
    context.shadowBlur = front ? 13 : 0;
    context.stroke();
    context.shadowBlur = 0;
  }

  function render() {
    context.clearRect(0, 0, width, height);

    const halo = context.createRadialGradient(centerX, centerY, radius * .28, centerX, centerY, radius * 1.55);
    halo.addColorStop(0, 'rgba(79, 179, 255, .17)');
    halo.addColorStop(.62, 'rgba(80, 128, 255, .09)');
    halo.addColorStop(1, 'rgba(80, 128, 255, 0)');
    context.fillStyle = halo;
    context.beginPath();
    context.arc(centerX, centerY, radius * 1.55, 0, Math.PI * 2);
    context.fill();

    drawOrbit(-spin * .46, .7, 1.24, '#67dcff', 2.3, false);
    drawOrbit(spin * .28, 1.16, 1.11, '#a99aff', 1.5, false);

    context.save();
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.clip();

    const sphere = context.createRadialGradient(centerX - radius * .36, centerY - radius * .42, radius * .06, centerX, centerY, radius * 1.2);
    sphere.addColorStop(0, '#8eeaff');
    sphere.addColorStop(.12, '#347fc9');
    sphere.addColorStop(.42, '#1552a2');
    sphere.addColorStop(.78, '#0b3479');
    sphere.addColorStop(1, '#061b45');
    context.fillStyle = sphere;
    context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

    const latitudeLines = [];
    for (let latitude = -72; latitude <= 72; latitude += 18) {
      const points = [];
      for (let longitude = -180; longitude <= 180; longitude += 3) {
        points.push(spherePoint(latitude, longitude));
      }
      latitudeLines.push(points);
    }
    const longitudeLines = [];
    for (let longitude = -180; longitude < 180; longitude += 22.5) {
      const points = [];
      for (let latitude = -90; latitude <= 90; latitude += 3) {
        points.push(spherePoint(latitude, longitude));
      }
      longitudeLines.push(points);
    }
    latitudeLines.forEach((points, index) => drawCurve(points, index === 4 ? 'rgba(137, 245, 255, .4)' : 'rgba(132, 208, 255, .24)', index === 4 ? 1.15 : .8, [2, 5]));
    longitudeLines.forEach((points, index) => drawCurve(points, index % 2 === 0 ? 'rgba(172, 163, 255, .3)' : 'rgba(122, 210, 255, .22)', .8, [2, 5]));

    const nodePoints = [];
    for (let latitude = -60; latitude <= 60; latitude += 20) {
      for (let longitude = -180; longitude < 180; longitude += 30) {
        const point = spherePoint(latitude, longitude);
        if (point.z > .08) nodePoints.push(point);
      }
    }
    nodePoints.forEach((point, index) => {
      const depth = Math.max(0, point.z);
      context.beginPath();
      context.arc(point.x, point.y, 1 + depth * 1.5, 0, Math.PI * 2);
      context.fillStyle = index % 5 === 0 ? '#c1b5ff' : '#a7f7ff';
      context.globalAlpha = .45 + depth * .5;
      context.shadowColor = context.fillStyle;
      context.shadowBlur = 5 + depth * 9;
      context.fill();
      context.shadowBlur = 0;
      context.globalAlpha = 1;
    });

    const specular = context.createRadialGradient(centerX - radius * .34, centerY - radius * .42, 0, centerX - radius * .34, centerY - radius * .42, radius * .64);
    specular.addColorStop(0, 'rgba(222, 252, 255, .3)');
    specular.addColorStop(.24, 'rgba(132, 222, 255, .12)');
    specular.addColorStop(1, 'rgba(132, 222, 255, 0)');
    context.fillStyle = specular;
    context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

    const edgeShade = context.createRadialGradient(centerX, centerY, radius * .45, centerX, centerY, radius);
    edgeShade.addColorStop(0, 'rgba(2, 9, 31, 0)');
    edgeShade.addColorStop(.72, 'rgba(2, 9, 31, .06)');
    edgeShade.addColorStop(1, 'rgba(2, 8, 28, .76)');
    context.fillStyle = edgeShade;
    context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    context.restore();

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.strokeStyle = 'rgba(176, 241, 255, .82)';
    context.lineWidth = 1.4;
    context.shadowColor = '#45c8ff';
    context.shadowBlur = 14;
    context.stroke();
    context.shadowBlur = 0;

    drawOrbit(-spin * .46, .7, 1.24, '#67dcff', 2.3, true);
    drawOrbit(spin * .28, 1.16, 1.11, '#a99aff', 1.5, true);
  }

  function animate() {
    if (document.hidden || reducedMotion) return;
    spin += .004;
    tiltX += (targetTiltX - tiltX) * .045;
    tiltY += (targetTiltY - tiltY) * .045;
    render();
    frame = window.requestAnimationFrame(animate);
  }

  function resize() {
    const bounds = surface.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    radius = Math.min(width * .41, height * .39);
    centerX = width * .53;
    centerY = height * .51;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    render();
    if (!reducedMotion && !document.hidden) {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(animate);
    }
  }

  if (!reducedMotion) {
    surface.addEventListener('pointermove', (event) => {
      const bounds = surface.getBoundingClientRect();
      pointer.x = (event.clientX - bounds.left) / bounds.width;
      pointer.y = (event.clientY - bounds.top) / bounds.height;
      pointer.active = true;
      targetTiltX = (pointer.y - .5) * .68;
      targetTiltY = (pointer.x - .5) * 1.05;
    }, { passive: true });
    surface.addEventListener('pointerleave', () => {
      pointer.active = false;
      targetTiltX = -.2;
      targetTiltY = .12;
    }, { passive: true });
  }

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.cancelAnimationFrame(frame);
    else if (!reducedMotion) frame = window.requestAnimationFrame(animate);
  });
  resize();
})();
