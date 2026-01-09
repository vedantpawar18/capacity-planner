// src/pages/LeavesPage.js
import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  useTheme,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Stack,
  Tooltip,
  Paper,
  Switch,
  FormControlLabel,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  selectSelectedProject,
  setLeaveForMember,
} from "../features/projectsSlice";
import {
  generateDateRange,
  formatDDMMYYYY,
  parseDDMMYYYY,
  isWeekend,
} from "../utils/dateUtils";

const getDayShort = (date) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
};

const formatDDMM = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
};

const getYear = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return String(d.getFullYear());
};

export default function LeavesPage() {
  const project = useSelector(selectSelectedProject);
  const holidaysState = useSelector((s) => s.holidays);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [editingCell, setEditingCell] = useState(null); // { memberId, memberName, memberCode, date, dateStr, value }
  // leftCompact still present but there's no UI to toggle it (keeps widths stable)
  const [leftCompact] = useState(false);

  // visibleCols controls hide/unhide for role/location/start/end (Name always visible)
  const [visibleCols, setVisibleCols] = useState({
    role: false,
    location: false,
    startDate: false,
    endDate: false,
  });

  const topScrollerRef = useRef(null);
  const tableWrapperRef = useRef(null);
  const tableInnerRef = useRef(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const [visibleRange, setVisibleRange] = useState({ start: null, end: null });
  const theme = useTheme();

  // column width for date columns (used to calculate scroll offsets)
  const DATE_COL_WIDTH = 32; // reduced to make rows narrower

  // build chronological list of all project dates (oldest -> newest)
  const allDatesChron = useMemo(() => {
    if (!project) return [];
    return generateDateRange(project.startDate, project.endDate); // returns Date objects
  }, [project]);

  // keep dates chronological; we'll position scroll so current week's Monday is visible by default
  const dates = useMemo(() => {
    if (!allDatesChron || !allDatesChron.length) return [];
    return allDatesChron;
  }, [allDatesChron]);

  // set layoutReady after dates/visibility changes so scroll can run
  useEffect(() => {
    setLayoutReady(true);
  }, [dates, leftCompact, visibleCols]);

  // sync top scroller <-> table wrapper and set width of top inner spacer
  useEffect(() => {
    const top = topScrollerRef.current;
    const wrapper = tableWrapperRef.current;
    const inner = tableInnerRef.current;
    if (!top || !wrapper || !inner) return;

    const syncTopToTable = () => (top.scrollLeft = wrapper.scrollLeft);
    const syncTableToTop = () => (wrapper.scrollLeft = top.scrollLeft);

      // compute and set visible date range (5-day window starting at first visible date column)
      function updateVisibleRange() {
        if (!wrapper || !dates || !dates.length) return;
        const firstDateIndex = Math.max(0, Math.floor(wrapper.scrollLeft / DATE_COL_WIDTH));
        const startIdx = Math.min(firstDateIndex, dates.length - 1);
        const endIdx = Math.min(startIdx + 4, dates.length - 1);
        const start = dates[startIdx] ? formatDDMMYYYY(dates[startIdx]) : null;
        const end = dates[endIdx] ? formatDDMMYYYY(dates[endIdx]) : null;
        setVisibleRange({ start, end });
      }
    wrapper.addEventListener("scroll", syncTopToTable);
    // update visible date range as user scrolls horizontally
    wrapper.addEventListener("scroll", updateVisibleRange);
    top.addEventListener("scroll", syncTableToTop);

    const adjust = () => {
      const spacer = top.querySelector(".spacer");
      if (spacer) spacer.style.width = `${inner.scrollWidth}px`;
        updateVisibleRange();
    };
    adjust();
    window.addEventListener("resize", adjust);

    return () => {
      wrapper.removeEventListener("scroll", syncTopToTable);
        wrapper.removeEventListener("scroll", updateVisibleRange);
      top.removeEventListener("scroll", syncTableToTop);
      window.removeEventListener("resize", adjust);
    };
  }, [dates, leftCompact, visibleCols]);

  // helper: compute width of sticky left columns (based on visibility & compact mode)
  const leftColumnsConfig = useMemo(() => {
    // base name column always present
    const cols = [];
    const nameWidth = leftCompact ? 150 : 120;
    cols.push({ key: "member", left: 0, width: nameWidth });

    let left = nameWidth;

    if (visibleCols.role) {
      const w = leftCompact ? 0 : 90;
      cols.push({ key: "role", left, width: w });
      left += w;
    }
    if (visibleCols.location) {
      const w = leftCompact ? 0 : 70;
      cols.push({ key: "location", left, width: w });
      left += w;
    }
    if (visibleCols.startDate) {
      const w = leftCompact ? 0 : 70;
      cols.push({ key: "start", left, width: w });
      left += w;
    }
    if (visibleCols.endDate) {
      const w = leftCompact ? 0 : 70;
      cols.push({ key: "end", left, width: w });
      left += w;
    }

    return { cols, totalWidth: left };
  }, [visibleCols, leftCompact]);

  // ensure the table initially scrolls so today's date is centered in the viewport using focus-based approach
  useEffect(() => {
    if (!layoutReady || !dates.length) return;
    const wrapper = tableWrapperRef.current;
    const top = topScrollerRef.current;
    if (!wrapper || !top) return;

    // Wait a bit for DOM to fully render
    const timeoutId = setTimeout(() => {
      // Find today's date index - try exact match first, then closest
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Normalize today for comparison
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDate = today.getDate();
      const todayTime = today.getTime();
      
      let todayIndex = -1;
      
      // First, always try to find exact match by comparing year, month, and day
      for (let i = 0; i < dates.length; i++) {
        const d = new Date(dates[i]);
        d.setHours(0, 0, 0, 0);
        if (d.getFullYear() === todayYear && 
            d.getMonth() === todayMonth && 
            d.getDate() === todayDate) {
          todayIndex = i;
          break;
        }
      }
      
      // If exact match not found, try to find a date with same month and day (different year)
      // This handles cases where project spans multiple years
      if (todayIndex === -1) {
        for (let i = 0; i < dates.length; i++) {
          const d = new Date(dates[i]);
          d.setHours(0, 0, 0, 0);
          if (d.getMonth() === todayMonth && d.getDate() === todayDate) {
            todayIndex = i;
            break;
          }
        }
      }
      
      // If still not found, find the closest date to today
      if (todayIndex === -1) {
        // Find first date >= today (future dates, prefer closest future)
        for (let i = 0; i < dates.length; i++) {
          const d = new Date(dates[i]);
          d.setHours(0, 0, 0, 0);
          if (d.getTime() >= todayTime) {
            todayIndex = i;
            break;
          }
        }
        
        // If no future date found, find the closest past date
        if (todayIndex === -1) {
          for (let i = dates.length - 1; i >= 0; i--) {
            const d = new Date(dates[i]);
            d.setHours(0, 0, 0, 0);
            if (d.getTime() <= todayTime) {
              todayIndex = i;
              break;
            }
          }
        }
      }
      
      // Final fallback: if still not found, use first date (but this shouldn't happen)
      if (todayIndex === -1) {
        todayIndex = 0;
      }
      
      // Ensure we have a valid index
      const targetDateIndex = todayIndex >= 0 && todayIndex < dates.length ? todayIndex : 0;

      // Debug: log computed indices to help diagnose incorrect positioning
      try {
        const targetDate = dates[targetDateIndex];
        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];
        
        // Show first few and last few dates for debugging
        const sampleDates = dates.slice(0, 5).map(d => formatDDMMYYYY(d));
        const lastSampleDates = dates.slice(-5).map(d => formatDDMMYYYY(d));
        
        console.debug("Leaves scroll - focus based:", {
          today: formatDDMMYYYY(today),
          todayYear,
          todayMonth: todayMonth + 1, // 1-based for display
          todayDate,
          todayTime,
          todayIndex,
          targetDateIndex,
          targetDate: targetDate ? formatDDMMYYYY(targetDate) : "N/A",
          firstDate: firstDate ? formatDDMMYYYY(firstDate) : "N/A",
          lastDate: lastDate ? formatDDMMYYYY(lastDate) : "N/A",
          datesCount: dates.length,
          first5Dates: sampleDates,
          last5Dates: lastSampleDates,
          isTodayInRange: todayIndex >= 0 && todayIndex < dates.length,
        });
      } catch (e) {
        // ignore in environments without console
      }

      // Use focus-based approach: find the header cell for today's date and scroll it into view
      try {
        const headerCells = tableInnerRef.current?.querySelectorAll("thead tr:first-child th");
        if (headerCells && headerCells.length) {
          // Count sticky columns (Member, Role, Location, Start, End) to find where date columns start
          // The dateStartIndex should be after all sticky columns
          let dateStartIndex = -1;
          
          // Method 1: Count sticky columns based on visibleCols
          let stickyColCount = 1; // Member column is always present
          if (visibleCols.role) stickyColCount++;
          if (visibleCols.location) stickyColCount++;
          if (visibleCols.startDate) stickyColCount++;
          if (visibleCols.endDate) stickyColCount++;
          
          dateStartIndex = stickyColCount;
          
          // Method 2: Fallback - try to find by pattern (date cells contain DD/MM somewhere in text)
          if (dateStartIndex < 0 || dateStartIndex >= headerCells.length) {
            for (let i = 0; i < headerCells.length; i++) {
              const text = (headerCells[i].textContent || "").trim();
              // Date cells contain DD/MM pattern (may have year and day name on new lines)
              if (/\d{2}\/\d{2}/.test(text)) {
                dateStartIndex = i;
                break;
              }
            }
          }
          
          console.debug("Date start index calculation:", {
            stickyColCount,
            dateStartIndex,
            headerCellsLength: headerCells.length,
            targetDateIndex,
            datesLength: dates.length,
          });
          
          if (dateStartIndex >= 0 && targetDateIndex >= 0 && targetDateIndex < dates.length) {
            const targetHeaderIndex = dateStartIndex + targetDateIndex;
            if (targetHeaderIndex < headerCells.length) {
              const targetCell = headerCells[targetHeaderIndex];
              if (targetCell) {
                // Verify the cell contains the expected date
                const cellText = targetCell.textContent?.trim() || "";
                const expectedDateStr = formatDDMMYYYY(dates[targetDateIndex]);
                const cellDateMatch = cellText.includes(expectedDateStr.split('/')[0]); // Check day matches
                
                console.debug("Scrolling to cell:", {
                  targetHeaderIndex,
                  targetDateIndex,
                  expectedDate: expectedDateStr,
                  cellText,
                  cellDateMatch,
                });
                
                // Get the cell's position relative to the scrollable container
                const cellRect = targetCell.getBoundingClientRect();
                const wrapperRect = wrapper.getBoundingClientRect();
                
                // Calculate where the cell is relative to the wrapper's scroll position
                const cellLeftRelativeToWrapper = cellRect.left - wrapperRect.left + wrapper.scrollLeft;
                const cellCenter = cellLeftRelativeToWrapper + (cellRect.width / 2);
                
                // Calculate scroll position to center the cell
                const viewportWidth = wrapper.clientWidth;
                const targetScroll = cellCenter - (viewportWidth / 2);
                
                // Clamp to valid scroll range
                const maxScroll = Math.max(wrapper.scrollWidth - wrapper.clientWidth, 0);
                const finalScroll = Math.max(0, Math.min(targetScroll, maxScroll));
                
                console.debug("Scroll calculation:", {
                  cellLeftRelativeToWrapper,
                  cellCenter,
                  viewportWidth,
                  targetScroll,
                  finalScroll,
                  maxScroll,
                });
                
                // Scroll to the calculated position
                wrapper.scrollTo({
                  left: finalScroll,
                  behavior: 'smooth'
                });
                
                // Also sync the top scroller
                if (top) {
                  top.scrollLeft = finalScroll;
                }
              }
            } else {
              console.warn("Target header index out of range:", {
                targetHeaderIndex,
                headerCellsLength: headerCells.length,
                dateStartIndex,
                targetDateIndex,
              });
            }
          } else {
            console.warn("Could not find date start index or invalid target date index:", {
              dateStartIndex,
              targetDateIndex,
              datesLength: dates.length,
            });
          }
        }
      } catch (e) {
        console.error("Error scrolling to today's date:", e);
      }
    }, 150); // Small delay to ensure DOM is ready

    return () => clearTimeout(timeoutId);
  }, [layoutReady, dates, leftColumnsConfig]);

  if (!project) {
    return (
      <Box>
        <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography>No project selected.</Typography>
      </Box>
    );
  }

  // stable sort by name
  const sortedMembers = [...project.members].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const isHolidayForLocation = (location, dateStr) => {
    const byLocation = holidaysState?.byLocation || {};
    const arr = byLocation[location] || [];
    return arr.some((h) => h.date === dateStr);
  };

  // NEW: return holiday object/name if present
  const getHolidayForLocation = (location, dateStr) => {
    const byLocation = holidaysState?.byLocation || {};
    const arr = byLocation[location] || [];
    const found = arr.find((h) => h.date === dateStr);
    return found || null; // { date, name, ... } or null
  };

  const getEffectiveLeaveValue = (member, date) => {
    const dateStr = formatDDMMYYYY(date);
    const stored = project.leaves?.[member.id]?.[dateStr];
    if (stored !== undefined && stored !== null) return String(stored);
    const join = parseDDMMYYYY(member.startDate);
    const leaveEnd = member.endDate ? parseDDMMYYYY(member.endDate) : parseDDMMYYYY(project.endDate);
    if (!join || !leaveEnd) return "";
    if (date < join || date > leaveEnd) return "";
    if (isWeekend(date)) return "";
    if (isHolidayForLocation(member.location, dateStr)) return "";
    return "1";
  };

  const handleCellClick = (member, date) => {
    const dateStr = formatDDMMYYYY(date);
    const join = parseDDMMYYYY(member.startDate);
    const leaveEnd = member.endDate ? parseDDMMYYYY(member.endDate) : parseDDMMYYYY(project.endDate);
    if (!join || !leaveEnd) return;
    if (date < join) return;
    if (isWeekend(date)) return;
    if (isHolidayForLocation(member.location, dateStr)) return;
    const stored = project.leaves?.[member.id]?.[dateStr];
    const value = stored !== undefined && stored !== null ? String(stored) : getEffectiveLeaveValue(member, date);
    setEditingCell({
      memberId: member.id,
      memberName: member.name,
      memberCode: member.code,
      date,
      dateStr,
      value,
    });
  };

  const handleSaveCell = () => {
    if (!editingCell) return;
    const { memberId, dateStr, value } = editingCell;
    const trimmed = String(value).trim();
    dispatch(
      setLeaveForMember({
        projectId: project.id,
        memberId,
        date: dateStr,
        value: trimmed === "" ? null : Number(trimmed),
      })
    );
    setEditingCell(null);
  };

  // render date cell with updated sizing and colors and reduced font (slightly smaller)
  const renderCell = (member, date) => {
    const dateStr = formatDDMMYYYY(date);
    const joinDate = parseDDMMYYYY(member.startDate);
    const endDate = member.endDate ? parseDDMMYYYY(member.endDate) : parseDDMMYYYY(project.endDate);
    const isBeforeJoin = joinDate && date < joinDate;
    const weekend = isWeekend(date);

    const holidayObj = getHolidayForLocation(member.location, dateStr);
    const isHoliday = Boolean(holidayObj);

    const stored = project.leaves?.[member.id]?.[dateStr];
    const displayed = stored !== undefined && stored !== null ? String(stored) : getEffectiveLeaveValue(member, date);
    const disabled = isBeforeJoin || weekend || isHoliday;

    // colors
    let bg = "background.paper";
    if (isHoliday) bg = "warning.light";
    else if (disabled) bg = "#f5f5f5";
    else if (displayed === "0") bg = "primary.main"; // blue theme for full-day off
    else if (displayed === "0.5" || displayed === "0.50") bg = "#FFF9C4"; // faint yellow for half-day
    else if (displayed === "1") bg = "success.light";
    else if (displayed === "") bg = "transparent";

    const sx = {
      minWidth: DATE_COL_WIDTH,
      maxWidth: DATE_COL_WIDTH,
      width: DATE_COL_WIDTH,
      textAlign: "center",
      // reduced font size (slightly smaller)
      fontSize: 11.5,
      cursor: disabled ? "default" : "pointer",
      bgcolor: bg,
      borderRight: "1px solid #eee",
      borderBottom: "1px solid #eee",
      padding: "6px 6px",
      transition: "background .12s ease, color .12s ease",
      "&:hover": disabled
        ? {}
        : { bgcolor: "primary.main", color: "primary.contrastText" },
    };

    return (
      <TableCell
        key={dateStr}
        sx={sx}
        onClick={() => { if (!disabled) handleCellClick(member, date); }}
      >
        {isHoliday ? (
          // show exact holiday name (fall back to 'Holiday' if name missing)
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11 }}>
            {holidayObj?.name || "Holiday"}
          </Typography>
        ) : displayed ? (
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: displayed === "1" ? 600 : 700, 
              fontSize: 11.5,
              color: displayed === "0" ? "#FFFFFF" : "inherit"
            }}
          >
            {displayed}
          </Typography>
        ) : (
          ""
        )}
      </TableCell>
    );
  };

  // toggle column visibility
  const toggleCol = (k) => setVisibleCols((p) => ({ ...p, [k]: !p[k] }));

  // Top header now uses Dashboard card style

  return (
    <Box>
      {/* Top header — compact horizontal Card to save vertical space */}
      <Card elevation={2} sx={{ mb: 1 }}>
        <CardContent sx={{ position: "relative", py: 1, pr: 2, pl: { xs: 5, sm: 6 } }}>
          <IconButton
            size="small"
            onClick={() => navigate(-1)}
            aria-label="Back"
            sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)" }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <EventIcon color="primary" sx={{ fontSize: 20 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Capacity planner — {project.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "block", sm: "block" } }}>
                  {project.startDate} → {project.endDate}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1, alignItems: "center", ml: { xs: 0, sm: 2 } }}>
              <Chip icon={<PersonIcon />} label={`${project.members.length} members`} size="small" />
              <Chip icon={<EventIcon />} label={`${project.startDate} → ${project.endDate}`} size="small" />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Controls: toggles for hide/unhide left columns — arranged to the right for compact aesthetics */}
      <Card elevation={0} sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flex: 1, flexWrap: "wrap" }}>
              <Chip size="small" label="Grey = weekends / before joining" />
              <Chip size="small" label="Yellow = Public Holiday" />
              <Chip size="small" label='0 = absent, 0.5 = half day' />
            </Box>

            <Divider orientation="vertical" flexItem />

            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              <FormControlLabel
                control={<Switch size="small" checked={visibleCols.role} onChange={() => toggleCol("role")} />}
                label={<Typography variant="caption" sx={{ fontSize: 12 }}>Role</Typography>}
              />

              <FormControlLabel
                control={<Switch size="small" checked={visibleCols.location} onChange={() => toggleCol("location")} />}
                label={<Typography variant="caption" sx={{ fontSize: 12 }}>Location</Typography>}
              />

              <FormControlLabel
                control={<Switch size="small" checked={visibleCols.startDate} onChange={() => toggleCol("startDate")} />}
                label={<Typography variant="caption" sx={{ fontSize: 12 }}>Start</Typography>}
              />
              <FormControlLabel
                control={<Switch size="small" checked={visibleCols.endDate} onChange={() => toggleCol("endDate")} />}
                label={<Typography variant="caption" sx={{ fontSize: 12 }}>End</Typography>}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>

        {/* top synchronized scroller */}
        <Box
          ref={topScrollerRef}
          sx={{
            overflowX: "auto",
            overflowY: "hidden",
            height: 12,
            bgcolor: "background.default",
            px: 1,
            "&::-webkit-scrollbar": { height: 8 },
            "&::-webkit-scrollbar-thumb": { borderRadius: 2, background: "#c1c1c1" },
          }}
        >
          <div className="spacer" style={{ height: 1, width: "100%" }} />
        </Box>

        {/* table wrapper — make vertically scrollable so the table header can stick */}
        <Box ref={tableWrapperRef} sx={{
          width: "100%",
          maxHeight: "55vh",
          overflowX: "auto",
          overflowY: "auto",
          // hide bottom scrollbar while keeping scroll functional
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}>
          <Box ref={tableInnerRef} sx={{ width: "max-content" }}>
            <Table size="small" stickyHeader sx={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 700 }}>
              <TableHead>
                <TableRow sx={{ '& th': { textAlign: 'center' } }}>
                  {/* Name column (always visible) */}
                  <TableCell
                    align="center"
                    sx={{
                      position: "sticky",
                      left: 0,
                      zIndex: 4,
                      minWidth: leftCompact ? 150 : 120,
                      maxWidth: leftCompact ? 150 : 120,
                      bgcolor: "background.paper",
                      borderRight: "1px solid #e6e6e6",
                      fontWeight: 700,
                      fontSize: 13,
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                      overflow: "hidden",
                    }}
                  >
                    Member
                  </TableCell>

                  {/* Role */}
                  {visibleCols.role && (
                    <TableCell
                      align="center"
                      sx={{
                        position: "sticky",
                        left: leftColumnsConfig.cols.find(c => c.key === "role")?.left ?? 0,
                        zIndex: 4,
                        minWidth: leftCompact ? 0 : 90,
                        maxWidth: leftCompact ? 0 : 90,
                        bgcolor: "background.paper",
                        borderRight: "1px solid #e6e6e6",
                        fontWeight: 700,
                        fontSize: 12,
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                      }}
                    >
                      Role
                    </TableCell>
                  )}

                  {/* Location */}
                  {visibleCols.location && (
                    <TableCell
                      align="center"
                      sx={{
                        position: "sticky",
                        left: leftColumnsConfig.cols.find(c => c.key === "location")?.left ?? 0,
                        zIndex: 4,
                        minWidth: leftCompact ? 0 : 70,
                        maxWidth: leftCompact ? 0 : 70,
                        bgcolor: "background.paper",
                        borderRight: "1px solid #e6e6e6",
                        fontWeight: 700,
                        fontSize: 12,
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                      }}
                    >
                      Location
                    </TableCell>
                  )}

                  {/* Start Date */}
                  {visibleCols.startDate && (
                    <TableCell
                      align="center"
                      sx={{
                        position: "sticky",
                        left: leftColumnsConfig.cols.find(c => c.key === "start")?.left ?? 0,
                        zIndex: 4,
                        minWidth: leftCompact ? 0 : 70,
                        maxWidth: leftCompact ? 0 : 70,
                        bgcolor: "background.paper",
                        borderRight: "1px solid #e6e6e6",
                        fontWeight: 700,
                        fontSize: 12,
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                      }}
                    >
                      Start
                    </TableCell>
                  )}

                  {/* End Date (new) */}
                  {visibleCols.endDate && (
                    <TableCell
                      align="center"
                      sx={{
                        position: "sticky",
                        left: leftColumnsConfig.cols.find(c => c.key === "end")?.left ?? 0,
                        zIndex: 4,
                        minWidth: leftCompact ? 0 : 70,
                        maxWidth: leftCompact ? 0 : 70,
                        bgcolor: "background.paper",
                        borderRight: "1px solid #e6e6e6",
                        fontWeight: 700,
                        fontSize: 12,
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                      }}
                    >
                      End
                    </TableCell>
                  )}

                  {/* Date columns */}
                  {dates.map((d) => {
                    const weekend = isWeekend(d);
                    return (
                      <TableCell
                        key={d.toISOString()}
                        sx={{
                          minWidth: DATE_COL_WIDTH,
                          maxWidth: DATE_COL_WIDTH,
                          width: DATE_COL_WIDTH,
                          textAlign: "center",
                          fontSize: 11,
                          borderRight: "1px solid #f0f0f0",
                          bgcolor: weekend ? "#fafafa" : "background.paper",
                          padding: "6px 6px",
                        }}
                      >
                        <Typography variant="caption" display="block" sx={{ fontSize: 11 }}>{formatDDMM(d)}</Typography>
                        <Typography variant="caption" display="block" sx={{ fontSize: 10 }}>{getYear(d)}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: 10 }}>{getDayShort(d)}</Typography>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>

              <TableBody>
                {sortedMembers.map((m) => (
                  <TableRow key={m.id} hover sx={{ "&:nth-of-type(odd)": { bgcolor: "action.hover" } }}>
                    {/* Name (always shown) */}
                    <TableCell
                      align="center"
                      sx={{
                        position: "sticky",
                        left: 0,
                        zIndex: 3,
                        minWidth: leftCompact ? 150 : 120,
                        maxWidth: leftCompact ? 150 : 120,
                        bgcolor: "background.paper",
                        borderRight: "1px solid #e6e6e6",
                        py: 1.2,
                        fontSize: 12,
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        overflow: "hidden",
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        fontWeight={600} 
                        sx={{ 
                          fontSize: 12,
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          hyphens: "auto",
                        }}
                      >
                        {m.name}
                      </Typography>
                    </TableCell>

                    {/* Role */}
                    {visibleCols.role && (
                      <TableCell
                        align="center"
                        sx={{
                          position: "sticky",
                          left: leftColumnsConfig.cols.find(c => c.key === "role")?.left ?? 0,
                          zIndex: 3,
                          minWidth: leftCompact ? 0 : 90,
                          maxWidth: leftCompact ? 0 : 90,
                          bgcolor: "background.paper",
                          borderRight: "1px solid #e6e6e6",
                          py: 1.2,
                          fontSize: 11.5,
                          whiteSpace: "normal",
                          wordWrap: "break-word",
                        }}
                      >
                        <Typography variant="caption" sx={{ fontSize: 11.5 }}>{m.role}</Typography>
                      </TableCell>
                    )}



                    {/* Location */}
                    {visibleCols.location && (
                      <TableCell
                        align="center"
                        sx={{
                          position: "sticky",
                          left: leftColumnsConfig.cols.find(c => c.key === "location")?.left ?? 0,
                          zIndex: 3,
                          minWidth: leftCompact ? 0 : 70,
                          maxWidth: leftCompact ? 0 : 70,
                          bgcolor: "background.paper",
                          borderRight: "1px solid #e6e6e6",
                          py: 1.2,
                          fontSize: 11.5,
                          whiteSpace: "normal",
                          wordWrap: "break-word",
                        }}
                      >
                        <Typography variant="caption" sx={{ fontSize: 11.5 }}>{m.location}</Typography>
                      </TableCell>
                    )}

                    {/* Start date */}
                    {visibleCols.startDate && (() => {
                      const startDateObj = parseDDMMYYYY(m.startDate);
                      return (
                        <TableCell
                          align="center"
                          sx={{
                            position: "sticky",
                            left: leftColumnsConfig.cols.find(c => c.key === "start")?.left ?? 0,
                            zIndex: 3,
                            minWidth: leftCompact ? 0 : 70,
                            maxWidth: leftCompact ? 0 : 70,
                            bgcolor: "background.paper",
                            borderRight: "1px solid #e6e6e6",
                            py: 1.2,
                            fontSize: 11.5,
                            whiteSpace: "normal",
                            wordWrap: "break-word",
                          }}
                        >
                          {startDateObj ? (
                            <>
                              <Typography variant="caption" display="block" sx={{ fontSize: 11.5 }}>{formatDDMM(startDateObj)}</Typography>
                              <Typography variant="caption" display="block" sx={{ fontSize: 10 }}>{getYear(startDateObj)}</Typography>
                            </>
                          ) : (
                            <Typography variant="caption" sx={{ fontSize: 11.5 }}>{m.startDate}</Typography>
                          )}
                        </TableCell>
                      );
                    })()}

                    {/* End date */}
                    {visibleCols.endDate && (() => {
                      const endDateStr = m.endDate || project.endDate;
                      const endDateObj = parseDDMMYYYY(endDateStr);
                      return (
                        <TableCell
                          align="center"
                          sx={{
                            position: "sticky",
                            left: leftColumnsConfig.cols.find(c => c.key === "end")?.left ?? 0,
                            zIndex: 3,
                            minWidth: leftCompact ? 0 : 70,
                            maxWidth: leftCompact ? 0 : 70,
                            bgcolor: "background.paper",
                            borderRight: "1px solid #e6e6e6",
                            py: 1.2,
                            fontSize: 11.5,
                            whiteSpace: "normal",
                            wordWrap: "break-word",
                          }}
                        >
                          {endDateObj ? (
                            <>
                              <Typography variant="caption" display="block" sx={{ fontSize: 11.5 }}>{formatDDMM(endDateObj)}</Typography>
                              <Typography variant="caption" display="block" sx={{ fontSize: 10 }}>{getYear(endDateObj)}</Typography>
                            </>
                          ) : (
                            <Typography variant="caption" sx={{ fontSize: 11.5 }}>{endDateStr}</Typography>
                          )}
                        </TableCell>
                      );
                    })()}

                    {/* date cells */}
                    {dates.map((date) => renderCell(m, date))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Paper>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
        Click on any editable cell to set capacity (1 = full day, 0.5 = half, 0 = off). Empty clears custom entry.
      </Typography>

      {/* Leave edit dialog */}
      <Dialog open={Boolean(editingCell)} onClose={() => setEditingCell(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Update leave</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editingCell && (
            <>
              <Typography variant="body2" gutterBottom><b>{editingCell.memberName}</b> – {editingCell.memberCode}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>Date: <b>{editingCell.dateStr}</b></Typography>
            </>
          )}
          <TextField
            select
            fullWidth
            label="Capacity value"
            value={editingCell?.value ?? ""}
            onChange={(e) =>
              setEditingCell((prev) =>
                prev ? { ...prev, value: e.target.value } : prev
              )
            }
            SelectProps={{ native: true }}
            helperText="Choose 1, 0.5 or 0. Leave empty to clear and use default."
            sx={{ mt: 2 }}
            autoFocus
          >
            <option value=""></option>
            <option value="1">1</option>
            <option value="0.5">0.5</option>
            <option value="0">0</option>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditingCell(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCell}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
