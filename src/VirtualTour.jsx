import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const sceneData = {
  Lobby: {
    image: '11.jpg',
    position: new THREE.Vector3(-5, 0, -10),
    offset: Math.PI
  }
};

const VirtualTour = () => {
  const mainRef = useRef();
  const miniRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 0.1);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mainRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.rotateSpeed = 0.5;
    controls.enableDamping = true;

    const textureLoader = new THREE.TextureLoader();

    let currentSphere;
    let currentLocation = 'Lobby';

    const setScene = (name) => {
      if (currentSphere) scene.remove(currentSphere);

      const data = sceneData[name];
      const texture = textureLoader.load(data.image, () => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.repeat.x = -1;
      });
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.encoding = THREE.SRGBColorSpace

      currentSphere = new THREE.Mesh(
        new THREE.SphereGeometry(500, 60, 40),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
      );
      scene.add(currentSphere);

      currentLocation = name;
      updateArrowPosition();
    };

    // === Minimap ===
    const miniScene = new THREE.Scene();
    const miniCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    miniCamera.position.set(60, 130, 20);
    miniCamera.lookAt(0, 0, 0);

    const miniRenderer = new THREE.WebGLRenderer({ alpha: true });
    miniRenderer.setSize(300, 300);
    miniRef.current.appendChild(miniRenderer.domElement);

    const miniSun = new THREE.DirectionalLight(0xffffff, 1.2);
    miniSun.position.set(100, 200, 100);
    miniScene.add(miniSun);
    miniScene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const gltfLoader = new GLTFLoader();
    gltfLoader.load('/floor.glb', (gltf) => {
  const floor = gltf.scene;
  floor.scale.set(10, 10, 10);
  floor.position.set(0, 0, 0); // make sure it's in view
  miniScene.add(floor);

  console.log('Floor model loaded', floor); // ✅ Add this to debug
}, undefined, (error) => {
  console.error('Failed to load GLTF:', error); // ✅ Add error handling
});


    const directionGroup = new THREE.Group();
    directionGroup.scale.set(3, 3, 3);
    miniScene.add(directionGroup);

    const createDirectionMarker = () => {
      const circle = new THREE.Mesh(
        new THREE.CircleGeometry(1, 32),
        new THREE.MeshBasicMaterial({
          color: 0x2196f3,
          side: THREE.DoubleSide,
          depthTest: false
        })
      );
      circle.rotation.x = -Math.PI / 2;
      circle.position.y = 0.02;
      circle.renderOrder = 997;

      const border = new THREE.Mesh(
        new THREE.CircleGeometry(1.15, 32),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          depthTest: false
        })
      );
      border.rotation.x = -Math.PI / 2;
      border.position.y = 0.01;
      border.renderOrder = 996;

      const coneGeometry = new THREE.ConeGeometry(7, 5, 32, 1, true);
      coneGeometry.rotateX(Math.PI);

      const alpha = new Float32Array(coneGeometry.attributes.position.count);
      for (let i = 0; i < alpha.length; i++) {
        alpha[i] = 1 - (coneGeometry.attributes.position.getY(i) + 2) / 4;
      }
      coneGeometry.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));

      const cone = new THREE.Mesh(
        coneGeometry,
        new THREE.ShaderMaterial({
          vertexShader: `
            varying float vAlpha;
            attribute float alpha;
            void main() {
              vAlpha = alpha;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying float vAlpha;
            void main() {
              gl_FragColor = vec4(0.13, 0.59, 0.95, vAlpha);
            }
          `,
          transparent: true,
          depthWrite: false,
          depthTest: false
        })
      );
      cone.position.set(0, 0.02, -2);
      cone.rotation.x = -Math.PI / 2;
      cone.renderOrder = 998;

      directionGroup.add(border, circle, cone);
    };

    createDirectionMarker();

    Object.entries(sceneData).forEach(([name, data]) => {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(2, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x00ff00, depthTest: false })
      );
      marker.renderOrder = 999;
      marker.position.copy(data.position);
      marker.userData = { scene: name };
      marker.callback = () => setScene(name);
      marker.name = name;
      miniScene.add(marker);
    });

    const updateArrowPosition = () => {
      const pos = sceneData[currentLocation].position;
      directionGroup.position.set(pos.x, 2, pos.z);
    };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleRaycast = (event) => {
      const bounds = miniRenderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

      raycaster.setFromCamera(mouse, miniCamera);
      const intersects = raycaster.intersectObjects(miniScene.children, true);
      if (intersects.length > 0) {
        const intersect = intersects.find(obj => obj.object.userData.scene);
        if (intersect && intersect.object.callback) {
          intersect.object.callback();
        }
      }
    };

    miniRenderer.domElement.addEventListener('click', handleRaycast);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      miniRenderer.render(miniScene, miniCamera);
    };
    animate();

    setScene(currentLocation);

    return () => {
      miniRenderer.domElement.removeEventListener('click', handleRaycast);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen">
      <div ref={mainRef} className="absolute inset-0 z-0" />
      <div
        ref={miniRef}
        className="absolute bottom-4 right-4 w-[300px] h-[300px] z-10 rounded-lg shadow-lg"
      />
      <div id="tooltip" ref={tooltipRef} className="absolute z-20 text-white" />
      <div className="absolute top-4 left-4 z-10 space-y-2">
        {Object.keys(sceneData).map((name) => (
          <button
            key={name}
            onClick={() => {}}
            className="bg-white text-black px-4 py-2 rounded shadow"
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default VirtualTour;
