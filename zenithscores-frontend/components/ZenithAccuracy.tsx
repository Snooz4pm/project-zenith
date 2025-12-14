import { TrendingUp, CheckCircle, Clock } from 'lucide-react';

export default function ZenithAccuracy() {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-green-500 w-5 h-5" />
                Zenith Track Record
            </h3>
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <CheckCircle className="text-green-500 w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-2xl font-bold text-white">73%</p>
                        <p className="text-sm text-gray-400">of "Strong Buy" signals moved up in 24h</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <TrendingUp className="text-blue-500 w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-xl font-bold text-white">+5.4%</p>
                        <p className="text-sm text-gray-400">Avg. return after 7 days</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 border-t border-gray-800 pt-3">
                    <Clock className="text-gray-500 w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500 italic">
                        Based on last 120 predictions. Past performance is not indicative of future results.
                    </p>
                </div>
            </div>
        </div>
    );
}
