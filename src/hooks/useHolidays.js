/**
 * Custom hook for holiday operations
 */

import { useSelector, useDispatch } from 'react-redux';
import {
  selectLocation,
  addHoliday as addHolidayAction,
  deleteHoliday as deleteHolidayAction,
  updateHoliday as updateHolidayAction,
  setHolidays as setHolidaysAction,
} from '../features/holidaysSlice';
import * as holidaysService from '../services/holidaysService';

/**
 * Hook for managing holidays
 */
export const useHolidays = () => {
  const dispatch = useDispatch();
  const holidaysState = useSelector((state) => state.holidays);
  const { byLocation, selectedLocation } = holidaysState;

  const selectLocationByName = (location) => {
    dispatch(selectLocation(location));
  };

  const createHoliday = async (holidayData) => {
    const result = await holidaysService.addHoliday(holidayData);
    dispatch(addHolidayAction(result));
  };

  const updateHolidayById = async (holidayId, location, updates) => {
    await holidaysService.updateHoliday(holidayId, updates);
    dispatch(updateHolidayAction({ location, id: holidayId, ...updates }));
  };

  const removeHoliday = async (holidayId, location) => {
    await holidaysService.deleteHoliday(holidayId);
    dispatch(deleteHolidayAction({ location, id: holidayId }));
  };

  const setHolidaysForLocation = async (location, holidays) => {
    await holidaysService.setHolidaysForLocation(location, holidays);
    dispatch(setHolidaysAction({ location, holidays }));
  };

  return {
    holidaysByLocation: byLocation,
    selectedLocation,
    selectLocation: selectLocationByName,
    addHoliday: createHoliday,
    updateHoliday: updateHolidayById,
    deleteHoliday: removeHoliday,
    setHolidays: setHolidaysForLocation,
  };
};
