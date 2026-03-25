'use client';

import { Sphere } from '@react-three/drei';
import { LayerMaterial, Depth, Noise } from 'lamina';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export function CyberSun({ quality = 'high' }: { quality?: 'high' | 'low' }) {
    const materialRef = useRef<any>(null);
    const isLow = quality === 'low';

    useFrame((state) => {
        if (!isLow && materialRef.current) {
            // Animate noise layers only in high quality
            const time = state.clock.getElapsedTime();

            // Layer 1: Main Noise (Plasma)
            if (materialRef.current.layers[1]?.offset) {
                materialRef.current.layers[1].offset.x = time * 0.1;
                materialRef.current.layers[1].offset.y = time * 0.2;
            }

            // Layer 2: Detail Noise
            if (materialRef.current.layers[2]?.offset) {
                materialRef.current.layers[2].offset.x = time * 0.1; // Re-purposing the x animation for the second noise layer
            }
        }
    });

    return (
        <Sphere args={[2.5, isLow ? 16 : 32, isLow ? 16 : 32]}>
            {isLow ? (
                <meshStandardMaterial 
                    color="#ffaa00" 
                    emissive="#ff4400" 
                    emissiveIntensity={2} 
                    roughness={0} 
                />
            ) : (
                <LayerMaterial
                    ref={materialRef}
                    color="#ffffff"
                    lighting="physical"
                    transmission={0}
                >
                    {/* Base Fire Layer */}
                    <Depth
                        colorA="#ffaa00"
                        colorB="#ff0000"
                        alpha={1}
                        mode="normal"
                        near={0}
                        far={3}
                        origin={[1, 1, 1]}
                    />

                    {/* Dynamic Noise for Plasma */}
                    <Noise
                        mapping="local"
                        type="simplex"
                        scale={10}
                        colorA="#ffaa00"
                        colorB="#000000"
                        mode="add"
                        alpha={0.5}
                    />

                    {/* Secondary Noise for Detail */}
                    <Noise
                        mapping="local"
                        type="curl"
                        scale={5}
                        colorA="#ffdd00"
                        colorB="#000000"
                        mode="add"
                        alpha={0.3}
                    />
                </LayerMaterial>
            )}

            {/* Simple point light emanation */}
            <pointLight intensity={isLow ? 1 : 2} distance={20} color="#ffaa00" />
        </Sphere>
    );
}
