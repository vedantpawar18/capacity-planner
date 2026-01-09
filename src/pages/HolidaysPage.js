// src/pages/HolidaysPage.js
import React, { useMemo, useState } from "react";
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
  TableContainer,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Stack,
  Tooltip,
  Grid,
  Paper,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import PublicIcon from "@mui/icons-material/Public";
import { useDispatch, useSelector } from "react-redux";
import { addHoliday, deleteHoliday, updateHoliday, selectLocation } from "../features/holidaysSlice";
import { formatDDMMYYYY, parseDDMMYYYY } from "../utils/dateUtils";
import { useNavigate } from "react-router-dom";

const LOCATIONS = ["Pune", "Noida", "Bangalore", "Chennai", "Hyderabad"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthOfDDMMYYYY(ddmm) {
  if (!ddmm) return null;
  const parts = ddmm.split("/");
  if (parts.length !== 3) return null;
  const month = parseInt(parts[1], 10); // 1..12
  return month - 1; // 0-based
}

export default function HolidaysPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const holidaysState = useSelector((s) => s.holidays);
  const byLocation = holidaysState.byLocation || {};
  const selectedLocation = holidaysState.selectedLocation || LOCATIONS[0];

  // Modal state
  const [open, setOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null); // { id, location, date, name }
  const [modalLocation, setModalLocation] = useState(null);
  const [modalMonthIndex, setModalMonthIndex] = useState(null);
  const [dateInput, setDateInput] = useState(""); // yyyy-mm-dd
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");
  const [applyAllLocations, setApplyAllLocations] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);

  // Header style now matches Dashboard top card (no gradient)
  const theme = useTheme();

  const rows = useMemo(() => LOCATIONS, []);

  // open modal for a location and month; prefill dateInput to first day of that month (current year)
  const openAdd = (location, monthIndex) => {
    setEditingHoliday(null);
    setModalLocation(location);
    setModalMonthIndex(monthIndex);

    // default date: first day of that month in current year (YYYY-MM-DD)
    const now = new Date();
    const year = now.getFullYear();
    const date = new Date(year, monthIndex, 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    setDateInput(`${yyyy}-${mm}-${dd}`);

    setNameInput("");
    setError("");
    setApplyAllLocations(false);
    setSelectedLocations(location ? [location] : []);
    setOpen(true);
  };

  // open edit modal for an existing holiday
  const openEdit = (holiday, location) => {
    setEditingHoliday(holiday);
    setModalLocation(location);
    
    // Convert DD/MM/YYYY to YYYY-MM-DD for date input
    const [d, m, y] = holiday.date.split("/");
    setDateInput(`${y}-${m}-${d}`);
    setNameInput(holiday.name);
    setError("");
    setApplyAllLocations(false);
    setSelectedLocations([location]);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingHoliday(null);
    setModalLocation(null);
    setModalMonthIndex(null);
    setDateInput("");
    setNameInput("");
    setError("");
    setApplyAllLocations(false);
    setSelectedLocations([]);
  };

  const handleAddHoliday = () => {
    if (!dateInput || !nameInput) return;
    // convert yyyy-mm-dd to DD/MM/YYYY
    const [y, m, d] = dateInput.split("-");
    const ddmm = `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;

    // If editing, update the holiday
    if (editingHoliday) {
      // Check if date changed and conflicts with another holiday (excluding current one)
      const dateConflict = modalLocation && (byLocation[modalLocation] || []).some(
        (h) => h.date === ddmm && h.id !== editingHoliday.id
      );
      if (dateConflict) {
        setError("A holiday already exists for this date in this location.");
        return;
      }
      
      dispatch(updateHoliday({
        location: modalLocation,
        id: editingHoliday.id,
        date: ddmm,
        name: nameInput,
      }));
      closeModal();
      return;
    }

    // Adding new holiday
    const targets = applyAllLocations
      ? LOCATIONS
      : (selectedLocations.length
          ? selectedLocations
          : (modalLocation ? [modalLocation] : []));

    if (!targets.length) return;

    // check duplicate at UI level and inform user (exclude current holiday if editing)
    const anyExists = targets.some((loc) =>
      (byLocation[loc] || []).some((h) => h.date === ddmm && (!editingHoliday || h.id !== editingHoliday.id))
    );
    if (anyExists) {
      setError("A holiday already exists for this date in one of the selected locations.");
      return;
    }

    targets.forEach((loc) =>
      dispatch(addHoliday({ location: loc, date: ddmm, name: nameInput }))
    );
    closeModal();
  };

  const handleDelete = (location, id) => {
    dispatch(deleteHoliday({ location, id }));
  };

  // Helper: get holidays for a location grouped by month index (0..11)
  const holidaysByLocationMonth = useMemo(() => {
    const map = {};
    LOCATIONS.forEach((loc) => {
      const arr = byLocation[loc] || [];
      const months = Array.from({ length: 12 }, () => []);
      arr.forEach((h) => {
        const mi = monthOfDDMMYYYY(h.date);
        if (mi !== null && mi >= 0 && mi < 12) months[mi].push(h);
      });
      map[loc] = months;
    });
    return map;
  }, [byLocation]);

  const isDuplicate = (() => {
    if (!dateInput) return false;
    const parts = dateInput.split("-");
    if (parts.length !== 3) return false;
    const [y, m, d] = parts;
    const ddmm = `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;

    const targets = applyAllLocations
      ? LOCATIONS
      : (selectedLocations.length
          ? selectedLocations
          : (modalLocation ? [modalLocation] : []));

    if (!targets.length) return false;

    return targets.some((loc) =>
      (byLocation[loc] || []).some((h) => h.date === ddmm && (!editingHoliday || h.id !== editingHoliday.id))
    );
  })();

  return (
    <Box>
      {/* Top header — Dashboard-style */}
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
              <PublicIcon color="primary" sx={{ fontSize: 20 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Public holidays
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Manage public holidays by location and month
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Chip size="small" label={`Locations: ${LOCATIONS.length}`} variant="outlined" />
              <Chip size="small" label={`Total: ${Object.values(byLocation).flat().length}`} variant="outlined" />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card elevation={1}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click a cell to add a holiday for that location in the selected month.
            Existing holidays appear as chips you can remove.
          </Typography>

          <TableContainer
            component={Paper}
            sx={{
              maxHeight: "55vh",
              overflowX: "auto",
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#c4c4c4 transparent",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#c4c4c4",
                borderRadius: "8px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: "#9e9e9e",
              },
            }}
          >
            <Table size="small" stickyHeader sx={{ minWidth: 900, '& thead th': { textAlign: 'center', position: 'sticky', top: 0, zIndex: (theme) => theme.zIndex.appBar, bgcolor: theme.palette.grey[900], color: theme.palette.common.white } }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ minWidth: 160, fontWeight: 700 }}>Location</TableCell>
                  {MONTHS.map((m, idx) => (
                    <TableCell key={m} align="center" sx={{ minWidth: 88, fontWeight: 700 }}>
                      {m}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((loc) => (
                  <TableRow key={loc}>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                        <Typography fontWeight={600}>{loc}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({(byLocation[loc] || []).length})
                        </Typography>
                      </Stack>
                    </TableCell>

                    {Array.from({ length: 12 }).map((_, mi) => {
                      const items = (holidaysByLocationMonth[loc] || [])[mi] || [];
                      return (
                        <TableCell
                          key={mi}
                          align="center"
                          sx={{
                            verticalAlign: "top",
                            maxWidth: 160,
                            whiteSpace: "normal",
                            cursor: "pointer",
                          }}
                          onClick={() => openAdd(loc, mi)}
                        >
                          <Stack spacing={0.5} alignItems="center" sx={{ width: "100%" }}>
                            {items.length === 0 ? (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(e) => { e.stopPropagation(); openAdd(loc, mi); }}
                                sx={{ textTransform: "none" }}
                              >
                                <AddIcon sx={{ fontSize: 16, mr: 0.5 }} /> Add
                              </Button>
                            ) : (
                              <>
                                <Box 
                                  sx={{ 
                                    display: "flex", 
                                    gap: 0.5, 
                                    flexWrap: "wrap", 
                                    justifyContent: "center",
                                    width: "100%"
                                  }}
                                >
                                  {items.map((h) => (
                                    <Tooltip key={h.id} title={`${h.date} — ${h.name} (Click to edit)`}>
                                      <Chip
                                        size="small"
                                        label={`${h.date.split("/")[0]} ${h.name}`}
                                        onClick={(e) => { e.stopPropagation(); openEdit(h, loc); }}
                                        onDelete={(e) => { e.stopPropagation(); handleDelete(loc, h.id); }}
                                        sx={{ 
                                          bgcolor: "warning.light",
                                          cursor: "pointer",
                                          "&:hover": {
                                            bgcolor: "warning.main",
                                            opacity: 0.9,
                                          }
                                        }}
                                      />
                                    </Tooltip>
                                  ))}
                                </Box>
                                <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
                                  <Button
                                    size="small"
                                    variant="text"
                                    onClick={(e) => { e.stopPropagation(); openAdd(loc, mi); }}
                                    sx={{ textTransform: "none" }}
                                  >
                                    + Add
                                  </Button>
                                </Box>
                              </>
                            )}
                          </Stack>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit holiday modal */}
      <Dialog open={open} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>{editingHoliday ? "Edit holiday" : "Add holiday"}</DialogTitle>
        <DialogContent>
          <Card
            elevation={0}
            sx={{
              mt: 1,
              borderRadius: 2,
              border: (t) => `1px solid ${t.palette.divider}`,
              background: (t) => t.palette.background.default,
              p: 2,
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location (anchor)"
                  value={modalLocation || ""}
                  InputProps={{ readOnly: true }}
                  helperText={editingHoliday ? "Location cannot be changed when editing" : ""}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={dateInput}
                  onChange={(e) => { setDateInput(e.target.value); setError(""); }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Holiday name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                    py: 1,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={applyAllLocations}
                        onChange={(e) => setApplyAllLocations(e.target.checked)}
                        disabled={!!editingHoliday}
                      />
                    }
                    label="Apply to all locations"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Tip: choose all, or pick specific locations below.
                  </Typography>
                </Box>
              </Grid>

              {!applyAllLocations && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      borderRadius: 2,
                      p: 1.5,
                      background: (t) => t.palette.background.paper,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 0.5, display: "block" }}
                    >
                      Select locations
                    </Typography>
                    <Grid container spacing={1}>
                      {LOCATIONS.map((loc) => (
                        <Grid item xs={6} key={loc}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={selectedLocations.includes(loc)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setSelectedLocations((prev) => {
                                    if (checked) {
                                      return prev.includes(loc) ? prev : [...prev, loc];
                                    }
                                    return prev.filter((x) => x !== loc);
                                  });
                                }}
                                disabled={!!editingHoliday}
                              />
                            }
                            label={loc}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                {error ? (
                  <Typography variant="caption" color="error">
                    {error}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    The selected date will be stored as DD/MM/YYYY and applied to the
                    Capacity planner page for users in the selected locations.
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddHoliday}
            disabled={!dateInput || !nameInput || isDuplicate}
          >
            {editingHoliday ? "Update holiday" : "Add holiday"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
