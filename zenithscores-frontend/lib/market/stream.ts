import { MarketTick } from './types'

type Listener = (tick: MarketTick, delta: number) => void

const listeners = new Set<Listener>()
let lastPrices = new Map<string, number>()

export function subscribe(fn: Listener) {
    listeners.add(fn)
    return () => {
        listeners.delete(fn)
    }
}

export function publish(tick: MarketTick) {
    const prev = lastPrices.get(tick.symbol) ?? tick.price
    const delta = tick.price - prev

    lastPrices.set(tick.symbol, tick.price)

    listeners.forEach(fn => fn(tick, delta))
}
