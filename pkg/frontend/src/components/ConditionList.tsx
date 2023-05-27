import {Condition} from "../types.ts";
import {Grid} from "@mui/material";
import Typography from "@mui/material/Typography";
import getAge from "../utils.ts";
import {DateTime} from "luxon";

type ConditionListItemProps = {
    condition: Condition;
};

function ConditionListItem({condition}: ConditionListItemProps) {
    const last = DateTime.fromISO(condition.lastTransitionTime)
    const age = getAge(DateTime.now(), last)
    return (
        <Grid item xs={12} md={12} key={condition.type}>
            <div className="p-4 bg-white rounded shadow cursor-pointer">
                <div>
                    <Typography>{condition.type}</Typography>
                    <Typography>{condition.status}</Typography>
                    <Typography>{condition.reason}</Typography>
                    <Typography title={condition.lastTransitionTime}>{age}</Typography>
                </div>
            </div>
        </Grid>
    );
}

type ConditionListProps = {
    conditions: Condition[] | undefined;
};

export default function ConditionList({conditions}: ConditionListProps) {
    return (
        <Grid container spacing={2}>
            {conditions?.map((condition: Condition) => (
                <ConditionListItem condition={condition} key={condition.type}/>
            ))}
        </Grid>
    );
}

