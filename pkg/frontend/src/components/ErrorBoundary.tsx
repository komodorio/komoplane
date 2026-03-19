import {Component, ErrorInfo, ReactNode} from "react";
import {Alert, Box, Button, Paper, Typography} from "@mui/material";

type Props = {
    children: ReactNode;
    version?: string;
};

type State = {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
};

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {hasError: false, error: null, errorInfo: null};
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {hasError: true, error};
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({error, errorInfo});
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        const issueUrl = "https://github.com/komodorio/komoplane/issues/new?" +
            `title=${encodeURIComponent("UI error: " + (this.state.error?.message || "unknown"))}&` +
            `body=${encodeURIComponent(
                "**Error:** " + this.state.error?.message + "\n\n" +
                "**Version:** " + (this.props.version || "unknown") + "\n\n" +
                "**Stack trace:**\n```\n" + (this.state.error?.stack || "N/A") + "\n```\n\n" +
                "**Component stack:**\n```\n" + (this.state.errorInfo?.componentStack || "N/A") + "\n```"
            )}`;

        return (
            <Box sx={{p: 4, maxWidth: 800, mx: "auto", mt: 4}}>
                <Alert severity="error" sx={{mb: 3}}>
                    An unexpected error occurred in komoplane.
                </Alert>
                <Paper sx={{p: 3, mb: 3}}>
                    <Typography variant="h6" gutterBottom>Error Details</Typography>
                    <Typography variant="body1" sx={{fontWeight: "bold", mb: 1}}>
                        {this.state.error?.message}
                    </Typography>
                    {this.props.version && (
                        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                            Version: {this.props.version}
                        </Typography>
                    )}
                    <Typography variant="body2" component="pre"
                                sx={{overflow: "auto", maxHeight: 300, bgcolor: "grey.100", p: 2, borderRadius: 1, fontSize: "0.75rem"}}>
                        {this.state.error?.stack}
                    </Typography>
                </Paper>
                <Box sx={{display: "flex", gap: 2}}>
                    <Button variant="contained" onClick={() => window.location.reload()}>
                        Refresh Page
                    </Button>
                    <Button variant="outlined" href={issueUrl} target="_blank">
                        Report Issue on GitHub
                    </Button>
                </Box>
            </Box>
        );
    }
}
