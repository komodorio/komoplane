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
                        <Typography variant="body1">Namespace: {item.metadata.namespace}</Typography>
                        <Typography variant="body1">XR: {item.kind}</Typography>
                        <Typography variant="body1">Composition: {item.spec.compositionRef?.name}</Typography>
                        <ReadySynced status={item.status?item.status:{}}></ReadySynced>
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
    if (!items || !items.items.length) {
        return (
            <Typography variant="h6">No items</Typography>
        )
    }

    return (
        <Grid container spacing={2}>
            {items?.items?.map((item: Claim) => (
                <ListItem item={item} key={item.metadata.name}/>
            ))}
        </Grid>
    );
}
