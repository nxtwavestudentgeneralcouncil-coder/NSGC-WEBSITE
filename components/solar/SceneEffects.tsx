// @ts-nocheck
'use client';

import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

const NoiseEffect = Noise as any;
const BloomEffect = Bloom as any;
const VignetteEffect = Vignette as any;

export function SceneEffects() {
    return (
        <EffectComposer disableNormalPass>
            {/* Optimized Bloom for performance */}
            <BloomEffect
                luminanceThreshold={0.5} // Increased threshold to glow only brightest parts
                mipmapBlur
                intensity={1.0} // Reduced intensity
                radius={0.4}
            />

            {/* Noise pass disabled - Global CSS noise is enough and much cheaper */}
            {/* <NoiseEffect opacity={0.05} blendFunction={BlendFunction.OVERLAY} /> */}

            {/* Vignette - kept as it's relatively cheap and adds focus */}
            <VignetteEffect
                eskil={false}
                offset={0.1}
                darkness={1.1}
            />
        </EffectComposer>
    );
}
