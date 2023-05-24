import {Status} from "../types.ts";
import Typography from "@mui/material/Typography";

type HealthStatusProps = {
    status: Status | undefined;
};

export default function HealthStatus({status}: HealthStatusProps) {
    let healthy = null
    status.conditions.forEach((element) => {
        if (element.type == "Healthy") {
            healthy = element
        }
    });

    if (healthy == null) {
        return (
            <></>
        );
    }

    return (
        <Typography>Healthy: {healthy.status}</Typography>
    );
}
