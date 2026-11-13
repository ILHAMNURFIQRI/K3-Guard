import React, { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { SafetyHelmet } from '../objects/SafetyHelmet'
import { FloatingParticles } from '../objects/FloatingParticles'
import { MouseTracker } from '../effects/MouseTracker'
import { ScrollAnimation } from '../effects/ScrollAnimation'

interface HeroSceneProps {
  mouseX: number
  mouseY: number
  scrollProgress: number
  simplified?: boolean
}

const CalibrationRings: React.FC = () => {
  const outerRingRef = useRef<THREE.Mesh>(null)
  const innerRingRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = t * 0.08
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = -t * 0.12
    }
  })

  return (
    <group position={[0, -0.68, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={outerRingRef}>
        <ringGeometry args={[1.68, 1.705, 72]} />
        <meshBasicMaterial color="#24546A" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={innerRingRef}>
        <ringGeometry args={[1.32, 1.335, 64, 1, 0, Math.PI * 1.45]} />
        <meshBasicMaterial color="#F28C28" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export const HeroScene: React.FC<HeroSceneProps> = ({
  mouseX,
  mouseY,
  scrollProgress,
  simplified = false,
}) => {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.72, 4.75], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      className="h-full w-full"
    >
      <Suspense fallback={null}>
        {/* Studio Three-Point Lighting */}
        <hemisphereLight args={['#FFFFFF', '#E6E4DD', 1.2]} />
        <ambientLight intensity={0.45} />
        <directionalLight
          position={[4, 6, 5]}
          intensity={1.85}
          color="#FFFBF5"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight
          position={[-4, 3, 4]}
          intensity={0.9}
          color="#EBF5FA"
        />
        <pointLight position={[0, 3, -3]} intensity={0.95} color="#FFFFFF" />

        <ScrollAnimation scrollProgress={scrollProgress}>
          <MouseTracker mouseX={mouseX} mouseY={mouseY} intensity={0.08}>
            <SafetyHelmet
              position={[0, 0.08, 0]}
              scale={1.32}
              mouseX={mouseX}
              mouseY={mouseY}
            />
            {!simplified && <CalibrationRings />}
          </MouseTracker>
        </ScrollAnimation>

        <FloatingParticles count={simplified ? 16 : 28} />

        <ContactShadows
          position={[0, -0.95, 0]}
          opacity={0.2}
          scale={5.5}
          blur={2.4}
          far={4}
          color="#202A30"
        />
      </Suspense>
    </Canvas>
  )
}
