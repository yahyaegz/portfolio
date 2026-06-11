import React from 'react';
import { ThreeBackgroundRenderer } from './ThreeBackgrounds';

export default function SectionBackground({ variant }) {
    switch (variant) {
        case 'services':
            return <ThreeBackgroundRenderer type="geometry" colorName="emerald" />;
        case 'skills':
            return <ThreeBackgroundRenderer type="network" colorName="cyan" />;
        case 'code':
            return <ThreeBackgroundRenderer type="cybergrid" colorName="emerald" />;
        case 'projects':
            return <ThreeBackgroundRenderer type="geometry" colorName="cyan" />;
        case 'ai-lab':
            return <ThreeBackgroundRenderer type="network" colorName="purple" />;
        case 'algorithms':
            return <ThreeBackgroundRenderer type="network" colorName="slate" />;
        case 'cv':
            return <ThreeBackgroundRenderer type="cybergrid" colorName="slate" />;
        case 'devops':
            return <ThreeBackgroundRenderer type="cybergrid" colorName="amber" />;
        case 'certifications':
            return <ThreeBackgroundRenderer type="geometry" colorName="amber" />;
        case 'cta':
            return <ThreeBackgroundRenderer type="vortex" colorName="emerald" />;
        case 'contact':
            return <ThreeBackgroundRenderer type="vortex" colorName="cyan" />;
        default:
            return null;
    }
}
