import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export type GlobalState = 'data-browsing' | 'viewing-raster' | 'viewing-ncf' | 'viewing-table';

export interface ISiteState {
  globalState: GlobalState;
}

const initState: ISiteState = {
  globalState: 'data-browsing',
};

export const siteSlice = createSlice({
  name: 'site',
  initialState: initState,
  reducers: {
    setGlobalState: (state, action: PayloadAction<GlobalState>) => {
      state.globalState = action.payload;
    },
  },
});

export default siteSlice.reducer;