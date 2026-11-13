import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SafetyHelmetProps {
  position?: [number, number, number]
  scale?: number
  mouseX?: number
  mouseY?: number
}

export const SafetyHelmet: React.FC<SafetyHelmetProps> = ({
  position = [0, 0, 0],
  scale = 1,
  mouseX = 0,
  mouseY = 0,
}) => {
  const groupRef = useRef<THREE.Group>(null)

  // Sculpted outer HDPE shell with closed lower lip so there is no hollow dark gap
  const domeGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.88),
      new THREE.Vector2(0.24, 0.87),
      new THREE.Vector2(0.48, 0.81),
      new THREE.Vector2(0.7, 0.68),
      new THREE.Vector2(0.87, 0.48),
      new THREE.Vector2(0.97, 0.25),
      new THREE.Vector2(1.02, 0.03),
      new THREE.Vector2(1.04, -0.05),
      new THREE.Vector2(1.1, -0.08),
      new THREE.Vector2(1.1, -0.12),
      new THREE.Vector2(0.98, -0.1),
      new THREE.Vector2(0.94, 0.02),
    ]
    const geo = new THREE.LatheGeometry(points, 64)
    geo.computeVertexNormals()
    return geo
  }, [])

  // Dark inner shell liner cap to give clean interior depth
  const innerLinerGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.8),
      new THREE.Vector2(0.45, 0.72),
      new THREE.Vector2(0.78, 0.45),
      new THREE.Vector2(0.93, 0.04),
      new THREE.Vector2(0.93, -0.06),
    ]
    const geo = new THREE.LatheGeometry(points, 48)
    geo.computeVertexNormals()
    return geo
  }, [])

  // Integrated front peak visor smoothly protruding along +X
  const visorGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.absarc(0, 0, 1.32, -0.58, 0.58, false)
    shape.absarc(0, 0, 0.96, 0.66, -0.66, true)
    shape.closePath()

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.032,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.012,
      bevelThickness: 0.012,
    })
    geo.rotateX(Math.PI / 2)
    geo.computeVertexNormals()
    return geo
  }, [])

  // Dorsal center crown rib conforming tightly to the outer dome curve
  const centerRibGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.96, 0.14, 0),
      new THREE.Vector3(0.82, 0.48, 0),
      new THREE.Vector3(0.46, 0.81, 0),
      new THREE.Vector3(0.0, 0.89, 0),
      new THREE.Vector3(-0.46, 0.81, 0),
      new THREE.Vector3(-0.82, 0.48, 0),
      new THREE.Vector3(-0.96, 0.14, 0),
    ])
    return new THREE.TubeGeometry(curve, 48, 0.05, 16, false)
  }, [])

  // Flank contour ribs
  const sideRibGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.68, 0.44, 0),
      new THREE.Vector3(0.38, 0.74, 0),
      new THREE.Vector3(0.0, 0.84, 0),
      new THREE.Vector3(-0.38, 0.74, 0),
      new THREE.Vector3(-0.68, 0.44, 0),
    ])
    return new THREE.TubeGeometry(curve, 36, 0.02, 12, false)
  }, [])

  const maxAngle = (14 * Math.PI) / 180

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()

    groupRef.current.position.y = position[1] + Math.sin(t * 1.35) * 0.07

    const targetRotY =
      -0.62 + THREE.MathUtils.clamp(mouseX * maxAngle, -maxAngle, maxAngle)
    const targetRotX =
      0.08 + THREE.MathUtils.clamp(mouseY * maxAngle * 0.5, -maxAngle, maxAngle)

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotY,
      Math.min(1, delta * 4)
    )
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotX,
      Math.min(1, delta * 4)
    )
    groupRef.current.rotation.z = Math.sin(t * 0.75) * 0.02
  })

  return (
    <group
      ref={groupRef}
      position={position}
      scale={[scale * 1.07, scale, scale * 0.96]}
      rotation={[0.08, -0.62, 0]}
    >
      {/* Main Glossy Safety-Orange Shell */}
      <mesh geometry={domeGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#F28C28"
          roughness={0.22}
          metalness={0.04}
          clearcoat={0.88}
          clearcoatRoughness={0.12}
        />
      </mesh>

      {/* Dark Interior Liner */}
      <mesh geometry={innerLinerGeometry}>
        <meshStandardMaterial color="#1E272D" roughness={0.85} metalness={0.05} side={THREE.BackSide} />
      </mesh>

      {/* Center Dorsal Crown Rib */}
      <mesh geometry={centerRibGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#F69535"
          roughness={0.2}
          metalness={0.04}
          clearcoat={0.92}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Flank Accent Ribs */}
      <mesh
        geometry={sideRibGeometry}
        position={[0, 0.02, 0.24]}
        rotation={[0.26, 0, 0]}
        castShadow
      >
        <meshPhysicalMaterial color="#E67E1C" roughness={0.24} metalness={0.04} clearcoat={0.75} />
      </mesh>
      <mesh
        geometry={sideRibGeometry}
        position={[0, 0.02, -0.24]}
        rotation={[-0.26, 0, 0]}
        castShadow
      >
        <meshPhysicalMaterial color="#E67E1C" roughness={0.24} metalness={0.04} clearcoat={0.75} />
      </mesh>

      {/* Integrated Front Peak Visor */}
      <mesh
        geometry={visorGeometry}
        position={[0.01, -0.075, 0]}
        rotation={[0, 0, -0.09]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color="#F28C28"
          roughness={0.22}
          metalness={0.04}
          clearcoat={0.88}
          clearcoatRoughness={0.12}
        />
      </mesh>

      {/* Molded Side Accessory Slots */}
      <mesh position={[0.05, 0.03, 1.01]} rotation={[0, 0, 0.03]} castShadow>
        <boxGeometry args={[0.2, 0.13, 0.05]} />
        <meshPhysicalMaterial color="#EB8420" roughness={0.26} metalness={0.04} clearcoat={0.7} />
      </mesh>
      <mesh position={[0.05, 0.03, -1.01]} rotation={[0, 0, 0.03]} castShadow>
        <boxGeometry args={[0.2, 0.13, 0.05]} />
        <meshPhysicalMaterial color="#EB8420" roughness={0.26} metalness={0.04} clearcoat={0.7} />
      </mesh>

      {/* Inner Black Suspension Ring & Rear Ratchet Knob */}
      <mesh position={[0, -0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.035, 12, 48]} />
        <meshStandardMaterial color="#1B2329" roughness={0.75} metalness={0.08} />
      </mesh>
      <mesh position={[-0.84, -0.2, 0]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[0.12, 0.22, 0.32]} />
        <meshStandardMaterial color="#182026" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[-0.91, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 0.055, 20]} />
        <meshStandardMaterial color="#2C3740" roughness={0.5} metalness={0.18} />
      </mesh>
    </group>
  )
}
