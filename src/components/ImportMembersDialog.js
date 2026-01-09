import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Paper,
  Stack,
  Box,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { LOCATIONS } from "../constants/dashboardConstants";

export default function ImportMembersDialog({ open, onClose, onImport, project }) {
  const fileRef = useRef();
  const [dragOver, setDragOver] = useState(false);
  const [previewCount, setPreviewCount] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);

  useEffect(() => {
    if (!open) {
      setDragOver(false);
      setPreviewCount(null);
      setParsedRows([]);
    }
  }, [open]);

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] || "";
      });
      rows.push(obj);
    }
    return rows;
  };

  const normalizeDateForApp = (s) => {
    if (!s) return project?.startDate || "";
    s = String(s).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split("-");
      return `${d}/${m}/${y}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
    // try Date
    const dt = new Date(s);
    if (!isNaN(dt)) {
      const dd = String(dt.getDate()).padStart(2, "0");
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const yyyy = dt.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    return project?.startDate || "";
  };

  const handleFile = (file) => {
    if (!file) return;
    setPreviewCount(null);
    const ext = (file.name.split(".").pop() || "").toLowerCase();

    if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        // normalize keys to lowercase single-word where possible
        const rows = json.map((r) => {
          const out = {};
          Object.keys(r).forEach((k) => {
            const key = String(k).trim().toLowerCase();
            out[key] = r[k];
          });
          return out;
        });
        setParsedRows(rows);
        setPreviewCount(rows.length);
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // CSV path (use Papa if available)
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      try {
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const rows = parsed.data.map((r) => {
          const out = {};
          Object.keys(r).forEach((k) => {
            out[String(k).trim().toLowerCase()] = r[k];
          });
          return out;
        });
        setParsedRows(rows);
        setPreviewCount(rows.length);
      } catch (err) {
        const rows = parseCSV(text);
        setParsedRows(rows);
        setPreviewCount(rows.length);
      }
    };
    reader.readAsText(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleImport = () => {
    if (!project || !parsedRows.length) return;
    const members = parsedRows.map((r) => {
      const name = r.name || r.fullname || r["full name"] || r["full_name"] || "Unknown";
      const role = r.role || r.designation || r.position || "Backend Engineer";
      const start = normalizeDateForApp(r.startdate || r.start_date || r.start || r.startdate_raw || "");
      const end = normalizeDateForApp(r.enddate || r.end_date || r.end || r.enddate_raw || "");
      const pod = Number(r.pod || r.team || r.pod_raw || 1) || 1;
      const locRaw = String(r.location || r.loc || r.city || "").trim();
      const location = LOCATIONS.includes(locRaw) ? locRaw : LOCATIONS[0];

      return {
        name: String(name).trim(),
        role: String(role).trim(),
        startDate: start,
        endDate: end,
        pod,
        location,
      };
    });

    onImport(members);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Import members (Excel or CSV)</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Drop an Excel (.xlsx/.xls) or CSV file. Required headers: <code>name, role, startDate, endDate, pod, location</code>. Dates can be <code>YYYY-MM-DD</code> or <code>DD/MM/YYYY</code>.
        </Typography>

        <Paper
          variant="outlined"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          sx={{
            py: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderStyle: "dashed",
            bgcolor: dragOver ? "action.hover" : "transparent",
            mb: 2,
            cursor: "pointer",
          }}
          onClick={() => fileRef.current?.click()}
        >
          <Stack alignItems="center" spacing={1}>
            <CloudUploadIcon sx={{ fontSize: 40 }} />
            <Typography>Drag & drop Excel/CSV here, or click to browse</Typography>
            <Button variant="contained" onClick={() => fileRef.current?.click()}>
              Choose file
            </Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,text/csv" onChange={onFileChange} style={{ display: "none" }} />
          </Stack>
        </Paper>

        <Typography variant="caption" color="text.secondary">
          Preview rows: {previewCount ?? 0}
        </Typography>

        {previewCount > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Sample preview</Typography>
            <Box sx={{ maxHeight: 240, overflow: "auto", mt: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {Object.keys(parsedRows[0] || {}).slice(0, 6).map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: 6, borderBottom: "1px solid #eee" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 6).map((r, idx) => (
                    <tr key={idx}>
                      {Object.keys(r).slice(0, 6).map((k) => (
                        <td key={k} style={{ padding: 6, borderBottom: "1px solid #f6f6f6" }}>
                          {r[k]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!parsedRows.length} onClick={handleImport}>
          Import {parsedRows.length ? `(${parsedRows.length})` : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

