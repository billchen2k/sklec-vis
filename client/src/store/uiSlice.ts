import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export type SnackbarSeverity = 'success' | 'warning' | 'info' | 'error';
export type DialogType = 'simple' | 'confirm';

export interface OpenSnackbarPayload {
  message: string,
  severity?: SnackbarSeverity;
};

export interface OpenDialogPayload {
  type: DialogType,
  title: string,
  content: JSX.Element | JSX.Element[] | string,
  cancelText?: string,
  confirmText?: string,
  onConfirm?: () => void,
  onCancel?: () => void,
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
  dialog: {
    open: boolean,
    type: DialogType,
    title: string,
    content: JSX.Element | JSX.Element[] | string,
    cancelText?: string,
    confirmText?: string,
    onConfirm?: () => void,
    onCancel?: () => void,
  }
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
  dialog: {
    open: false,
    type: 'simple',
    title: '',
    content: '',
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
    openDialog(state: IUIState, action: PayloadAction<OpenDialogPayload>) {
      state.dialog = {
        open: true,
        type: action.payload.type,
        title: action.payload.title,
        content: action.payload.content,
        onConfirm: action.payload.onConfirm,
        onCancel: action.payload.onCancel,
        cancelText: action.payload.cancelText,
        confirmText: action.payload.confirmText,
      };
    },
    dialogConfirm(state: IUIState) {
      state.dialog.open = false;
      if (state.dialog.onConfirm) {
        state.dialog.onConfirm();
      }
    },
    dialogCancel(state: IUIState) {
      state.dialog.open = false;
      if (state.dialog.onCancel) {
        state.dialog.onCancel();
      }
    },
  },
});
