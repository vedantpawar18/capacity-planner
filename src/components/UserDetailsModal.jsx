// src/components/UserDetailsModal.jsx
import React, { useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Stack,
} from "@mui/material";
import {
  formatDDMMYYYY,
  parseDDMMYYYY,
  generateDateRange,
  isWeekend,
} from "../utils/dateUtils";
import { BASE_RATE_BY_ROLE } from "../constants";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  Legend,
} from "recharts";

export default function UserDetailsModal({
  open,
  onClose,
  member,
  project,
  holidaysState,
}) {
  // --- Note: do NOT return early before hooks. Keep hooks unconditional. ---
  // Provide safe values for hooks to consume; hooks will return default results when missing.
  const m = member || null;
  const pj = project || null;
  const leavesMap = pj?.leaves || {};

  const isHolidayForLocation = (location, dateStr) => {
    const byLocation =
      holidaysState?.byLocation ||
      window.__APP_STATE__?.holidays?.byLocation ||
      {};
    const arr = byLocation[location] || [];
    return arr.some((h) => h.date === dateStr);
  };

  /** Months from project start to end (unconditional hook) */
  const monthsToShow = useMemo(() => {
    if (!pj) return [];
    const start = parseDDMMYYYY(pj.startDate);
    const end = parseDDMMYYYY(pj.endDate);
    if (!start || !end) return [];

    const res = [];
    let y = start.getFullYear();
    let mm = start.getMonth();

    while (y < end.getFullYear() || (y === end.getFullYear() && mm <= end.getMonth())) {
      res.push({
        label: new Date(y, mm, 1).toLocaleString(undefined, {
          month: "short",
          year: "numeric",
        }),
        year: y,
        monthIndex: mm,
      });

      mm++;
      if (mm > 11) {
        mm = 0;
        y++;
      }
    }
    return res;
  }, [pj]);

  /** Compute per-month predicted FTE, actual FTE, revenue (unconditional hook) */
  const monthsData = useMemo(() => {
    if (!pj || !m) return [];
    const memberLeaves = leavesMap[m.id] || {};
    const buffer = pj?.buffer ?? 2;
    const discount = pj?.discount ?? 0;

    return monthsToShow.map((mm) => {
      const first = new Date(mm.year, mm.monthIndex, 1);
      const last = new Date(mm.year, mm.monthIndex + 1, 0);

      const dates = generateDateRange(
        `${String(first.getDate()).padStart(2, "0")}/${String(first.getMonth() + 1).padStart(2, "0")}/${first.getFullYear()}`,
        `${String(last.getDate()).padStart(2, "0")}/${String(last.getMonth() + 1).padStart(2, "0")}/${last.getFullYear()}`
      );

      let predicted = 0;
      let actual = 0;

      dates.forEach((d) => {
        const ds = formatDDMMYYYY(d);
        const join = parseDDMMYYYY(m.startDate);
        const endD = m.endDate
          ? parseDDMMYYYY(m.endDate)
          : parseDDMMYYYY(pj.endDate);
        if (!join || !endD) return;
        if (d < join || d > endD) return;
        if (isWeekend(d)) return;
        if (isHolidayForLocation(m.location, ds)) return;
        predicted++;

        const stored = memberLeaves[ds];
        if (stored !== undefined && stored !== null) actual += Number(stored);
        else actual++;
      });

      const hourly = BASE_RATE_BY_ROLE.get(m.role) ?? 15;
      const baseRevenue = actual * 8 * hourly;
      // Subtract buffer days per team member monthly (buffer days * 8 hours * hourly rate)
      const bufferRevenue = buffer * 8 * hourly;
      const revenueWithBuffer = baseRevenue - bufferRevenue;
      // Apply discount percentage to monthly revenue
      const discountPercent = Number(discount) || 0;
      const revenue = revenueWithBuffer * (1 - discountPercent / 100);

      return { label: mm.label, predicted, actual, revenue };
    });
  }, [pj, m, monthsToShow, holidaysState, leavesMap]);

  /** Flattened list of leaves (unconditional hook) */
  const leavesList = useMemo(() => {
    if (!pj || !m) return [];
    const arr = Object.entries(leavesMap[m.id] || {}).map(([date, value]) => ({
      date,
      value,
    }));
    arr.sort((a, b) => parseDDMMYYYY(a.date) - parseDDMMYYYY(b.date));
    return arr;
  }, [pj, m, leavesMap]);

  // Now it's safe to return early if required
  if (!member || !project) return null;

  // Get hourly rate and discount for revenue/hour calculation
  const baseHourlyRate = BASE_RATE_BY_ROLE.get(m?.role) ?? 15;
  const discountPercent = pj?.discount ?? 0;
  const effectiveHourlyRate = baseHourlyRate * (1 - discountPercent / 100);

  // Prepare chart data
  const chartData = monthsData.map((d, i) => {
    const revenuePerFte = d.actual > 0 ? d.revenue / d.actual : 0;
    const leaveDays = d.predicted - d.actual;
    const growthRate = i > 0 && monthsData[i - 1].revenue > 0 
      ? ((d.revenue - monthsData[i - 1].revenue) / monthsData[i - 1].revenue) * 100 
      : 0;
    
    // Revenue/hour: effective hourly rate (base rate after discount)
    // This is constant per role since rate is fixed and discount is project-wide
    const revenuePerHour = effectiveHourlyRate;
    
    return {
      month: d.label, // Full month label with year (e.g., "Jan 2025")
      monthFull: d.label,
      revenue: Math.round(d.revenue),
      revenuePerFte: Math.round(revenuePerFte),
      predicted: parseFloat(d.predicted.toFixed(1)),
      actual: parseFloat(d.actual.toFixed(1)),
      leaveDays: parseFloat(leaveDays.toFixed(1)),
      growthRate: parseFloat(growthRate.toFixed(1)),
      hours: d.actual * 8,
      revenuePerHour: Math.round(revenuePerHour),
    };
  });

  // Calculate totals and averages
  const totalRevenue = monthsData.reduce((sum, d) => sum + d.revenue, 0);
  const totalActualFte = monthsData.reduce((sum, d) => sum + d.actual, 0);
  const totalPredictedFte = monthsData.reduce((sum, d) => sum + d.predicted, 0);
  const avgRevenuePerFte = totalActualFte > 0 ? totalRevenue / totalActualFte : 0;
  const avgMonthlyRevenue = monthsData.length > 0 ? totalRevenue / monthsData.length : 0;
  const fteUtilization = totalPredictedFte > 0 ? (totalActualFte / totalPredictedFte) * 100 : 0;
  const totalMonths = monthsData.length;
  
  // Calculate efficiency metrics
  const memberHourly = BASE_RATE_BY_ROLE.get(m?.role) ?? 15;
  const totalHours = totalActualFte * 8;
  const efficiency = totalHours > 0 ? (totalRevenue / (totalHours * memberHourly)) * 100 : 0;
  
  // Additional manager metrics
  const totalLeaveDays = totalPredictedFte - totalActualFte;
  const leaveUtilization = totalPredictedFte > 0 ? (totalLeaveDays / totalPredictedFte) * 100 : 0;
  const revenuePerHour = totalHours > 0 ? totalRevenue / totalHours : 0;
  const avgMonthlyFte = monthsData.length > 0 ? totalActualFte / monthsData.length : 0;
  
  // Calculate monthly growth rate
  const monthlyGrowthRates = monthsData.map((d, i) => {
    if (i === 0) return 0;
    const prevRevenue = monthsData[i - 1].revenue;
    return prevRevenue > 0 ? ((d.revenue - prevRevenue) / prevRevenue) * 100 : 0;
  });
  const avgGrowthRate = monthlyGrowthRates.length > 1 
    ? monthlyGrowthRates.slice(1).reduce((sum, r) => sum + r, 0) / (monthlyGrowthRates.length - 1) 
    : 0;

  // Calculate trend line data (simple linear regression)
  const calculateTrend = (data, key) => {
    const n = data.length;
    if (n === 0) return [];
    const sumX = data.reduce((sum, _, i) => sum + (i + 1), 0);
    const sumY = data.reduce((sum, d) => sum + d[key], 0);
    const sumXY = data.reduce((sum, d, i) => sum + (i + 1) * d[key], 0);
    const sumX2 = data.reduce((sum, _, i) => sum + Math.pow(i + 1, 2), 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - Math.pow(sumX, 2));
    const intercept = (sumY - slope * sumX) / n;
    return data.map((_, i) => slope * (i + 1) + intercept);
  };

  const revenueTrend = calculateTrend(chartData, "revenue");
  const revenuePerFteTrend = calculateTrend(chartData, "revenuePerFte");

  // Add trend data to chart data
  const chartDataWithTrend = chartData.map((d, i) => ({
    ...d,
    revenueTrend: Math.round(revenueTrend[i] || 0),
    revenuePerFteTrend: Math.round(revenuePerFteTrend[i] || 0),
  }));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">{m.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {m.role}
            </Typography>
          </Box>

          <Box textAlign="right">
            <Typography>{m.location}</Typography>
            <Typography variant="caption" color="text.secondary">
              {m.startDate} → {m.endDate || pj.endDate}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2, px: 2, "& > *": { maxWidth: "100%", boxSizing: "border-box" } }}>
        {/* SECTION 1 — DETAILS */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Member details
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper" }}>
              <Typography><b>Name:</b> {m.name}</Typography>
              <Typography><b>Role:</b> {m.role}</Typography>
              <Typography><b>Location:</b> {m.location}</Typography>
              <Typography><b>POD:</b> P{m.pod}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, borderRadius: 1, bgcolor: "background.paper" }}>
              <Typography><b>Joined:</b> {m.startDate}</Typography>
              <Typography><b>End date:</b> {m.endDate || pj.endDate}</Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* SECTION 2 — LEAVES */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Leaves
        </Typography>
        {leavesList.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No leaves recorded.
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto", mb: 3 }}>
            <Table size="small" sx={{ minWidth: 480 }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leavesList.map((r) => (
                  <TableRow key={r.date}>
                    <TableCell align="center">{r.date}</TableCell>
                    <TableCell align="center">{r.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* SECTION 3 — DASHBOARD */}
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, fontSize: 16 }}>
          Performance Dashboard
        </Typography>

        {/* Dashboard Summary Cards - 4 Cards Spread Evenly */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, width: "100%" }}>
          <Box
            sx={{
              flex: "1 1 25%",
              p: 2,
              borderRadius: 2,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
            }}
          >
            <Typography variant="caption" sx={{ fontSize: 11, opacity: 0.9, display: "block", mb: 0.5 }}>
              Total Revenue
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: 22 }}>
              ${Math.round(totalRevenue).toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.8, display: "block", mt: 0.5 }}>
              {totalMonths} months
            </Typography>
          </Box>

          <Box
            sx={{
              flex: "1 1 25%",
              p: 2,
              borderRadius: 2,
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
              boxShadow: "0 4px 12px rgba(240, 147, 251, 0.3)",
            }}
          >
            <Typography variant="caption" sx={{ fontSize: 11, opacity: 0.9, display: "block", mb: 0.5 }}>
              Avg Revenue/FTE
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: 22 }}>
              ${Math.round(avgRevenuePerFte).toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.8, display: "block", mt: 0.5 }}>
              Per FTE
            </Typography>
          </Box>

          <Box
            sx={{
              flex: "1 1 25%",
              p: 2,
              borderRadius: 2,
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
              boxShadow: "0 4px 12px rgba(79, 172, 254, 0.3)",
            }}
          >
            <Typography variant="caption" sx={{ fontSize: 11, opacity: 0.9, display: "block", mb: 0.5 }}>
              FTE Utilization
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: 22 }}>
              {fteUtilization.toFixed(1)}%
            </Typography>
            <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.8, display: "block", mt: 0.5 }}>
              Actual vs Predicted
            </Typography>
          </Box>

          <Box
            sx={{
              flex: "1 1 25%",
              p: 2,
              borderRadius: 2,
              background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              color: "white",
              boxShadow: "0 4px 12px rgba(250, 112, 154, 0.3)",
            }}
          >
            <Typography variant="caption" sx={{ fontSize: 11, opacity: 0.9, display: "block", mb: 0.5 }}>
              Revenue/Hour
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: 22 }}>
              ${Math.round(revenuePerHour).toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.8, display: "block", mt: 0.5 }}>
              Per hour worked
            </Typography>
          </Box>
        </Box>

        {/* Dashboard Charts - Single Comprehensive Chart */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "#ffffff",
            border: "2px solid #667eea",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.2)",
            mb: 3,
            width: "100%",
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: 14, color: "#667eea" }}>
            Comprehensive Performance Overview
          </Typography>
          <Box sx={{ height: 350, width: "100%", overflow: "hidden" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#764ba2" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7b1fa2" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#7b1fa2" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e91e63" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#e91e63" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorLeave" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fa709a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#fee140" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 9 }} 
                  stroke="#666" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  interval={0}
                />
                <YAxis 
                  yAxisId="left" 
                  tick={{ fontSize: 10 }} 
                  stroke="#667eea" 
                  width={50}
                  label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#667eea', fontSize: 10 } }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fontSize: 10 }} 
                  stroke="#f093fb" 
                  width={50}
                  label={{ value: 'FTE / Days', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#f093fb', fontSize: 10 } }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "revenue") return [`$${value.toLocaleString()}`, "Revenue"];
                    if (name === "revenuePerFte") return [`$${value.toLocaleString()}`, "Revenue/FTE"];
                    if (name === "predicted") return [`${value}`, "Predicted FTE"];
                    if (name === "actual") return [`${value}`, "Actual FTE"];
                    if (name === "leaveDays") return [`${value} days`, "Leave Days"];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                {/* Revenue Area Chart */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#667eea"
                  strokeWidth={2}
                  fillOpacity={0.6}
                  fill="url(#colorRevenue)"
                />
                {/* Revenue per FTE Line */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenuePerFte"
                  stroke="#4facfe"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  strokeDasharray="5 5"
                />
                {/* Predicted FTE Area */}
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="predicted"
                  stackId="1"
                  stroke="#7b1fa2"
                  strokeWidth={2}
                  fillOpacity={0.5}
                  fill="url(#colorPredicted)"
                />
                {/* Actual FTE Area */}
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="actual"
                  stackId="1"
                  stroke="#e91e63"
                  strokeWidth={2}
                  fillOpacity={0.5}
                  fill="url(#colorActual)"
                />
                {/* Leave Days Bar */}
                <Bar yAxisId="right" dataKey="leaveDays" fill="url(#colorLeave)" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Row 2: Table */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
          {/* Detailed Performance Table */}
          <Box
            sx={{
              flex: "0 0 100%",
              p: 2,
              borderRadius: 2,
              bgcolor: "#ffffff",
              border: "2px solid #e0e0e0",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              maxWidth: "100%",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: 14, color: "#333" }}>
              Monthly Performance Details
            </Typography>
            <Box sx={{ overflowX: "auto", maxHeight: 280, overflowY: "auto", width: "100%" }}>
              <Table size="small" stickyHeader sx={{ width: "100%", tableLayout: "auto" }}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 11 }}>Month</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 11 }}>Predicted FTE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 11 }}>Actual FTE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 11 }}>Leave Days</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 11 }}>Hours</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 11 }}>Revenue ($)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 11 }}>Revenue/FTE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 11 }}>Revenue/Hour</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 11 }}>Growth %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {chartData.map((d, i) => (
                    <TableRow key={d.monthFull} hover>
                      <TableCell align="center" sx={{ fontSize: 10 }}>{d.monthFull}</TableCell>
                      <TableCell align="center" sx={{ fontSize: 10 }}>{d.predicted.toFixed(1)}</TableCell>
                      <TableCell align="center" sx={{ fontSize: 10 }}>{d.actual.toFixed(1)}</TableCell>
                      <TableCell align="center" sx={{ fontSize: 10 }}>{d.leaveDays.toFixed(1)}</TableCell>
                      <TableCell align="center" sx={{ fontSize: 10 }}>{d.hours}</TableCell>
                      <TableCell align="center" sx={{ fontSize: 10 }}>${d.revenue.toLocaleString()}</TableCell>
                      <TableCell align="center" sx={{ fontSize: 10 }}>${d.revenuePerFte.toLocaleString()}</TableCell>
                      <TableCell align="center" sx={{ fontSize: 10 }}>${d.revenuePerHour}</TableCell>
                      <TableCell align="center" sx={{ fontSize: 10, color: d.growthRate >= 0 ? "#4caf50" : "#f44336" }}>
                        {d.growthRate >= 0 ? "+" : ""}{d.growthRate.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        </Box>

      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={onClose}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
