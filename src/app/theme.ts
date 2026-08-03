import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "dark",

    primary: {
      main: "#7c9cff",
    },

    background: {
      default: "#10131a",
      paper: "#181c25",
    },
  },

  shape: {
    borderRadius: 8,
  },
});