import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export type SnackbarSeverity = 'success' | 'warning' | 'info' | 'error';

export interface OpenSnackbarPayload {
  message: string,
  severity?: SnackbarSeverity;
};

export interface IUIState {
  isLoading: boolean,
  title: string,
  loadingText: string,
  snackbar: {
    open: boolean,
    message: string,
    severity: SnackbarSeverity,
  },
}

const initialState: IUIState = {
  isLoading: false,
  title: 'SKLEC Spatial-temporal Data Visualization',
  loadingText: '',
  snackbar: {
    open: false,
    message: '',
    severity: 'info',
  },
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState: initialState,
  reducers: {
    openSnackbar(state: IUIState, action: PayloadAction<OpenSnackbarPayload>) {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity,
      };
    },
    dismissSnackbar(state: IUIState) {
      state.snackbar.open = false;
    },
    setTitle(state: IUIState, action: PayloadAction<string>) {
      state.title = action.payload;
    },
    beginLoading(state: IUIState, action: PayloadAction<| string>) {
      state.isLoading = true;
      state.loadingText = action.payload || '';
    },
    endLoading(state: IUIState) {
      state.isLoading = false;
      state.loadingText = '';
    },
  },
});
