import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const EMPLOYEE_CHECKED_FIELD = 'employee_checked' as const;

interface EmployeeSelectionState {
  field: typeof EMPLOYEE_CHECKED_FIELD;
  value: string[];
}

const initialState: EmployeeSelectionState = {
  field: EMPLOYEE_CHECKED_FIELD,
  value: [],
};

const employeeSelectionSlice = createSlice({
  name: 'employeeSelection',
  initialState,
  reducers: {
    setEmployeeCheckedIds(state, action: PayloadAction<string[]>) {
      state.value = Array.from(new Set(action.payload));
    },
    clearEmployeeCheckedIds(state) {
      state.value = [];
    },
  },
});

export const { setEmployeeCheckedIds, clearEmployeeCheckedIds } = employeeSelectionSlice.actions;
export const employeeSelectionReducer = employeeSelectionSlice.reducer;
