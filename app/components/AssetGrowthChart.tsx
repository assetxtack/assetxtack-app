"use client";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid 
} from "recharts";
import { mockGrowthData } from "@/lib/mockData";
import { TrendingUp } from "lucide-react";

export default function AssetGrowthChart() {
  const formatNairaShort = (value: number) => {
    if (value >= 1000) {
      return `₦${(value / 1000).toFixed(0)}k`;
    }
    return `₦${value}`;
  };

  return (
    <div className="p-5 bg-[#151922] border border-[#242938] rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-[var(--font-display)] font-bold text-base text-[#EDEFF2]">
              Escrow Trade Volume
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <TrendingUp size={10} /> +38.5%
            </span>
          </div>
          <p className="text-xs text-[#8A93A3] mt-0.5">
            Monthly value of completed and active escrow transactions.
          </p>
        </div>

        <div className="text-xs text-[#8A93A3] font-medium bg-[#0B0E14] px-3 py-1.5 rounded-lg border border-[#242938] self-start sm:self-auto">
          6-Month History
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={mockGrowthData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFB020" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FFB020" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#242938" vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="#8A93A3" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#8A93A3" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={formatNairaShort}
            />
            <Tooltip 
                  contentStyle={{
                    backgroundColor: "#0B0E14",
                    borderColor: "#242938",
                    borderRadius: "12px",
                    color: "#EDEFF2",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                  }}
                  formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, "Trade Volume"]}
                />
                
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#FFB020"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorVolume)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}