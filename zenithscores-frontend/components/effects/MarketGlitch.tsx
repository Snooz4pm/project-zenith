'use client';

import { useRef, useEffect } from 'react';

interface MarketGlitchProps {
    glitchColors?: string[];
    className?: string;
    glitchSpeed?: number;
    centerVignette?: boolean;
    outerVignette?: boolean;
    smooth?: boolean;
}

/**
 * MarketGlitch - A mesmerizing background animation using trading symbols
 * Based on LetterGlitch from ReactBits, customized for ZenithScore
 */
const MarketGlitch = ({
    glitchColors = ['#00f0ff', '#a855f7', '#22c55e', '#f59e0b'],
    className = '',
    glitchSpeed = 50,
    centerVignette = false,
    outerVignette = true,
    smooth = true,
}: MarketGlitchProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const letters = useRef<Array<{
        char: string;
        color: string;
        targetColor: string;
        colorProgress: number;
    }>>([]);
    const grid = useRef({ columns: 0, rows: 0 });
    const context = useRef<CanvasRenderingContext2D | null>(null);
    const lastGlitchTime = useRef(Date.now());

    // Market-themed characters: crypto symbols, forex pairs, stock tickers, numbers, trading symbols
    const marketSymbols = [
        // Crypto
        'BTC', 'ETH', 'SOL', 'ADA', 'DOT', '₿', 'Ξ', '◎',
        // Forex pairs shorthand
        'EUR', 'USD', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD',
        // Stocks
        'AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'META', 'AMZN',
        // Trading symbols
        '↑', '↓', '→', '←', '▲', '▼', '◆', '●', '○',
        // Numbers and percentages  
        '+2.4%', '-1.2%', '+5.7%', '-0.8%', '+12%', '-3.5%',
        // Simple chars
        '$', '€', '£', '¥', '%', '#', '@',
        // Patterns
        '////', '====', '----', '....', '****',
    ];

    const fontSize = 14;
    const charWidth = 12;
    const charHeight = 18;

    const getRandomChar = () => {
        return marketSymbols[Math.floor(Math.random() * marketSymbols.length)];
    };

    const getRandomColor = () => {
        return glitchColors[Math.floor(Math.random() * glitchColors.length)];
    };

    const hexToRgb = (hex: string) => {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
            }
            : null;
    };

    const interpolateColor = (
        start: { r: number; g: number; b: number },
        end: { r: number; g: number; b: number },
        factor: number
    ) => {
        const result = {
            r: Math.round(start.r + (end.r - start.r) * factor),
            g: Math.round(start.g + (end.g - start.g) * factor),
            b: Math.round(start.b + (end.b - start.b) * factor),
        };
        return `rgb(${result.r}, ${result.g}, ${result.b})`;
    };

    const calculateGrid = (width: number, height: number) => {
        const columns = Math.ceil(width / charWidth);
        const rows = Math.ceil(height / charHeight);
        return { columns, rows };
    };

    const initializeLetters = (columns: number, rows: number) => {
        grid.current = { columns, rows };
        const totalLetters = columns * rows;
        letters.current = Array.from({ length: totalLetters }, () => ({
            char: getRandomChar(),
            color: getRandomColor(),
            targetColor: getRandomColor(),
            colorProgress: 1,
        }));
    };

    const resizeCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = parent.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        if (context.current) {
            context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        const { columns, rows } = calculateGrid(rect.width, rect.height);
        initializeLetters(columns, rows);
        drawLetters();
    };

    const drawLetters = () => {
        if (!context.current || letters.current.length === 0 || !canvasRef.current) return;
        const ctx = context.current;
        const { width, height } = canvasRef.current.getBoundingClientRect();
        ctx.clearRect(0, 0, width, height);
        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
        ctx.textBaseline = 'top';

        letters.current.forEach((letter, index) => {
            const x = (index % grid.current.columns) * charWidth;
            const y = Math.floor(index / grid.current.columns) * charHeight;
            ctx.fillStyle = letter.color;

            // Add slight opacity variation
            ctx.globalAlpha = 0.3 + Math.random() * 0.4;
            ctx.fillText(letter.char.charAt(0), x, y);
            ctx.globalAlpha = 1;
        });
    };

    const updateLetters = () => {
        if (!letters.current || letters.current.length === 0) return;

        const updateCount = Math.max(1, Math.floor(letters.current.length * 0.08));

        for (let i = 0; i < updateCount; i++) {
            const index = Math.floor(Math.random() * letters.current.length);
            if (!letters.current[index]) continue;

            letters.current[index].char = getRandomChar();
            letters.current[index].targetColor = getRandomColor();

            if (!smooth) {
                letters.current[index].color = letters.current[index].targetColor;
                letters.current[index].colorProgress = 1;
            } else {
                letters.current[index].colorProgress = 0;
            }
        }
    };

    const handleSmoothTransitions = () => {
        let needsRedraw = false;
        letters.current.forEach((letter) => {
            if (letter.colorProgress < 1) {
                letter.colorProgress += 0.05;
                if (letter.colorProgress > 1) letter.colorProgress = 1;

                const startRgb = hexToRgb(letter.color);
                const endRgb = hexToRgb(letter.targetColor);
                if (startRgb && endRgb) {
                    letter.color = interpolateColor(startRgb, endRgb, letter.colorProgress);
                    needsRedraw = true;
                }
            }
        });

        if (needsRedraw) {
            drawLetters();
        }
    };

    const animate = () => {
        const now = Date.now();
        if (now - lastGlitchTime.current >= glitchSpeed) {
            updateLetters();
            drawLetters();
            lastGlitchTime.current = now;
        }

        if (smooth) {
            handleSmoothTransitions();
        }

        animationRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        context.current = canvas.getContext('2d');
        resizeCanvas();
        animate();

        let resizeTimeout: NodeJS.Timeout;

        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                cancelAnimationFrame(animationRef.current);
                resizeCanvas();
                animate();
            }, 100);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', handleResize);
        };
    }, [glitchSpeed, smooth]);

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                backgroundColor: '#000000',
                overflow: 'hidden',
            }}
            className={className}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                }}
            />
            {outerVignette && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        background: 'radial-gradient(circle, rgba(0,0,0,0) 40%, rgba(0,0,0,0.95) 100%)',
                    }}
                />
            )}
            {centerVignette && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        background: 'radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)',
                    }}
                />
            )}
        </div>
    );
};

export default MarketGlitch;
