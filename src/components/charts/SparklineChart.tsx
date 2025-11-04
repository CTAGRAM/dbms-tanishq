import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SparklineChartProps {
  data: { value: number }[];
  color?: string;
  className?: string;
}

export const SparklineChart = ({ data, color = "hsl(var(--primary))", className = "" }: SparklineChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={40} className={className}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${color})`}
          isAnimationActive={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
