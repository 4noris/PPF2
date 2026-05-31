document.documentElement.classList.add("js");

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const sceneCanvas = document.querySelector("#network-scene");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

async function initTradingScene() {
  if (!sceneCanvas || reduceMotion) {
    return;
  }

  try {
    const THREE = await import("https://unpkg.com/three@0.164.1/build/three.module.min.js");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: sceneCanvas,
      powerPreference: "low-power",
    });

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    sceneCanvas.dataset.engine = "three.js r164";
    camera.position.set(0, 0, 8.8);

    const group = new THREE.Group();
    scene.add(group);

    const nodes = Array.from({ length: 42 }, (_, index) => {
      const layer = index % 3;
      const angle = index * 0.84;
      const radius = 1.35 + layer * 0.75 + ((index * 11) % 9) * 0.09;

      return {
        x: Math.cos(angle) * radius * 1.75,
        y: Math.sin(angle * 0.72) * 1.85 + (layer - 1) * 0.28,
        z: Math.sin(angle * 1.35) * 1.2 + (layer - 1) * 0.35,
      };
    });

    const pointPositions = new Float32Array(nodes.length * 3);
    nodes.forEach((node, index) => {
      pointPositions[index * 3] = node.x;
      pointPositions[index * 3 + 1] = node.y;
      pointPositions[index * 3 + 2] = node.z;
    });

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute("position", new THREE.BufferAttribute(pointPositions, 3));

    const points = new THREE.Points(
      pointGeometry,
      new THREE.PointsMaterial({
        blending: THREE.AdditiveBlending,
        color: 0xf3ecdf,
        depthWrite: false,
        opacity: 0.58,
        size: 0.045,
        transparent: true,
      })
    );
    group.add(points);

    const linePositions = [];
    nodes.forEach((node, index) => {
      const nextIndexes = [index + 1, index + 5, index + 13].filter((value) => value < nodes.length);
      nextIndexes.forEach((nextIndex) => {
        const target = nodes[nextIndex];
        const distance = Math.hypot(node.x - target.x, node.y - target.y, node.z - target.z);
        if (distance < 3.15) {
          linePositions.push(node.x, node.y, node.z, target.x, target.y, target.z);
        }
      });
    });

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));

    group.add(
      new THREE.LineSegments(
        lineGeometry,
        new THREE.LineBasicMaterial({
          blending: THREE.AdditiveBlending,
          color: 0x9be7c1,
          depthWrite: false,
          opacity: 0.15,
          transparent: true,
        })
      )
    );

    const routeGeometry = new THREE.BufferGeometry();
    routeGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [
          -4.8, -1.05, 0.4, -2.4, 0.35, -0.25,
          -2.4, 0.35, -0.25, 0.2, -0.18, 0.75,
          0.2, -0.18, 0.75, 2.55, 0.62, -0.2,
          2.55, 0.62, -0.2, 4.65, -0.55, 0.35,
        ],
        3
      )
    );

    group.add(
      new THREE.LineSegments(
        routeGeometry,
        new THREE.LineBasicMaterial({
          blending: THREE.AdditiveBlending,
          color: 0xe8b86d,
          depthWrite: false,
          opacity: 0.18,
          transparent: true,
        })
      )
    );

    const grid = new THREE.GridHelper(12, 18, 0x9be7c1, 0xf3ecdf);
    grid.material.transparent = true;
    grid.material.opacity = 0.035;
    grid.material.depthWrite = false;
    grid.rotation.x = Math.PI * 0.5;
    grid.position.z = -1.6;
    group.add(grid);

    const pointer = { x: 0, y: 0 };
    window.addEventListener(
      "pointermove",
      (event) => {
        pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
        pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
      },
      { passive: true }
    );

    function resize() {
      const width = sceneCanvas.clientWidth || window.innerWidth;
      const height = sceneCanvas.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(sceneCanvas);
    resize();

    function animate(time = 0) {
      const seconds = time * 0.001;
      const position = pointGeometry.attributes.position;

      nodes.forEach((node, index) => {
        position.array[index * 3 + 1] = node.y + Math.sin(seconds * 0.75 + index * 0.42) * 0.035;
      });
      position.needsUpdate = true;

      group.rotation.x = -0.08 + pointer.y * 0.025;
      group.rotation.y = seconds * 0.075 + pointer.x * 0.06;
      group.rotation.z = -0.03;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  } catch (error) {
    sceneCanvas.classList.add("is-static");
  }
}

initTradingScene();
