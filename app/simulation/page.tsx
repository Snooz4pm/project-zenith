'use client';

/**
 * Brain V2 Simulation Dashboard
 *
 * Real-time monitoring of the simulation engine
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SimulationStats {
    totalTrades: number;
    successfulTrades: number;
    failedTrades: number;
    startingBalance: number;
    currentBalance: number;
    currentValue: number;
    totalPnL: number;
    pnlPercent: number;
    holdings: Array<{
        mint: string;
        symbol: string;
        amount: number;
        avgPrice: number;
    }>;
}

interface SimulationCycle {
    cycleNumber: number;
    regime: string;
    trustLevel: number;
    executionAllowed: boolean;
    executionReason: string;
    trades: number;
    logs: string[];
}

interface SimulationRun {
    id: string;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED';
    startTime: number;
    endTime?: number;
    cycles: number;
    stats: SimulationStats;
    latestCycle?: SimulationCycle;
}

export default function SimulationPage() {
    const [currentRun, setCurrentRun] = useState<SimulationRun | null>(null);
    const [runs, setRuns] = useState<SimulationRun[]>([]);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [autoRun, setAutoRun] = useState(false);

    // Fetch all runs
    const fetchRuns = async () => {
        try {
            const res = await fetch('/api/simulation');
            const data = await res.json();
            if (data.success) {
                setRuns(data.runs);
            }
        } catch (error) {
            console.error('Failed to fetch runs:', error);
        }
    };

    // Fetch current run details
    const fetchRunDetails = async (runId: string) => {
        try {
            const res = await fetch(`/api/simulation?runId=${runId}`);
            const data = await res.json();
            if (data.success) {
                setCurrentRun(data.run);
                if (data.run.latestCycle?.logs) {
                    setLogs(data.run.latestCycle.logs);
                }
            }
        } catch (error) {
            console.error('Failed to fetch run details:', error);
        }
    };

    // Start new simulation
    const startSimulation = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/simulation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    initialSol: 0.1,
                    maxCycles: 100,
                    targetROI: 5,
                }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchRunDetails(data.runId);
                await fetchRuns();
            }
        } catch (error) {
            console.error('Failed to start simulation:', error);
        } finally {
            setLoading(false);
        }
    };

    // Run one cycle
    const runCycle = async () => {
        if (!currentRun) return;
        setLoading(true);
        try {
            const res = await fetch('/api/simulation', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    runId: currentRun.id,
                    action: 'cycle',
                }),
            });
            const data = await res.json();
            if (data.success) {
                setLogs(data.cycle.logs);
                await fetchRunDetails(currentRun.id);
                await fetchRuns();
            }
        } catch (error) {
            console.error('Failed to run cycle:', error);
        } finally {
            setLoading(false);
        }
    };

    // Stop simulation
    const stopSimulation = async () => {
        if (!currentRun) return;
        setLoading(true);
        try {
            const res = await fetch('/api/simulation', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    runId: currentRun.id,
                    action: 'stop',
                }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchRunDetails(currentRun.id);
                await fetchRuns();
                setAutoRun(false);
            }
        } catch (error) {
            console.error('Failed to stop simulation:', error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-run cycles
    useEffect(() => {
        if (autoRun && currentRun?.status === 'RUNNING') {
            const interval = setInterval(() => {
                runCycle();
            }, 5000); // Run cycle every 5 seconds
            return () => clearInterval(interval);
        }
    }, [autoRun, currentRun]);

    // Initial load
    useEffect(() => {
        fetchRuns();
    }, []);

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Brain V2 Live Simulation</h1>
                    <p className="text-muted-foreground">
                        Monitor real-time paper trading with all pillars integrated
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={startSimulation} disabled={loading || (currentRun?.status === 'RUNNING')}>
                        Start New Simulation
                    </Button>
                    {currentRun?.status === 'RUNNING' && (
                        <>
                            <Button onClick={runCycle} disabled={loading} variant="outline">
                                Run 1 Cycle
                            </Button>
                            <Button
                                onClick={() => setAutoRun(!autoRun)}
                                variant={autoRun ? "destructive" : "default"}
                            >
                                {autoRun ? 'Stop Auto' : 'Start Auto'}
                            </Button>
                            <Button onClick={stopSimulation} disabled={loading} variant="destructive">
                                Stop Simulation
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Status</CardDescription>
                        <CardTitle className="text-2xl">
                            {currentRun ? (
                                <Badge variant={
                                    currentRun.status === 'RUNNING' ? 'default' :
                                    currentRun.status === 'COMPLETED' ? 'outline' : 'destructive'
                                }>
                                    {currentRun.status}
                                </Badge>
                            ) : (
                                <span className="text-muted-foreground">No Run</span>
                            )}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Current Balance</CardDescription>
                        <CardTitle className="text-2xl">
                            {currentRun?.stats ? (
                                <span>{currentRun.stats.currentBalance.toFixed(4)} SOL</span>
                            ) : (
                                <span className="text-muted-foreground">-</span>
                            )}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Value</CardDescription>
                        <CardTitle className="text-2xl">
                            {currentRun?.stats ? (
                                <span>{currentRun.stats.currentValue.toFixed(4)} SOL</span>
                            ) : (
                                <span className="text-muted-foreground">-</span>
                            )}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>PnL</CardDescription>
                        <CardTitle className="text-2xl">
                            {currentRun?.stats ? (
                                <span className={currentRun.stats.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {currentRun.stats.pnlPercent >= 0 ? '+' : ''}{currentRun.stats.pnlPercent.toFixed(2)}%
                                </span>
                            ) : (
                                <span className="text-muted-foreground">-</span>
                            )}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Tabs defaultValue="current" className="w-full">
                <TabsList>
                    <TabsTrigger value="current">Current Run</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="logs">Live Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="space-y-4">
                    {currentRun ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Latest Cycle</CardTitle>
                                        <CardDescription>
                                            Cycle {currentRun.latestCycle?.cycleNumber || 0} of {currentRun.cycles}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {currentRun.latestCycle && (
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Regime:</span>
                                                    <Badge variant="outline">{currentRun.latestCycle.regime}</Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Trust Level:</span>
                                                    <span>{currentRun.latestCycle.trustLevel}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Execution:</span>
                                                    <Badge variant={currentRun.latestCycle.executionAllowed ? 'default' : 'destructive'}>
                                                        {currentRun.latestCycle.executionAllowed ? 'ALLOWED' : 'BLOCKED'}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Trades:</span>
                                                    <span>{currentRun.latestCycle.trades}</span>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Portfolio</CardTitle>
                                        <CardDescription>Current holdings</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium">SOL</span>
                                                <span>{currentRun.stats.currentBalance.toFixed(6)}</span>
                                            </div>
                                            {currentRun.stats.holdings.map((holding) => (
                                                <div key={holding.mint} className="flex justify-between text-sm">
                                                    <span className="font-medium">{holding.symbol}</span>
                                                    <span>{holding.amount.toFixed(6)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Trade Statistics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <div className="text-muted-foreground">Total Trades</div>
                                            <div className="text-2xl font-bold">{currentRun.stats.totalTrades}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Successful</div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {currentRun.stats.successfulTrades}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Failed</div>
                                            <div className="text-2xl font-bold text-red-600">
                                                {currentRun.stats.failedTrades}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center text-muted-foreground">
                                    No active simulation. Start a new one to begin.
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Simulation History</CardTitle>
                            <CardDescription>All past simulation runs</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {runs.map((run) => (
                                    <div
                                        key={run.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                                        onClick={() => fetchRunDetails(run.id)}
                                    >
                                        <div>
                                            <div className="font-medium">{run.id.substring(0, 12)}...</div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(run.startTime).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-sm text-muted-foreground">Cycles</div>
                                                <div className="font-medium">{run.cycles}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-muted-foreground">PnL</div>
                                                <div className={run.pnl >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                                    {run.pnl >= 0 ? '+' : ''}{run.pnl.toFixed(2)}%
                                                </div>
                                            </div>
                                            <Badge variant={
                                                run.status === 'RUNNING' ? 'default' :
                                                run.status === 'COMPLETED' ? 'outline' : 'destructive'
                                            }>
                                                {run.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="logs">
                    <Card>
                        <CardHeader>
                            <CardTitle>Live Logs</CardTitle>
                            <CardDescription>Real-time execution logs</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                                <div className="space-y-1 font-mono text-xs">
                                    {logs.map((log, i) => (
                                        <div key={i} className="whitespace-pre-wrap">
                                            {log}
                                        </div>
                                    ))}
                                    {logs.length === 0 && (
                                        <div className="text-muted-foreground text-center py-8">
                                            No logs yet. Run a cycle to see logs.
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
