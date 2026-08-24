import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/auth.slice';
import { organizationTypeSelectionReducer } from './organizationTypeSelection/organizationTypeSelectionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    organizationTypeSelection: organizationTypeSelectionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
