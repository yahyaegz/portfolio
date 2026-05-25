import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, MathUtils } from 'three';

function seededRandom(seed) {
    let value = seed;
    return () => {
        value = (value * 16807) % 2147483647;
        return (value - 1) / 2147483646;
    };
}

function useReducedMotion() {
    const [reduced, setReduced] = useState(true);

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReduced(media.matches);

        update();
        media.addEventListener?.('change', update);

        return () => media.removeEventListener?.('change', update);
    }, []);

    return reduced;
}

function DepthParticles({ animated, count, radius, speed, size, opacity, colors }) {
    const ref = useRef(null);

    const { positions, colorValues } = useMemo(() => {
        const rand = seededRandom(count + Math.floor(radius * 100));
        const pos = new Float32Array(count * 3);
        const cols = new Float32Array(count * 3);
        const colorA = new Color(colors[0]);
        const colorB = new Color(colors[1]);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const angle = rand() * Math.PI * 2;
            const z = (rand() - 0.5) * radius * 2;
            const distance = radius * Math.sqrt(rand());
            const yBias = (rand() - 0.5) * 1.5;
            const color = colorA.clone().lerp(colorB, rand());

            pos[i3] = Math.cos(angle) * distance;
            pos[i3 + 1] = Math.sin(angle) * distance * 0.45 + yBias;
            pos[i3 + 2] = z;

            cols[i3] = color.r;
            cols[i3 + 1] = color.g;
            cols[i3 + 2] = color.b;
        }

        return { positions: pos, colorValues: cols };
    }, [colors, count, radius]);

    useFrame((state) => {
        if (!animated || !ref.current) return;

        const t = state.clock.getElapsedTime();
        ref.current.rotation.y = t * speed + state.pointer.x * 0.08;
        ref.current.rotation.x = Math.sin(t * 0.12) * 0.05 + state.pointer.y * 0.05;
    });

    return (
        <points ref={ref} frustumCulled={false}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                <bufferAttribute attach="attributes-color" args={[colorValues, 3]} />
            </bufferGeometry>
            <pointsMaterial
                transparent
                vertexColors
                size={size}
                sizeAttenuation
                depthWrite={false}
                blending={AdditiveBlending}
                opacity={opacity}
            />
        </points>
    );
}

function SignalGrid({ animated, compact }) {
    const ref = useRef(null);
    const laneCount = compact ? 11 : 17;

    const lanes = useMemo(() => {
        const rows = [];
        const width = compact ? 9 : 13;
        const depth = compact ? 7 : 10;

        for (let i = 0; i < laneCount; i++) {
            const y = MathUtils.mapLinear(i, 0, laneCount - 1, -2.3, 2.3);
            rows.push(new Float32Array([
                -width, y, -depth,
                width, y + Math.sin(i * 0.7) * 0.5, depth,
            ]));
        }

        return rows;
    }, [compact, laneCount]);

    useFrame((state) => {
        if (!animated || !ref.current) return;

        const t = state.clock.getElapsedTime();
        ref.current.position.z = Math.sin(t * 0.18) * 0.8;
        ref.current.rotation.z = Math.sin(t * 0.08) * 0.04;
        ref.current.rotation.y = state.pointer.x * 0.04;
    });

    return (
        <group ref={ref} rotation={[0.12, -0.35, -0.2]} position={[0, 0, -4]}>
            {lanes.map((positions, index) => (
                <line key={index}>
                    <bufferGeometry>
                        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                    </bufferGeometry>
                    <lineBasicMaterial
                        transparent
                        color={index % 2 ? '#06b6d4' : '#10b981'}
                        opacity={compact ? 0.08 : 0.11}
                        blending={AdditiveBlending}
                        depthWrite={false}
                    />
                </line>
            ))}
        </group>
    );
}

function FieldRig({ animated, compact }) {
    const ref = useRef(null);

    useFrame((state) => {
        if (!animated || !ref.current) return;

        ref.current.rotation.x = MathUtils.lerp(ref.current.rotation.x, state.pointer.y * 0.08, 0.035);
        ref.current.rotation.y = MathUtils.lerp(ref.current.rotation.y, state.pointer.x * 0.1, 0.035);
    });

    return (
        <group ref={ref}>
            <DepthParticles
                animated={animated}
                count={compact ? 260 : 620}
                radius={compact ? 6 : 8}
                speed={0.016}
                size={compact ? 0.035 : 0.028}
                opacity={0.7}
                colors={['#10b981', '#67e8f9']}
            />
            <DepthParticles
                animated={animated}
                count={compact ? 120 : 260}
                radius={compact ? 8 : 11}
                speed={-0.01}
                size={compact ? 0.02 : 0.018}
                opacity={0.45}
                colors={['#e0f2fe', '#22c55e']}
            />
            <SignalGrid animated={animated} compact={compact} />
        </group>
    );
}

export default function ParticleField() {
    const reducedMotion = useReducedMotion();
    const [compact, setCompact] = useState(false);

    useEffect(() => {
        const update = () => setCompact(window.innerWidth < 768);

        update();
        window.addEventListener('resize', update);

        return () => window.removeEventListener('resize', update);
    }, []);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none opacity-70" aria-hidden="true">
            <Canvas
                frameloop={reducedMotion ? 'demand' : 'always'}
                camera={{ position: [0, 0, compact ? 8 : 7], fov: compact ? 58 : 52 }}
                dpr={compact ? [1, 1.2] : [1, 1.6]}
                gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
                style={{ background: 'transparent' }}
            >
                <FieldRig animated={!reducedMotion} compact={compact} />
            </Canvas>
        </div>
    );
}
