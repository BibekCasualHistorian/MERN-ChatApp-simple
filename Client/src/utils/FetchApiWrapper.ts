import { AppDispatch } from "../store/store"; // Adjust the import based on your file structure
import { logout } from "../store/slices/userSlice"; // Import your logout action

const FetchApiWrapper = async (
  url: URL,
  options: RequestInit = {},
  dispatch: AppDispatch
) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const data = await response.json();

  // console.log("response in wrapper", response);
  // console.log("data in wrapper", data);

  if (!response.ok) {
    if (
      data.message == "No token provided" ||
      data.message == "Token verification failed"
    ) {
      dispatch(logout());
    }
  }

  return { response, data };
};

export default FetchApiWrapper;
