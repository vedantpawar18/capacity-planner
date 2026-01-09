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
import ProjectionPieChart from "./ProjectionPieChart";
import {
  formatDDMMYYYY,
  parseDDMMYYYY,
  generateDateRange,
  isWeekend,
} from "../utils/dateUtils";

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
    const hourlyRates = window.__HOURLY_RATES__ || {};
    const memberLeaves = leavesMap[m.id] || {};

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

      const hourly = hourlyRates[m.role] ?? 15;
      const revenue = actual * 8 * hourly;

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

  const pieData = monthsData.map((d) => ({
    name: d.label,
    value: Math.round(d.revenue),
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

      <DialogContent dividers sx={{ pt: 2 }}>
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

        {/* SECTION 3 — PROJECTIONS */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Monthly projections
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Month</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Predicted FTE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actual FTE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Revenue ($)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthsData.map((d) => (
                    <TableRow key={d.label}>
                      <TableCell align="center">{d.label}</TableCell>
                      <TableCell align="center">{d.predicted.toFixed(1)}</TableCell>
                      <TableCell align="center">{d.actual.toFixed(1)}</TableCell>
                      <TableCell align="center">{Math.round(d.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <ProjectionPieChart
              data={pieData}
              title={`${m.name} — Revenue breakdown`}
            />
          </Grid>
        </Grid>
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
