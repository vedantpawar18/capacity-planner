/**
 * Centralized constants
 * All application constants in one place
 */

export const LOCATIONS = ["Pune", "Noida", "Bangalore", "Chennai", "Hyderabad"];

export const ROLE_OPTIONS = [
  "Backend Engineer",
  "Frontend Engineer",
  "Fullstack Engineer",
  "QA Engineer",
  "Business Analyst",
  "Project Manager",
  "Scrum Master",
];

// Billing role titles
export const BILLING_ROLES = [
  "Lead Senior Engineer - Mobile Dev",
  "Mid Level Engineer - Mobile Dev",
  "Senior Engineer - Mobile Dev",
  "Senior Quality Engineer",
  "Backend Engineer",
  "Frontend Engineer",
];

// Month labels
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Date column width for leaves table
export const DATE_COL_WIDTH = 64;

// Default buffer and discount
export const DEFAULT_BUFFER = 2;
export const DEFAULT_DISCOUNT = 0;

// Default hourly rates by role
export const BASE_RATE_BY_ROLE = new Map([
  ["Lead Senior Engineer - Mobile Dev", 20],
  ["Mid Level Engineer - Mobile Dev", 10],
  ["Senior Engineer - Mobile Dev", 15],
  ["Senior Quality Engineer", 15],
  ["Backend Engineer", 18],
  ["Frontend Engineer", 17],
]);
