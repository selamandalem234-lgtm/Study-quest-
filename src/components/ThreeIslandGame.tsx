import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { IslandData, CropData } from '../firebase.ts';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Droplets,
  Home,
  Navigation,
  Compass,
  ArrowLeft,
  Users,
  Palette,
  Eye,
  Maximize2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ThreeIslandGameProps {
  island: IslandData;
  crops: CropData[];
  isVisiting: boolean;
  onHarvestCrop?: (plotId: string) => void;
  onPlantCrop?: (plotId: string) => void;
  onWaterSoil?: () => void;
  onReturnHome?: () => void;
  onOpenWardrobe?: () => void;
  onOpenShop?: () => void;
  onOpenMap?: () => void;
  onOpenFriends?: () => void;
  studyMinutesToday: number;
}

export const ThreeIslandGame: React.FC<ThreeIslandGameProps> = ({
  island,
  crops,
  isVisiting,
  onHarvestCrop,
  onPlantCrop,
  onWaterSoil,
  onReturnHome,
  onOpenWardrobe,
  onOpenShop,
  onOpenMap,
  onOpenFriends,
  studyMinutesToday
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // References for mutable Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const beanGroupRef = useRef<THREE.Group | null>(null);
  const beanTargetPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.45, 0));
  const isWalkingRef = useRef<boolean>(false);
  const cropMeshGroupsRef = useRef<Map<string, THREE.Group>>(new Map());

  // Show transient feedback
  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL per Three.js guidelines
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xdcecf8); // Cozy pastel sky
    scene.fog = new THREE.FogExp2(0xdcecf8, 0.025);

    // 2. Camera setup (cozy isometric perspective)
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
    camera.position.set(12, 11, 14);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false
    });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.15; // Don't flip underneath island
    controls.minDistance = 6;
    controls.maxDistance = 24;
    controls.target.set(0, 0.5, 0);

    // 5. Lighting Rig (Warm Key + Cool Ambient Fill)
    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    sunLight.position.set(10, 15, 8);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 30;
    sunLight.shadow.camera.left = -8;
    sunLight.shadow.camera.right = 8;
    sunLight.shadow.camera.top = 8;
    sunLight.shadow.camera.bottom = -8;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0xe8f4ff, 0x6e8a5b, 1.2);
    scene.add(hemiLight);

    // Island Root Group
    const islandGroup = new THREE.Group();
    scene.add(islandGroup);

    // 6. Island Bedrock & Grass Plateau
    // Top Grass Layer
    const grassGeo = new THREE.CylinderGeometry(5.2, 4.8, 0.6, 24);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x68b948,
      roughness: 0.8,
      metalness: 0.05
    });
    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    grassMesh.position.y = 0;
    grassMesh.receiveShadow = true;
    islandGroup.add(grassMesh);

    // Lower Rocky Underside
    const rockGeo = new THREE.ConeGeometry(5.0, 4.2, 16);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x5b4737,
      roughness: 0.95
    });
    const rockMesh = new THREE.Mesh(rockGeo, rockMat);
    rockMesh.rotation.x = Math.PI;
    rockMesh.position.y = -2.3;
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;
    islandGroup.add(rockMesh);

    // Hanging Vines
    for (let v = 0; v < 8; v++) {
      const angle = (v / 8) * Math.PI * 2;
      const vineLen = 1.2 + Math.random() * 1.5;
      const vineGeo = new THREE.CylinderGeometry(0.04, 0.02, vineLen, 5);
      const vineMat = new THREE.MeshStandardMaterial({ color: 0x3d7e2e, roughness: 0.9 });
      const vine = new THREE.Mesh(vineGeo, vineMat);
      vine.position.set(Math.cos(angle) * 4.9, -vineLen / 2 - 0.2, Math.sin(angle) * 4.9);
      islandGroup.add(vine);
    }

    // 7. Flowing River & Waterfall
    const riverGeo = new THREE.PlaneGeometry(1.6, 4.5, 10, 10);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x48bfe3,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85
    });
    const river = new THREE.Mesh(riverGeo, riverMat);
    river.rotation.x = -Math.PI / 2;
    river.rotation.z = 0.45;
    river.position.set(2.4, 0.32, 1.2);
    river.receiveShadow = true;
    islandGroup.add(river);

    // Waterfall spill
    const fallGeo = new THREE.PlaneGeometry(1.2, 3.2);
    const fallMat = new THREE.MeshStandardMaterial({
      color: 0x90e0ef,
      transparent: true,
      opacity: 0.8
    });
    const fall = new THREE.Mesh(fallGeo, fallMat);
    fall.position.set(4.4, -1.2, 2.6);
    fall.rotation.y = -Math.PI / 4;
    islandGroup.add(fall);

    // Wooden Arched Bridge
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(2.4, 0.45, 1.2);
    bridgeGroup.rotation.y = 0.45;
    const bridgeArchGeo = new THREE.BoxGeometry(0.8, 0.12, 1.8);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 });
    const bridgePlank = new THREE.Mesh(bridgeArchGeo, woodMat);
    bridgePlank.castShadow = true;
    bridgeGroup.add(bridgePlank);
    islandGroup.add(bridgeGroup);

    // 8. Farmhouse Cabin / Cottage / Observatory (Based on houseLevel)
    const houseGroup = new THREE.Group();
    houseGroup.position.set(-2.0, 0.3, -1.8);

    // House Walls
    const houseLvl = island.houseLevel || 1;
    const wallColor = houseLvl === 1 ? 0xa06d44 : houseLvl === 2 ? 0x9e9e9e : 0x3d405b;
    const wallGeo = new THREE.BoxGeometry(2.4, 1.8, 2.2);
    const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85 });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 0.9;
    walls.castShadow = true;
    walls.receiveShadow = true;
    houseGroup.add(walls);

    // House Roof
    const roofColor = houseLvl === 1 ? 0xc87d47 : houseLvl === 2 ? 0x8c2f39 : 0x22223b;
    const roofGeo = new THREE.ConeGeometry(2.3, 1.4, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.6 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 2.4;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    houseGroup.add(roof);

    // Chimney with Smoke
    const chimneyGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x6c757d, roughness: 0.9 });
    const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
    chimney.position.set(0.7, 2.4, -0.5);
    chimney.castShadow = true;
    houseGroup.add(chimney);

    // Cozy Front Porch
    const porchGeo = new THREE.BoxGeometry(1.6, 0.15, 0.8);
    const porch = new THREE.Mesh(porchGeo, woodMat);
    porch.position.set(0, 0.08, 1.3);
    porch.castShadow = true;
    houseGroup.add(porch);

    islandGroup.add(houseGroup);

    // 9. Interactive 6-Plot Garden Farm
    const gardenGroup = new THREE.Group();
    gardenGroup.position.set(-1.8, 0.32, 1.8);

    // Garden Bed Frame
    const bedGeo = new THREE.BoxGeometry(2.8, 0.18, 2.0);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.castShadow = true;
    bed.receiveShadow = true;
    gardenGroup.add(bed);

    // Soil Top
    const soilGeo = new THREE.BoxGeometry(2.6, 0.1, 1.8);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 1.0 });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.y = 0.08;
    gardenGroup.add(soil);

    // 6 Individual Crop Plots (2 rows x 3 cols)
    cropMeshGroupsRef.current.clear();
    const plotPositions = [
      { id: 'plot-1', x: -0.8, z: -0.45 },
      { id: 'plot-2', x: 0.0, z: -0.45 },
      { id: 'plot-3', x: 0.8, z: -0.45 },
      { id: 'plot-4', x: -0.8, z: 0.45 },
      { id: 'plot-5', x: 0.0, z: 0.45 },
      { id: 'plot-6', x: 0.8, z: 0.45 }
    ];

    plotPositions.forEach((pos, i) => {
      const plotGroup = new THREE.Group();
      plotGroup.position.set(pos.x, 0.14, pos.z);
      plotGroup.name = pos.id;

      const crop = crops[i] || { cropType: 'wheat', stage: 1 };
      buildCropMesh(plotGroup, crop.cropType, crop.stage);

      cropMeshGroupsRef.current.set(pos.id, plotGroup);
      gardenGroup.add(plotGroup);
    });

    islandGroup.add(gardenGroup);

    // 10. Campfire & Calico Cat
    const fireGroup = new THREE.Group();
    fireGroup.position.set(0.6, 0.32, -0.6);

    // Stone ring
    for (let r = 0; r < 8; r++) {
      const ang = (r / 8) * Math.PI * 2;
      const stoneGeo = new THREE.DodecahedronGeometry(0.12);
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x757575, roughness: 0.9 });
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(Math.cos(ang) * 0.45, 0.06, Math.sin(ang) * 0.45);
      stone.castShadow = true;
      fireGroup.add(stone);
    }

    // Flame Core
    const flameGeo = new THREE.ConeGeometry(0.18, 0.45, 6);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff7b00 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 0.22;
    fireGroup.add(flame);

    // Campfire PointLight
    const fireLight = new THREE.PointLight(0xff9e00, 1.2, 4);
    fireLight.position.y = 0.4;
    fireGroup.add(fireLight);

    // Curled Calico Cat
    const catGroup = new THREE.Group();
    catGroup.position.set(0.7, 0.06, 0.2);
    const catBodyGeo = new THREE.SphereGeometry(0.18, 12, 12);
    catBodyGeo.scale(1.3, 0.7, 1);
    const catMat = new THREE.MeshStandardMaterial({ color: 0xf5a623, roughness: 0.8 });
    const catBody = new THREE.Mesh(catBodyGeo, catMat);
    catBody.castShadow = true;
    catGroup.add(catBody);

    const catHeadGeo = new THREE.SphereGeometry(0.12, 10, 10);
    const catHead = new THREE.Mesh(catHeadGeo, catMat);
    catHead.position.set(0.2, 0.08, 0);
    catGroup.add(catHead);

    fireGroup.add(catGroup);
    islandGroup.add(fireGroup);

    // 11. Docked Hot Air Balloon
    const balloonGroup = new THREE.Group();
    balloonGroup.position.set(3.8, 1.4, -2.6);

    // Balloon Envelope
    const balloonGeo = new THREE.SphereGeometry(1.3, 20, 20);
    balloonGeo.scale(1, 1.35, 1);
    const balloonMat = new THREE.MeshStandardMaterial({
      color: 0xff6b6b,
      roughness: 0.5
    });
    const balloonMesh = new THREE.Mesh(balloonGeo, balloonMat);
    balloonMesh.position.y = 1.8;
    balloonMesh.castShadow = true;
    balloonGroup.add(balloonMesh);

    // Balloon Basket
    const basketGeo = new THREE.BoxGeometry(0.65, 0.45, 0.65);
    const basketMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.85 });
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.position.y = 0.2;
    basket.castShadow = true;
    balloonGroup.add(basket);

    islandGroup.add(balloonGroup);

    // 12. Stylized 3D Trees & Foliage
    createTree(islandGroup, -3.8, -0.6);
    createTree(islandGroup, -0.8, -3.8);
    createTree(islandGroup, 1.6, -3.2);

    // 13. Procedural 3D Bean Companion
    const beanGroup = new THREE.Group();
    beanGroupRef.current = beanGroup;
    beanGroup.position.set(0, 0.45, 0);

    // Bean Body
    const beanBodyColor = island.beanOutfit?.color || '#eaae70';
    const beanGeo = new THREE.CapsuleGeometry(0.35, 0.35, 12, 16);
    const beanMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(beanBodyColor),
      roughness: 0.55
    });
    const beanMesh = new THREE.Mesh(beanGeo, beanMat);
    beanMesh.castShadow = true;
    beanGroup.add(beanMesh);

    // Bean Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.11, 0.2, 0.33);
    beanGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.11, 0.2, 0.33);
    beanGroup.add(rightEye);

    // Rosy Cheeks
    const cheekMat = new THREE.MeshBasicMaterial({ color: 0xff85a1 });
    const cheekGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    leftCheek.position.set(-0.18, 0.12, 0.31);
    beanGroup.add(leftCheek);

    const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
    rightCheek.position.set(0.18, 0.12, 0.31);
    beanGroup.add(rightCheek);

    // Bean Hat
    const hatType = island.beanOutfit?.hat || 'beanie';
    buildBeanHat(beanGroup, hatType);

    islandGroup.add(beanGroup);

    // 14. Raycasting for Clicking on Plots or Ground
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check intersection with crops
      const plotObjects: THREE.Object3D[] = [];
      cropMeshGroupsRef.current.forEach(grp => plotObjects.push(...grp.children));
      const cropHits = raycaster.intersectObjects(plotObjects, true);

      if (cropHits.length > 0) {
        // Find which plot was clicked
        let parent: THREE.Object3D | null = cropHits[0].object;
        while (parent && !parent.name.startsWith('plot-') && parent !== scene) {
          parent = parent.parent;
        }
        if (parent && parent.name.startsWith('plot-')) {
          const plotId = parent.name;
          const targetCrop = crops.find(c => c.id === plotId);
          if (targetCrop?.stage === 3) {
            onHarvestCrop?.(plotId);
          } else {
            onPlantCrop?.(plotId);
          }
          return;
        }
      }

      // Check intersection with island grass ground for movement
      const groundHits = raycaster.intersectObject(grassMesh);
      if (groundHits.length > 0) {
        const point = groundHits[0].point;
        beanTargetPos.current.set(point.x, 0.45, point.z);
        isWalkingRef.current = true;
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 15. Animation Loop
    let clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Gentle balloon hover
      balloonGroup.position.y = 1.4 + Math.sin(elapsed * 1.5) * 0.15;

      // Campfire flicker
      flame.scale.set(
        1 + Math.sin(elapsed * 10) * 0.1,
        1 + Math.cos(elapsed * 12) * 0.15,
        1 + Math.sin(elapsed * 8) * 0.1
      );
      fireLight.intensity = 1.1 + Math.sin(elapsed * 14) * 0.3;

      // Bean Movement & Waddling
      if (beanGroupRef.current) {
        const bean = beanGroupRef.current;
        const dist = bean.position.distanceTo(beanTargetPos.current);

        if (dist > 0.1) {
          // Walk towards target
          const dir = new THREE.Vector3().subVectors(beanTargetPos.current, bean.position).normalize();
          bean.position.addScaledVector(dir, Math.min(dist, delta * 2.8));

          // Look at destination
          const targetRotation = Math.atan2(dir.x, dir.z);
          bean.rotation.y = THREE.MathUtils.damp(bean.rotation.y, targetRotation, 10, delta);

          // Waddle animation
          bean.rotation.z = Math.sin(elapsed * 16) * 0.12;
          bean.position.y = 0.45 + Math.abs(Math.sin(elapsed * 16)) * 0.1;
        } else {
          // Idle cute breath bounce
          bean.position.y = 0.45 + Math.sin(elapsed * 2.5) * 0.03;
          bean.rotation.z = 0;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animId);
      renderer.dispose();
      controls.dispose();
    };
  }, [island.houseLevel, island.beanOutfit]);

  // Helper to construct 3D tree
  function createTree(parent: THREE.Group, x: number, z: number) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0.3, z);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.25, 1.2, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.6;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Foliage layers
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.8 });
    [
      { r: 1.1, h: 1.3, y: 1.5 },
      { r: 0.85, h: 1.1, y: 2.2 },
      { r: 0.55, h: 0.9, y: 2.8 }
    ].forEach(f => {
      const coneGeo = new THREE.ConeGeometry(f.r, f.h, 8);
      const cone = new THREE.Mesh(coneGeo, foliageMat);
      cone.position.y = f.y;
      cone.castShadow = true;
      treeGroup.add(cone);
    });

    parent.add(treeGroup);
  }

  // Helper to build 3D Crop for specific stage
  function buildCropMesh(group: THREE.Group, type: string, stage: number) {
    group.clear();

    const stemMat = new THREE.MeshStandardMaterial({ color: 0x7cb342, roughness: 0.7 });

    if (stage === 0) {
      // Seed mound
      const seedGeo = new THREE.SphereGeometry(0.06, 6, 6);
      const seedMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
      const seed = new THREE.Mesh(seedGeo, seedMat);
      seed.position.y = 0.04;
      group.add(seed);
    } else if (stage === 1) {
      // Young sprout
      const sproutGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.2, 6);
      const sprout = new THREE.Mesh(sproutGeo, stemMat);
      sprout.position.y = 0.1;
      group.add(sprout);

      const leafGeo = new THREE.SphereGeometry(0.08, 6, 6);
      leafGeo.scale(1.4, 0.2, 0.6);
      const leaf = new THREE.Mesh(leafGeo, stemMat);
      leaf.position.set(0.05, 0.2, 0);
      group.add(leaf);
    } else if (stage === 2) {
      // Blooming plant
      const stalkGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.45, 6);
      const stalk = new THREE.Mesh(stalkGeo, stemMat);
      stalk.position.y = 0.22;
      group.add(stalk);

      const bloomColor = type === 'starberry' ? 0xff4081 : type === 'moonblossom' ? 0x7c4dff : 0xffca28;
      const bloomMat = new THREE.MeshStandardMaterial({ color: bloomColor, roughness: 0.4 });
      const budGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const bud = new THREE.Mesh(budGeo, bloomMat);
      bud.position.y = 0.45;
      group.add(bud);
    } else {
      // Golden Harvest Ready (Glowing ripe crops)
      const harvestColor =
        type === 'wheat'
          ? 0xffc107
          : type === 'starberry'
          ? 0xf50057
          : type === 'moonblossom'
          ? 0x651fff
          : 0xff9800;

      const stalkGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.6, 6);
      const stalk = new THREE.Mesh(stalkGeo, stemMat);
      stalk.position.y = 0.3;
      group.add(stalk);

      const fruitMat = new THREE.MeshStandardMaterial({
        color: harvestColor,
        roughness: 0.2,
        emissive: harvestColor,
        emissiveIntensity: 0.35
      });
      const fruitGeo = new THREE.DodecahedronGeometry(0.2);
      const fruit = new THREE.Mesh(fruitGeo, fruitMat);
      fruit.position.y = 0.65;
      fruit.castShadow = true;
      group.add(fruit);
    }
  }

  // Helper to build 3D Bean Hat
  function buildBeanHat(parent: THREE.Group, hatType: string) {
    if (hatType === 'beanie') {
      const beanieGeo = new THREE.SphereGeometry(0.38, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const beanieMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.9 });
      const beanie = new THREE.Mesh(beanieGeo, beanieMat);
      beanie.position.y = 0.36;
      parent.add(beanie);

      // Pom pom
      const pomGeo = new THREE.SphereGeometry(0.09, 8, 8);
      const pomMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const pom = new THREE.Mesh(pomGeo, pomMat);
      pom.position.y = 0.76;
      parent.add(pom);
    } else if (hatType === 'straw') {
      const brimGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.04, 16);
      const strawMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.9 });
      const brim = new THREE.Mesh(brimGeo, strawMat);
      brim.position.y = 0.45;
      parent.add(brim);

      const crownGeo = new THREE.CylinderGeometry(0.36, 0.38, 0.25, 12);
      const crown = new THREE.Mesh(crownGeo, strawMat);
      crown.position.y = 0.58;
      parent.add(crown);
    } else if (hatType === 'crown') {
      const crownGeo = new THREE.CylinderGeometry(0.35, 0.28, 0.3, 5);
      const crownMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.8,
        roughness: 0.2
      });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.y = 0.54;
      parent.add(crown);
    }
  }

  return (
    <div className="relative w-full h-[520px] sm:h-[620px] rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-b from-sky-200 to-sky-100 dark:from-slate-900 dark:to-slate-950">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Overlay Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
        <div className="glass-panel px-3.5 py-1.5 rounded-full border border-white/30 text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 shadow-md">
          <span className="text-base">🏝️</span>
          <span>{island.islandName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold">
            Lv {island.houseLevel}
          </span>
        </div>

        {isVisiting && (
          <div className="glass-panel px-3 py-1.5 rounded-full border border-amber-400 bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-extrabold shadow-md flex items-center gap-1">
            <span>👁️ Spectator Mode</span>
          </div>
        )}
      </div>

      {/* Interactive Hint Notification */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className="glass-panel px-3 py-1.5 rounded-full border border-white/20 text-[11px] font-semibold text-slate-700 dark:text-slate-300 shadow-sm flex items-center gap-1">
          <span>👆 Tap ground to walk Bean · Tap crops to harvest</span>
        </div>
      </div>

      {/* Action feedback toast */}
      {actionFeedback && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 glass-card px-4 py-2 rounded-full border border-blue-400 text-xs font-bold text-blue-700 dark:text-blue-300 animate-in fade-in duration-200 shadow-lg">
          {actionFeedback}
        </div>
      )}

      {/* Collapsible Bottom Control Dock (Three.js skill directive: Zero viewport occlusion) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-[640px] flex flex-col items-center gap-1.5">
        <button
          onClick={() => setHudCollapsed(!hudCollapsed)}
          className="px-3 py-0.5 rounded-full glass-panel border border-white/20 text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
          title={hudCollapsed ? 'Show Controls' : 'Hide Controls'}
        >
          {hudCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>{hudCollapsed ? 'Show Controls' : 'Hide Controls'}</span>
        </button>

        {!hudCollapsed && (
          <div className="w-full glass-card rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-1.5 shadow-2xl border border-white/20 backdrop-blur-xl">
            {isVisiting ? (
              <button
                onClick={onReturnHome}
                className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-600/20"
              >
                <ArrowLeft className="w-4 h-4" /> Return to My Island
              </button>
            ) : (
              <>
                <button
                  onClick={onWaterSoil}
                  className="flex-1 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  title="Sprinkle water on farm plots"
                >
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span className="hidden sm:inline">Water</span>
                </button>

                <button
                  onClick={onOpenShop}
                  className="flex-1 h-10 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  title="Farm Seeds & Cabin Expansions"
                >
                  <Home className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Shop</span>
                </button>

                <button
                  onClick={onOpenWardrobe}
                  className="flex-1 h-10 rounded-xl bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  title="Change Bean's Outfit & Hat"
                >
                  <Palette className="w-3.5 h-3.5 text-pink-500" />
                  <span className="hidden sm:inline">Wardrobe</span>
                </button>

                <button
                  onClick={onOpenMap}
                  className="flex-1 h-10 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  title="Fly Hot Air Balloon to Friends"
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Sky Map</span>
                </button>

                <button
                  onClick={onOpenFriends}
                  className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  title="Friends & Visiting Code"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Friends</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
