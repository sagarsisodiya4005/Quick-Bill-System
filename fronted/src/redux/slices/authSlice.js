import { createSlice } from '@reduxjs/toolkit';

const storedUser = localStorage.getItem('qb_user');
const storedToken = localStorage.getItem('qb_token');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken || null,
    isAuthenticated: !!storedToken,
  },
  reducers: {
    setCredentials(state, action) {
      const { token, ...user } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('qb_token', token);
      localStorage.setItem('qb_user', JSON.stringify(user));
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('qb_token');
      localStorage.removeItem('qb_user');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
