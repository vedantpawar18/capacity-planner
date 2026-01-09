import React from "react";
import {
  Button,
  Menu,
  MenuItem,
  MenuList,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
  IconButton,
  Divider,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

export default function ProjectSelectionMenu({
  projects,
  showAllProjects,
  selectedProjects,
  projectMenuAnchor,
  onMenuOpen,
  onMenuClose,
  onAllProjectsToggle,
  onProjectToggle,
  onEditProject,
  onAddProject,
}) {
  const getButtonText = () => {
    if (showAllProjects) return "All Projects";
    if (selectedProjects.size === 0) return "Select Projects";
    if (selectedProjects.size === 1) {
      return projects.find((p) => selectedProjects.has(p.id))?.name || "1 project selected";
    }
    return `${selectedProjects.size} projects selected`;
  };

  return (
    <>
      <Button
        variant="outlined"
        onClick={onMenuOpen}
        sx={{
          justifyContent: "space-between",
          textTransform: "none",
          textAlign: "left",
        }}
        endIcon={<ArrowDropDownIcon />}
      >
        {getButtonText()}
      </Button>
      <Menu
        anchorEl={projectMenuAnchor}
        open={Boolean(projectMenuAnchor)}
        onClose={onMenuClose}
        PaperProps={{
          sx: {
            minWidth: 320,
            maxHeight: 450,
            borderRadius: 2,
            boxShadow: 3,
            border: "1px solid",
            borderColor: "divider",
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
          },
        }}
      >
        <MenuList
          sx={{
            py: 1,
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
          <MenuItem
            sx={{
              py: 1.5,
              px: 2,
              "&:hover": {
                bgcolor: "action.hover",
              },
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={showAllProjects}
                  onChange={(e) => onAllProjectsToggle(e.target.checked)}
                  sx={{
                    "&.Mui-checked": {
                      color: "primary.main",
                    },
                  }}
                />
              }
              label={
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: showAllProjects ? "primary.main" : "text.primary" }}
                >
                  All Projects
                </Typography>
              }
              onClick={(e) => e.stopPropagation()}
            />
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          {projects.map((p) => (
            <MenuItem
              key={p.id}
              onClick={(e) => e.stopPropagation()}
              sx={{
                py: 1.25,
                px: 2,
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showAllProjects || selectedProjects.has(p.id)}
                      onChange={(e) => onProjectToggle(p.id, e.target.checked)}
                      disabled={showAllProjects}
                      sx={{
                        "&.Mui-checked": {
                          color: "primary.main",
                        },
                      }}
                    />
                  }
                  label={
                    <Typography
                      variant="body2"
                      sx={{
                        color: showAllProjects || selectedProjects.has(p.id) ? "primary.main" : "text.primary",
                        fontWeight: showAllProjects || selectedProjects.has(p.id) ? 500 : 400,
                      }}
                    >
                      {p.name}
                    </Typography>
                  }
                  onClick={(e) => e.stopPropagation()}
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditProject(p);
                    onMenuClose();
                  }}
                  sx={{
                    ml: 1,
                    "&:hover": {
                      bgcolor: "action.selected",
                    },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            </MenuItem>
          ))}
          <Divider sx={{ my: 0.5 }} />
          <MenuItem
            onClick={() => {
              onAddProject();
              onMenuClose();
            }}
            sx={{
              py: 1.5,
              px: 2,
              "&:hover": {
                bgcolor: "primary.light",
                "& .MuiTypography-root": {
                  color: "primary.contrastText",
                },
                "& .MuiSvgIcon-root": {
                  color: "primary.contrastText",
                },
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <AddIcon fontSize="small" sx={{ color: "primary.main" }} />
              <Typography variant="body2" fontWeight={500} sx={{ color: "primary.main" }}>
                Add new project
              </Typography>
            </Box>
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  );
}

