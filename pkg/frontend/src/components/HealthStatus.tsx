import {Condition, Status} from "../types.ts";
import {Chip} from "@mui/material";

type HealthStatusProps = {
    status: Status;
};

export default function HealthStatus({status}: HealthStatusProps) {
    let healthy: Condition  = {lastTransitionTime: "", reason: "", status: "Unknown", type: ""}
    status.conditions?.forEach((element) => {
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
        <Chip label={(healthy.status == "True" ? "" : "Not ") + "Healthy"} title={healthy.reason}
              color={(healthy.status == "True" ? "success" : "error")}></Chip>
    );
}
