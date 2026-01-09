import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/authSlice";
import projectsReducer from "./features/projectsSlice";
import holidaysReducer from "./features/holidaysSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    holidays: holidaysReducer,
  },
});
