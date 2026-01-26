import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
}

export function ScoreGauge({ score, maxScore = 100 }: ScoreGaugeProps) {
  const percentage = (score / maxScore) * 100;
  
  // Color based on score tiers
  let color = "#ef4444"; // Red (High Risk)
  if (score >= 60) color = "#eab308"; // Yellow (Medium)
  if (score >= 80) color = "#1a4231"; // Primary Green (Low Risk)

  const data = [
    { value: score },
    { value: maxScore - score },
  ];

  return (
    <div className="relative h-64 w-full flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={80}
            outerRadius={100}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="#f3f4f6" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-8">
        <div className="text-5xl font-bold font-display text-primary">{score}</div>
        <div className="text-sm text-muted-foreground uppercase tracking-wide font-medium mt-1">
          Credit Score
        </div>
      </div>
    </div>
  );
}
