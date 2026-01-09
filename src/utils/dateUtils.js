export const parseDDMMYYYY = (str) => {
  if (!str) return null;
  const [dd, mm, yyyy] = str.split("/").map((p) => parseInt(p, 10));
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
};

export const formatDDMMYYYY = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const generateDateRange = (startStr, endStr) => {
  const start = parseDDMMYYYY(startStr);
  const end = parseDDMMYYYY(endStr);
  if (!start || !end || start > end) return [];
  const dates = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
};

export const isWeekend = (date) => {
  const d = date.getDay();
  return d === 0 || d === 6;
};
