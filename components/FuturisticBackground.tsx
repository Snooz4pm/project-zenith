'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    pulsePhase: number;
}

interface FuturisticBackgroundProps {
    particleCount?: number;
    connectionDistance?: number;
    showScanLines?: boolean;
    showNoise?: boolean;
    showMeshGradient?: boolean;
    mouseParallax?: boolean;
    colors?: string[];
}

/**
 * Complete futuristic background system with:
 * - Multi-layered animated mesh gradients
 * - Interactive particle system with mouse parallax
 * - Scan lines overlay
 * - Noise texture
 * - Matrix rain effect (subtle)
 */
const FuturisticBackground: React.FC<FuturisticBackgroundProps> = ({
    particleCount = 80,
    connectionDistance = 150,
    showScanLines = true,
    showNoise = true,
    showMeshGradient = true,
    mouseParallax = true,
    colors = ['#00f0ff', '#a855f7', '#f72585', '#10b981'],
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const [gradientOffset, setGradientOffset] = useState({ x: 0, y: 0 });

    // Handle mouse movement for parallax
    useEffect(() => {
        if (!mouseParallax) return;

        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            mouseRef.current = { x, y };
            setGradientOffset({ x: x * 30, y: y * 30 });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseParallax]);

    // Particle system
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2 + 1,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    pulsePhase: Math.random() * Math.PI * 2,
                });
            }
        };

        const draw = (time: number) => {
            // Clear with fade trail
            ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const mouse = mouseRef.current;

            particles.forEach((p, i) => {
                // Mouse influence
                if (mouseParallax) {
                    const mouseInfluence = 0.02;
                    p.vx += mouse.x * mouseInfluence * 0.1;
                    p.vy += mouse.y * mouseInfluence * 0.1;
                }

                // Apply velocity with damping
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.99;
                p.vy *= 0.99;

                // Bounce off edges
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                // Keep in bounds
                p.x = Math.max(0, Math.min(canvas.width, p.x));
                p.y = Math.max(0, Math.min(canvas.height, p.y));

                // Pulsing size
                const pulse = Math.sin(time * 0.002 + p.pulsePhase) * 0.5 + 1;
                const currentSize = p.size * pulse;

                // Draw particle with glow
                ctx.beginPath();
                ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);

                // Create gradient for glow effect
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 3);
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(0.5, p.color + '60');
                gradient.addColorStop(1, 'transparent');

                ctx.fillStyle = gradient;
                ctx.fill();

                // Core dot
                ctx.beginPath();
                ctx.arc(p.x, p.y, currentSize * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();

                // Draw connections
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDistance) {
                        const opacity = (1 - dist / connectionDistance) * 0.4;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        resize();
        animationFrameId = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [particleCount, connectionDistance, colors, mouseParallax]);

    return (
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
            {/* Mesh Gradient Background */}
            {showMeshGradient && (
                <div
                    className="absolute inset-0 transition-transform duration-1000 ease-out"
                    style={{
                        transform: `translate(${gradientOffset.x}px, ${gradientOffset.y}px)`,
                    }}
                >
                    <div
                        className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-30"
                        style={{
                            background: `radial-gradient(circle, ${colors[0]}40, transparent 70%)`,
                            top: '10%',
                            left: '20%',
                            animation: 'float 20s ease-in-out infinite',
                        }}
                    />
                    <div
                        className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-25"
                        style={{
                            background: `radial-gradient(circle, ${colors[1]}40, transparent 70%)`,
                            top: '40%',
                            right: '10%',
                            animation: 'float 25s ease-in-out infinite reverse',
                        }}
                    />
                    <div
                        className="absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-20"
                        style={{
                            background: `radial-gradient(circle, ${colors[2]}40, transparent 70%)`,
                            bottom: '10%',
                            left: '30%',
                            animation: 'float 30s ease-in-out infinite',
                        }}
                    />
                    <div
                        className="absolute w-[400px] h-[400px] rounded-full blur-[60px] opacity-15"
                        style={{
                            background: `radial-gradient(circle, ${colors[3]}40, transparent 70%)`,
                            top: '60%',
                            right: '30%',
                            animation: 'float 22s ease-in-out infinite reverse',
                        }}
                    />
                </div>
            )}

            {/* Canvas for particles */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0"
                style={{ background: '#0a0a0f' }}
            />

            {/* Scan Lines */}
            {showScanLines && (
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{
                        background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255, 255, 255, 0.1) 2px,
              rgba(255, 255, 255, 0.1) 4px
            )`,
                    }}
                />
            )}

            {/* Moving Scan Line */}
            {showScanLines && (
                <div
                    className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"
                    style={{
                        animation: 'scan-line 4s linear infinite',
                    }}
                />
            )}

            {/* Noise Texture */}
            {showNoise && (
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.02]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                />
            )}

            {/* Vignette Effect */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
                }}
            />
        </div>
    );
};

export default FuturisticBackground;
