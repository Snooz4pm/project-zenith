'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Zap } from 'lucide-react';

interface Alert {
    id: number;
    symbol: string;
    type: 'high' | 'low';
    message: string;
    time: string;
}

export default function AlertsFeed() {
    const [alerts, setAlerts] = useState<Alert[]>([]);

    useEffect(() => {
        // Init mock alerts
        const initialAlerts: Alert[] = [
            { id: 1, symbol: 'SOL', type: 'high', message: 'Jumped above 80 Score', time: '2m ago' },
            { id: 2, symbol: 'PEPE', type: 'high', message: 'Volume spike detected', time: '5m ago' },
        ];
        setAlerts(initialAlerts);

        // Simulate live feed
        const interval = setInterval(() => {
            const newAlert: Alert = {
                id: Date.now(),
                symbol: ['ETH', 'AVAX', 'LINK', 'UNI'][Math.floor(Math.random() * 4)],
                type: Math.random() > 0.5 ? 'high' : 'low',
                message: Math.random() > 0.5 ? 'Crossed key resistance level' : 'Zenith Score reversal detected',
                time: 'Just now'
            };
            setAlerts(prev => [newAlert, ...prev].slice(0, 5));
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
                <div className="relative">
                    <Zap size={18} className="text-yellow-400" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
                </div>
                <h3 className="font-bold text-white text-sm">Extreme Signals</h3>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {alerts.map(alert => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: -20, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`p-3 rounded-lg border text-xs relative overflow-hidden ${alert.type === 'high' ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}
                        >
                            <div className="flex justify-between items-start mb-1 relative z-10">
                                <span className="font-bold text-white">{alert.symbol}</span>
                                <span className="text-gray-500">{alert.time}</span>
                            </div>
                            <p className="text-gray-300 relative z-10">{alert.message}</p>

                            {/* Background Flash Effect */}
                            <motion.div
                                initial={{ opacity: 0.5 }}
                                animate={{ opacity: 0 }}
                                transition={{ duration: 1 }}
                                className={`absolute inset-0 ${alert.type === 'high' ? 'bg-green-500/20' : 'bg-red-500/20'}`}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
