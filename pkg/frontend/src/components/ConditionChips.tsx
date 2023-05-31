import {Status} from "../types.ts";
import {Chip} from "@mui/material";

type HealthStatusProps = {
    status: Status;
};

export default function ConditionChips({status}: HealthStatusProps) {
    return (
        <>{
            status.conditions?.map((element) => (
                <Chip variant="outlined" className="mr-1 ml-1"
                      key={element.type}
                      label={(element.status == "True" ? "" : "Not ") + element.type}
                      title={element.reason}
                      color={(element.status == "True" ? "success" : "error")}></Chip>
            ))
        }</>
    )
}
