import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {DatasetType} from '@/types';

export type GlobalState = 'data-listing' | 'data-inspecting';

export type IRasterState = {
    open: boolean;
    rasterLink: string;
    visualQueryLatLngs: L.LatLng[];
    config: {
      colorScale?: string;
      invertColorScale?: boolean;
      opacity?: number;
      resolution?: number;
      rasterMin?: number;
      rasterMax?: number;
    }
  };

export interface ISiteState {
  globalState: GlobalState;
  currentData?: string | number;
  currentType?: DatasetType;
  rasterState?: IRasterState;
  datasetListCache?: any;
  datasetDetailCache?: any;
}

const initState: ISiteState = {
  globalState: 'data-listing',
  currentData: undefined,
  currentType: undefined,
  rasterState: {
    open: false,
    rasterLink: '',
    visualQueryLatLngs: [],
    config: {
      opacity: 0.75,
      resolution: 2 ** 7,
      invertColorScale: false,
      colorScale: 'Spectral',
      rasterMax: 0.15,
      rasterMin: 0.08,
    },
  },
  datasetListCache: undefined,
  datasetDetailCache: undefined,
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
    setRasterState: (state, action: PayloadAction<Partial<IRasterState>>) => {
      state.rasterState = {
        ...state.rasterState,
        ...action.payload,
      };
    },
    setRasterStateConfig(state, action: PayloadAction<Partial<IRasterState['config']>>) {
      state.rasterState.config = {
        ...state.rasterState.config,
        ...action.payload,
      };
    },
    setRasterVisualQuery(state, action: PayloadAction<L.LatLng[]>) {
      state.rasterState.visualQueryLatLngs = action.payload;
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
      state.currentData = initState.currentData;
      state.currentType = initState.currentType;
      state.rasterState = initState.rasterState;
    },
    setDatasetListCache: (state, action: PayloadAction<any>) => {
      state.datasetListCache = action.payload;
    },
    setDatasetDetailCache: (state, action: PayloadAction<any>) => {
      state.datasetDetailCache = action.payload;
    },
  },
});

export default siteSlice.reducer;
