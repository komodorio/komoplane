import {Box, Tab} from '@mui/material';
import {useState} from "react";
import {TabContext, TabList, TabPanel} from '@mui/lab';
import ConditionList from "./ConditionList.tsx";
import {Condition, K8sResource} from "../types.ts";
import Events from "./Events.tsx";
import YAMLCodeBlock from "./YAMLCodeBlock.tsx";


export class ItemContext {
    public curItem: K8sResource;

    constructor() {
        this.curItem = {kind: "", apiVersion: "", metadata: {name: ""}, status: {}, spec: {}};
    }

    setCurrent(item: K8sResource) {
        this.curItem = item
    }

    getConditions(): Condition[] {
        if (!this.curItem.status) {
            return []
        }

        if (!this.curItem.status.conditions) {
            return []
        }

        return this.curItem.status.conditions;
    }

    getEventsURL() {
        let path = "";
        if (this.curItem.metadata.namespace) {
            path += this.curItem.metadata.namespace + "/" + this.curItem.metadata.name
        } else {
            path += this.curItem.metadata.name
        }
        return path;
    }
}

type ItemProps = {
    bridge: ItemContext
    noStatus?: boolean
    noEvents?: boolean
};

const InfoTabs = ({bridge, noStatus, noEvents}: ItemProps) => {
    let initial="status";
    if (noStatus) {
        initial="events"
        if (noEvents) {
            initial="relations"
        }
    }

    const [currentTabIndex, setCurrentTabIndex] = useState<string>(initial);

    const handleTabChange = (_: object, tabIndex: string) => {
        setCurrentTabIndex(tabIndex);
    };

    return (
        <>
            <TabContext value={currentTabIndex}>
                <Box sx={{borderBottom: 1, borderColor: 'divider'}} className="pl-2">
                    <TabList value={currentTabIndex} onChange={handleTabChange}>
                        {noStatus?(<></>):(<Tab label='Status' value="status"/>)}
                        {noEvents?(<></>):(<Tab label='Events' value="events"/>)}
                        <Tab label='Relations' value="relations"/>
                        <Tab label='YAML' value="yaml"/>
                    </TabList>
                </Box>
                <Box className="bg-gray-100">
                    <TabPanel value="yaml">{currentTabIndex == "yaml" ? getYAML(bridge) : (<></>)}</TabPanel>
                    <TabPanel
                        value="status">{currentTabIndex == "status" ? getStatus(bridge.getConditions()) : (<></>)}</TabPanel>
                    <TabPanel
                        value="events">{currentTabIndex == "events" ? getEvents(bridge.getEventsURL()) : (<></>)}</TabPanel>
                    <TabPanel value="relations">{currentTabIndex == "relations" ? getRelations() : (<></>)}</TabPanel>
                </Box>
            </TabContext>
        </>
    );
};

function getYAML(bridge: ItemContext) {
    return <>
        <YAMLCodeBlock obj={bridge.curItem}></YAMLCodeBlock>
    </>
}

function getStatus(conditions: Condition[]) {
    return <><ConditionList conditions={conditions}/></>
}

function getEvents(url: string) {
    return <><Events src={url}></Events></>
}

function getRelations() {
    console.log("get relations")
    return <></>
}

export default InfoTabs;