import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const ORGANIZATION_TYPE_CHECKED_FIELD = 'organization_type_checked' as const;

interface OrganizationTypeSelectionState {
  field: typeof ORGANIZATION_TYPE_CHECKED_FIELD;
  value: string[];
}

const initialState: OrganizationTypeSelectionState = {
  field: ORGANIZATION_TYPE_CHECKED_FIELD,
  value: [],
};

const organizationTypeSelectionSlice = createSlice({
  name: 'organizationTypeSelection',
  initialState,
  reducers: {
    setOrganizationTypeCheckedIds(state, action: PayloadAction<string[]>) {
      state.value = Array.from(new Set(action.payload));
    },
    clearOrganizationTypeCheckedIds(state) {
      state.value = [];
    },
  },
});

export const { setOrganizationTypeCheckedIds, clearOrganizationTypeCheckedIds } = organizationTypeSelectionSlice.actions;
export const organizationTypeSelectionReducer = organizationTypeSelectionSlice.reducer;
