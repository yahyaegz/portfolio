import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

export default function WebGLDisposer() {
    const gl = useThree((state) => state.gl);

    useEffect(() => {
        return () => {
            if (gl) {
                const ext = gl.getExtension('WEBGL_lose_context');
                if (ext) {
                    ext.loseContext();
                }
            }
        };
    }, [gl]);

    return null;
}
