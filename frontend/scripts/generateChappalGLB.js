// Generator script for authentic 3D Peshawari Chappal (.glb)
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as fs from 'fs';
import * as path from 'path';

// Node FileReader polyfill for GLTFExporter
class FileReaderPolyfill {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
}
globalThis.FileReader = FileReaderPolyfill;

export function buildPeshawariChappalScene(options = {}) {
  const {
    upperColor = '#8B5A34',     // Saddle Tan default
    soleColor = '#161616',      // Tyre rubber black
    weltColor = '#3D2314',      // Natural leather welt
    insoleColor = '#7A4A28',    // Soft insole leather
    stitchColor = '#F0E6D2',    // Linen wax thread
    buckleColor = '#D4AF37',    // Aged brass
    buckleMetalness = 0.92,
    buckleRoughness = 0.22,
  } = options;

  const root = new THREE.Group();
  root.name = 'PeshawariChappal';

  // Materials
  const upperMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(upperColor),
    roughness: 0.38,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });

  const soleMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(soleColor),
    roughness: 0.92,
    metalness: 0.02,
  });

  const weltMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(weltColor),
    roughness: 0.65,
    metalness: 0.05,
  });

  const insoleMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(insoleColor),
    roughness: 0.45,
    metalness: 0.06,
  });

  const stitchMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(stitchColor),
    roughness: 0.8,
    metalness: 0.0,
  });

  const buckleMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(buckleColor),
    metalness: buckleMetalness,
    roughness: buckleRoughness,
  });

  // ----------------------------------------------------
  // 1. OUTSOLE SHAPE (Anatomical Peshawari Footprint)
  // ----------------------------------------------------
  const soleShape = new THREE.Shape();
  soleShape.moveTo(0, -1.15); // Heel center
  soleShape.bezierCurveTo(-0.25, -1.15, -0.42, -1.05, -0.42, -0.75); // Medial heel
  soleShape.bezierCurveTo(-0.42, -0.5, -0.32, -0.15, -0.32, 0.05);   // Medial arch (waist scoop)
  soleShape.bezierCurveTo(-0.32, 0.25, -0.52, 0.45, -0.52, 0.70);    // Medial ball flare
  soleShape.bezierCurveTo(-0.52, 0.95, -0.35, 1.18, 0.05, 1.25);     // Distinctive Peshawari curved toe
  soleShape.bezierCurveTo(0.35, 1.20, 0.52, 0.95, 0.52, 0.70);       // Lateral toe
  soleShape.bezierCurveTo(0.52, 0.45, 0.46, 0.25, 0.44, 0.0);        // Lateral ball & waist
  soleShape.bezierCurveTo(0.42, -0.3, 0.44, -0.65, 0.42, -0.75);     // Lateral heel
  soleShape.bezierCurveTo(0.42, -1.05, 0.25, -1.15, 0, -1.15);       // Close at heel

  // 1a. Tyre Tread Outsole (Bottom)
  const soleGeom = new THREE.ExtrudeGeometry(soleShape, {
    depth: 0.07,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.02,
    bevelThickness: 0.02,
  });
  soleGeom.center();
  const soleMesh = new THREE.Mesh(soleGeom, soleMat);
  soleMesh.rotation.x = Math.PI / 2;
  soleMesh.position.set(0, -0.05, 0);
  soleMesh.castShadow = true;
  soleMesh.receiveShadow = true;
  root.add(soleMesh);

  // 1b. Tyre Tread Grooves (Bottom grip)
  const treadGroup = new THREE.Group();
  for (let i = -0.8; i <= 0.8; i += 0.18) {
    const treadGeom = new THREE.BoxGeometry(0.55, 0.015, 0.06);
    const treadMesh = new THREE.Mesh(treadGeom, soleMat);
    treadMesh.position.set(0, -0.10, i);
    treadMesh.rotation.y = 0.2;
    treadGroup.add(treadMesh);
  }
  root.add(treadGroup);

  // 1c. Natural Leather Welt (Middle rim)
  const weltGeom = new THREE.ExtrudeGeometry(soleShape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.015,
  });
  weltGeom.center();
  const weltMesh = new THREE.Mesh(weltGeom, weltMat);
  weltMesh.rotation.x = Math.PI / 2;
  weltMesh.position.set(0, 0.0, 0);
  weltMesh.castShadow = true;
  root.add(weltMesh);

  // 1d. Perimeter Wax-Thread Welt Stitches
  const stitchCurvePoints = soleShape.getSpacedPoints(80);
  const stitchGroup = new THREE.Group();
  stitchCurvePoints.forEach((pt, idx) => {
    if (idx % 2 === 0) {
      const dot = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.01, 0.035), stitchMat);
      dot.position.set(pt.x * 1.02, 0.025, -pt.y * 1.02);
      const angle = Math.atan2(pt.y, pt.x);
      dot.rotation.y = angle;
      stitchGroup.add(dot);
    }
  });
  root.add(stitchGroup);

  // 1e. Cushioned Leather Footbed (Top)
  const insoleShape = new THREE.Shape();
  const scaleInsole = 0.94;
  soleCurveScaled(insoleShape, scaleInsole);

  const insoleGeom = new THREE.ExtrudeGeometry(insoleShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.015,
    bevelThickness: 0.012,
  });
  insoleGeom.center();
  const insoleMesh = new THREE.Mesh(insoleGeom, insoleMat);
  insoleMesh.rotation.x = Math.PI / 2;
  insoleMesh.position.set(0, 0.028, 0);
  insoleMesh.receiveShadow = true;
  root.add(insoleMesh);

  // 1f. Gold Embossed Brand Crest on Heel
  const crestGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.005, 24);
  const crestMesh = new THREE.Mesh(crestGeom, buckleMat);
  crestMesh.position.set(0, 0.045, 0.72);
  root.add(crestMesh);

  // ----------------------------------------------------
  // 2. SIGNATURE CROSS-OVER VAMP STRAPS (Kaptaan Cut)
  // ----------------------------------------------------
  // Strap 1: Outer arch to inner toe (sweeps up across bridge)
  const strap1Curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.44, 0.03, -0.05),     // Outer root
    new THREE.Vector3(0.35, 0.18, 0.08),
    new THREE.Vector3(0.05, 0.32, 0.28),      // Arch apex
    new THREE.Vector3(-0.25, 0.22, 0.52),
    new THREE.Vector3(-0.38, 0.04, 0.72),     // Inner toe root
  ]);

  const strap1Mesh = createCurvedStrapMesh(strap1Curve, 0.34, 0.035, upperMat, stitchMat);
  strap1Mesh.castShadow = true;
  root.add(strap1Mesh);

  // Strap 2: Inner arch to outer toe (crosses OVER Strap 1)
  const strap2Curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.35, 0.03, -0.10),    // Inner root
    new THREE.Vector3(-0.28, 0.20, 0.06),
    new THREE.Vector3(-0.02, 0.36, 0.30),     // Apex (sits slightly higher, crossing over)
    new THREE.Vector3(0.24, 0.24, 0.54),
    new THREE.Vector3(0.40, 0.04, 0.75),      // Outer toe root
  ]);

  const strap2Mesh = createCurvedStrapMesh(strap2Curve, 0.34, 0.035, upperMat, stitchMat);
  strap2Mesh.castShadow = true;
  root.add(strap2Mesh);

  // ----------------------------------------------------
  // 3. FRONT TOE CAP / HOOD (Traditional Curved Tip)
  // ----------------------------------------------------
  const toeCapShape = new THREE.Shape();
  toeCapShape.moveTo(-0.34, 0.85);
  toeCapShape.quadraticCurveTo(0, 0.72, 0.34, 0.85);
  toeCapShape.quadraticCurveTo(0.42, 1.12, 0.05, 1.24);
  toeCapShape.quadraticCurveTo(-0.38, 1.12, -0.34, 0.85);

  const toeCapGeom = new THREE.ExtrudeGeometry(toeCapShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.03,
    bevelThickness: 0.03,
  });
  toeCapGeom.center();
  const toeCapMesh = new THREE.Mesh(toeCapGeom, upperMat);
  toeCapMesh.rotation.x = Math.PI / 2 + 0.12;
  toeCapMesh.position.set(0.02, 0.09, -0.98);
  toeCapMesh.scale.set(0.95, 0.95, 0.65);
  toeCapMesh.castShadow = true;
  root.add(toeCapMesh);

  // ----------------------------------------------------
  // 4. HEEL QUARTERS & SLINGBACK ANKLE STRAP
  // ----------------------------------------------------
  // Outer Quarter Tab
  const outerTabGeom = new THREE.BoxGeometry(0.04, 0.22, 0.28);
  const outerTab = new THREE.Mesh(outerTabGeom, upperMat);
  outerTab.position.set(0.42, 0.13, 0.52);
  outerTab.rotation.y = -0.15;
  outerTab.rotation.z = -0.1;
  root.add(outerTab);

  // Inner Quarter Tab
  const innerTabGeom = new THREE.BoxGeometry(0.04, 0.22, 0.28);
  const innerTab = new THREE.Mesh(innerTabGeom, upperMat);
  innerTab.position.set(-0.40, 0.13, 0.52);
  innerTab.rotation.y = 0.15;
  innerTab.rotation.z = 0.1;
  root.add(innerTab);

  // Slingback Ankle Strap (Wraps around Achilles tendon)
  const slingCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.38, 0.18, 0.50),   // Inner tab
    new THREE.Vector3(-0.32, 0.26, 0.85),
    new THREE.Vector3(0.0, 0.28, 1.05),     // Back heel center
    new THREE.Vector3(0.32, 0.26, 0.85),
    new THREE.Vector3(0.42, 0.18, 0.50),    // Outer tab
  ]);

  const slingMesh = createCurvedStrapMesh(slingCurve, 0.16, 0.03, upperMat, stitchMat);
  slingMesh.castShadow = true;
  root.add(slingMesh);

  // ----------------------------------------------------
  // 5. SOLID BRASS BUCKLE ASSEMBLY (Outer Lateral Ankle)
  // ----------------------------------------------------
  const buckleGroup = new THREE.Group();
  buckleGroup.position.set(0.46, 0.20, 0.46);
  buckleGroup.rotation.y = -0.3;
  buckleGroup.rotation.z = 0.15;

  // 5a. Buckle Outer Rectangular Frame
  const frameW = 0.18, frameH = 0.24, tubeR = 0.022;
  const frameTop = new THREE.Mesh(new THREE.CylinderGeometry(tubeR, tubeR, frameW, 16), buckleMat);
  frameTop.rotation.z = Math.PI / 2;
  frameTop.position.set(0, frameH / 2, 0);

  const frameBottom = new THREE.Mesh(new THREE.CylinderGeometry(tubeR, tubeR, frameW, 16), buckleMat);
  frameBottom.rotation.z = Math.PI / 2;
  frameBottom.position.set(0, -frameH / 2, 0);

  const frameLeft = new THREE.Mesh(new THREE.CylinderGeometry(tubeR, tubeR, frameH, 16), buckleMat);
  frameLeft.position.set(-frameW / 2, 0, 0);

  const frameRight = new THREE.Mesh(new THREE.CylinderGeometry(tubeR, tubeR, frameH, 16), buckleMat);
  frameRight.position.set(frameW / 2, 0, 0);

  // 5b. Buckle Center Pin / Tongue (Prong)
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, frameW * 0.95, 16), buckleMat);
  pin.rotation.z = Math.PI / 2;
  pin.position.set(0, 0, 0);

  const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.008, 0.14, 12), buckleMat);
  prong.position.set(0, 0.04, 0.04);
  prong.rotation.x = -0.55;

  // 5c. Leather Keeper Loop
  const keeper = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.20, 0.08), upperMat);
  keeper.position.set(0.08, 0, -0.02);

  buckleGroup.add(frameTop, frameBottom, frameLeft, frameRight, pin, prong, keeper);
  root.add(buckleGroup);

  return root;
}

// Helper: Curved Strap with Stitches along edges
function createCurvedStrapMesh(curve, width, thickness, strapMat, stitchMat) {
  const group = new THREE.Group();
  const segments = 28;

  const vertices = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    if (normal.length() === 0) normal.set(1, 0, 0);

    const pLeft = new THREE.Vector3().copy(pt).addScaledVector(normal, width / 2);
    const pRight = new THREE.Vector3().copy(pt).addScaledVector(normal, -width / 2);

    vertices.push(pLeft.x, pLeft.y, pLeft.z);
    vertices.push(pRight.x, pRight.y, pRight.z);

    normals.push(0, 1, 0);
    normals.push(0, 1, 0);

    uvs.push(0, t);
    uvs.push(1, t);

    // Stitches along edges
    if (i % 3 === 0 && stitchMat) {
      const sL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.015, 0.035), stitchMat);
      sL.position.copy(pLeft).addScaledVector(normal, -0.035);
      group.add(sL);

      const sR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.015, 0.035), stitchMat);
      sR.position.copy(pRight).addScaledVector(normal, 0.035);
      group.add(sR);
    }
  }

  for (let i = 0; i < segments; i++) {
    const base = i * 2;
    indices.push(base, base + 1, base + 2);
    indices.push(base + 1, base + 3, base + 2);
    // Double sided
    indices.push(base, base + 2, base + 1);
    indices.push(base + 1, base + 2, base + 3);
  }

  const ribbonGeom = new THREE.BufferGeometry();
  ribbonGeom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  ribbonGeom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  ribbonGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  ribbonGeom.setIndex(indices);
  ribbonGeom.computeVertexNormals();

  const mesh = new THREE.Mesh(ribbonGeom, strapMat);
  group.add(mesh);

  return group;
}

function soleCurveScaled(shape, s) {
  shape.moveTo(0, -1.15 * s);
  shape.bezierCurveTo(-0.25 * s, -1.15 * s, -0.42 * s, -1.05 * s, -0.42 * s, -0.75 * s);
  shape.bezierCurveTo(-0.42 * s, -0.5 * s, -0.32 * s, -0.15 * s, -0.32 * s, 0.05 * s);
  shape.bezierCurveTo(-0.32 * s, 0.25 * s, -0.52 * s, 0.45 * s, -0.52 * s, 0.70 * s);
  shape.bezierCurveTo(-0.52 * s, 0.95 * s, -0.35 * s, 1.18 * s, 0.05 * s, 1.25 * s);
  shape.bezierCurveTo(0.35 * s, 1.20 * s, 0.52 * s, 0.95 * s, 0.52 * s, 0.70 * s);
  shape.bezierCurveTo(0.52 * s, 0.45 * s, 0.46 * s, 0.25 * s, 0.44 * s, 0.0 * s);
  shape.bezierCurveTo(0.42 * s, -0.3 * s, 0.44 * s, -0.65 * s, 0.42 * s, -0.75 * s);
  shape.bezierCurveTo(0.42 * s, -1.05 * s, 0.25 * s, -1.15 * s, 0, -1.15 * s);
}

// ----------------------------------------------------
// Export GLB files
// ----------------------------------------------------
async function main() {
  const modelsDir = path.resolve('public/models');
  if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

  const colorVariants = [
    { name: 'kaptaan-tan', upper: '#8B5A34', sole: '#161616', buckle: '#D4AF37' },
    { name: 'zalmi-copper', upper: '#A8481D', sole: '#161616', buckle: '#C1602E' },
    { name: 'norzi-espresso', upper: '#2D180C', sole: '#161616', buckle: '#D4AF37' },
    { name: 'quetta-gold', upper: '#B8860B', sole: '#161616', buckle: '#D4AF37' },
    { name: 'royal-black', upper: '#1A1817', sole: '#161616', buckle: '#C0C0C0' },
  ];

  const exporter = new GLTFExporter();

  for (const variant of colorVariants) {
    const scene = new THREE.Scene();
    const chappal = buildPeshawariChappalScene({
      upperColor: variant.upper,
      soleColor: variant.sole,
      buckleColor: variant.buckle,
    });
    scene.add(chappal);

    const glbBuffer = await exporter.parseAsync(scene, { binary: true });
    const outPath = path.join(modelsDir, `${variant.name}.glb`);
    fs.writeFileSync(outPath, Buffer.from(glbBuffer));
    console.log(`Generated ${outPath} (${(glbBuffer.byteLength / 1024).toFixed(1)} KB)`);
  }

  // Also write default chappal.glb
  const defaultScene = new THREE.Scene();
  defaultScene.add(buildPeshawariChappalScene());
  const defaultGlb = await exporter.parseAsync(defaultScene, { binary: true });
  fs.writeFileSync(path.join(modelsDir, 'peshawari-chappal.glb'), Buffer.from(defaultGlb));
  console.log(`Generated default peshawari-chappal.glb (${(defaultGlb.byteLength / 1024).toFixed(1)} KB)`);
}

main().catch(console.error);
