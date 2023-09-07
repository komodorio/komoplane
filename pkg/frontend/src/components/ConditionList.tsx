import {Condition} from "../types.ts";
import {Grid} from "@mui/material";
import Typography from "@mui/material/Typography";
import {getAge} from "../utils.ts";
import {DateTime} from "luxon";
import Card from '@mui/material/Card';

type ConditionListItemProps = {
    condition: Condition;
};

function ConditionListItem({condition}: ConditionListItemProps) {
    const last = DateTime.fromISO(condition.lastTransitionTime)
    const age = getAge(DateTime.now(), last)
    return (
        <Grid item xs={12} md={12} key={condition.type}>
            <Card variant="outlined" className="p-2">
                <Grid container justifyContent="space-between">
                    <Grid item>
                        <Typography variant="body1" sx={{fontWeight: "bold"}} display="inline"
                                    className={condition.status == "True" ? "text-green-700" : "text-red-700"}>
                            {condition.status == "True" ? "" : "Not "}{condition.type}
                        </Typography>
                        <Typography>{condition.reason}{condition.message ? (": " + condition.message) : ""}</Typography>
                    </Grid>
                    <Grid item><Typography title={condition.lastTransitionTime}>{age} ago</Typography></Grid>
                </Grid>
            </Card>
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

