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

function ParticleSphere({ animated, compact }) {
    const ref = useRef(null);
    const count = compact ? 420 : 920;

    const { positions, colors } = useMemo(() => {
        const rand = seededRandom(42);
        const pos = new Float32Array(count * 3);
        const colorValues = new Float32Array(count * 3);
        const green = new Color('#10b981');
        const cyan = new Color('#06b6d4');
        const pale = new Color('#d1fae5');

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
            const r = 2.05 + Math.sin(i * 0.27) * 0.09 + rand() * 0.28;
            const color = green.clone().lerp(i % 3 === 0 ? pale : cyan, rand() * 0.85);

            pos[i3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i3 + 2] = r * Math.cos(phi);

            colorValues[i3] = color.r;
            colorValues[i3 + 1] = color.g;
            colorValues[i3 + 2] = color.b;
        }

        return { positions: pos, colors: colorValues };
    }, [count]);

    useFrame((state) => {
        if (!animated || !ref.current) return;

        const t = state.clock.getElapsedTime();
        ref.current.rotation.y = t * 0.09 + state.pointer.x * 0.18;
        ref.current.rotation.x = Math.sin(t * 0.1) * 0.12 + state.pointer.y * 0.15;
        ref.current.rotation.z = Math.sin(t * 0.07) * 0.05;
    });

    return (
        <points ref={ref} frustumCulled={false}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                <bufferAttribute attach="attributes-color" args={[colors, 3]} />
            </bufferGeometry>
            <pointsMaterial
                transparent
                vertexColors
                size={compact ? 0.028 : 0.022}
                sizeAttenuation
                depthWrite={false}
                blending={AdditiveBlending}
                opacity={0.82}
            />
        </points>
    );
}

function OrbitRings({ animated, compact }) {
    const ref = useRef(null);

    useFrame((state) => {
        if (!animated || !ref.current) return;

        const t = state.clock.getElapsedTime();
        ref.current.rotation.y = t * 0.18;
        ref.current.rotation.x = Math.sin(t * 0.2) * 0.08;
    });

    return (
        <group ref={ref}>
            {[0, 1, 2].map((index) => (
                <mesh
                    key={index}
                    rotation={[
                        Math.PI / 2 + index * 0.38,
                        index * 0.54,
                        index * 0.72,
                    ]}
                >
                    <torusGeometry args={[compact ? 2.18 : 2.34, 0.006, 8, 168]} />
                    <meshBasicMaterial
                        transparent
                        color={index === 1 ? '#67e8f9' : '#10b981'}
                        opacity={index === 1 ? 0.28 : 0.2}
                        blending={AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

function DataArcs({ animated, compact }) {
    const ref = useRef(null);
    const arcs = useMemo(() => {
        const rand = seededRandom(77);
        const result = [];
        const count = compact ? 5 : 9;

        for (let i = 0; i < count; i++) {
            const segments = 40;
            const positions = new Float32Array(segments * 3);
            const start = rand() * Math.PI * 2;
            const sweep = 0.9 + rand() * 1.5;
            const radius = 1.58 + rand() * 0.4;
            const lift = 0.25 + rand() * 0.5;
            const tilt = (rand() - 0.5) * 0.9;

            for (let j = 0; j < segments; j++) {
                const p = j / (segments - 1);
                const angle = start + sweep * p;
                const i3 = j * 3;

                positions[i3] = Math.cos(angle) * radius;
                positions[i3 + 1] = Math.sin(Math.PI * p) * lift + Math.sin(angle + tilt) * 0.35;
                positions[i3 + 2] = Math.sin(angle) * radius;
            }

            result.push({
                positions,
                color: i % 2 ? '#67e8f9' : '#34d399',
                opacity: 0.22 + rand() * 0.18,
            });
        }

        return result;
    }, [compact]);

    useFrame((state) => {
        if (!animated || !ref.current) return;

        ref.current.rotation.y = -state.clock.getElapsedTime() * 0.08;
        ref.current.rotation.z = MathUtils.lerp(ref.current.rotation.z, state.pointer.x * 0.12, 0.04);
    });

    return (
        <group ref={ref}>
            {arcs.map((arc, index) => (
                <line key={index}>
                    <bufferGeometry>
                        <bufferAttribute attach="attributes-position" args={[arc.positions, 3]} />
                    </bufferGeometry>
                    <lineBasicMaterial
                        transparent
                        color={arc.color}
                        opacity={arc.opacity}
                        blending={AdditiveBlending}
                        depthWrite={false}
                    />
                </line>
            ))}
        </group>
    );
}

function CoreGlow({ animated, compact }) {
    const ref = useRef(null);

    useFrame((state) => {
        if (!animated || !ref.current) return;

        const scale = 1 + Math.sin(state.clock.getElapsedTime() * 1.2) * 0.035;
        ref.current.scale.setScalar(scale);
    });

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[compact ? 1.08 : 1.18, 36, 18]} />
            <meshBasicMaterial
                transparent
                wireframe
                color="#a7f3d0"
                opacity={0.09}
                blending={AdditiveBlending}
                depthWrite={false}
            />
        </mesh>
    );
}

function GlobeRig({ animated, compact }) {
    const ref = useRef(null);

    useFrame((state) => {
        if (!animated || !ref.current) return;

        ref.current.rotation.x = MathUtils.lerp(ref.current.rotation.x, state.pointer.y * 0.08, 0.04);
        ref.current.rotation.y = MathUtils.lerp(ref.current.rotation.y, state.pointer.x * 0.1, 0.04);
    });

    return (
        <group ref={ref} position={compact ? [0.25, -0.15, 0] : [0.75, 0, 0]}>
            <CoreGlow animated={animated} compact={compact} />
            <ParticleSphere animated={animated} compact={compact} />
            <OrbitRings animated={animated} compact={compact} />
            <DataArcs animated={animated} compact={compact} />
        </group>
    );
}

export default function ParticleGlobe() {
    const reducedMotion = useReducedMotion();
    const [compact, setCompact] = useState(false);

    useEffect(() => {
        const update = () => setCompact(window.innerWidth < 768);

        update();
        window.addEventListener('resize', update);

        return () => window.removeEventListener('resize', update);
    }, []);

    return (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-75" aria-hidden="true">
            <Canvas
                frameloop={reducedMotion ? 'demand' : 'always'}
                camera={{ position: [0, 0, compact ? 5.7 : 5.2], fov: compact ? 48 : 43 }}
                dpr={compact ? [1, 1.2] : [1, 1.7]}
                gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                style={{ background: 'transparent' }}
            >
                <GlobeRig animated={!reducedMotion} compact={compact} />
            </Canvas>
        </div>
    );
}
