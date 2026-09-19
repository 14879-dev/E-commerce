import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from "lucide-react";

interface StepInfo {
  id: number;
  title: string;
  subtitle: string;
  instruction: string;
  tip: string;
  badge: string;
  color: string;
}

const STEPS: StepInfo[] = [
  {
    id: 0,
    title: "1. Lay Reference Sheet Flat",
    subtitle: "A4 paper (or Credit Card) flat on contrasting floor",
    instruction: "Place your clean A4 paper sheet flat against the floor. Make sure corners are uncurled and the floor has good contrast.",
    tip: "The algorithm uses this known size (210×297 mm) as a real-world scale ruler.",
    badge: "Scale Calibration",
    color: "#f59e0b",
  },
  {
    id: 1,
    title: "2. Position Bare Foot Beside It",
    subtitle: "Bare foot placed straight and parallel to the sheet",
    instruction: "Step barefoot beside the reference paper with a 2–3 cm gap. Point your toes straight forward in line with the paper.",
    tip: "No socks. Your entire foot from toe tip to heel must be visible and flat.",
    badge: "Foot Alignment",
    color: "#38bdf8",
  },
  {
    id: 2,
    title: "3. Hold Camera 90° Overhead",
    subtitle: "Phone positioned 30–50 cm directly above",
    instruction: "Hold your phone completely flat at a 90° perpendicular angle above both foot and paper. Do not take photos from an angle.",
    tip: "A top-down view eliminates perspective distortion for true millimeter accuracy.",
    badge: "Overhead 90°",
    color: "#10b981",
  },
  {
    id: 3,
    title: "4. AI Scan Measures Toe to Heel",
    subtitle: "Strictly toe-tip to heel bounding calculation",
    instruction: "Hold still and capture. The computer vision pipeline isolates your foot contour and measures strictly from big toe to heel.",
    tip: "Outputs your verified EU, UK & US sizes with millimeter precision.",
    badge: "Toe-to-Heel AI Scan",
    color: "#8b5cf6",
  },
];

export default function FootScanDemo({
  calibrationObject = "a4_paper",
  onClose,
}: {
  calibrationObject?: string;
  onClose?: () => void;
}) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const animFrameId = useRef<number | null>(null);

  // References to 3D scene objects to animate smoothly
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const paperMeshRef = useRef<THREE.Mesh | null>(null);
  const footGroupRef = useRef<THREE.Group | null>(null);
  const phoneGroupRef = useRef<THREE.Group | null>(null);
  const laserMeshRef = useRef<THREE.Mesh | null>(null);
  const measureLineRef = useRef<THREE.Line | null>(null);
  const beamConeRef = useRef<THREE.Mesh | null>(null);

  // Drag interaction state
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const orbitRotation = useRef<{ x: number; y: number }>({ x: 0.35, y: -0.2 });

  // Step transitions interpolation targets
  const stepTarget = useRef<{
    camY: number;
    camZ: number;
    camX: number;
    paperY: number;
    footY: number;
    footOpacity: number;
    phoneY: number;
    phoneTilt: number;
    laserVisible: boolean;
  }>({
    camY: 3.2,
    camZ: 4.6,
    camX: 0,
    paperY: 0.01,
    footY: -2.0,
    footOpacity: 0.0,
    phoneY: 5.0,
    phoneTilt: 0,
    laserVisible: false,
  });

  // Update target positions when currentStep changes
  useEffect(() => {
    switch (currentStep) {
      case 0:
        // Focus on Paper
        stepTarget.current = {
          camX: -0.8,
          camY: 2.8,
          camZ: 3.8,
          paperY: 0.02,
          footY: -1.5,
          footOpacity: 0.15,
          phoneY: 5.5,
          phoneTilt: 0.4,
          laserVisible: false,
        };
        break;
      case 1:
        // Focus on Foot beside Paper
        stepTarget.current = {
          camX: 0.3,
          camY: 2.9,
          camZ: 4.2,
          paperY: 0.02,
          footY: 0.02,
          footOpacity: 1.0,
          phoneY: 5.5,
          phoneTilt: 0.3,
          laserVisible: false,
        };
        break;
      case 2:
        // Focus on 90° Overhead Phone
        stepTarget.current = {
          camX: 0.0,
          camY: 4.6,
          camZ: 3.2,
          paperY: 0.02,
          footY: 0.02,
          footOpacity: 1.0,
          phoneY: 3.2,
          phoneTilt: Math.PI / 2, // 90° pointing down
          laserVisible: false,
        };
        break;
      case 3:
        // Laser Scanning & Measurement
        stepTarget.current = {
          camX: 0.4,
          camY: 3.6,
          camZ: 3.5,
          paperY: 0.02,
          footY: 0.02,
          footOpacity: 1.0,
          phoneY: 3.6,
          phoneTilt: Math.PI / 2,
          laserVisible: true,
        };
        break;
    }
  }, [currentStep]);

  // Gentle auto-play timer (only if user explicitly enables it)
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % STEPS.length);
    }, 6000); // Generous 6 seconds per step, no rushing
    return () => clearInterval(timer);
  }, [autoPlay]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = 320;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 3.2, 4.6);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    keyLight.position.set(4, 8, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const warmFill = new THREE.DirectionalLight(0xf59e0b, 0.8);
    warmFill.position.set(-4, 5, -2);
    scene.add(warmFill);

    // 4. World Group (rotated by user drag)
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // 5. 3D Studio Floor
    const floorGeo = new THREE.PlaneGeometry(12, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.85,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    worldGroup.add(floor);

    // Floor Grid lines
    const gridHelper = new THREE.GridHelper(10, 20, 0x1e293b, 0x0f172a);
    gridHelper.position.y = 0.005;
    worldGroup.add(gridHelper);

    // 6. 3D A4 Paper Reference Sheet (210 x 297 mm -> 1.4 x 1.98 units)
    const isCard = calibrationObject === "credit_card";
    const pW = isCard ? 0.9 : 1.4;
    const pH = isCard ? 0.57 : 1.98;

    const paperGeo = new THREE.BoxGeometry(pW, 0.02, pH);
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
      metalness: 0.05,
    });
    const paperMesh = new THREE.Mesh(paperGeo, paperMat);
    paperMesh.position.set(-0.9, 0.01, 0);
    paperMesh.castShadow = true;
    paperMesh.receiveShadow = true;
    worldGroup.add(paperMesh);
    paperMeshRef.current = paperMesh;

    // Paper border outline
    const paperEdges = new THREE.EdgesGeometry(paperGeo);
    const paperLine = new THREE.LineSegments(
      paperEdges,
      new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 })
    );
    paperMesh.add(paperLine);

    // 7. 3D Stylized Foot Model (Parallel beside paper at x = +0.5)
    const footGroup = new THREE.Group();
    footGroup.position.set(0.5, 0.01, 0);
    worldGroup.add(footGroup);
    footGroupRef.current = footGroup;

    // Foot skin tone material
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373,
      roughness: 0.6,
      metalness: 0.1,
    });

    // Heel
    const heelGeo = new THREE.SphereGeometry(0.32, 16, 16);
    heelGeo.scale(1, 0.6, 1.2);
    const heel = new THREE.Mesh(heelGeo, skinMat);
    heel.position.set(0, 0.16, 0.58);
    heel.castShadow = true;
    footGroup.add(heel);

    // Arch & Metatarsal Bridge
    const bridgeGeo = new THREE.CylinderGeometry(0.38, 0.32, 0.9, 16);
    bridgeGeo.scale(1, 0.35, 1.3);
    const bridge = new THREE.Mesh(bridgeGeo, skinMat);
    bridge.position.set(0, 0.16, 0.05);
    bridge.rotation.x = Math.PI / 2;
    bridge.castShadow = true;
    footGroup.add(bridge);

    // Ball of Foot
    const ballGeo = new THREE.SphereGeometry(0.38, 16, 16);
    ballGeo.scale(1.1, 0.45, 0.9);
    const ball = new THREE.Mesh(ballGeo, skinMat);
    ball.position.set(0, 0.16, -0.45);
    ball.castShadow = true;
    footGroup.add(ball);

    // 5 Toes
    const toeSizes = [0.13, 0.11, 0.10, 0.09, 0.08];
    const toeOffsets = [-0.25, -0.12, 0.0, 0.12, 0.23];
    toeSizes.forEach((r, idx) => {
      const toeGeo = new THREE.SphereGeometry(r, 12, 12);
      toeGeo.scale(1, 0.7, 1.2);
      const toe = new THREE.Mesh(toeGeo, skinMat);
      const zOffset = -0.82 - (idx === 0 ? 0.05 : idx * 0.015);
      toe.position.set(toeOffsets[idx], 0.1, zOffset);
      toe.castShadow = true;
      footGroup.add(toe);
    });

    // Foot Bounding Target Box (Cyan wireframe around foot)
    const footBoxGeo = new THREE.BoxGeometry(0.95, 0.35, 1.85);
    const footBoxEdges = new THREE.EdgesGeometry(footBoxGeo);
    const footBoxLine = new THREE.LineSegments(
      footBoxEdges,
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 })
    );
    footBoxLine.position.y = 0.18;
    footGroup.add(footBoxLine);

    // 8. 3D Smartphone (Floats overhead)
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(0, 3.2, 0);
    phoneGroup.rotation.x = Math.PI / 2;
    worldGroup.add(phoneGroup);
    phoneGroupRef.current = phoneGroup;

    const phoneBodyGeo = new THREE.BoxGeometry(0.8, 1.6, 0.08);
    const phoneBodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const phoneBody = new THREE.Mesh(phoneBodyGeo, phoneBodyMat);
    phoneBody.castShadow = true;
    phoneGroup.add(phoneBody);

    // Phone Screen Viewport
    const screenGeo = new THREE.PlaneGeometry(0.72, 1.48);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.z = -0.045;
    screen.rotation.y = Math.PI;
    phoneGroup.add(screen);

    // Camera Lens on back
    const lensGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16);
    const lensMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0.24, 0.55, 0.05);
    lens.rotation.x = Math.PI / 2;
    phoneGroup.add(lens);

    // Overhead Projection Cone (Frustum light)
    const coneGeo = new THREE.ConeGeometry(1.9, 3.0, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, 1.5, 0);
    cone.rotation.x = Math.PI;
    worldGroup.add(cone);
    beamConeRef.current = cone;

    // 9. 3D Laser Scanning Beam (Cyan ribbon)
    const laserGeo = new THREE.PlaneGeometry(1.0, 0.06);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
    });
    const laser = new THREE.Mesh(laserGeo, laserMat);
    laser.rotation.x = Math.PI / 2;
    laser.position.set(0.5, 0.38, 0);
    worldGroup.add(laser);
    laserMeshRef.current = laser;

    // 10. Measurement Line (Connecting Toe to Heel)
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0.5, 0.42, 0.85),  // Heel
      new THREE.Vector3(0.5, 0.42, -0.92), // Toe
    ]);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 3 });
    const measureLine = new THREE.Line(lineGeo, lineMat);
    worldGroup.add(measureLine);
    measureLineRef.current = measureLine;

    // 11. Mouse/Touch Drag Handlers for 3D Orbiting
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevMousePos.current.x;
      const dy = e.clientY - prevMousePos.current.y;
      prevMousePos.current = { x: e.clientX, y: e.clientY };

      orbitRotation.current.y += dx * 0.008;
      orbitRotation.current.x = Math.max(0.1, Math.min(1.2, orbitRotation.current.x + dy * 0.008));
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // Touch support
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMousePos.current.x;
      const dy = e.touches[0].clientY - prevMousePos.current.y;
      prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      orbitRotation.current.y += dx * 0.01;
      orbitRotation.current.x = Math.max(0.1, Math.min(1.2, orbitRotation.current.x + dy * 0.01));
    };
    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    dom.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    // 12. Animation Render Loop
    let clock = 0;
    const animate = () => {
      clock += 0.02;

      // Smooth step target lerps
      const t = stepTarget.current;
      camera.position.x += (t.camX - camera.position.x) * 0.06;
      camera.position.y += (t.camY - camera.position.y) * 0.06;
      camera.position.z += (t.camZ - camera.position.z) * 0.06;
      camera.lookAt(0.1, 0.4, 0);

      // World group smooth orbit from user drag
      worldGroup.rotation.y += (orbitRotation.current.y - worldGroup.rotation.y) * 0.1;
      worldGroup.rotation.x += (orbitRotation.current.x - worldGroup.rotation.x) * 0.1;

      // Phone float & tilt
      if (phoneGroupRef.current) {
        phoneGroupRef.current.position.y += (t.phoneY - phoneGroupRef.current.position.y) * 0.05;
        phoneGroupRef.current.rotation.x += (t.phoneTilt - phoneGroupRef.current.rotation.x) * 0.05;
      }

      // Projection cone visibility
      if (beamConeRef.current) {
        beamConeRef.current.visible = currentStep === 2 || currentStep === 3;
      }

      // Laser sweep animation (Step 3)
      if (laserMeshRef.current) {
        laserMeshRef.current.visible = t.laserVisible;
        if (t.laserVisible) {
          // Sweep back and forth along Z (-0.9 to 0.8)
          laserMeshRef.current.position.z = Math.sin(clock * 2) * 0.82;
        }
      }

      // Measurement line visibility
      if (measureLineRef.current) {
        measureLineRef.current.visible = t.laserVisible;
      }

      renderer.render(scene, camera);
      animFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 640;
      camera.aspect = newW / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener("resize", handleResize);
      dom.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      dom.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      renderer.dispose();
    };
  }, [calibrationObject]);

  const stepInfo = STEPS[currentStep];

  const resetView = () => {
    orbitRotation.current = { x: 0.35, y: -0.2 };
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Interactive Scanning Guide
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
            Drag to Rotate
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetView}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Reset Camera View"
          >
            <RotateCcw className="w-3 h-3" /> Reset View
          </button>

          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg transition-colors border ${
              autoPlay
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
            title={autoPlay ? "Pause Auto-Step" : "Play Smooth Walkthrough"}
          >
            {autoPlay ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{autoPlay ? "Auto: ON" : "Auto: OFF"}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div className="relative">
        <div ref={mountRef} className="w-full h-[320px] bg-slate-950 cursor-grab active:cursor-grabbing" />

        {/* 3D Overlay Badges */}
        <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1.5">
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-200 flex items-center gap-2 shadow-lg">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: stepInfo.color }}
            />
            <span>{stepInfo.badge}</span>
          </div>

          <span className="text-[10px] text-slate-400 bg-slate-950/75 px-2 py-0.5 rounded-md backdrop-blur-sm border border-slate-800">
            Click & drag anywhere to inspect angle
          </span>
        </div>

        {/* Live Step Overlay Callout */}
        <div className="absolute bottom-3 right-3 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 text-right shadow-xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              Step {currentStep + 1} of 4
            </div>
            <div className="text-xs font-bold text-white">
              {currentStep === 0 && "Flat Floor Setup"}
              {currentStep === 1 && "Barefoot Placement"}
              {currentStep === 2 && "90° Perpendicular Angle"}
              {currentStep === 3 && "Toe-to-Heel Laser Scan"}
            </div>
          </div>
        </div>
      </div>

      {/* Step Tabs Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-b border-slate-800/80 bg-slate-950">
        {STEPS.map((s, idx) => {
          const isActive = idx === currentStep;
          return (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={`py-2.5 px-3 text-left transition-all border-r border-slate-800/60 last:border-r-0 ${
                isActive
                  ? "bg-slate-900 text-white border-b-2 border-b-blue-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Step 0{idx + 1}
              </div>
              <div className="text-xs font-bold truncate mt-0.5">{s.title.split("—")[0]}</div>
            </button>
          );
        })}
      </div>

      {/* Step Guidance Text & Controls */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/40">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: stepInfo.color }}
            />
            <h4 className="font-bold text-sm text-slate-100">{stepInfo.title}</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{stepInfo.instruction}</p>
          <p className="text-[11px] text-amber-300/90 font-medium italic mt-1">
            💡 {stepInfo.tip}
          </p>
        </div>

        {/* Previous / Next Step Buttons (No Rushing!) */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => setCurrentStep((prev) => (prev - 1 + STEPS.length) % STEPS.length)}
            disabled={currentStep === 0}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all ${
              currentStep === 0
                ? "opacity-40 cursor-not-allowed border-slate-800 text-slate-600"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev Step
          </button>

          <button
            onClick={() => setCurrentStep((prev) => (prev + 1) % STEPS.length)}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all"
          >
            <span>{currentStep === STEPS.length - 1 ? "Replay Guide" : "Next Step"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}