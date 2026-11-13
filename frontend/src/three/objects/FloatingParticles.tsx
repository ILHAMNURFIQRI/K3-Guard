import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FloatingParticlesProps {
  count?: number
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 45,
}) => {
  const pointsRef = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random distribution for clean render
      const seed1 = Math.sin(i * 12.9898) * 43758.5453
      const seed2 = Math.sin(i * 78.233) * 43758.5453
      const seed3 = Math.sin(i * 45.164) * 43758.5453
      const rx = seed1 - Math.floor(seed1)
      const ry = seed2 - Math.floor(seed2)
      const rz = seed3 - Math.floor(seed3)

      arr[i * 3] = (rx - 0.5) * 8
      arr[i * 3 + 1] = (ry - 0.5) * 6
      arr[i * 3 + 2] = (rz - 0.5) * 5 - 1
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (!pointsRef.current) return
    const t = state.clock.getElapsedTime()
    pointsRef.current.rotation.y = t * 0.04
    pointsRef.current.rotation.x = Math.sin(t * 0.05) * 0.05
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#3B7894"
        transparent
        opacity={0.45}
        sizeAttenuation
      />
    </points>
  )
}

