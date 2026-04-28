"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

const colors = ["#1DB954", "#820AD1", "#0EA5E9", "#F59E0B", "#F43F5E", "#64748B"];

export function SpendingChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) {
    return (
      <div className="grid h-56 place-items-center rounded-[8px] bg-slate-50 text-sm font-bold text-muted">
        A grana ainda não foi pra lugar nenhum.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={4}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
