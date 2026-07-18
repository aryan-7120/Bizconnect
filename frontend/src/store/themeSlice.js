import { createSlice } from '@reduxjs/toolkit';

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: 'light' },
  reducers: {
    setTheme: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem('bizconnect_theme', state.mode);
      if (state.mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
