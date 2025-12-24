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
    days?: number; // Number of days of history to generate
}

export const useMarketData = ({
    initialPrice,
    volatility = 0.002, // 0.2% volatility
    intervalMs = 200, // Very fast updates for "live" feel
    symbol,
    days = 90 // Default to 3 months
}: UseMarketDataParams) => {
    const [currentPrice, setCurrentPrice] = useState(initialPrice);
    const [lastTick, setLastTick] = useState<TickData | null>(null);
    const priceRef = useRef(initialPrice);

    // Generate initial history
    const generateHistory = useCallback(() => {
        const data: TickData[] = [];
        let price = initialPrice * 0.9;
        const now = Math.floor(Date.now() / 1000);

        // Use hourly bars for longer periods, 15-min bars for shorter
        const barsPerDay = days <= 7 ? 96 : 24; // 15-min bars for 1D/1W, hourly for longer
        const totalBars = days * barsPerDay;
        const secondsPerBar = (days * 24 * 3600) / totalBars;

        for (let i = totalBars; i > 0; i--) {
            const time = (now - (i * secondsPerBar)) as Time;
            const change = (Math.random() - 0.5) * (price * volatility * 2);
            price += change;

            if (price < 0.01) price = 0.01;

            data.push({ time, value: price });
        }

        priceRef.current = price;
        setCurrentPrice(price);

        return data;
    }, [initialPrice, volatility, days]);

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
