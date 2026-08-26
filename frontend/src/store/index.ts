import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/auth.slice';
import { employeeSelectionReducer } from './employeeSelection/employeeSelectionSlice';
import { organizationTypeSelectionReducer } from './organizationTypeSelection/organizationTypeSelectionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    employeeSelection: employeeSelectionReducer,
    organizationTypeSelection: organizationTypeSelectionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
