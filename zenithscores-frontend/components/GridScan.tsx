'use client';

import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Color } from 'ogl';

/**
 * GridScan Background - Technical grid with scanning laser effect
 * Inspired by reactbits.dev grid-scan component
 * Perfect for data-heavy trading pages
 */

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform vec3 uGridColor;
uniform vec3 uScanColor;
uniform float uGridSize;
uniform float uScanSpeed;

// Draw a grid line
float grid(vec2 uv, float lineWidth) {
    vec2 grid = abs(fract(uv - 0.5) - 0.5);
    float d = min(grid.x, grid.y);
    return 1.0 - smoothstep(0.0, lineWidth, d);
}

// 3D perspective grid
float perspectiveGrid(vec2 uv, float time) {
    // Apply perspective transformation
    vec2 p = uv - 0.5;
    float z = 1.0 + p.y * 2.0;
    p.x *= z;
    p.y = p.y * 3.0 - time * 0.3; // Scrolling effect
    
    // Multi-level grid
    float g1 = grid(p * uGridSize, 0.02 / z);
    float g2 = grid(p * uGridSize * 4.0, 0.01 / z);
    
    // Fade with depth
    float fade = smoothstep(-0.5, 0.3, uv.y);
    
    return (g1 * 0.8 + g2 * 0.3) * fade;
}

// Scanning laser line
float scanLine(vec2 uv, float time) {
    float scanPos = fract(time * uScanSpeed);
    float scan = smoothstep(0.0, 0.02, abs(uv.y - scanPos));
    scan = 1.0 - scan;
    
    // Add glow
    float glow = exp(-abs(uv.y - scanPos) * 30.0);
    
    return scan + glow * 0.5;
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    
    // Grid
    float gridVal = perspectiveGrid(uv, iTime);
    vec3 gridColor = uGridColor * gridVal * 0.6;
    
    // Scan line
    float scan = scanLine(uv, iTime);
    vec3 scanColor = uScanColor * scan * 0.4;
    
    // Combine
    vec3 color = gridColor + scanColor;
    
    // Vignette
    vec2 center = uv - 0.5;
    float vignette = 1.0 - dot(center, center) * 0.5;
    color *= vignette;
    
    // Alpha based on content
    float alpha = max(gridVal * 0.5, scan * 0.3);
    
    gl_FragColor = vec4(color, alpha);
}
`;

interface GridScanProps {
  gridColor?: [number, number, number]; // Default: cyan
  scanColor?: [number, number, number]; // Default: purple
  gridSize?: number;
  scanSpeed?: number;
  className?: string;
}

export default function GridScan({
  gridColor = [0, 0.94, 1], // Zenith Cyan
  scanColor = [0.66, 0.33, 0.97], // Zenith Purple
  gridSize = 10,
  scanSpeed = 0.15,
  className = ''
}: GridScanProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const renderer = new Renderer({ alpha: true });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Color(gl.canvas.width, gl.canvas.height, 1)
        },
        uGridColor: { value: new Color(...gridColor) },
        uScanColor: { value: new Color(...scanColor) },
        uGridSize: { value: gridSize },
        uScanSpeed: { value: scanSpeed }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      const { clientWidth, clientHeight } = container;
      renderer.setSize(clientWidth, clientHeight);
      program.uniforms.iResolution.value.r = clientWidth;
      program.uniforms.iResolution.value.g = clientHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function update(t: number) {
      program.uniforms.iTime.value = t * 0.001;
      renderer.render({ scene: mesh });
      animationFrameId.current = requestAnimationFrame(update);
    }
    animationFrameId.current = requestAnimationFrame(update);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', resize);
      if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [gridColor, scanColor, gridSize, scanSpeed]);

  return (
    <div 
      ref={containerRef} 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
