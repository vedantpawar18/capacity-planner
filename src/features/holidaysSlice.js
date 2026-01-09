// src/features/holidaysSlice.js
import { createSlice, nanoid } from "@reduxjs/toolkit";

// Helper function to create date string in DD/MM/YYYY format for year 2026
const createHolidayDate2026 = (day, month) => {
  const year = 2026;
  const dayStr = String(day).padStart(2, "0");
  const monthStr = String(month).padStart(2, "0");
  return `${dayStr}/${monthStr}/${year}`;
};

// default holidays per location for calendar year 2026
const DEFAULTS = {
  Noida: [
    { id: nanoid(), date: createHolidayDate2026(1, 1), name: "New Year's Day" },
    { id: nanoid(), date: createHolidayDate2026(26, 1), name: "Republic Day" },
    { id: nanoid(), date: createHolidayDate2026(4, 3), name: "Holi" },
    { id: nanoid(), date: createHolidayDate2026(27, 5), name: "Eid al Adha" },
    { id: nanoid(), date: createHolidayDate2026(28, 8), name: "Raksha Bandhan" },
    { id: nanoid(), date: createHolidayDate2026(14, 9), name: "Vinayaka Chavithi" },
    { id: nanoid(), date: createHolidayDate2026(2, 10), name: "Gandhi Jayanthi" },
    { id: nanoid(), date: createHolidayDate2026(20, 10), name: "Vijaya Dashami/ Dussehra" },
    { id: nanoid(), date: createHolidayDate2026(24, 11), name: "Gur Nanak Dev Jayanthi" },
    { id: nanoid(), date: createHolidayDate2026(25, 12), name: "Christmas" },
  ],
  Pune: [
    { id: nanoid(), date: createHolidayDate2026(1, 1), name: "New Year's Day" },
    { id: nanoid(), date: createHolidayDate2026(26, 1), name: "Republic Day" },
    { id: nanoid(), date: createHolidayDate2026(4, 3), name: "Holi" },
    { id: nanoid(), date: createHolidayDate2026(19, 3), name: "Ugadi/Gudi Padwa" },
    { id: nanoid(), date: createHolidayDate2026(1, 5), name: "Maharashtra Day/May Day" },
    { id: nanoid(), date: createHolidayDate2026(27, 5), name: "Eid al Adha" },
    { id: nanoid(), date: createHolidayDate2026(14, 9), name: "Ganesh Chaturthi" },
    { id: nanoid(), date: createHolidayDate2026(2, 10), name: "Gandhi Jayanthi" },
    { id: nanoid(), date: createHolidayDate2026(20, 10), name: "Vijaya Dashami" },
    { id: nanoid(), date: createHolidayDate2026(25, 12), name: "Christmas" },
  ],
  Bangalore: [
    { id: nanoid(), date: createHolidayDate2026(1, 1), name: "New Year's Day" },
    { id: nanoid(), date: createHolidayDate2026(15, 1), name: "Sankranti / Pongal" },
    { id: nanoid(), date: createHolidayDate2026(26, 1), name: "Republic Day" },
    { id: nanoid(), date: createHolidayDate2026(19, 3), name: "Ugadi" },
    { id: nanoid(), date: createHolidayDate2026(1, 5), name: "May Day" },
    { id: nanoid(), date: createHolidayDate2026(27, 5), name: "Eid al Adha" },
    { id: nanoid(), date: createHolidayDate2026(14, 9), name: "Ganesh Chaturthi" },
    { id: nanoid(), date: createHolidayDate2026(2, 10), name: "Gandhi Jayanthi" },
    { id: nanoid(), date: createHolidayDate2026(20, 10), name: "Vijaya Dashami" },
    { id: nanoid(), date: createHolidayDate2026(25, 12), name: "Christmas" },
  ],
  Chennai: [
    { id: nanoid(), date: createHolidayDate2026(1, 1), name: "New Year's Day" },
    { id: nanoid(), date: createHolidayDate2026(15, 1), name: "Makar Sankranti / Pongal" },
    { id: nanoid(), date: createHolidayDate2026(26, 1), name: "Republic Day" },
    { id: nanoid(), date: createHolidayDate2026(14, 4), name: "Tamil New Year Day" },
    { id: nanoid(), date: createHolidayDate2026(1, 5), name: "May Day" },
    { id: nanoid(), date: createHolidayDate2026(27, 5), name: "Eid al Adha" },
    { id: nanoid(), date: createHolidayDate2026(14, 9), name: "Vinayakar Chathurthi" },
    { id: nanoid(), date: createHolidayDate2026(2, 10), name: "Gandhi Jayanthi" },
    { id: nanoid(), date: createHolidayDate2026(20, 10), name: "Vijaya Dasami" },
    { id: nanoid(), date: createHolidayDate2026(25, 12), name: "Christmas" },
  ],
  Hyderabad: [
    { id: nanoid(), date: createHolidayDate2026(1, 1), name: "New Year's Day" },
    { id: nanoid(), date: createHolidayDate2026(15, 1), name: "Sankranti / Pongal" },
    { id: nanoid(), date: createHolidayDate2026(26, 1), name: "Republic Day" },
    { id: nanoid(), date: createHolidayDate2026(1, 5), name: "May Day" },
    { id: nanoid(), date: createHolidayDate2026(27, 5), name: "Eid al Adha" },
    { id: nanoid(), date: createHolidayDate2026(2, 6), name: "Telangana Formation Day" },
    { id: nanoid(), date: createHolidayDate2026(14, 9), name: "Vinayaka Chathurthi" },
    { id: nanoid(), date: createHolidayDate2026(2, 10), name: "Gandhi Jayanthi" },
    { id: nanoid(), date: createHolidayDate2026(20, 10), name: "Vijaya Dasami" },
    { id: nanoid(), date: createHolidayDate2026(25, 12), name: "Christmas" },
  ],
};

const holidaysSlice = createSlice({
  name: "holidays",
  initialState: {
    byLocation: DEFAULTS,
    selectedLocation: "Pune",
  },
  reducers: {
    selectLocation(state, action) {
      state.selectedLocation = action.payload;
    },
    addHoliday(state, action) {
      const { location, date, name } = action.payload;
      if (!state.byLocation[location]) state.byLocation[location] = [];
      // Prevent multiple entries for the same date at the same location
      const exists = state.byLocation[location].some((h) => h.date === date);
      if (!exists) {
        state.byLocation[location].push({ id: nanoid(), date, name });
      }
    },
    deleteHoliday(state, action) {
      const { location, id } = action.payload;
      if (!state.byLocation[location]) return;
      state.byLocation[location] = state.byLocation[location].filter(
        (h) => h.id !== id
      );
    },
    updateHoliday(state, action) {
      const { location, id, date, name } = action.payload;
      if (!state.byLocation[location]) return;
      const holiday = state.byLocation[location].find((h) => h.id === id);
      if (holiday) {
        if (date !== undefined) holiday.date = date;
        if (name !== undefined) holiday.name = name;
      }
    },
    setHolidays(state, action) {
      const { location, holidays } = action.payload;
      state.byLocation[location] = holidays;
    },
  },
});

export const { selectLocation, addHoliday, deleteHoliday, updateHoliday, setHolidays } =
  holidaysSlice.actions;
export default holidaysSlice.reducer;
