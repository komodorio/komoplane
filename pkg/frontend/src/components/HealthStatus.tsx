import {Condition, Status} from "../types.ts";
import Typography from "@mui/material/Typography";

type HealthStatusProps = {
    status: Status;
};

export default function HealthStatus({status}: HealthStatusProps) {
    let healthy: (Condition|undefined) = undefined
    status.conditions.forEach((element) => {
        if (element.type == "Healthy") {
            healthy = element
        }
    });

    if (!healthy) {
        return (
            <></>
        );
    }

    return (
        <Typography component="span" className="p-1 bg-slate-300 border rounded border-slate-500">Healthy: {healthy.status}</Typography>
    );
}
