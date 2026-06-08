
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { AdditiveBlending, Color, MathUtils } from 'three';

function seededRandom(seed) {
    let value = seed;
    return () => {
        value = (value * 16807) % 2147483647;
        return (value - 1) / 2147483646;
    };
}

function useReducedMotion() {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReduced(media.matches);

        update();
        media.addEventListener?.('change', update);

        return () => media.removeEventListener?.('change', update);
    }, []);

    return reduced;
}

function ParticleSphere({ animated, compact, motionScale }) {
    const ref = useRef(null);
    const count = compact ? 420 : 920;

    const { positions, basePositions, colors, phaseValues } = useMemo(() => {
        const rand = seededRandom(42);
        const base = new Float32Array(count * 3);
        const pos = new Float32Array(count * 3);
        const colorValues = new Float32Array(count * 3);
        const phases = new Float32Array(count);
        const green = new Color('#10b981');
        const cyan = new Color('#06b6d4');
        const pale = new Color('#d1fae5');

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
            const r = 2.05 + Math.sin(i * 0.27) * 0.09 + rand() * 0.28;
            const color = green.clone().lerp(i % 3 === 0 ? pale : cyan, rand() * 0.85);

            base[i3] = r * Math.sin(phi) * Math.cos(theta);
            base[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            base[i3 + 2] = r * Math.cos(phi);

            pos[i3] = base[i3];
            pos[i3 + 1] = base[i3 + 1];
            pos[i3 + 2] = base[i3 + 2];

            colorValues[i3] = color.r;
            colorValues[i3 + 1] = color.g;
            colorValues[i3 + 2] = color.b;

            phases[i] = rand() * Math.PI * 2;
        }

        return { positions: pos, basePositions: base, colors: colorValues, phaseValues: phases };
    }, [count]);

    useFrame((state) => {
        if (!animated || !ref.current) return;

        const t = state.clock.elapsedTime;
        const position = ref.current.geometry.attributes.position;
        const values = position.array;

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const phase = phaseValues[i];
            const pulse = 1
                + Math.sin(t * 1.15 + phase) * 0.035 * motionScale
                + Math.sin(t * 2.05 + phase * 0.45) * 0.012 * motionScale;

            values[i3] = basePositions[i3] * pulse;
            values[i3 + 1] = basePositions[i3 + 1] * pulse;
            values[i3 + 2] = basePositions[i3 + 2] * pulse;
        }

        position.needsUpdate = true;
        ref.current.rotation.y = t * 0.22 * motionScale + state.pointer.x * 0.18 * motionScale;
        ref.current.rotation.x = Math.sin(t * 0.2) * 0.16 * motionScale + state.pointer.y * 0.15 * motionScale;
        ref.current.rotation.z = Math.sin(t * 0.16) * 0.075 * motionScale;
        ref.current.material.opacity = 0.72 + Math.sin(t * 1.25) * 0.1 * motionScale;
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

function OrbitRings({ animated, compact, motionScale }) {
    const ref = useRef(null);

    useFrame((state) => {
        if (!animated || !ref.current) return;

        const t = state.clock.elapsedTime;
        ref.current.rotation.y = t * 0.34 * motionScale;
        ref.current.rotation.x = Math.sin(t * 0.32) * 0.11 * motionScale;

        ref.current.children.forEach((ring, index) => {
            ring.rotation.z += (0.0015 + index * 0.0008) * motionScale;
            ring.material.opacity = (index === 1 ? 0.24 : 0.17) + Math.sin(t * 1.1 + index) * 0.055 * motionScale;
        });
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

function DataArcs({ animated, compact, motionScale }) {
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

        const t = state.clock.elapsedTime;
        ref.current.rotation.y = -t * 0.18 * motionScale;
        ref.current.rotation.z = MathUtils.lerp(ref.current.rotation.z, state.pointer.x * 0.12 * motionScale, 0.04);

        ref.current.children.forEach((arc, index) => {
            arc.position.y = Math.sin(t * 0.85 + index * 0.6) * 0.035 * motionScale;
            arc.material.opacity = arcs[index].opacity * (0.68 + Math.sin(t * 1.55 + index) * 0.32 * motionScale);
        });
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

function CoreGlow({ animated, compact, motionScale }) {
    const ref = useRef(null);

    useFrame((state) => {
        if (!animated || !ref.current) return;

        const scale = 1 + Math.sin(state.clock.elapsedTime * 1.45) * 0.075 * motionScale;
        ref.current.scale.setScalar(scale);
        ref.current.rotation.y = state.clock.elapsedTime * 0.16 * motionScale;
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

function GlobeRig({ animated, compact, motionScale }) {
    const ref = useRef(null);

    useFrame((state) => {
        if (!animated || !ref.current) return;

        const t = state.clock.elapsedTime;
        ref.current.rotation.x = MathUtils.lerp(
            ref.current.rotation.x,
            (Math.sin(t * 0.18) * 0.04 + state.pointer.y * 0.08) * motionScale,
            0.04,
        );
        ref.current.rotation.y = MathUtils.lerp(
            ref.current.rotation.y,
            (Math.cos(t * 0.16) * 0.05 + state.pointer.x * 0.1) * motionScale,
            0.04,
        );
    });

    return (
        <group ref={ref} position={compact ? [0.25, -0.15, 0] : [0.75, 0, 0]}>
            <CoreGlow animated={animated} compact={compact} motionScale={motionScale} />
            <ParticleSphere animated={animated} compact={compact} motionScale={motionScale} />
            <OrbitRings animated={animated} compact={compact} motionScale={motionScale} />
            <DataArcs animated={animated} compact={compact} motionScale={motionScale} />
        </group>
    );
}

export default function ParticleGlobe() {
    const reducedMotion = useReducedMotion();
    const [compact, setCompact] = useState(false);
    const motionScale = reducedMotion ? 0.3 : 1;

    useEffect(() => {
        const update = () => setCompact(window.innerWidth < 768);

        update();
        window.addEventListener('resize', update);

        return () => window.removeEventListener('resize', update);
    }, []);

    return (
        <group>
            <PerspectiveCamera makeDefault position={[0, 0, compact ? 5.7 : 5.2]} fov={compact ? 48 : 43} />
            <GlobeRig animated compact={compact} motionScale={motionScale} />
        </group>
    );
}
