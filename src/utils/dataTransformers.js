/**
 * Data transformation utilities
 * Handles conversion between API format and application format
 */

import { nanoid } from "@reduxjs/toolkit";
import { formatDDMMYYYY } from "./dateUtils";

/**
 * Convert YYYY-MM-DD to DD/MM/YYYY
 */
export const convertDateFormat = (dateStr) => {
  if (!dateStr) return "";
  const [yyyy, mm, dd] = dateStr.split("-");
  return `${dd}/${mm}/${yyyy}`;
};

/**
 * Extract pod number from "POD1", "POD2", etc.
 */
export const extractPodNumber = (podStr) => {
  if (!podStr) return 1;
  const match = podStr.match(/POD(\d+)/i);
  return match ? parseInt(match[1], 10) : 1;
};

/**
 * Transform project data from API/JSON format to application format
 */
export const transformProjectFromAPI = (projectData, projectIndex = 0) => {
  const members = [];
  const leaves = {};
  let earliestStart = null;
  let latestEnd = null;
  const podSet = new Set();
  
  projectData.members?.forEach((memberData, memberIndex) => {
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
  const podCount = Math.max(1, Math.max(...Array.from(podSet), 1));
  const podNames = {};
  for (let i = 1; i <= podCount; i++) {
    podNames[i] = `POD${i}`;
  }
  
  // Calculate project dates
  const today = new Date();
  const addMonths = (base, offset) => {
    const d = new Date(base);
    d.setMonth(d.getMonth() + offset);
    return d;
  };
  
  const projectStartDate = earliestStart ? formatDDMMYYYY(earliestStart) : formatDDMMYYYY(today);
  const projectEndDate = latestEnd ? formatDDMMYYYY(latestEnd) : formatDDMMYYYY(addMonths(today, 3));
  
  return {
    id: projectData.id || `p-${projectIndex + 1}`,
    name: projectData.projectName || projectData.name,
    startDate: projectStartDate,
    endDate: projectEndDate,
    podCount,
    podNames,
    members,
    leaves,
    buffer: projectData.buffer ?? 2,
    discount: projectData.discount ?? 0,
  };
};

/**
 * Transform multiple projects from API format
 */
export const transformProjectsFromAPI = (projectsData) => {
  if (!Array.isArray(projectsData)) return [];
  return projectsData.map((projectData, index) => transformProjectFromAPI(projectData, index));
};

/**
 * Transform project to API format
 */
export const transformProjectToAPI = (project) => {
  return {
    id: project.id,
    name: project.name,
    startDate: project.startDate,
    endDate: project.endDate,
    podCount: project.podCount,
    podNames: project.podNames,
    buffer: project.buffer,
    discount: project.discount,
    members: project.members.map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      code: member.code,
      startDate: member.startDate,
      endDate: member.endDate,
      pod: `POD${member.pod}`,
      location: member.location,
    })),
    leaves: project.leaves,
  };
};

/**
 * Transform member to API format
 */
export const transformMemberToAPI = (member) => {
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    code: member.code,
    startDate: member.startDate,
    endDate: member.endDate,
    pod: `POD${member.pod}`,
    location: member.location,
  };
};

/**
 * Transform holiday to API format
 */
export const transformHolidayToAPI = (holiday) => {
  return {
    id: holiday.id,
    date: holiday.date,
    name: holiday.name,
  };
};
