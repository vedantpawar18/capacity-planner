// src/components/ProjectionPieChart.jsx
import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Box, Typography } from "@mui/material";

const COLORS = [
  "#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336", "#00bcd4", "#8bc34a",
];

export default function ProjectionPieChart({ data, title = "Revenue share" }) {
  // data: [{ name: 'Jan 2026', value: 1234 }, ...]
  const filtered = (data || []).filter((d) => d.value && d.value > 0);
  if (!filtered.length) {
    return <Typography variant="body2" color="text.secondary">No revenue data to show</Typography>;
  }

  return (
    <Box sx={{ width: "100%", height: 260 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{title}</Typography>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={36}
            paddingAngle={4}
            label={(entry) => `${entry.name.split(" ")[0]}: ${Math.round(entry.value)}`}
          >
            {filtered.map((entry, idx) => (
              <Cell key={`c-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [`$${Math.round(v)}`, "Revenue"]} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}
