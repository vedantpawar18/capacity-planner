// src/pages/DashboardPage.js
import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import { useSelector, useDispatch } from "react-redux";
import {
  selectProjectsState,
  selectSelectedProject,
  selectProject,
  addProject,
  addMember,
  updateMember,
  deleteMember,
  bulkAddMembers,
  updateProject,
  moveMember,
} from "../features/projectsSlice";
import ProjectDialog from "../components/ProjectDialog";
import MemberDialog from "../components/MemberDialog";
import ImportMembersDialog from "../components/ImportMembersDialog";
import ProjectSelectionMenu from "../components/ProjectSelectionMenu";
import ProjectInfoChips from "../components/ProjectInfoChips";
import DashboardActionButtons from "../components/DashboardActionButtons";
import MemberTable from "../components/MemberTable";
import UserDetailsModal from "../components/UserDetailsModal";

export default function DashboardPage() {
  const { projects } = useSelector(selectProjectsState);
  const reduxSelectedProject = useSelector(selectSelectedProject);
  const dispatch = useDispatch();
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedMemberForModal, setSelectedMemberForModal] = useState(null);

  // Checkbox-based project selection - sync with Redux selected project
  const [selectedProjects, setSelectedProjects] = useState(new Set());
  const [showAllProjects, setShowAllProjects] = useState(true);
  const [projectMenuAnchor, setProjectMenuAnchor] = useState(null);

  // Sync local state with Redux selected project when component mounts or Redux state changes
  // Only sync if Redux has a selected project (from navigation), not when it's null (multiple selection)
  useEffect(() => {
    if (reduxSelectedProject) {
      // If there's a selected project in Redux (from navigation), show only that project
      // Only update if it's different from current selection to avoid unnecessary resets
      const currentSelectedId = selectedProjects.size === 1 ? Array.from(selectedProjects)[0] : null;
      if (currentSelectedId !== reduxSelectedProject.id) {
        setShowAllProjects(false);
        setSelectedProjects(new Set([reduxSelectedProject.id]));
      }
    }
    // Don't reset to "All projects" when reduxSelectedProject is null, as that could be from multiple selection
  }, [reduxSelectedProject]);

  // Find which project a member belongs to
  const findMemberProject = (memberId) => {
    return projects.find((p) => p.members.some((m) => m.id === memberId));
  };

  // Get displayed members based on selection
  const displayedMembers = useMemo(() => {
    let membersToShow = [];

    if (showAllProjects) {
      // Show all members from all projects, grouped by project then pod
      projects.forEach((project) => {
        project.members.forEach((member) => {
          membersToShow.push({
            ...member,
            projectId: project.id,
            projectName: project.name,
          });
        });
      });
    } else if (selectedProjects.size > 0) {
      // Show members from selected projects only
      projects.forEach((project) => {
        if (selectedProjects.has(project.id)) {
          project.members.forEach((member) => {
            membersToShow.push({
              ...member,
              projectId: project.id,
              projectName: project.name,
            });
          });
        }
      });
    }

    // Sort: first by project name, then by pod
    return membersToShow.sort((a, b) => {
      if (a.projectName !== b.projectName) {
        return a.projectName.localeCompare(b.projectName);
      }
      return a.pod - b.pod;
    });
  }, [projects, selectedProjects, showAllProjects]);

  // For backward compatibility, keep selectedProject based on first selected project
  const selectedProject = useMemo(() => {
    if (showAllProjects || selectedProjects.size === 0) return null;
    const firstSelectedId = Array.from(selectedProjects)[0];
    return projects.find((p) => p.id === firstSelectedId) || null;
  }, [projects, selectedProjects, showAllProjects]);

  // Check if exactly one project is selected (for showing start/end dates and enabling Add/Import buttons)
  const isSingleProjectSelected = useMemo(() => {
    return !showAllProjects && selectedProjects.size === 1;
  }, [showAllProjects, selectedProjects]);

  const handleAllProjectsToggle = (checked) => {
    setShowAllProjects(checked);
    if (checked) {
      setSelectedProjects(new Set());
      // Clear Redux selection when "All projects" is selected
      dispatch(selectProject(null));
    }
  };

  const handleProjectToggle = (projectId, checked) => {
    if (checked) {
      setShowAllProjects(false);
      // Add to existing selected projects to allow multiple selection
      setSelectedProjects((prev) => {
        const newSelected = new Set([...prev, projectId]);
        // Only update Redux when exactly one project is selected
        // Don't update Redux when multiple projects are selected to avoid triggering useEffect reset
        if (newSelected.size === 1) {
          dispatch(selectProject(projectId));
        }
        return newSelected;
      });
    } else {
      setSelectedProjects((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        // Only update Redux when exactly one project remains or no projects selected
        if (next.size === 0) {
          dispatch(selectProject(null));
        } else if (next.size === 1) {
          // If exactly one project remains, update Redux to that project
          dispatch(selectProject(Array.from(next)[0]));
        }
        // Don't update Redux when multiple projects are still selected
        return next;
      });
    }
  };

  const handleMoveMember = (memberId, fromProjectId, toProjectId) => {
    if (fromProjectId === toProjectId) return;
    dispatch(moveMember({ memberId, fromProjectId, toProjectId }));
  };

  const handleProjectSubmit = (data) => {
    dispatch(addProject(data));
    setProjectDialogOpen(false);
  };

  const handleProjectEditSubmit = (data) => {
    if (!selectedProject) return;
    dispatch(
      updateProject({
        projectId: selectedProject.id,
        updates: data,
      })
    );
    setProjectDialogOpen(false);
    setEditingProject(null);
  };

  const openAddMember = () => {
    setEditingMember(null);
    setMemberDialogOpen(true);
    // If no project selected but "All projects" is on, select first project for adding
    if (!selectedProject && showAllProjects && projects.length > 0) {
      dispatch(selectProject(projects[0].id));
    }
  };

  const handleMemberSubmit = (memberData) => {
    if (!selectedProject && !editingMember) return;
    const targetProjectId = editingMember
      ? findMemberProject(editingMember.id)?.id
      : selectedProject?.id || projects[0]?.id;
    if (!targetProjectId) return;

    if (editingMember) {
      dispatch(
        updateMember({
          projectId: targetProjectId,
          memberId: editingMember.id,
          updates: memberData,
        })
      );
    } else {
      dispatch(addMember({ projectId: targetProjectId, ...memberData }));
    }
    setMemberDialogOpen(false);
    setEditingMember(null);
  };

  const handleEditMember = (m) => {
    setEditingMember(m);
    setMemberDialogOpen(true);
  };

  const handleDeleteMember = (m) => {
    setMemberToDelete(m);
  };

  const confirmDeleteMember = () => {
    if (memberToDelete) {
      const project = findMemberProject(memberToDelete.id);
      if (project) {
        dispatch(
          deleteMember({ projectId: project.id, memberId: memberToDelete.id })
        );
      }
    }
    setMemberToDelete(null);
  };

  const handleImportMembers = (members) => {
    const targetProject = selectedProject || projects[0];
    if (!targetProject) return;
    dispatch(bulkAddMembers({ projectId: targetProject.id, members }));
  };

  return (
    <Box>
      {/* Top project + actions bar */}
      <Card elevation={2}>
        <CardContent>
          <Grid container spacing={2} alignItems="flex-start" justifyContent="space-between">
            <Grid item xs={12} md={7}>
              <Stack direction="row" spacing={2} alignItems="center" mb={1.5}>
                <WorkspacesIcon color="primary" />
                <Box>
                  <Typography variant="h6">Project allocation</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select a project and manage its team members.
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <ProjectSelectionMenu
                  projects={projects}
                  showAllProjects={showAllProjects}
                  selectedProjects={selectedProjects}
                  projectMenuAnchor={projectMenuAnchor}
                  onMenuOpen={(e) => setProjectMenuAnchor(e.currentTarget)}
                  onMenuClose={() => setProjectMenuAnchor(null)}
                  onAllProjectsToggle={handleAllProjectsToggle}
                  onProjectToggle={handleProjectToggle}
                  onEditProject={(p) => {
                    setEditingProject(p);
                    setProjectDialogOpen(true);
                  }}
                  onAddProject={() => {
                    setEditingProject(null);
                    setProjectDialogOpen(true);
                  }}
                />
              </Box>

              <ProjectInfoChips
                displayedMembers={displayedMembers}
                projects={projects}
                showAllProjects={showAllProjects}
                selectedProjects={selectedProjects}
                isSingleProjectSelected={isSingleProjectSelected}
                selectedProject={selectedProject}
              />
            </Grid>

            {/* RIGHT SIDE: Two vertical groups */}
            <Grid item xs={12} md={5}>
              <DashboardActionButtons
                isSm={isSm}
                isSingleProjectSelected={isSingleProjectSelected}
                selectedProject={selectedProject}
                onAddMember={openAddMember}
                onImportMembers={() => setImportDialogOpen(true)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Members table */}
      <MemberTable
        displayedMembers={displayedMembers}
        projects={projects}
        onEditMember={handleEditMember}
        onDeleteMember={handleDeleteMember}
        onMoveMember={handleMoveMember}
        onMemberClick={(m) => {
          setSelectedMemberForModal(m);
          setUserModalOpen(true);
        }}
      />

      {/* Dialogs */}
      <ProjectDialog
        open={projectDialogOpen}
        onClose={() => {
          setProjectDialogOpen(false);
          setEditingProject(null);
        }}
        onSubmit={editingProject ? handleProjectEditSubmit : handleProjectSubmit}
        initialProject={editingProject}
      />
      <MemberDialog
        open={memberDialogOpen}
        onClose={() => {
          setMemberDialogOpen(false);
          setEditingMember(null);
        }}
        onSubmit={handleMemberSubmit}
        initial={editingMember}
        project={
          editingMember
            ? findMemberProject(editingMember.id)
            : selectedProject || projects[0]
        }
      />
      <ImportMembersDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImportMembers}
        project={selectedProject || projects[0]}
      />
      <UserDetailsModal
        open={userModalOpen}
        onClose={() => {
          setUserModalOpen(false);
          setSelectedMemberForModal(null);
        }}
        member={selectedMemberForModal}
        project={
          selectedMemberForModal
            ? findMemberProject(selectedMemberForModal.id)
            : null
        }
      />

      <Dialog
        open={Boolean(memberToDelete)}
        onClose={() => setMemberToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete member</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Are you sure you want to remove <b>{memberToDelete?.name}</b> from{" "}
            <b>
              {findMemberProject(memberToDelete?.id)?.name || "project"}
            </b>
            ?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMemberToDelete(null)}>Cancel</Button>
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            onClick={confirmDeleteMember}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
