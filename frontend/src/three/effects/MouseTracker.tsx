import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface MouseTrackerProps {
  mouseX: number
  mouseY: number
  intensity?: number
  children: React.ReactNode
}

export const MouseTracker: React.FC<MouseTrackerProps> = ({
  mouseX,
  mouseY,
  intensity = 0.08,
  children,
}) => {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      mouseX * intensity,
      Math.min(1, delta * 3)
    )
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      mouseY * intensity * 0.6,
      Math.min(1, delta * 3)
    )
  })

  return <group ref={groupRef}>{children}</group>
}

