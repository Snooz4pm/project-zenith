import { useState, useEffect, useRef, useCallback } from 'react';
import { Time } from 'lightweight-charts';

interface TickData {
    time: Time;
    value: number;
}

interface UseMarketDataParams {
    initialPrice: number;
    volatility?: number; // 0.0 to 1.0 (percent variance)
    intervalMs?: number; // update speed
    symbol?: string;
}

export const useMarketData = ({
    initialPrice,
    volatility = 0.002, // 0.2% volatility
    intervalMs = 200, // Very fast updates for "live" feel
    symbol
}: UseMarketDataParams) => {
    const [currentPrice, setCurrentPrice] = useState(initialPrice);
    const [lastTick, setLastTick] = useState<TickData | null>(null);
    const priceRef = useRef(initialPrice);

    // Generate initial history
    const generateHistory = useCallback((days = 90) => {
        const data: TickData[] = [];
        let price = initialPrice * 0.9;
        const now = Math.floor(Date.now() / 1000);

        for (let i = days * 24; i > 0; i--) { // Hourly bars for history
            const time = (now - (i * 3600)) as Time;
            const change = (Math.random() - 0.5) * (price * volatility * 2); // More volatility for history
            price += change;

            // Keep price positive
            if (price < 0.01) price = 0.01;

            data.push({ time, value: price });
        }

        // Ensure the last point connects to current price
        priceRef.current = price;
        setCurrentPrice(price);

        return data;
    }, [initialPrice, volatility]);

    const [history, setHistory] = useState<TickData[]>([]);

    useEffect(() => {
        setHistory(generateHistory());
    }, [generateHistory]);

    useEffect(() => {
        priceRef.current = initialPrice;
        setCurrentPrice(initialPrice);
        setHistory(generateHistory());
    }, [initialPrice]);

    // Live Tick Generation
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000) as Time;
            const prevPrice = priceRef.current;

            // Random Walk
            const direction = Math.random() > 0.48 ? 1 : -1; // Slight bullish drift bias
            const magnitude = prevPrice * (volatility / 100) * (Math.random() * 2);
            let newPrice = prevPrice + (direction * magnitude);

            // Dampening: Return to mean if too far? 
            // For now just pure random walk looking "organic"

            if (newPrice < 0.01) newPrice = 0.01;

            priceRef.current = newPrice;
            setCurrentPrice(newPrice);

            setLastTick({
                time: now,
                value: newPrice
            });

        }, intervalMs);

        return () => clearInterval(interval);
    }, [intervalMs, volatility]);

    return {
        currentPrice,
        history,
        lastTick
    };
};
