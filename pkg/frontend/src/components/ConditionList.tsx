import {Condition} from "../types.ts";
import {Grid} from "@mui/material";
import Typography from "@mui/material/Typography";


type ConditionListItemProps = {
    condition: Condition;
};

function ConditionListItem({condition}: ConditionListItemProps) {
    return (
        <Grid item xs={12} md={12} key={condition.type}>
            <div className="p-4 bg-white rounded shadow cursor-pointer">
                <div>
                    <Typography>{condition.type}</Typography>
                    <Typography>{condition.status}</Typography>
                    <Typography>{condition.reason}</Typography>
                    <Typography>{condition.lastTransitionTime}</Typography>
                </div>
            </div>
        </Grid>
    );
}

type ConditionListProps = {
    conditions: Condition[] | undefined;
};

export default function ConditionList({conditions}: ConditionListProps) {
    conditions?.forEach((condition: Condition) => (
        console.log(condition)
    ))

    return (
        <Grid container spacing={2}>
            {conditions?.map((condition: Condition) => (
                <ConditionListItem condition={condition}/>
            ))}
        </Grid>
    );
}

