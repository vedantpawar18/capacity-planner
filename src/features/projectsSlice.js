// src/features/projectsSlice.js
import { createSlice, nanoid } from "@reduxjs/toolkit";
import { formatDDMMYYYY } from "../utils/dateUtils";

const today = new Date();
const addMonths = (base, offset) => {
  const d = new Date(base);
  d.setMonth(d.getMonth() + offset);
  return d;
};

const LOCATIONS = ["Pune", "Noida", "Bangalore", "Chennai", "Hyderabad"];

// Billing role titles (updated per your request)
export const BILLING_ROLES = [
  "Lead Senior Engineer - Mobile Dev",
  "Mid Level Engineer - Mobile Dev",
  "Senior Engineer - Mobile Dev",
  "Senior Quality Engineer",
  // fallback roles to keep some variety
  "Backend Engineer",
  "Frontend Engineer",
];

// Convert YYYY-MM-DD to DD/MM/YYYY
const convertDateFormat = (dateStr) => {
  if (!dateStr) return "";
  const [yyyy, mm, dd] = dateStr.split("-");
  return `${dd}/${mm}/${yyyy}`;
};

// Extract pod number from "POD1", "POD2", etc.
const extractPodNumber = (podStr) => {
  if (!podStr) return 1;
  const match = podStr.match(/POD(\d+)/i);
  return match ? parseInt(match[1], 10) : 1;
};

// Transform JSON data to app format
const transformProjectsFromJSON = (jsonData) => {
  const projects = [];
  
  jsonData.projects.forEach((projectData, projectIndex) => {
    const members = [];
    const leaves = {};
    let earliestStart = null;
    let latestEnd = null;
    const podSet = new Set();
    
    projectData.members.forEach((memberData, memberIndex) => {
      const memberId = nanoid();
      const podNumber = extractPodNumber(memberData.pod);
      podSet.add(podNumber);
      
      // Convert dates
      const startDate = convertDateFormat(memberData.startDate);
      const endDate = convertDateFormat(memberData.endDate);
      
      // Track project dates
      const startDateObj = new Date(memberData.startDate);
      const endDateObj = new Date(memberData.endDate);
      
      if (!earliestStart || startDateObj < earliestStart) {
        earliestStart = startDateObj;
      }
      if (!latestEnd || endDateObj > latestEnd) {
        latestEnd = endDateObj;
      }
      
      const member = {
        id: memberId,
        name: memberData.name,
        role: memberData.role,
        code: `EMP-${projectIndex + 1}-${String(memberIndex + 1).padStart(3, "0")}`,
        startDate,
        endDate,
        pod: podNumber,
        location: memberData.location || "Pune",
      };
      
      members.push(member);
      leaves[memberId] = {};
    });
    
    // Determine pod count and create pod names
    const podCount = Math.max(1, Math.max(...Array.from(podSet)));
    const podNames = {};
    for (let i = 1; i <= podCount; i++) {
      podNames[i] = `POD${i}`;
    }
    
    // Calculate project dates
    const projectStartDate = earliestStart ? formatDDMMYYYY(earliestStart) : formatDDMMYYYY(today);
    const projectEndDate = latestEnd ? formatDDMMYYYY(latestEnd) : formatDDMMYYYY(addMonths(today, 3));
    
    projects.push({
      id: `p-${projectIndex + 1}`,
      name: projectData.projectName,
      startDate: projectStartDate,
      endDate: projectEndDate,
      podCount,
      podNames,
      members,
      leaves,
    });
  });
  
  return projects;
};

// Import the JSON data
const jsonData = {
  "projects": [
    {
      "projectName": "FIS Agile Coaching-Cap. Market",
      "members": [
        {
          "name": "Kumar Antash",
          "role": "Agile Coach",
          "startDate": "2025-03-10",
          "endDate": "2026-06-30",
          "pod": "POD1",
          "location": "Bangalore"
        },
        {
          "name": "Abhishek Sinha",
          "role": "Agile Coach",
          "startDate": "2025-03-10",
          "endDate": "2026-06-30",
          "pod": "POD1",
          "location": "Bangalore"
        }
      ]
    },
    {
      "projectName": "Beacon United-API&Micro",
      "members": [
        {
          "name": "Govind Saini",
          "role": "Lead Senior Engineer - API Dev",
          "startDate": "2025-08-11",
          "endDate": "2026-08-31",
          "pod": "POD1",
          "location": "Noida"
        },
        {
          "name": "Abhishek *",
          "role": "Senior Engineer - API Dev",
          "startDate": "2025-08-11",
          "endDate": "2026-07-31",
          "pod": "POD1",
          "location": "Noida"
        },
        {
          "name": "Sandhyalakshmi Birudukota",
          "role": "Mid Level Engineer - API Dev",
          "startDate": "2025-08-11",
          "endDate": "2026-07-31",
          "pod": "POD1",
          "location": "Hyderabad"
        },
        {
          "name": "Pasavala Narendra",
          "role": "Mid Level Engineer - API Dev",
          "startDate": "2025-08-11",
          "endDate": "2026-02-28",
          "pod": "POD1",
          "location": "Bangalore"
        },
        {
          "name": "Suprava",
          "role": "Mid Level Engineer - API Dev",
          "startDate": "2025-08-11",
          "endDate": "2026-08-31",
          "pod": "POD1",
          "location": "Noida"
        },
        {
          "name": "Manish Dangwal",
          "role": "Senior QE - API",
          "startDate": "2025-08-11",
          "endDate": "2026-05-31",
          "pod": "POD1",
          "location": "Bangalore"
        },
        {
          "name": "Sumit Kumar",
          "role": "Senior Engineer - API Dev",
          "startDate": "2025-08-11",
          "endDate": "2026-08-31",
          "pod": "POD2",
          "location": "Pune"
        },
        {
          "name": "Utsav Tayde",
          "role": "Mid Level Engineer - API Dev",
          "startDate": "2025-09-23",
          "endDate": "2026-05-31",
          "pod": "POD2",
          "location": "Pune"
        },
        {
          "name": "Vedant Pawar",
          "role": "Mid Level Engineer - API Dev",
          "startDate": "2025-08-11",
          "endDate": "2026-05-31",
          "pod": "POD2",
          "location": "Pune"
        },
        {
          "name": "Aruna Dhanapal",
          "role": "Senior QE - API",
          "startDate": "2025-09-23",
          "endDate": "2026-05-31",
          "pod": "POD2",
          "location": "Chennai"
        },
        {
          "name": "Nitish Kumar",
          "role": "Senior Engineer - API Dev",
          "startDate": "2025-09-23",
          "endDate": "2026-02-28",
          "pod": "POD3",
          "location": "Noida"
        },
        {
          "name": "Neha B J",
          "role": "Mid Level Engineer - API Dev",
          "startDate": "2025-10-13",
          "endDate": "2026-05-31",
          "pod": "POD3",
          "location": "Bangalore"
        }
      ]
    },
    {
      "projectName": "Business Hub Web Eng-Wintrust",
      "members": [
        {
          "name": "Tanuraj Shaktawat",
          "role": "Senior Engineer - API Dev",
          "startDate": "2025-09-15",
          "endDate": "2026-02-28",
          "pod": "POD1",
          "location": "Pune"
        },
        {
          "name": "Arun Nagar",
          "role": "Senior Engineer - Web Dev",
          "startDate": "2025-10-27",
          "endDate": "2026-02-28",
          "pod": "POD1",
          "location": "Noida"
        },
        {
          "name": "D V Yogesh",
          "role": "Mid Level Engineer - Web Dev",
          "startDate": "2025-09-24",
          "endDate": "2026-02-28",
          "pod": "POD1",
          "location": "Bangalore"
        },
        {
          "name": "Chandni Rani",
          "role": "Mid Level Engineer - Web Dev",
          "startDate": "2025-12-02",
          "endDate": "2026-02-28",
          "pod": "POD1",
          "location": "Noida"
        }
      ]
    },
    {
      "projectName": "BHub - Integrations",
      "members": [
        {
          "name": "Geeta Padwal",
          "role": "Senior Engineer - API Dev",
          "startDate": "2025-10-29",
          "endDate": "2026-06-30",
          "pod": "POD1",
          "location": "Pune"
        },
        {
          "name": "Sachin Ramteke",
          "role": "Senior Engineer - API Dev",
          "startDate": "2025-10-27",
          "endDate": "2026-06-30",
          "pod": "POD1",
          "location": "Nagpur"
        },
        {
          "name": "Nilotpal Sarkar",
          "role": "Senior Engineer - Web Dev",
          "startDate": "2025-11-03",
          "endDate": "2026-06-30",
          "pod": "POD1",
          "location": "Hyderabad"
        },
        {
          "name": "Selvakumar Krishnamoorthy",
          "role": "Senior Engineer - Web Dev",
          "startDate": "2025-12-02",
          "endDate": "2026-06-30",
          "pod": "POD1",
          "location": "Chennai"
        }
      ]
    },
    {
      "projectName": "D1C Mobile Engineering",
      "members": [
        {
          "name": "Tamil Arasan",
          "role": "Lead Senior Engineer - Mobile Dev",
          "startDate": "2025-09-15",
          "endDate": "2026-02-14",
          "pod": "POD1",
          "location": "Chennai"
        },
        {
          "name": "Rupam Vade",
          "role": "Senior Engineer - Mobile Dev",
          "startDate": "2025-09-15",
          "endDate": "2026-02-14",
          "pod": "POD1",
          "location": "Pune"
        },
        {
          "name": "Rajan Kanaujiya",
          "role": "Senior Engineer - Mobile Dev",
          "startDate": "2025-09-15",
          "endDate": "2026-02-14",
          "pod": "POD1",
          "location": "Noida"
        },
        {
          "name": "Gaurav Jadhav",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-09-15",
          "endDate": "2026-02-14",
          "pod": "POD1",
          "location": "Pune"
        },
        {
          "name": "Ajay More",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-09-15",
          "endDate": "2026-02-14",
          "pod": "POD1",
          "location": "Pune"
        },
        {
          "name": "Akansha",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-09-15",
          "endDate": "2026-02-14",
          "pod": "POD1",
          "location": "Noida"
        },
        {
          "name": "Kunal Poddar",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-09-15",
          "endDate": "2026-02-14",
          "pod": "POD1",
          "location": "Pune"
        },
        {
          "name": "Anuj Kumar Gupta",
          "role": "Senior QE - Mobile",
          "startDate": "2025-09-15",
          "endDate": "2026-02-14",
          "pod": "POD1",
          "location": "Noida"
        },
        {
          "name": "Kumari Rani Dixit",
          "role": "Senior QE - Mobile",
          "startDate": "2025-09-29",
          "endDate": "2026-02-14",
          "pod": "POD1",
          "location": "Noida"
        },
        {
          "name": "sapna devi",
          "role": "Senior Engineer - Mobile Dev",
          "startDate": "2025-09-29",
          "endDate": "2026-02-14",
          "pod": "POD1",
          "location": "Noida"
        }
      ]
    },
    {
      "projectName": "Digital Tech Dev-Project-29095",
      "members": [
        {
          "name": "Kavish Chokshi",
          "role": "Lead Senior Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD1",
          "location": "Pune"
        },
        {
          "name": "Shaikh Mehboob Ali",
          "role": "Senior Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD1",
          "location": "Bangalore"
        },
        {
          "name": "Sapna Devi",
          "role": "Senior Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD1",
          "location": "Chennai"
        },
        {
          "name": "Sonali Chauhan",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD1",
          "location": "Bangalore"
        },
        {
          "name": "Aditya Jha",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD1",
          "location": "Noida"
        },
        {
          "name": "Ganesh Raut",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD1",
          "location": "Pune"
        },
        {
          "name": "Md Akhtar",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD1",
          "location": "Noida"
        },
        {
          "name": "Anil Kumar R",
          "role": "Senior Quality Engineer",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD1",
          "location": "Bangalore"
        },
        {
          "name": "Mallikarjuna Dadireddy",
          "role": "Senior Quality Engineer",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD1",
          "location": "Bangalore"
        },
        {
          "name": "Vishal Singh",
          "role": "Lead Senior Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD2",
          "location": "Noida"
        },
        {
          "name": "Sivakumar M",
          "role": "Senior Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD2",
          "location": "Chennai"
        },
        {
          "name": "Sanjeev Kumar",
          "role": "Senior Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD2",
          "location": "Noida"
        },
        {
          "name": "Prabhjot Kaur",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-09",
          "pod": "POD2",
          "location": "Noida"
        },
        {
          "name": "Sunaina Gupta",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD2",
          "location": "Noida"
        },
        {
          "name": "Anil Kumar",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2025-12-12",
          "pod": "POD2",
          "location": "Noida"
        },
        {
          "name": "Bharat Joshi",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2025-12-16",
          "pod": "POD2",
          "location": "Noida"
        },
        {
          "name": "Srikant m Konded",
          "role": "Senior Quality Engineer",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD2",
          "location": "Bangalore"
        },
        {
          "name": "Sahil Tandon",
          "role": "Senior Quality Engineer",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD2",
          "location": "Bangalore"
        },
        {
          "name": "Anchal Mulchandani",
          "role": "Lead Senior Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD3",
          "location": "Pune"
        },
        {
          "name": "Soumyaranjan Purohit",
          "role": "Senior Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD3",
          "location": "Noida"
        },
        {
          "name": "Anuj Agrawal",
          "role": "Senior Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD3",
          "location": "Noida"
        },
        {
          "name": "Aatka Ahsan",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD3",
          "location": "Noida"
        },
        {
          "name": "Govardhan Sutar",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD3",
          "location": "Bangalore"
        },
        {
          "name": "Arpit Singh",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD3",
          "location": "Noida"
        },
        {
          "name": "Imran Siddiqui",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD3",
          "location": "Noida"
        },
        {
          "name": "Prajakta Arvind Kahar",
          "role": "Senior Quality Engineer",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD3",
          "location": "Pune"
        },
        {
          "name": "Yogendra Burkul",
          "role": "Senior Quality Engineer",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD3",
          "location": "Pune"
        },
        {
          "name": "Manjunath H S",
          "role": "Lead Senior Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD4",
          "location": "Bangalore"
        },
        {
          "name": "Daxesh Panchal",
          "role": "Senior Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD4",
          "location": "Pune"
        },
        {
          "name": "Deepak Kumar",
          "role": "Senior Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD4",
          "location": "Noida"
        },
        {
          "name": "Shravan Bhuyar",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD4",
          "location": "Pune"
        },
        {
          "name": "Deepak R Kumar",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD4",
          "location": "Noida"
        },
        {
          "name": "Sumedh Dhakre",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD4",
          "location": "Pune"
        },
        {
          "name": "Nandkishore Shinde",
          "role": "Mid Level Engineer - Mobile Dev",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD4",
          "location": "Pune"
        },
        {
          "name": "Madhvi Kumari",
          "role": "Senior Quality Engineer",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD4",
          "location": "Bangalore"
        },
        {
          "name": "Rishabh Srivastava",
          "role": "Senior Quality Engineer",
          "startDate": "2025-03-01",
          "endDate": "2026-01-31",
          "pod": "POD4",
          "location": "Noida"
        }
      ]
    }
  ]
};

const initialProjects = transformProjectsFromJSON(jsonData);

const projectsSlice = createSlice({
  name: "projects",
  initialState: {
    projects: initialProjects,
    selectedProjectId: initialProjects[0]?.id || null,
  },
  reducers: {
    selectProject(state, action) {
      state.selectedProjectId = action.payload;
    },
    addProject: {
      reducer(state, action) {
        state.projects.push(action.payload);
      },
      prepare({ name, startDate, endDate, podCount = 3, podNames }) {
        const effectivePodCount = Math.max(1, Number(podCount) || 1);
        const defaultPodNames = {};
        for (let i = 1; i <= effectivePodCount; i++) {
          defaultPodNames[i] = String(i);
        }
        return {
          payload: {
            id: nanoid(),
            name,
            startDate,
            endDate,
            podCount: effectivePodCount,
            podNames: podNames || defaultPodNames,
            members: [],
            leaves: {},
          },
        };
      },
    },
    addMember: {
      reducer(state, action) {
        const { projectId, member } = action.payload;
        const project = state.projects.find((p) => p.id === projectId);
        if (project) {
          if (!member.endDate) member.endDate = project.endDate;
          if (!member.location) member.location = "Pune";
          project.members.push(member);
          if (!project.leaves[member.id]) project.leaves[member.id] = {};
        }
      },
      prepare({ projectId, name, role, code, startDate, endDate, pod, location }) {
        return {
          payload: {
            projectId,
            member: {
              id: nanoid(),
              name,
              role,
              code,
              startDate,
              endDate,
              pod,
              location,
            },
          },
        };
      },
    },
    updateMember(state, action) {
      const { projectId, memberId, updates } = action.payload;
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) return;
      const member = project.members.find((m) => m.id === memberId);
      if (member) {
        Object.assign(member, updates);
        if (!member.endDate) member.endDate = project.endDate;
      }
    },
    updateProject(state, action) {
      const { projectId, updates } = action.payload;
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) return;

      const previousEndDate = project.endDate;
      Object.assign(project, updates);

      // Ensure pod metadata is sane
      if (!project.podCount || project.podCount < 1) {
        project.podCount = 1;
      }
      if (!project.podNames) {
        const names = {};
        for (let i = 1; i <= project.podCount; i++) names[i] = String(i);
        project.podNames = names;
      }

      // If project end date changed, update all member end dates to match
      if (updates.endDate && updates.endDate !== previousEndDate) {
        project.members.forEach((m) => {
          m.endDate = updates.endDate;
        });
      }
    },
    deleteMember(state, action) {
      const { projectId, memberId } = action.payload;
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) return;
      project.members = project.members.filter((m) => m.id !== memberId);
      delete project.leaves[memberId];
    },
    setLeaveForMember(state, action) {
      const { projectId, memberId, date, value } = action.payload;
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) return;
      if (!project.leaves[memberId]) project.leaves[memberId] = {};
      if (value === null || value === "") delete project.leaves[memberId][date];
      else project.leaves[memberId][date] = Number(value);
    },
    bulkAddMembers(state, action) {
      const { projectId, members } = action.payload;
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) return;
      members.forEach((m) => {
        const mm = {
          id: nanoid(),
          name: m.name,
          role: m.role || "Backend Engineer",
          code: m.code || `EMP-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          startDate: m.startDate || project.startDate,
          endDate: m.endDate || project.endDate,
          pod: Number(m.pod || 1),
          location: m.location || "Pune",
        };
        project.members.push(mm);
        project.leaves[mm.id] = {};
      });
    },
    moveMember(state, action) {
      const { memberId, fromProjectId, toProjectId } = action.payload;
      const fromProject = state.projects.find((p) => p.id === fromProjectId);
      const toProject = state.projects.find((p) => p.id === toProjectId);
      if (!fromProject || !toProject || fromProjectId === toProjectId) return;
      
      const member = fromProject.members.find((m) => m.id === memberId);
      if (!member) return;
      
      // Remove member from source project
      fromProject.members = fromProject.members.filter((m) => m.id !== memberId);
      const memberLeaves = fromProject.leaves[memberId] || {};
      delete fromProject.leaves[memberId];
      
      // Add member to target project
      const updatedMember = { ...member };
      if (!updatedMember.endDate) updatedMember.endDate = toProject.endDate;
      toProject.members.push(updatedMember);
      toProject.leaves[memberId] = memberLeaves;
    },
    replaceAllProjects(state, action) {
      state.projects = action.payload;
      // Select first project if available
      state.selectedProjectId = action.payload.length > 0 ? action.payload[0].id : null;
    },
  },
});

export const {
  selectProject,
  addProject,
  addMember,
  updateMember,
  deleteMember,
  setLeaveForMember,
  bulkAddMembers,
  updateProject,
  moveMember,
  replaceAllProjects,
} = projectsSlice.actions;

export const selectProjectsState = (state) => state.projects;
export const selectSelectedProject = (state) =>
  state.projects.projects.find((p) => p.id === state.projects.selectedProjectId) || null;

export default projectsSlice.reducer;
