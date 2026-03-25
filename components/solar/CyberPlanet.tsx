'use client';

import { MeshDistortMaterial, Text, Ring } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { motion } from 'framer-motion-3d';

interface CyberPlanetProps {
    name: string;
    radius: number;
    distance: number;
    speed: number;
    color: string;
    route: string;
    description: string;
    quality?: 'high' | 'low';
}

const MotionMesh = motion.mesh as any;

export function CyberPlanet({ name, radius, distance, speed, color, route, description, quality = 'high' }: CyberPlanetProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const orbitRef = useRef<THREE.Group>(null);
    const router = useRouter();
    const [hovered, setHovered] = useState(false);
    const isLow = quality === 'low';

    // Random start angle
    const initialAngle = useRef(Math.random() * Math.PI * 2).current;

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        // Orbit rotation
        if (orbitRef.current) {
            orbitRef.current.rotation.y = t * speed * 0.1 + initialAngle;
        }

        // Planet self-rotation
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.01;
        }
    });

    const handleClick = () => {
        router.push(route);
    };

    return (
        <group>
            {/* Orbital Path (Visible Ring) */}
            <Ring args={[distance - 0.05, distance + 0.05, isLow ? 16 : 32]} rotation={[-Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color={color} opacity={0.1} transparent side={THREE.DoubleSide} />
            </Ring>

            {/* Orbit Container */}
            <group ref={orbitRef}>
                <group position={[distance, 0, 0]}>
                    {/* The Planet Mesh */}
                    <MotionMesh
                        ref={meshRef}
                        onClick={handleClick}
                        onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
                        onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
                        animate={{
                            scale: hovered ? 1.5 : 1,
                        }}
                        transition={{ duration: 0.5, type: 'spring' }}
                    >
                        <sphereGeometry args={[radius, isLow ? 16 : 32, isLow ? 16 : 32]} />
                        {/* High-performance material for low quality */}
                        {isLow ? (
                            <meshStandardMaterial
                                color={color}
                                emissive={color}
                                emissiveIntensity={hovered ? 2 : 0.5}
                                roughness={0.3}
                                metalness={0.8}
                            />
                        ) : (
                            <MeshDistortMaterial
                                color={color}
                                emissive={color}
                                emissiveIntensity={hovered ? 2 : 0.5}
                                roughness={0.2}
                                metalness={1}
                                distort={hovered ? 0.6 : 0.3}
                                speed={hovered ? 5 : 2}
                            />
                        )}
                    </MotionMesh>

                    {/* Label */}
                    <group position={[0, radius + 0.5, 0]}>
                        <Text
                            fontSize={0.5}
                            color="white"
                            anchorX="center"
                            anchorY="bottom"
                            outlineWidth={0.05}
                            outlineColor="#000000"
                        >
                            {name}
                        </Text>

                        {hovered && (
                            <Text
                                position={[0, -radius * 2.5, 0]}
                                fontSize={0.3}
                                color={color}
                                anchorX="center"
                                anchorY="top"
                                maxWidth={4}
                                textAlign="center"
                                outlineWidth={0.02}
                                outlineColor="#000000"
                            >
                                {description}
                            </Text>
                        )}
                    </group>
                </group>
            </group>
        </group>
    );
}
