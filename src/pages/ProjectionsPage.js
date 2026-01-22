// src/pages/ProjectionsPage.js
import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Collapse,
  TableContainer,
  Paper,
  TextField,
  Button,
  Stack,
  Chip,
  InputAdornment,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import InsightsIcon from "@mui/icons-material/Insights";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  formatDDMMYYYY,
  parseDDMMYYYY,
  isWeekend,
  generateDateRange,
} from "../utils/dateUtils";
import { selectSelectedProject, updateProject } from "../features/projectsSlice";

import { BASE_RATE_BY_ROLE } from "../constants";

function monthLabel(monthIndex, year) {
  return new Date(year, monthIndex, 1).toLocaleString(undefined, {
    month: "short",
    year: "numeric",
  });
}

export default function ProjectionsPage() {
  const project = useSelector(selectSelectedProject);
  const holidaysState = useSelector((s) => s.holidays);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // stable members array
  const members = project?.members || [];

  // derive unique roles from landing page (project members)
  const uniqueRoles = useMemo(
    () => Array.from(new Set(members.map((m) => m.role))).filter(Boolean),
    [members]
  );

  // hourlyRates state (editable). Stored as array of [role, rate]
  const [hourlyRatesArr, setHourlyRatesArr] = useState(() =>
    uniqueRoles.length
      ? uniqueRoles.map((role) => [
          role,
          BASE_RATE_BY_ROLE.get(role) ?? 15,
        ])
      : [["Default Role", 15]]
  );

  // if roles change (project changed), realign rate card with new unique roles
  React.useEffect(() => {
    if (!uniqueRoles.length) return;
    setHourlyRatesArr((prev) => {
      const prevMap = new Map(prev);
      return uniqueRoles.map((role) => [
        role,
        prevMap.get(role) ?? BASE_RATE_BY_ROLE.get(role) ?? 15,
      ]);
    });
  }, [uniqueRoles]);

  // collapse state for Rate Card (closed by default to keep area small)
  const [rateCardOpen, setRateCardOpen] = useState(false);

  // Buffer and Discount from Redux (centrally managed)
  const buffer = project?.buffer ?? 2;
  const discount = project?.discount ?? 0;

  // Local state for input fields to allow empty values temporarily
  const [bufferInput, setBufferInput] = useState(String(buffer || ""));
  const [discountInput, setDiscountInput] = useState(String(discount || ""));

  // Sync local state with Redux when project changes
  React.useEffect(() => {
    setBufferInput(buffer === 0 ? "" : String(buffer));
    setDiscountInput(discount === 0 ? "" : String(discount));
  }, [buffer, discount]);

  // UI state for expanded member row
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const toggleExpand = (id) => setExpandedMemberId((prev) => (prev === id ? null : id));

  const theme = useTheme();

  // helper: holiday check
  const isHolidayForLocation = (location, dateStr) => {
    const byLocation = holidaysState?.byLocation || {};
    const arr = byLocation[location] || [];
    return arr.some((h) => h.date === dateStr);
  };

  // helper: stored leave
  const getStoredLeave = (memberId, dateStr) => {
    return project?.leaves?.[memberId]?.[dateStr];
  };

  // Build monthsToShow from project.startDate -> project.endDate (inclusive).
  const monthsToShow = useMemo(() => {
    if (!project) return [];
    const start = parseDDMMYYYY(project.startDate);
    const end = parseDDMMYYYY(project.endDate);
    if (!start || !end) return [];
    const months = [];
    let curYear = start.getFullYear();
    let curMonth = start.getMonth();
    const endYear = end.getFullYear();
    const endMonth = end.getMonth();
    while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
      months.push({
        label: monthLabel(curMonth, curYear),
        year: curYear,
        monthIndex: curMonth,
      });
      curMonth++;
      if (curMonth > 11) {
        curMonth = 0;
        curYear++;
      }
    }
    return months;
  }, [project]);

  // Precompute list of dates for each month (map: label -> [Date,...])
  const monthDatesMap = useMemo(() => {
    const map = {};
    monthsToShow.forEach((m) => {
      const first = new Date(m.year, m.monthIndex, 1);
      const last = new Date(m.year, m.monthIndex + 1, 0);
      const dates = generateDateRange(
        `${String(first.getDate()).padStart(2, "0")}/${String(first.getMonth() + 1).padStart(
          2,
          "0"
        )}/${first.getFullYear()}`,
        `${String(last.getDate()).padStart(2, "0")}/${String(last.getMonth() + 1).padStart(
          2,
          "0"
        )}/${last.getFullYear()}`
      );
      map[m.label] = dates;
    });
    return map;
  }, [monthsToShow]);

  // Create an hourly lookup from the editable array for calculations
  const hourlyLookup = useMemo(() => Object.fromEntries(hourlyRatesArr), [hourlyRatesArr]);

  // rows: compute per-member months array [{ label, predictedFte, actualFte, revenue }, ...] and totalRevenue
  const rows = useMemo(() => {
    if (!project) return [];
    return members.map((member) => {
      const monthsArr = monthsToShow.map((m) => {
        const dates = monthDatesMap[m.label] || [];

        // predictedFte: calendar working days
        let predictedFte = 0;
        dates.forEach((d) => {
          const dateStr = formatDDMMYYYY(d);
          const join = parseDDMMYYYY(member.startDate);
          const end = member.endDate ? parseDDMMYYYY(member.endDate) : parseDDMMYYYY(project.endDate);
          if (!join || !end) return;
          if (d < join || d > end) return;
          if (isWeekend(d)) return;
          if (isHolidayForLocation(member.location, dateStr)) return;
          predictedFte += 1;
        });

        // actualFte: stored leaves override or default present
        let actualFte = 0;
        dates.forEach((d) => {
          const dateStr = formatDDMMYYYY(d);
          const join = parseDDMMYYYY(member.startDate);
          const end = member.endDate ? parseDDMMYYYY(member.endDate) : parseDDMMYYYY(project.endDate);
          if (!join || !end) return;
          if (d < join || d > end) return;
          if (isWeekend(d)) return;
          if (isHolidayForLocation(member.location, dateStr)) return;
          const stored = getStoredLeave(member.id, dateStr);
          if (stored !== undefined && stored !== null) actualFte += Number(stored);
          else actualFte += 1;
        });

        const hourly = hourlyLookup[member.role] ?? 15;
        const baseRevenue = actualFte * 8 * hourly;
        // Subtract buffer days per team member monthly (buffer days * 8 hours * hourly rate)
        const bufferRevenue = buffer * 8 * hourly;
        const revenue = baseRevenue - bufferRevenue;

        return {
          label: m.label,
          predictedFte,
          actualFte,
          revenue,
        };
      });

      const totalRevenue = monthsArr.reduce((s, c) => s + c.revenue, 0);
      return {
        id: member.id,
        name: member.name,
        role: member.role,
        months: monthsArr,
        totalRevenue,
      };
    });
  }, [project, members, monthsToShow, monthDatesMap, holidaysState, hourlyLookup, buffer]);

  // column totals (with discount applied to monthly totals)
  const columnTotals = useMemo(() => {
    const totals = {};
    monthsToShow.forEach((m) => {
      totals[m.label] = { predictedFte: 0, actualFte: 0, revenue: 0 };
    });
    rows.forEach((r) => {
      r.months.forEach((cell) => {
        const t = totals[cell.label];
        t.predictedFte += cell.predictedFte;
        t.actualFte += cell.actualFte;
        t.revenue += cell.revenue;
      });
    });
    // Apply discount percentage to monthly totals
    const discountPercent = Number(discount) || 0;
    Object.keys(totals).forEach((monthLabel) => {
      totals[monthLabel].revenue = totals[monthLabel].revenue * (1 - discountPercent / 100);
    });
    return totals;
  }, [rows, monthsToShow, discount]);

  // total projection revenue to show in header
  const totalProjectionRevenue = rows.reduce((s, r) => s + (r.totalRevenue || 0), 0);

  // Guard early return — placed after hooks
  if (!project) {
    return <Typography>Please select a project first.</Typography>;
  }

  // Handler: update an hourly rate inline
  const updateHourlyRate = (roleKey, value) => {
    const parsed = value === "" || isNaN(Number(value)) ? 0 : Number(value);
    const newArr = hourlyRatesArr.map(([r, v]) => (r === roleKey ? [r, parsed] : [r, v]));
    setHourlyRatesArr(newArr);
  };

  const resetRates = () => {
    setHourlyRatesArr(
      uniqueRoles.length
        ? uniqueRoles.map((role) => [
            role,
            BASE_RATE_BY_ROLE.get(role) ?? 15,
          ])
        : [["Default Role", 15]]
    );
    if (project) {
      dispatch(updateProject({ projectId: project.id, updates: { buffer: 2, discount: 0 } }));
    }
  };

  // Handlers for buffer and discount updates
  const handleBufferChange = (value) => {
    setBufferInput(value);
    const parsed = Number(value);
    if (project) {
      dispatch(updateProject({ projectId: project.id, updates: { buffer: value === "" || isNaN(parsed) ? 0 : parsed } }));
    }
  };

  const handleDiscountChange = (value) => {
    setDiscountInput(value);
    const parsed = Number(value);
    const clamped = value === "" || isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
    if (project) {
      dispatch(updateProject({ projectId: project.id, updates: { discount: clamped } }));
    }
  };

  // Colors used
  // Remove gradients: use solid backgrounds for simpler, flatter look
  const rateCardHeaderBg = "#E6F7EF";
  const rateCardBodyBg = "#f6fbf7"; // soft non-white background for rate card body
  const projHeaderFooterBg = "#f3fbf9"; // header & footer background (solid)

  // Use theme tokens for consistent look

  return (
    <Box>
      {/* Top header — Dashboard-style with back button */}
      <Card elevation={2} sx={{ mb: 1 }}>
        <CardContent sx={{ position: "relative", py: 1, pr: 2, pl: { xs: 5, sm: 6 } }}>
          <IconButton
            size="small"
            onClick={() => navigate(-1)}
            aria-label="Back"
            sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", minWidth: 0 }}>
              <InsightsIcon color="primary" sx={{ fontSize: 20 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Projections
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Incoming hours and utilization forecasts
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Chip size="small" label={`Projections: ${rows.length}`} variant="outlined" />
              <Chip size="small" label={`Active: ${rows.filter((r) => r.totalRevenue > 0).length}`} variant="outlined" />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Beautified Rate Card (no chart) */}
      <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 3 }}>
        <Box
          sx={{
            px: 1.5,
            py: 0.75,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            background: rateCardHeaderBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 13, color: "#052A2A" }}>Rate Card</Typography>
            <Typography variant="caption" sx={{ color: "#053f3f", fontSize: 12 }}>
              Editable hourly rates affect projections below
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button
              size="small"
              variant="contained"
              onClick={() => setRateCardOpen((s) => !s)}
              startIcon={rateCardOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ textTransform: "none", fontWeight: 700, fontSize: 13 }}
            >
              {rateCardOpen ? "Collapse" : "Open"}
            </Button>
          </Box>
        </Box>

        <CardContent sx={{ pt: 1.5, pb: 2, background: rateCardBodyBg }}>
          <Collapse in={rateCardOpen}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, width: "100%" }}>
              {/* Left Half: Rates Table */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Paper elevation={0} sx={{ borderRadius: 1, overflow: "hidden", background: rateCardBodyBg, width: "100%", p: 1 }}>
                  <TableContainer component={Paper} sx={{ background: rateCardBodyBg, boxShadow: "none" }}>
                    <Table size="small" sx={{ minWidth: 300 }}>
                      <TableHead>
                        <TableRow sx={{ background: "#eaf8f0" }}>
                          <TableCell
                            align="center"
                            sx={{ fontWeight: 800, fontSize: 12, color: "#0b3b3b" }}
                          >
                            Role
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ fontWeight: 800, fontSize: 12, color: "#0b3b3b" }}
                          >
                            Hourly ($/hr)
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {hourlyRatesArr.map(([role, rate]) => (
                          <TableRow key={role} sx={{ background: "transparent" }}>
                            <TableCell sx={{ whiteSpace: "nowrap", fontSize: 13, color: (t) => t.palette.text.primary }}>{role}</TableCell>
                            <TableCell sx={{ textAlign: "center", fontSize: 13 }}>
                              <TextField
                                size="small"
                                value={rate === 0 ? "" : String(rate)}
                                onChange={(e) => updateHourlyRate(role, e.target.value)}
                                onFocus={(e) => e.target.select()}
                                inputProps={{
                                  inputMode: "numeric",
                                  pattern: "[0-9]*",
                                  style: { fontSize: 12, padding: "4px 6px", textAlign: "center", height: "28px" },
                                }}
                                sx={{ width: "80px", "& .MuiInputBase-root": { height: "32px" } }}
                                variant="outlined"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>

              {/* Right Half: Buffer & Discount */}
              <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <Paper elevation={0} sx={{ borderRadius: 1, background: rateCardBodyBg, width: "100%", p: 2 }}>
                  {/* Buffer Section */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 13, color: "#0b3b3b" }}>
                      Buffer (per team member)
                    </Typography>
                    <Box sx={{ width: "33.33%" }}>
                      <TextField
                        size="small"
                        type="number"
                        label="Buffer Days"
                        value={bufferInput}
                        onChange={(e) => handleBufferChange(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        inputProps={{
                          inputMode: "numeric",
                          style: { fontSize: 12, padding: "4px 6px", height: "28px" },
                        }}
                        sx={{ width: "100%", "& .MuiInputBase-root": { height: "32px" } }}
                        fullWidth
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                      Buffer days per team member, calculated monthly (days × 8 hours × hourly rate)
                    </Typography>
                  </Box>

                  {/* Discount Section */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 13, color: "#0b3b3b" }}>
                      Discount
                    </Typography>
                    <Box sx={{ width: "33.33%" }}>
                      <TextField
                        size="small"
                        type="number"
                        label="Discount Percentage"
                        value={discountInput}
                        onChange={(e) => handleDiscountChange(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        inputProps={{
                          inputMode: "numeric",
                          style: { fontSize: 12, padding: "4px 6px", height: "28px" },
                        }}
                        sx={{ width: "100%", "& .MuiInputBase-root": { height: "32px" } }}
                        fullWidth
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                      Discount percentage applied to total monthly projection
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>

            {/* Footer with actions */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, background: rateCardBodyBg, mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                Tip: update rates, buffer, and discount to immediately affect the projections below.
              </Typography>

              <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="small" onClick={resetRates} sx={{ textTransform: "none" }}>
                  Reset
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    // Close the rate card after saving
                    setRateCardOpen(false);
                  }}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Save
                </Button>
              </Stack>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Main projections table with colored header/footer and centered headers/cells */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} sx={{ maxHeight: "55vh",  scrollbarWidth: 'thin',
    scrollbarColor: '#c4c4c4 transparent',

    /* Chrome / Edge / Safari */
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#c4c4c4',
      borderRadius: '8px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: '#9e9e9e',
    }, }}>
            <Table size="small" stickyHeader sx={{ minWidth: 900, fontSize: 12 }}>
              {/* Header with dark background - SAME color used for footer */}
              <TableHead>
                <TableRow sx={{ background: theme.palette.grey[900], '& th': { background: theme.palette.grey[900], position: 'sticky', top: 0, zIndex: theme.zIndex.appBar } }}>
                  <TableCell align="center" sx={{ fontWeight: 700, color: theme.palette.common.white, fontSize: 12 }}>
                    Member
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: theme.palette.common.white, fontSize: 12 }}>
                    Role
                  </TableCell>
                  {monthsToShow.map((m) => (
                    <TableCell
                      align="center"
                      key={m.label}
                      sx={{ textAlign: "center", fontWeight: 700, color: theme.palette.common.white, fontSize: 12 }}
                    >
                      {m.label}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 700, color: theme.palette.common.white, fontSize: 12 }}>
                    Grand Total ($)
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: theme.palette.common.white, fontSize: 12 }} />
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((r) => (
                  <React.Fragment key={r.id}>
                    <TableRow hover>
                      <TableCell align="center" sx={{ whiteSpace: "nowrap", fontWeight: 600, fontSize: 12 }}>{r.name}</TableCell>
                      <TableCell align="center" sx={{ fontSize: 12 }}>{r.role}</TableCell>

                      {r.months.map((cell) => (
                        <TableCell key={cell.label} align="center" sx={{ fontSize: 12 }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 11 }}>
                            Pred: {cell.predictedFte.toFixed(1)}
                          </Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: 12, color: (t) => t.palette.text.primary }}>Act: {cell.actualFte.toFixed(1)}</Typography>
                          <Typography sx={{ fontSize: 12, color: (t) => t.palette.text.primary }}>${Math.round(cell.revenue)}</Typography>
                        </TableCell>
                      ))}

                      <TableCell align="center" sx={{ fontSize: 13, color: (t) => t.palette.text.primary }}>${Math.round(r.totalRevenue)}</TableCell>

                      <TableCell align="center">
                        <IconButton size="small" onClick={() => toggleExpand(r.id)} aria-label="Expand">
                          {expandedMemberId === r.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>

                    {/* Expanded details row */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4 + monthsToShow.length}>
                        <Collapse in={expandedMemberId === r.id} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontSize: 13 }}>
                              Monthly breakdown — {r.name}
                            </Typography>

                            <Table size="small" sx={{ minWidth: 800, fontSize: 12 }}>
                              <TableHead>
                                <TableRow sx={{ background: projHeaderFooterBg }}>
                                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12 }}>Month</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12 }}>Predicted FTE</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12 }}>Actual FTE</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12 }}>Revenue ($)</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {r.months.map((c) => (
                                  <TableRow key={c.label}>
                                    <TableCell align="center" sx={{ fontSize: 12 }}>{c.label}</TableCell>
                                    <TableCell align="center" sx={{ fontSize: 12 }}>{c.predictedFte.toFixed(1)}</TableCell>
                                    <TableCell align="center" sx={{ fontSize: 12 }}>{c.actualFte.toFixed(1)}</TableCell>
                                    <TableCell align="center" sx={{ fontSize: 12 }}>{Math.round(c.revenue)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}

                {/* Grand totals row with SAME color as header */}
                <TableRow
                  sx={{
                    background: theme.palette.grey[900],
                  }}
                >
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, color: theme.palette.common.white }}>Grand Total</TableCell>
                  <TableCell align="center" sx={{ color: theme.palette.common.white }} />
                  {monthsToShow.map((m) => (
                    <TableCell key={m.label} align="center" sx={{ fontWeight: 700, fontSize: 12, color: theme.palette.common.white }}>
                      Pred: {columnTotals[m.label].predictedFte.toFixed(1)}
                      <br />
                      Act: {columnTotals[m.label].actualFte.toFixed(1)}
                      <br />
                      ${Math.round(columnTotals[m.label].revenue)}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, color: theme.palette.common.white }}>
                    ${Math.round(Object.values(columnTotals).reduce((s, c) => s + c.revenue, 0))}
                  </TableCell>
                  <TableCell align="center" sx={{ color: theme.palette.common.white }} />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
