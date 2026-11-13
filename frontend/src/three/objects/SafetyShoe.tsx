import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SafetyShoeProps {
  position?: [number, number, number]
  scale?: number
  rotation?: [number, number, number]
}

export const SafetyShoe: React.FC<SafetyShoeProps> = ({
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
}) => {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    groupRef.current.position.y = position[1] + Math.sin(t * 1.0 + 3.0) * 0.08
    groupRef.current.rotation.y = rotation[1] + Math.cos(t * 0.5) * 0.14
  })

  return (
    <group ref={groupRef} position={position} scale={scale} rotation={rotation}>
      {/* Rugged Rubber Sole */}
      <mesh position={[0, -0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.74, 0.1, 0.34]} />
        <meshStandardMaterial color="#202A30" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* Main Shoe Body / Upper */}
      <mesh position={[-0.04, 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.56, 0.26, 0.3]} />
        <meshStandardMaterial color="#24546A" roughness={0.6} metalness={0.15} />
      </mesh>

      {/* Ankle Collar */}
      <mesh position={[-0.18, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.15, 0.16, 20]} />
        <meshStandardMaterial color="#202A30" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Reinforced Steel-Toe Cap */}
      <mesh position={[0.24, -0.02, 0]} castShadow>
        <sphereGeometry args={[0.155, 20, 16]} />
        <meshStandardMaterial color="#F28C28" roughness={0.3} metalness={0.45} />
      </mesh>

      {/* Safety Stripe */}
      <mesh position={[-0.02, 0.04, 0.155]}>
        <boxGeometry args={[0.28, 0.04, 0.01]} />
        <meshStandardMaterial color="#F28C28" roughness={0.3} metalness={0.2} />
      </mesh>
    </group>
  )
}

