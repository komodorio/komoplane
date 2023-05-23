import Typography from "@mui/material/Typography";
import {Grid, Toolbar} from "@mui/material";

const Providers = () => {
    return (
        <>
            <Toolbar>
                <Typography variant="h5">Providers</Typography>
            </Toolbar>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <div className="p-4 bg-white rounded shadow">
                        <Typography variant="h6">Table Widget</Typography>
                        <Typography variant="body1">Table content goes here</Typography>
                    </div>
                </Grid>
                <Grid item xs={12} md={6}>
                    <div className="p-4 bg-white rounded shadow">
                        <Typography variant="h6">Graph Widget</Typography>
                        <Typography variant="body1">Graph content goes here</Typography>
                    </div>
                </Grid>
                <Grid item xs={12} md={6}>
                    <div className="p-4 bg-white rounded shadow">
                        <Typography variant="h6">Widget 3</Typography>
                        <Typography variant="body1">Content for widget 3</Typography>
                    </div>
                </Grid>
                <Grid item xs={12} md={6}>
                    <div className="p-4 bg-white rounded shadow">
                        <Typography variant="h6">Widget 4</Typography>
                        <Typography variant="body1">Content for widget 4</Typography>
                    </div>
                </Grid>
            </Grid>
        </>
    );
};

export default Providers;
