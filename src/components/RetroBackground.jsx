
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Trail, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const TerrainGrid = () => {
    const gridRef = useRef();
    
    useFrame((state, delta) => {
        if (!gridRef.current) return;
        // Move the grid towards the camera
        gridRef.current.position.z += delta * 15;
        // Loop the grid to create infinite scrolling effect
        if (gridRef.current.position.z > 10) {
            gridRef.current.position.z -= 10;
        }
    });

    return (
        <group ref={gridRef} position={[0, -3, -40]}>
            <gridHelper args={[120, 120, '#ff007f', '#00e5ff']} position={[0, 0, 0]} />
        </group>
    );
};

const OutrunSun = () => {
    return (
        <mesh position={[0, 2, -60]}>
            <circleGeometry args={[20, 64]} />
            <meshBasicMaterial color="#ff2a6d" fog={false} />
        </mesh>
    );
};

export default function RetroBackground() {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" style={{ backgroundColor: '#050710' }}>
            <>
            <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={60} />
            
                <color attach="background" args={['#050710']} />
                <fog attach="fog" args={['#050710', 20, 80]} />
                
                <Stars radius={60} depth={30} count={3000} factor={4} saturation={1} fade speed={1.5} />
                <OutrunSun />
                <TerrainGrid />
                
                {/* Ambient glow */}
                <ambientLight intensity={0.5} />
                <pointLight position={[0, 5, -50]} intensity={2} color="#ff2a6d" />
            </>
            
            {/* Scanline overlay effect */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay"
                style={{
                    backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9InRyYW5zcGFyZW50Ii8+PHJlY3Qgd2lkdGg9IjQiIGhlaWdodD0iMSIgZmlsbD0icmdiYSgwLCAwLCAwLCAwLjcpIi8+PC9zdmc+")',
                    backgroundSize: '4px 4px'
                }}
            />
            {/* Bottom horizon glow */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#ff007f]/10 to-transparent pointer-events-none mix-blend-screen" />
        </div>
    );
}
