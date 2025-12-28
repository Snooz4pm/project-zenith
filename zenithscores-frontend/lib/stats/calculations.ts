
export function calculateReturns(data: any[]): {
    totalReturn: number;
    annualizedReturn: number;
    periodicReturns: number[];
    sharpeRatio: number;
} {
    if (data.length < 2) {
        return { totalReturn: 0, annualizedReturn: 0, periodicReturns: [], sharpeRatio: 0 };
    }

    // Sort by date
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

    // Calculate periodic returns
    const returns: number[] = [];
    for (let i = 1; i < sortedData.length; i++) {
        const prevClose = sortedData[i - 1].close;
        const currentClose = sortedData[i].close;
        const periodReturn = (currentClose - prevClose) / prevClose;
        returns.push(periodReturn);
    }

    // Total return
    const firstPrice = sortedData[0].close;
    const lastPrice = sortedData[sortedData.length - 1].close;
    const totalReturn = (lastPrice - firstPrice) / firstPrice;

    // Annualized return
    const firstDate = new Date(sortedData[0].timestamp);
    const lastDate = new Date(sortedData[sortedData.length - 1].timestamp);
    const yearsDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const annualizedReturn = yearsDiff > 0 ? Math.pow(1 + totalReturn, 1 / yearsDiff) - 1 : 0;

    // Sharpe ratio (simplified)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sq, n) => sq + Math.pow(n - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    return {
        totalReturn,
        annualizedReturn,
        periodicReturns: returns,
        sharpeRatio
    };
}

export function calculateVolatility(data: any[]): {
    annualized(annualized: any): unknown;
    dailyVolatility: number;
    annualizedVolatility: number;
    volatilityOfVolatility: number;
} {
    if (data.length < 2) {
        return {
            dailyVolatility: 0, annualizedVolatility: 0, volatilityOfVolatility: 0,
            annualized: function (annualized: any): unknown {
                throw new Error("Function not implemented.");
            },
            dailyVolatility: 0,
            annualizedVolatility: 0,
            volatilityOfVolatility: 0
        };
    }

    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    const returns: number[] = [];

    for (let i = 1; i < sortedData.length; i++) {
        const prevClose = sortedData[i - 1].close;
        const currentClose = sortedData[i].close;
        const periodReturn = (currentClose - prevClose) / prevClose;
        returns.push(periodReturn);
    }

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sq, n) => sq + Math.pow(n - avgReturn, 2), 0) / returns.length;
    const dailyVolatility = Math.sqrt(variance);

    // Annualize (assuming 252 trading days)
    const annualizedVolatility = dailyVolatility * Math.sqrt(252);

    // Volatility of volatility
    const volatilityChanges: number[] = [];
    for (let i = 1; i < returns.length; i++) {
        volatilityChanges.push(Math.abs(returns[i] - returns[i - 1]));
    }
    const volOfVol = volatilityChanges.length > 0
        ? volatilityChanges.reduce((a, b) => a + b, 0) / volatilityChanges.length
        : 0;

    return {
        dailyVolatility, annualizedVolatility, volatilityOfVolatility: volOfVol,
        annualized: function (annualized: any): unknown {
            throw new Error("Function not implemented.");
        },
        dailyVolatility: 0,
        annualizedVolatility: 0,
        volatilityOfVolatility: 0
    };
}

export function calculateDrawdowns(data: any[]): {
    maxDrawdown: number;
    avgDrawdown: number;
    avgRecoveryDays: number;
    recoverySuccessRate: number;
    recoveries: Array<{ depth: number; duration: number; recoveryDays: number }>;
} {
    if (data.length < 10) {
        return {
            maxDrawdown: 0,
            avgDrawdown: 0,
            avgRecoveryDays: 0,
            recoverySuccessRate: 0,
            recoveries: []
        };
    }

    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    let peak = sortedData[0].close;
    let trough = sortedData[0].close;
    let maxDrawdown = 0;
    const drawdowns: Array<{ peak: number; trough: number; depth: number; start: Date; end: Date | null }> = [];
    let currentDrawdown: any = null;

    for (let i = 0; i < sortedData.length; i++) {
        const price = sortedData[i].close;
        const date = new Date(sortedData[i].timestamp);

        if (price > peak) {
            peak = price;
            trough = price;

            // End previous drawdown if it exists
            if (currentDrawdown) {
                currentDrawdown.end = date;
                drawdowns.push(currentDrawdown);
                currentDrawdown = null;
            }
        } else if (price < trough) {
            trough = price;
            const drawdown = (peak - trough) / peak;

            if (!currentDrawdown) {
                // Start new drawdown
                currentDrawdown = {
                    peak,
                    trough,
                    depth: drawdown,
                    start: date,
                    end: null
                };
            } else {
                // Update existing drawdown
                currentDrawdown.trough = trough;
                currentDrawdown.depth = drawdown;
            }

            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }
    }

    // Calculate recovery statistics
    const recoveries: Array<{ depth: number; duration: number; recoveryDays: number }> = [];
    let totalRecoveryDays = 0;
    let successfulRecoveries = 0;

    for (let i = 0; i < drawdowns.length; i++) {
        const drawdown = drawdowns[i];
        if (!drawdown.end) continue;

        const duration = drawdown.end.getTime() - drawdown.start.getTime();
        const recoveryDays = duration / (1000 * 60 * 60 * 24);

        recoveries.push({
            depth: drawdown.depth,
            duration: duration,
            recoveryDays: recoveryDays
        });

        totalRecoveryDays += recoveryDays;
        successfulRecoveries++;
    }

    const avgRecoveryDays = successfulRecoveries > 0 ? totalRecoveryDays / successfulRecoveries : 0;
    const recoverySuccessRate = drawdowns.length > 0 ? successfulRecoveries / drawdowns.length : 0;
    const avgDrawdown = drawdowns.length > 0
        ? drawdowns.reduce((sum, dd) => sum + dd.depth, 0) / drawdowns.length
        : 0;

    return {
        maxDrawdown,
        avgDrawdown,
        avgRecoveryDays,
        recoverySuccessRate,
        recoveries
    };
}
