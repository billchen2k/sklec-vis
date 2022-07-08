import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {DatasetType, IDataset} from '@/types';
import {IDimensionType} from '@/types/ncf.type';

export type GlobalState = 'data-listing' | 'data-inspecting' | 'managing';

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
  selectedRange: Partial<Record<IDimensionType, number[]>>;
}

export interface ISiteState {
  globalState: GlobalState;
  currentData?: string | number;
  currentType?: DatasetType;
  rasterState?: IRasterState;
  inspectState?: Partial<IInspectState>;
  datasetListCache?: IDataset[] | any;
  datasetDetailCache?: IDataset; // The current viewing data. Will be set in any viewing panel.
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
  inspectState: {
    selectedVisFile: 0,
    selectedChannel: -1,
    selectedRange: {},
  },
  datasetListCache: undefined,
  datasetDetailCache: undefined,
};

export const siteSlice = createSlice({
  name: 'site',
  initialState: initState,
  reducers: {
    setGlobalState: (state: ISiteState, action: PayloadAction<GlobalState>) => {
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
    setRasterState: (state: ISiteState, action: PayloadAction<Partial<IRasterState>>) => {
      state.rasterState = {
        ...state.rasterState,
        ...action.payload,
      };
    },
    setRasterStateConfig(state: ISiteState, action: PayloadAction<Partial<IRasterState['config']>>) {
      state.rasterState.config = {
        ...state.rasterState.config,
        ...action.payload,
      };
    },
    setRasterVisualQuery(state: ISiteState, action: PayloadAction<L.LatLng[]>) {
      state.rasterState.visualQueryLatLngs = action.payload;
    },
    enterDataInspecting: (state: ISiteState, action: PayloadAction<{
      dataId: string | number;
      datasetType: DatasetType;
    }>) => {
      state.currentData = action.payload.dataId;
      state.currentType = action.payload.datasetType;
      if (action.payload.dataId) {
        state.globalState = 'data-inspecting';
      }
    },
    enterDataListing(state: ISiteState) {
      state.globalState = 'data-listing';
      state.currentData = initState.currentData;
      state.currentType = initState.currentType;
      state.rasterState = initState.rasterState;
      state.inspectState = initState.inspectState;
    },
    enterDataManaging(state: ISiteState, action: PayloadAction<string>) {
      state.currentData = action.payload;
      state.globalState = 'managing';
    },
    setInspectingState: (state: ISiteState, action: PayloadAction<Partial<IInspectState>>) => {
      state.inspectState = {
        ...state.inspectState,
        ...action.payload,
      };
    },
    setDatasetListCache: (state: ISiteState, action: PayloadAction<any>) => {
      state.datasetListCache = action.payload;
    },
    setDatasetDetailCache: (state: ISiteState, action: PayloadAction<any>) => {
      state.datasetDetailCache = action.payload;
    },
  },
});

// export default siteSlice.reducer;
