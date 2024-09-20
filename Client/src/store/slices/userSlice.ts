import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the initial state and types
interface UserState {
  data: any; // Replace `any` with your user data type
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  data: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Create the user slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<any>) {
      console.log("payload in loginSucess", action);
      // Replace `any` with user data type
      state.data = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logout(state) {
      state.data = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
});

// Export actions and reducer
export const { loginStart, loginSuccess, loginFailure, logout } =
  userSlice.actions;
export default userSlice.reducer;
