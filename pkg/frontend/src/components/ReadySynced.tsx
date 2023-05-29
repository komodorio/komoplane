import {Status} from "../types.ts";
import {Chip} from "@mui/material";

type HealthStatusProps = {
    status: Status;
};

export default function ReadySynced({status}: HealthStatusProps) {
    let ready = <></>
    let synced = <></>
    status.conditions.forEach((element) => {
        if (element.type == "Ready") {
            ready = <Chip label={(element.status == "True" ? "" : "Not ") + "Ready"} title={element.reason}
                          color={(element.status == "True" ? "success" : "error")}></Chip>
        }

        if (element.type == "Synced") {
            synced = <Chip label={(element.status == "True" ? "" : "Not ") + "Synced"} title={element.reason}
                           color={(element.status == "True" ? "primary" : "warning")}></Chip>
        }
    });

    return (
        <>
            {ready}
            {synced}
        </>
    );
}
