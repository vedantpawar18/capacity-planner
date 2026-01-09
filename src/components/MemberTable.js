import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function MemberTable({
  displayedMembers,
  projects,
  onEditMember,
  onDeleteMember,
  onMoveMember,
  onMemberClick,
}) {
  if (displayedMembers.length === 0) {
    return (
      <Box mt={3}>
        <Card elevation={1}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Project members
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please select project(s) to view members.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box mt={3}>
      <Card elevation={1}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Project members
          </Typography>
          <TableContainer
            component={Paper}
            sx={{
              maxHeight: "55vh",
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
            <Table
              size="small"
              stickyHeader
              sx={{
                minWidth: 1000,
                "& thead th": {
                  textAlign: "center",
                  position: "sticky",
                  top: 0,
                  zIndex: (theme) => theme.zIndex.appBar + 1,
                  bgcolor: "background.paper",
                  fontWeight: "bold",
                },
                "& tbody tr:nth-of-type(odd)": { bgcolor: "action.hover" },
                "& td, & th": { verticalAlign: "middle" },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell align="center">Project</TableCell>
                  <TableCell align="center">Member</TableCell>
                  <TableCell align="center">Role</TableCell>
                  <TableCell align="center">Location</TableCell>
                  <TableCell align="center">Start date</TableCell>
                  <TableCell align="center">End date</TableCell>
                  <TableCell align="center">POD</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedMembers.map((m, idx) => {
                  const prev = displayedMembers[idx - 1];
                  const showProjectSeparator =
                    idx === 0 || (prev && prev.projectId !== m.projectId);
                  const showPodSeparator =
                    prev && prev.projectId === m.projectId && prev.pod !== m.pod;
                  const memberProject = projects.find((p) => p.id === m.projectId);

                  return (
                    <React.Fragment key={`${m.projectId}-${m.id}`}>
                      {showProjectSeparator && (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            sx={{
                              py: 2,
                              bgcolor: "primary.main",
                              borderTop: "2px solid",
                              borderBottom: "2px solid",
                              borderColor: "primary.main",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-start",
                              }}
                            >
                              <Chip
                                label={m.projectName}
                                size="medium"
                                sx={{
                                  fontWeight: 700,
                                  bgcolor: "primary.main",
                                  color: "#FFFFFF",
                                  fontSize: "0.95rem",
                                  height: 40,
                                  px: 2,
                                  boxShadow: 2,
                                  border: "1px solid rgba(255, 255, 255, 0.2)",
                                  "& .MuiChip-label": {
                                    color: "#FFFFFF",
                                    fontWeight: 700,
                                    letterSpacing: "0.5px",
                                  },
                                }}
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                      {showPodSeparator && (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ py: 1 }}>
                            <Divider
                              textAlign="left"
                              sx={{
                                "&::before,&::after": { borderColor: "primary.light" },
                              }}
                            >
                              <Chip
                                label={memberProject?.podNames?.[m.pod] || `P${m.pod}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Divider>
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow hover>
                        <TableCell align="center">
                          <FormControl size="small" sx={{ minWidth: 140, maxWidth: 140 }}>
                            <Select
                              value={m.projectId}
                              onChange={(e) => {
                                const newProjectId = e.target.value;
                                if (newProjectId !== m.projectId) {
                                  onMoveMember(m.id, m.projectId, newProjectId);
                                }
                              }}
                              sx={{ fontSize: 12 }}
                            >
                              {projects.map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                  {p.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ cursor: "pointer", textDecoration: "underline" }}
                            onClick={() => onMemberClick(m)}
                          >
                            {m.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{m.role}</TableCell>
                        <TableCell align="center">{m.location}</TableCell>
                        <TableCell align="center">{m.startDate}</TableCell>
                        <TableCell align="center">{m.endDate || "-"}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={memberProject?.podNames?.[m.pod] || `P${m.pod}`}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => onEditMember(m)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => onDeleteMember(m)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

