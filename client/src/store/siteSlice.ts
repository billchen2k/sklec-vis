import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {DatasetType, IDataset} from '@/types';

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

export type IInspectState = {
  selectedVisFile: number; // The index of datasetDetail cache
  selectedChannel: number; // The index of datasetDetail cache. If this value is -1, means no channel is selected.
}

export interface ISiteState {
  globalState: GlobalState;
  currentData?: string | number;
  currentType?: DatasetType;
  rasterState?: IRasterState;
  inspectState?: Partial<IInspectState>;
  datasetListCache?: IDataset[] | any;
  datasetDetailCache?: IDataset;
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
  inspectState: {},
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
      state.inspectState = initState.inspectState;
    },
    setInspectingState: (state, action: PayloadAction<Partial<IInspectState>>) => {
      state.inspectState = {
        ...state.inspectState,
        ...action.payload,
      };
    },
    setDatasetListCache: (state, action: PayloadAction<any>) => {
      state.datasetListCache = action.payload;
    },
    setDatasetDetailCache: (state, action: PayloadAction<any>) => {
      state.datasetDetailCache = action.payload;
    },
  },
});

// export default siteSlice.reducer;
