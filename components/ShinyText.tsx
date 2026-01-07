'use client';

import { CSSProperties } from 'react';

/**
 * ShinyText - Animated shiny text effect for loading states
 * Inspired by reactbits.dev
 */

interface ShinyTextProps {
    text: string;
    disabled?: boolean;
    speed?: number;
    className?: string;
}

export default function ShinyText({
    text,
    disabled = false,
    speed = 5,
    className = ''
}: ShinyTextProps) {
    const animationStyle: CSSProperties = {
        animationDuration: `${speed}s`,
    };

    return (
        <>
            <span
                className={`shiny-text ${disabled ? 'disabled' : ''} ${className}`}
                style={animationStyle}
            >
                {text}
            </span>

            <style jsx>{`
        .shiny-text {
          color: #b5b5b5a4;
          background: linear-gradient(
            120deg,
            rgba(255, 255, 255, 0) 40%,
            rgba(255, 255, 255, 0.8) 50%,
            rgba(255, 255, 255, 0) 60%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          display: inline-block;
          animation: shine 5s linear infinite;
        }

        @keyframes shine {
          0% {
            background-position: 100%;
          }
          100% {
            background-position: -100%;
          }
        }

        .shiny-text.disabled {
          animation: none;
        }
      `}</style>
        </>
    );
}
