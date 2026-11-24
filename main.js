(function () {
  /* ====== ตั้งค่าตรงนี้ ====== */
  var SKIN_URL = "img/skin.png"; // วางไฟล์ไว้ในโฟลเดอร์ public ของ Vite
  var SLIM = true;           // true = แขนเล็กแบบ Alex, false = แบบ Steve
  var AUTO_ROTATE = true;     // หมุนเองเมื่อไม่ได้ลาก
  var ZOOM = false;            // true = ซูมด้วยล้อเมาส์ได้
  /* ========================= */

  var box = document.getElementById("skin-viewer");

  if (!box) {
    console.error('ไม่พบ element id="skin-viewer" ใน index.html');
    return;
  }

  if (typeof THREE === "undefined") {
    console.error("ไม่พบ Three.js ตรวจสอบการโหลด CDN ใน index.html");
    return;
  }

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  box.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, 1, 1, 400);

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));

  var sun = new THREE.DirectionalLight(0xffffff, 0.5);
  sun.position.set(24, 44, 32);
  scene.add(sun);

  // ตำแหน่งของแต่ละชิ้นบนสกิน 64x64
  var P = {
    head:  { u: 0,  v: 0,  h: 8,  d: 8 },
    head2: { u: 32, v: 0,  h: 8,  d: 8 },
    body:  { u: 16, v: 16, h: 12, d: 4 },
    body2: { u: 16, v: 32, h: 12, d: 4 },
    armR:  { u: 40, v: 16, h: 12, d: 4 },
    armR2: { u: 40, v: 32, h: 12, d: 4 },
    armL:  { u: 32, v: 48, h: 12, d: 4 },
    armL2: { u: 48, v: 48, h: 12, d: 4 },
    legR:  { u: 0,  v: 16, h: 12, d: 4 },
    legR2: { u: 0,  v: 32, h: 12, d: 4 },
    legL:  { u: 16, v: 48, h: 12, d: 4 },
    legL2: { u: 0,  v: 48, h: 12, d: 4 }
  };

  var skin = document.createElement("canvas");
  skin.width = 64;
  skin.height = 64;
  var sctx = skin.getContext("2d");

  function faceTex(x, y, w, h) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d").drawImage(skin, x, y, w, h, 0, 0, w, h);

    var t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function boxMesh(p, w, grow, overlay) {
    var u = p.u, v = p.v, h = p.h, d = p.d;
    var rects = [
      [u + d + w, v + d, d, h],
      [u, v + d, d, h],
      [u + d, v, w, d],
      [u + d + w, v, w, d],
      [u + d, v + d, w, h],
      [u + 2 * d + w, v + d, w, h]
    ];

    var mats = rects.map(function (r) {
      var materialOptions = {
        map: faceTex(r[0], r[1], r[2], r[3])
      };
      if (overlay) materialOptions.alphaTest = 0.5;
      return new THREE.MeshLambertMaterial(materialOptions);
    });

    return new THREE.Mesh(
      new THREE.BoxGeometry(w + grow, h + grow, d + grow),
      mats
    );
  }

  function part(base, over, w) {
    var group = new THREE.Group();
    group.add(boxMesh(P[base], w, 0, false));
    group.add(boxMesh(P[over], w, 0.5, true));
    return group;
  }

  function buildCharacter() {
    var armWidth = SLIM ? 3 : 4;
    var root = new THREE.Group();

    var body = part("body", "body2", 8);
    body.position.set(0, 18, 0);

    var head = part("head", "head2", 8);
    head.position.set(0, 28, 0);

    var armR = part("armR", "armR2", armWidth);
    armR.position.set(-(4 + armWidth / 2), 18, 0);

    var armL = part("armL", "armL2", armWidth);
    armL.position.set(4 + armWidth / 2, 18, 0);

    var legR = part("legR", "legR2", 4);
    legR.position.set(-2, 6, 0);

    var legL = part("legL", "legL2", 4);
    legL.position.set(2, 6, 0);

    armR.rotation.z = -0.06;
    armL.rotation.z = 0.06;

    root.add(body, head, armR, armL, legR, legL);
    scene.add(root);
  }

  // โหลดไฟล์ Skin จาก public/skin.png
  var img = new Image();

  img.onload = function () {
    sctx.clearRect(0, 0, 64, 64);
    sctx.drawImage(img, 0, 0, 64, 64);

    if (img.height === 32) {
      sctx.drawImage(skin, 0, 16, 16, 16, 16, 48, 16, 16);
      sctx.drawImage(skin, 40, 16, 16, 16, 32, 48, 16, 16);
    }

    buildCharacter();
    console.log("Skin loaded successfully:", SKIN_URL);
  };

  img.onerror = function () {
    console.error(
      "โหลด Skin ไม่สำเร็จ: " + SKIN_URL +
      " — ตรวจสอบว่าไฟล์อยู่ที่ public/skin.png และชื่อไฟล์ตรงกัน"
    );
  };

  img.src = SKIN_URL;

  // หมุนกล้องรอบตัวละคร
  var theta = 0.5;
  var phi = 1.4;
  var radius = 88;
  var dragging = false;
  var lx = 0;
  var ly = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  var el = renderer.domElement;

  el.addEventListener("pointerdown", function (e) {
    dragging = true;
    lx = e.clientX;
    ly = e.clientY;

    try {
      el.setPointerCapture(e.pointerId);
    } catch (err) {}
  });

  el.addEventListener("pointermove", function (e) {
    if (!dragging) return;

    theta -= (e.clientX - lx) * 0.01;
    phi = clamp(phi - (e.clientY - ly) * 0.008, 0.45, 2.05);
    lx = e.clientX;
    ly = e.clientY;
  });

  el.addEventListener("pointerup", function () {
    dragging = false;
  });

  el.addEventListener("pointercancel", function () {
    dragging = false;
  });

  if (ZOOM) {
    el.addEventListener("wheel", function (e) {
      e.preventDefault();
      radius = clamp(radius * (e.deltaY > 0 ? 1.08 : 0.92), 40, 130);
    }, { passive: false });
  }

  function resize() {
    var width = box.clientWidth;
    var height = box.clientHeight;

    if (!width || !height) return;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(box);
  }

  window.addEventListener("resize", resize);
  resize();

  var clock = new THREE.Clock();

  (function loop() {
    requestAnimationFrame(loop);

    var dt = Math.min(clock.getDelta(), 0.05);

    if (AUTO_ROTATE && !dragging) {
      theta += dt * 0.45;
    }

    var sp = Math.sin(phi);
    camera.position.set(
      radius * sp * Math.sin(theta),
      17 + radius * Math.cos(phi),
      radius * sp * Math.cos(theta)
    );
    camera.lookAt(0, 17, 0);

    renderer.render(scene, camera);
  })();
})();
