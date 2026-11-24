(() => {
  const canvas = document.querySelector('#globe-canvas');
  const surface = canvas?.closest('.hero-art');
  if (!canvas || !surface) return;

  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) {
    canvas.classList.add('globe-canvas-fallback');
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vertexSource = `
    attribute vec3 a_position;
    uniform vec2 u_resolution;
    uniform vec2 u_center;
    uniform float u_radius;
    uniform float u_spin;
    uniform vec2 u_pointer;
    varying vec3 v_normal;

    void main() {
      float spin = u_spin + u_pointer.x * 0.34;
      float tilt = -0.24 + u_pointer.y * 0.27;
      vec3 p = a_position;

      float cs = cos(spin);
      float sn = sin(spin);
      p = vec3(p.x * cs + p.z * sn, p.y, -p.x * sn + p.z * cs);

      float ct = cos(tilt);
      float st = sin(tilt);
      p = vec3(p.x, p.y * ct - p.z * st, p.y * st + p.z * ct);
      v_normal = p;

      vec2 pixel = u_center + p.xy * u_radius;
      vec2 clip = vec2(pixel.x / u_resolution.x * 2.0 - 1.0, 1.0 - pixel.y / u_resolution.y * 2.0);
      gl_Position = vec4(clip, -p.z * 0.94, 1.0);
    }
  `;

  const fragmentSource = `
    precision mediump float;
    varying vec3 v_normal;

    void main() {
      vec3 n = normalize(v_normal);
      vec3 light = normalize(vec3(-0.42, 0.56, 0.82));
      float diffuse = max(dot(n, light), 0.0);
      float facing = max(n.z, 0.0);
      float fresnel = pow(1.0 - facing, 2.4);

      float latitude = asin(clamp(n.y, -1.0, 1.0));
      float longitude = atan(n.x, n.z);
      float parallels = 1.0 - smoothstep(0.025, 0.06, abs(sin(latitude * 8.0)));
      float meridians = 1.0 - smoothstep(0.024, 0.058, abs(sin(longitude * 6.0)));
      float grid = max(parallels * 0.42, meridians * 0.64) * smoothstep(-0.25, 0.22, n.z);

      vec3 base = mix(vec3(0.012, 0.055, 0.16), vec3(0.035, 0.24, 0.49), 0.18 + diffuse * 0.72);
      vec3 color = base + vec3(0.04, 0.25, 0.40) * pow(diffuse, 2.0);
      color += vec3(0.21, 0.76, 0.92) * grid;
      color += vec3(0.17, 0.49, 0.81) * fresnel * 0.78;

      vec3 halfVector = normalize(light + vec3(0.0, 0.0, 1.0));
      float highlight = pow(max(dot(n, halfVector), 0.0), 28.0);
      color += vec3(0.55, 0.9, 1.0) * highlight * 0.72;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    canvas.classList.add('globe-canvas-fallback');
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    canvas.classList.add('globe-canvas-fallback');
    return;
  }

  const latitudeSteps = 56;
  const longitudeSteps = 88;
  const positions = [];
  const indices = [];
  for (let row = 0; row <= latitudeSteps; row += 1) {
    const latitude = -Math.PI / 2 + row / latitudeSteps * Math.PI;
    for (let column = 0; column <= longitudeSteps; column += 1) {
      const longitude = column / longitudeSteps * Math.PI * 2;
      const cosLatitude = Math.cos(latitude);
      positions.push(
        cosLatitude * Math.sin(longitude),
        Math.sin(latitude),
        cosLatitude * Math.cos(longitude)
      );
    }
  }
  for (let row = 0; row < latitudeSteps; row += 1) {
    for (let column = 0; column < longitudeSteps; column += 1) {
      const first = row * (longitudeSteps + 1) + column;
      const next = first + longitudeSteps + 1;
      indices.push(first, next, first + 1, next, next + 1, first + 1);
    }
  }

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  gl.useProgram(program);
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
  const uniforms = {
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    center: gl.getUniformLocation(program, 'u_center'),
    radius: gl.getUniformLocation(program, 'u_radius'),
    spin: gl.getUniformLocation(program, 'u_spin'),
    pointer: gl.getUniformLocation(program, 'u_pointer')
  };

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;
  let radius = 0;
  let spin = 0.3;
  let frame = 0;

  function resize() {
    const bounds = surface.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    centerX = width * pixelRatio * 0.53;
    centerY = height * pixelRatio * 0.51;
    radius = Math.min(width * 0.43, height * 0.43) * pixelRatio;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.center, centerX, centerY);
    gl.uniform1f(uniforms.radius, radius);
    render();
    if (!reducedMotion && !document.hidden) {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(animate);
    }
  }

  function render() {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(uniforms.spin, spin);
    gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  }

  function animate() {
    if (document.hidden || reducedMotion) return;
    spin += 0.0032;
    pointer.x += (pointer.targetX - pointer.x) * 0.055;
    pointer.y += (pointer.targetY - pointer.y) * 0.055;
    render();
    frame = window.requestAnimationFrame(animate);
  }

  if (!reducedMotion) {
    surface.addEventListener('pointermove', (event) => {
      const bounds = surface.getBoundingClientRect();
      pointer.targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 1.15;
      pointer.targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.9;
    }, { passive: true });
    surface.addEventListener('pointerleave', () => {
      pointer.targetX = 0;
      pointer.targetY = 0;
    }, { passive: true });
  }

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.cancelAnimationFrame(frame);
    else if (!reducedMotion) frame = window.requestAnimationFrame(animate);
  });
  resize();
})();
