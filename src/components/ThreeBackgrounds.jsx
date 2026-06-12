import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PointMaterial, Line } from '@react-three/drei';
import * as THREE from 'three';

// ─── UTILITIES ──────────────────────────────────────────────────────────────
const Palette = {
    emerald: '#10b981',
    cyan: '#06b6d4',
    purple: '#a855f7',
    amber: '#f59e0b',
    rose: '#f43f5e',
    slate: '#64748b'
};

// ─── 1. CYBER GRID SCENE ────────────────────────────────────────────────────
function CyberGrid({ color }) {
    const gridRef = useRef();
    
    useFrame((state) => {
        if (gridRef.current) {
            // Move grid towards camera
            gridRef.current.position.z = (state.clock.elapsedTime * 2) % 10;
        }
    });

    return (
        <group>
            <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
            <fog attach="fog" args={['#050710', 10, 40]} />
            <ambientLight intensity={0.2} />
            <pointLight position={[0, 5, -20]} intensity={2} color={color} />
            <group ref={gridRef}>
                <gridHelper args={[100, 40, color, '#1e293b']} position={[0, -5, -40]} />
            </group>
        </group>
    );
}

// ─── 2. NEURAL NETWORK SCENE ────────────────────────────────────────────────
function NeuralNetwork({ color }) {
    const pointsRef = useRef();
    const linesRef = useRef();
    
    const particleCount = 100;
    const maxDistance = 4;

    const [positions, lines] = useMemo(() => {
        const pos = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i++) {
            pos[i] = (Math.random() - 0.5) * 30;
        }
        
        const linePositions = [];
        for (let i = 0; i < particleCount; i++) {
            for (let j = i + 1; j < particleCount; j++) {
                const dx = pos[i * 3] - pos[j * 3];
                const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
                const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < maxDistance) {
                    linePositions.push(
                        pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2],
                        pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]
                    );
                }
            }
        }
        return [pos, new Float32Array(linePositions)];
    }, []);

    useFrame((state) => {
        if (pointsRef.current && linesRef.current) {
            const t = state.clock.elapsedTime * 0.05;
            pointsRef.current.rotation.y = t;
            pointsRef.current.rotation.x = t * 0.5;
            linesRef.current.rotation.y = t;
            linesRef.current.rotation.x = t * 0.5;
        }
    });

    return (
        <group>
            <fog attach="fog" args={['#050710', 10, 30]} />
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
                </bufferGeometry>
                <PointMaterial color={color} size={0.15} sizeAttenuation transparent opacity={0.8} />
            </points>
            <lineSegments ref={linesRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={lines.length / 3} array={lines} itemSize={3} />
                </bufferGeometry>
                <lineBasicMaterial color={color} transparent opacity={0.15} />
            </lineSegments>
        </group>
    );
}

// ─── 3. FLOATING GEOMETRY SCENE ─────────────────────────────────────────────
function FloatingGeometry({ color }) {
    const groupRef = useRef();

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
        }
    });

    return (
        <group>
            <fog attach="fog" args={['#050710', 10, 40]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} color={color} />
            <group ref={groupRef}>
                {Array.from({ length: 20 }).map((_, i) => (
                    <Float key={i} speed={2} rotationIntensity={2} floatIntensity={2} position={[(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20 - 10]}>
                        <mesh>
                            {i % 3 === 0 ? <boxGeometry args={[1, 1, 1]} /> : i % 3 === 1 ? <octahedronGeometry args={[1]} /> : <icosahedronGeometry args={[1]} />}
                            <meshStandardMaterial color={color} wireframe={i % 2 === 0} transparent opacity={0.3} />
                        </mesh>
                    </Float>
                ))}
            </group>
        </group>
    );
}

// ─── 4. VORTEX SCENE ────────────────────────────────────────────────────────
function Vortex({ color }) {
    const pointsRef = useRef();
    const count = 2000;

    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const radius = Math.random() * 20;
            const angle = Math.random() * Math.PI * 2;
            const height = (Math.random() - 0.5) * 30;
            pos[i * 3] = Math.cos(angle) * radius;
            pos[i * 3 + 1] = height;
            pos[i * 3 + 2] = Math.sin(angle) * radius;
        }
        return pos;
    }, []);

    useFrame((state) => {
        if (pointsRef.current) {
            const positions = pointsRef.current.geometry.attributes.position.array;
            const t = state.clock.elapsedTime;
            
            for (let i = 0; i < count; i++) {
                const x = positions[i * 3];
                const z = positions[i * 3 + 2];
                const radius = Math.sqrt(x * x + z * z);
                
                // Swirl effect
                const angle = Math.atan2(z, x) + 0.02 * (20 - radius);
                
                positions[i * 3] = Math.cos(angle) * radius;
                positions[i * 3 + 2] = Math.sin(angle) * radius;
            }
            pointsRef.current.geometry.attributes.position.needsUpdate = true;
            pointsRef.current.rotation.y = t * 0.1;
        }
    });

    return (
        <group>
            <fog attach="fog" args={['#050710', 10, 40]} />
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
                </bufferGeometry>
                <PointMaterial color={color} size={0.1} sizeAttenuation transparent opacity={0.6} />
            </points>
        </group>
    );
}

// ─── MAIN EXPORT ────────────────────────────────────────────────────────────
export function ThreeBackgroundRenderer({ type, colorName }) {
    const color = Palette[colorName] || Palette.emerald;

    // Use Intersection Observer to only mount the Canvas when visible
    // Browsers crash if you have 11 active WebGL contexts.
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { rootMargin: '200px' } // Mount slightly before it comes into view
        );
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 -z-10 pointer-events-none" style={{ backgroundColor: '#050710' }}>
            {isVisible && (
                <Canvas camera={{ position: [0, 0, 15], fov: 60 }} dpr={[1, 1.5]} gl={{ alpha: false, powerPreference: 'high-performance' }}>
                    {type === 'cybergrid' && <CyberGrid color={color} />}
                    {type === 'network' && <NeuralNetwork color={color} />}
                    {type === 'geometry' && <FloatingGeometry color={color} />}
                    {type === 'vortex' && <Vortex color={color} />}
                </Canvas>
            )}
            {/* Dark gradient overlay to blend smoothly into the section */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#050710]/80 via-transparent to-[#050710]/80 pointer-events-none" />
        </div>
    );
}
