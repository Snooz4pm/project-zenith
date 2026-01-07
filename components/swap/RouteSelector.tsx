/**
 * RouteSelector Component
 * 
 * Terminal-style route selection UI.
 * Shows BEST / FASTEST / LOW IMPACT options.
 */

'use client';

import { Zap, TrendingUp, Shield, Check } from 'lucide-react';
import { ClassifiedRoute, formatRouteForDisplay } from '@/lib/swap/routes';
import { lamportsToUi } from '@/lib/swap/helpers';

interface RouteSelectorProps {
  routes: ClassifiedRoute[];
  selectedRoute: ClassifiedRoute | null;
  onSelectRoute: (route: ClassifiedRoute) => void;
  outputDecimals: number;
  outputSymbol?: string;
}

export function RouteSelector({
  routes,
  selectedRoute,
  onSelectRoute,
  outputDecimals,
  outputSymbol
}: RouteSelectorProps) {
  if (!routes.length) return null;

  const getRouteIcon = (type: string) => {
    switch (type) {
      case 'best': return <TrendingUp className="w-4 h-4" />;
      case 'fastest': return <Zap className="w-4 h-4" />;
      case 'low_impact': return <Shield className="w-4 h-4" />;
      default: return null;
    }
  };

  const getRouteColor = (type: string, isSelected: boolean) => {
    if (!isSelected) return 'border-white/10 bg-white/[0.02]';
    
    switch (type) {
      case 'best': return 'border-emerald-500/50 bg-emerald-500/10';
      case 'fastest': return 'border-blue-500/50 bg-blue-500/10';
      case 'low_impact': return 'border-purple-500/50 bg-purple-500/10';
      default: return 'border-white/20 bg-white/5';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'best': return 'text-emerald-400';
      case 'fastest': return 'text-blue-400';
      case 'low_impact': return 'text-purple-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Select Route</p>
      
      {routes.map((route) => {
        const isSelected = selectedRoute?.route.outAmount === route.route.outAmount;
        const formatted = formatRouteForDisplay(route);
        const outputUi = lamportsToUi(route.outAmount.toString(), outputDecimals);

        return (
          <button
            key={route.type}
            onClick={() => onSelectRoute(route)}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${getRouteColor(route.type, isSelected)}`}
          >
            <div className="flex items-center gap-3">
              {/* Selection indicator */}
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                isSelected ? 'border-white bg-white' : 'border-zinc-600'
              }`}>
                {isSelected && <Check className="w-3 h-3 text-black" />}
              </div>

              {/* Route info */}
              <div className="flex items-center gap-2">
                <span className={getTextColor(route.type)}>
                  {getRouteIcon(route.type)}
                </span>
                <div className="text-left">
                  <p className={`text-sm font-medium ${getTextColor(route.type)}`}>
                    {formatted.label}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatted.advantage}
                  </p>
                </div>
              </div>
            </div>

            {/* Output amount */}
            <div className="text-right">
              <p className="text-sm font-mono text-white">
                {outputUi.toFixed(outputDecimals > 6 ? 6 : outputDecimals)}
              </p>
              {outputSymbol && (
                <p className="text-xs text-zinc-500">{outputSymbol}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact route badge (for showing selected route)
 */
export function RouteBadge({ route }: { route: ClassifiedRoute }) {
  const getColor = () => {
    switch (route.type) {
      case 'best': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'fastest': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'low_impact': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  const getIcon = () => {
    switch (route.type) {
      case 'best': return <TrendingUp className="w-3 h-3" />;
      case 'fastest': return <Zap className="w-3 h-3" />;
      case 'low_impact': return <Shield className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${getColor()}`}>
      {getIcon()}
      {route.label}
    </span>
  );
}
