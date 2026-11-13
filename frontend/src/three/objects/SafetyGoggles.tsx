import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SafetyGogglesProps {
  position?: [number, number, number]
  scale?: number
  rotation?: [number, number, number]
}

export const SafetyGoggles: React.FC<SafetyGogglesProps> = ({
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
}) => {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    groupRef.current.position.y = position[1] + Math.sin(t * 1.1 + 1.5) * 0.08
    groupRef.current.rotation.y = rotation[1] + Math.sin(t * 0.6) * 0.15
  })

  return (
    <group ref={groupRef} position={position} scale={scale} rotation={rotation}>
      {/* Left Lens Frame */}
      <mesh position={[-0.24, 0, 0]} castShadow>
        <torusGeometry args={[0.19, 0.035, 16, 32]} />
        <meshStandardMaterial color="#202A30" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Left Lens Glass */}
      <mesh position={[-0.24, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.175, 0.175, 0.02, 28]} />
        <meshPhysicalMaterial
          color="#3B7894"
          transparent
          opacity={0.55}
          roughness={0.1}
          metalness={0.2}
          transmission={0.4}
        />
      </mesh>

      {/* Right Lens Frame */}
      <mesh position={[0.24, 0, 0]} castShadow>
        <torusGeometry args={[0.19, 0.035, 16, 32]} />
        <meshStandardMaterial color="#202A30" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Right Lens Glass */}
      <mesh position={[0.24, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.175, 0.175, 0.02, 28]} />
        <meshPhysicalMaterial
          color="#3B7894"
          transparent
          opacity={0.55}
          roughness={0.1}
          metalness={0.2}
          transmission={0.4}
        />
      </mesh>

      {/* Nose Bridge */}
      <mesh position={[0, 0.04, 0.01]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.14, 12]} />
        <meshStandardMaterial color="#202A30" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Side Arms */}
      <mesh position={[-0.44, 0.02, -0.22]} rotation={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.45]} />
        <meshStandardMaterial color="#F28C28" roughness={0.35} metalness={0.3} />
      </mesh>
      <mesh position={[0.44, 0.02, -0.22]} rotation={[0, -0.15, 0]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.45]} />
        <meshStandardMaterial color="#F28C28" roughness={0.35} metalness={0.3} />
      </mesh>
    </group>
  )
}

