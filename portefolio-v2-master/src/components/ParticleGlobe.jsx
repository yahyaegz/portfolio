import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { AdditiveBlending } from 'three';

function seededRandom(seed) {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function ParticleSphere() {
    const ref = useRef();
    const count = 600;

    const positions = useMemo(() => {
        const rand = seededRandom(42);
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
            const r = 2.2 + rand() * 0.3;
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = r * Math.cos(phi);
        }
        return pos;
    }, []);

    useFrame((state) => {
        if (!ref.current) return;
        const t = state.clock.getElapsedTime();
        ref.current.rotation.y = t * 0.08;
        ref.current.rotation.x = Math.sin(t * 0.05) * 0.15;

        const mx = state.pointer.x * 0.3;
        const my = state.pointer.y * 0.3;
        ref.current.rotation.x += (my - ref.current.rotation.x) * 0.02;
        ref.current.rotation.z += (mx - ref.current.rotation.z) * 0.02;
    });

    return (
        <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
            <PointMaterial
                transparent
                color="#10b981"
                size={0.025}
                sizeAttenuation
                depthWrite={false}
                blending={AdditiveBlending}
                opacity={0.7}
            />
        </Points>
    );
}

function InnerRing() {
    const ref = useRef();
    const count = 200;

    const positions = useMemo(() => {
        const rand = seededRandom(99);
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const r = 1.4 + rand() * 0.1;
            pos[i * 3] = r * Math.cos(angle);
            pos[i * 3 + 1] = (rand() - 0.5) * 0.3;
            pos[i * 3 + 2] = r * Math.sin(angle);
        }
        return pos;
    }, []);

    useFrame((state) => {
        if (!ref.current) return;
        ref.current.rotation.y = -state.clock.getElapsedTime() * 0.15;
        ref.current.rotation.x = 0.4;
    });

    return (
        <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
            <PointMaterial
                transparent
                color="#06b6d4"
                size={0.018}
                sizeAttenuation
                depthWrite={false}
                blending={AdditiveBlending}
                opacity={0.5}
            />
        </Points>
    );
}

export default function ParticleGlobe() {
    const [enabled, setEnabled] = React.useState(true);
    React.useEffect(() => {
        if (window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setEnabled(false);
        }
    }, []);

    if (!enabled) return null;

    return (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60" aria-hidden="true">
            <Canvas
                camera={{ position: [0, 0, 5], fov: 45 }}
                dpr={[1, 1.5]}
                gl={{ antialias: false, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <ambientLight intensity={0.5} />
                <ParticleSphere />
                <InnerRing />
            </Canvas>
        </div>
    );
}

