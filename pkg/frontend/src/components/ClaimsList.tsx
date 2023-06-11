import {Card, CardActionArea, CardContent, Grid} from '@mui/material';
import {Claim, ItemList} from "../types.ts";
import Typography from "@mui/material/Typography";
import {useNavigate} from "react-router-dom";
import ReadySynced from "./ReadySynced.tsx";

type ItemProps = {
    item: Claim;
};

function ListItem({item}: ItemProps) {
    const navigate = useNavigate();
    const handleOnClick = () => {
        navigate(
            item.apiVersion + "/" + item.kind + "/" + item.metadata.namespace + "/" + item.metadata.name,
            {state: item}
        );
    };

    return (
        <Grid item xs={12} md={12} key={item.metadata.name} onClick={handleOnClick}>
            <Card variant="outlined" className="cursor-pointer">
                <CardActionArea>
                    <CardContent>
                        <Typography variant="h6">{item.metadata.name}</Typography>
                        <Typography variant="h6">{item.metadata.namespace}</Typography>
                        <Typography variant="h6">{item.kind}</Typography>
                        <Typography variant="h6">{item.spec.compositionRef.name}</Typography>
                        <ReadySynced status={item.status}></ReadySynced>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    );
}

type ItemListProps = {
    items: ItemList<Claim> | undefined;
};

export default function ClaimsList({items}: ItemListProps) {
    return (
        <Grid container spacing={2}>
            {items?.items?.map((item: Claim) => (
                <ListItem item={item} key={item.metadata.name}/>
            ))}
        </Grid>
    );
}
