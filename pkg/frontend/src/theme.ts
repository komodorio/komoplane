import {createTheme, ThemeOptions} from '@mui/material/styles';

export const themeLight: ThemeOptions = createTheme({
    palette: {
        mode: 'light',
    },
});

export const themeDark: ThemeOptions = createTheme({
    palette: {
        mode: 'dark',
    },
});
