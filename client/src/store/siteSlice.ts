import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {DatasetType} from '@/types';

export type GlobalState = 'data-listing' | 'data-inspecting';

export type IRasterState = {
    opacity?: number;
    resolution?: number;
    rasterLink: string;
    colorScale?: 'Spectral' | 'Viridis' | string;
    open?: boolean;
  };

export interface ISiteState {
  globalState: GlobalState;
  currentData?: string | number;
  currentType?: DatasetType;
  rasterState?: IRasterState;
}

const initState: ISiteState = {
  globalState: 'data-listing',
  currentData: undefined,
  currentType: undefined,
  rasterState: undefined,
};

export const siteSlice = createSlice({
  name: 'site',
  initialState: initState,
  reducers: {
    setGlobalState: (state, action: PayloadAction<GlobalState>) => {
      state.globalState = action.payload;
      switch (action.payload) {
        case 'data-inspecting':
          state.currentData = undefined;
          state.currentType = undefined;
          state.rasterState = undefined;
          break;
        default:
          break;
      }
    },
    setRasterState: (state, action: PayloadAction<IRasterState>) => {
      state.rasterState = action.payload;
    },
    enterDataInspecting: (state, action: PayloadAction<{
      dataId: string | number;
      datasetType: DatasetType;
    }>) => {
      state.currentData = action.payload.dataId;
      state.currentType = action.payload.datasetType;
      if (action.payload.dataId) {
        state.globalState = 'data-inspecting';
      }
    },
    leaveDataInspecting(state) {
      state.globalState = 'data-listing';
      state.currentData = undefined;
      state.currentType = undefined;
      state.rasterState = undefined;
    },
  },
});

export default siteSlice.reducer;
