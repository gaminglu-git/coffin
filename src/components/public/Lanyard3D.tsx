/* eslint-disable react/no-unknown-property */
"use client";

import { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  Environment,
  Lightformer,
} from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RigidBodyProps,
  type RapierRigidBody as RapierBody,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";

extend({ MeshLineGeometry, MeshLineMaterial });

/** Erzeugt eine Canvas-Textur mit dem Unternehmensnamen für das Lanyard-Band */
function createBandTexture(companyName: string): THREE.CanvasTexture {
  const w = 1024;
  const h = 320;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#fafaf9"; // stone-50
  ctx.fillRect(0, 0, w, h);

  ctx.font = "bold 104px Georgia, serif";
  ctx.fillStyle = "#047857"; // emerald-800
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(companyName, w / 2, h / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 16;
  return tex;
}

/** Zeichnet Text mit Zeilenumbruch und zentrierter Ausrichtung. Bei mehreren Zeilen wird der Block tiefer positioniert. */
function wrapAndDrawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  baseY: number,
  maxWidth: number,
  lineHeight: number,
  extraYPerLine: number = 22
): void {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const centerY = baseY + (lines.length - 1) * extraYPerLine;
  const totalHeight = lines.length * lineHeight;
  let drawY = centerY - (totalHeight - lineHeight) / 2;
  for (const line of lines) {
    ctx.fillText(line, x, drawY);
    drawY += lineHeight;
  }
}

/** Lädt ein Bild und gibt es als Promise zurück */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src.startsWith("/") ? window.location.origin + src : src;
  });
}

/** Erzeugt eine Canvas-Textur für die Karte (LanyardCard-Layout mit quadratischem Foto) */
async function createCardTexture(
  _logoUrl: string,
  _companyName: string,
  employeeName: string,
  employeeRole: string,
  employeeImage: string
): Promise<THREE.CanvasTexture> {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // GLB-Karte: UVs horizontal + vertikal gespiegelt. Wir zeichnen horizontal gespiegelt,
  // damit repeat(-1,-1)+offset(1,1) den Inhalt zentriert und lesbar darstellt.
  ctx.save();
  ctx.translate(size, 0);
  ctx.scale(-1, 1);

  // Hintergrund
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // Rahmen
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, size - 8, size - 8);

  const centerX = size / 2 - 260;

  // Quadratisches Mitarbeiterfoto (größer, oben positioniert – kein Logo/Firmenname mehr)
  const photoSize = 420;
  const photoY = 80;
  const photoX = centerX - photoSize / 2;
  try {
    const empImg = await loadImage(employeeImage);
    ctx.drawImage(empImg, photoX, photoY, photoSize, photoSize);
  } catch {
    ctx.fillStyle = "#d1fae5";
    ctx.fillRect(photoX, photoY, photoSize, photoSize);
  }

  // Rahmen um Foto (Rechteck)
  ctx.strokeStyle = "#d1fae5";
  ctx.lineWidth = 8;
  ctx.strokeRect(photoX, photoY, photoSize, photoSize);

  // Name (kleiner, damit er nicht über die Ränder ragt)
  ctx.font = "bold 52px Georgia, serif";
  ctx.fillStyle = "#047857";
  ctx.textAlign = "center";
  ctx.fillText(employeeName, centerX, 620);

  // Rolle (mit Zeilenumbruch, damit lange Titel nicht über die Karte ragen)
  ctx.font = "36px sans-serif";
  ctx.fillStyle = "#059669";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  wrapAndDrawText(ctx, employeeRole, centerX, 668, 380, 44);

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  // Beide Achsen spiegeln (GLB-UVs sind invertiert) → Inhalt zentriert und lesbar
  tex.repeat.set(-1, -1);
  tex.offset.set(1, 1);
  return tex;
}

interface CardData {
  logoUrl: string;
  companyName: string;
  employeeName: string;
  employeeRole: string;
  employeeImage: string;
}

interface Lanyard3DProps {
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
  transparent?: boolean;
  className?: string;
  /** Unternehmensname für das Band */
  companyName?: string;
  /** Daten für die Kartenvorderseite (LanyardCard-Layout) */
  cardData?: CardData;
  /** Triggert einen kleinen Impuls zum Auspendeln beim Einblenden */
  triggerSwing?: boolean;
}

function LanyardScene({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  companyName = "liebevoll bestatten",
  cardData,
  triggerSwing = false,
}: Omit<Lanyard3DProps, "className">) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    const handleResize = () =>
      setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Canvas
      camera={{ position, fov }}
      dpr={[1, isMobile ? 1.5 : 2]}
      gl={{ alpha: transparent }}
      onCreated={({ gl }) =>
        gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)
      }
    >
      <ambientLight intensity={Math.PI} />
      <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
        <Band
          isMobile={isMobile}
          companyName={companyName}
          cardData={cardData}
          triggerSwing={triggerSwing}
        />
      </Physics>
      <Environment blur={0.75}>
        <Lightformer
          intensity={2}
          color="white"
          position={[0, -1, 5]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          intensity={3}
          color="white"
          position={[-1, -1, 1]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          intensity={3}
          color="white"
          position={[1, 1, 1]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          intensity={10}
          color="white"
          position={[-10, 0, 14]}
          rotation={[0, Math.PI / 2, Math.PI / 3]}
          scale={[100, 10, 1]}
        />
      </Environment>
    </Canvas>
  );
}

interface BandProps {
  maxSpeed?: number;
  minSpeed?: number;
  isMobile?: boolean;
  companyName?: string;
  cardData?: CardData;
  triggerSwing?: boolean;
}

function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  companyName = "liebevoll bestatten",
  cardData,
  triggerSwing = false,
}: BandProps) {
  const band = useRef<THREE.Mesh>(null);
  const fixed = useRef<RapierBody>(null);
  const j1 = useRef<RapierBody>(null);
  const j2 = useRef<RapierBody>(null);
  const j3 = useRef<RapierBody>(null);
  const card = useRef<RapierBody>(null);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const segmentProps: Partial<RigidBodyProps> = {
    type: "dynamic",
    canSleep: true,
    colliders: false as RigidBodyProps["colliders"],
    angularDamping: 4,
    linearDamping: 4,
  };

  const gltf = useGLTF("/assets/lanyard/card.glb") as unknown as {
    nodes: {
      card: THREE.Mesh;
      clip: THREE.Mesh;
      clamp: THREE.Mesh;
    };
    materials: {
      base: THREE.MeshStandardMaterial & { map: THREE.Texture };
      metal: THREE.MeshStandardMaterial;
    };
  };
  const { nodes, materials } = gltf;

  const bandTexture = useMemo(
    () => createBandTexture(companyName),
    [companyName]
  );
  useEffect(() => () => bandTexture.dispose(), [bandTexture]);

  const [cardTexture, setCardTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!cardData) {
      setCardTexture(null);
      return;
    }
    let cancelled = false;
    createCardTexture(
      cardData.logoUrl,
      cardData.companyName,
      cardData.employeeName,
      cardData.employeeRole,
      cardData.employeeImage
    ).then((tex) => {
      if (!cancelled) {
        setCardTexture((prev) => {
          prev?.dispose();
          return tex;
        });
      } else {
        tex.dispose();
      }
    });
    return () => {
      cancelled = true;
      setCardTexture((prev) => {
        prev?.dispose();
        return null;
      });
    };
  }, [cardData]);
  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ])
  );
  const [dragged, drag] = useState<false | THREE.Vector3>(false);
  const [hovered, hover] = useState(false);
  const swingTriggeredRef = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useRopeJoint(fixed as any, j1 as any, [
    [0, 0, 0],
    [0, 0, 0],
    1,
  ]);
  useRopeJoint(j1 as any, j2 as any, [
    [0, 0, 0],
    [0, 0, 0],
    1,
  ]);
  useRopeJoint(j2 as any, j3 as any, [
    [0, 0, 0],
    [0, 0, 0],
    1,
  ]);
  useSphericalJoint(j3 as any, card as any, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab";
      return () => {
        document.body.style.cursor = "auto";
      };
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (triggerSwing && !swingTriggeredRef.current) {
      swingTriggeredRef.current = true;
      [j1, j2, j3, card].forEach((ref) => {
        const rb = ref.current as { wakeUp?: () => void; applyImpulse?: (v: { x: number; y: number; z: number }, w?: boolean) => void } | null;
        if (rb?.wakeUp && rb?.applyImpulse) {
          rb.wakeUp();
          rb.applyImpulse(
            {
              x: (Math.random() - 0.5) * 0.3,
              y: Math.random() * 0.15,
              z: (Math.random() - 0.5) * 0.15,
            },
            true
          );
        }
      });
    }
    if (dragged && typeof dragged !== "boolean") {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }
    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        const rb = ref.current as {
          translation?: () => { x: number; y: number; z: number };
          lerped?: THREE.Vector3;
        };
        if (!rb?.translation) return;
        const trans = rb.translation();
        if (!rb.lerped) rb.lerped = new THREE.Vector3(trans.x, trans.y, trans.z);
        const transVec = new THREE.Vector3(trans.x, trans.y, trans.z);
        const clampedDistance = Math.max(
          0.1,
          Math.min(1, rb.lerped.distanceTo(transVec))
        );
        rb.lerped.lerp(
          transVec,
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        );
      });
      const j3Trans = (j3.current as { translation?: () => { x: number; y: number; z: number } })?.translation?.();
      const j2Lerped = (j2.current as { lerped?: THREE.Vector3 })?.lerped;
      const j1Lerped = (j1.current as { lerped?: THREE.Vector3 })?.lerped;
      const fixedTrans = (fixed.current as { translation?: () => { x: number; y: number; z: number } })?.translation?.();
      if (j3Trans && fixedTrans && j2Lerped && j1Lerped) {
        curve.points[0].set(j3Trans.x, j3Trans.y, j3Trans.z);
        curve.points[1].copy(j2Lerped);
        curve.points[2].copy(j1Lerped);
        curve.points[3].set(fixedTrans.x, fixedTrans.y, fixedTrans.z);
      }
      if (band.current?.geometry && "setPoints" in band.current.geometry) {
        (band.current.geometry as { setPoints: (p: THREE.Vector3[]) => void }).setPoints(
          curve.getPoints(isMobile ? 16 : 32)
        );
      }
      const cardRb = card.current as unknown as {
        angvel?: () => { x: number; y: number; z: number };
        rotation?: () => { x: number; y: number; z: number };
        setAngvel?: (v: { x: number; y: number; z: number }, wakeUp?: boolean) => void;
      };
      const cardAngvel = cardRb?.angvel?.();
      const cardRotation = cardRb?.rotation?.();
      if (cardAngvel && cardRotation && cardRb?.setAngvel) {
        ang.set(cardAngvel.x, cardAngvel.y, cardAngvel.z);
        rot.set(cardRotation.x, cardRotation.y, cardRotation.z);
        cardRb.setAngvel(
          { x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z },
          true
        );
      }
    }
  });

  (curve as THREE.CatmullRomCurve3 & { curveType?: string }).curveType = "chordal";
  bandTexture.wrapS = bandTexture.wrapT = THREE.RepeatWrapping;

  const cardMap = cardTexture ?? materials.base.map;

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody
          ref={fixed}
          {...segmentProps}
          type={"fixed" as RigidBodyProps["type"]}
        />
        <RigidBody
          position={[0.5, 0, 0]}
          ref={j1}
          {...segmentProps}
          type={"dynamic" as RigidBodyProps["type"]}
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[1, 0, 0]}
          ref={j2}
          {...segmentProps}
          type={"dynamic" as RigidBodyProps["type"]}
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[1.5, 0, 0]}
          ref={j3}
          {...segmentProps}
          type={"dynamic" as RigidBodyProps["type"]}
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={
            dragged
              ? ("kinematicPosition" as RigidBodyProps["type"])
              : ("dynamic" as RigidBodyProps["type"])
          }
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e: React.PointerEvent) => {
              (e.target as HTMLElement).releasePointerCapture(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e: React.PointerEvent) => {
              const target = e.target as HTMLElement;
              target.setPointerCapture(e.pointerId);
              const point = (e as unknown as { point: THREE.Vector3 }).point;
              const cardTrans = (card.current as { translation?: () => { x: number; y: number; z: number } })?.translation?.();
              if (cardTrans) {
                vec.set(cardTrans.x, cardTrans.y, cardTrans.z);
                drag(point.clone().sub(vec));
              }
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
            </mesh>
            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
              material-roughness={0.3}
            />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        {/* @ts-expect-error meshline extend types */}
        <meshLineGeometry />
        {/* @ts-expect-error meshline extend types */}
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={bandTexture}
          repeat={[-4, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}

export type { CardData };

export function Lanyard3D({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  className = "relative z-0 w-full h-[70vh] min-h-[400px] flex justify-center items-center",
  companyName = "liebevoll bestatten",
  cardData,
  triggerSwing = false,
}: Lanyard3DProps) {
  return (
    <div className={className}>
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-stone-100 rounded-2xl">
            <span className="text-stone-500">Lade 3D-Ansicht…</span>
          </div>
        }
      >
        <LanyardScene
          position={position}
          gravity={gravity}
          fov={fov}
          transparent={transparent}
          companyName={companyName}
          cardData={cardData}
          triggerSwing={triggerSwing}
        />
      </Suspense>
    </div>
  );
}
