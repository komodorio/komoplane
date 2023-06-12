import {Box, Tab} from '@mui/material';
import {useState} from "react";
import {TabContext, TabList, TabPanel} from '@mui/lab';
import ConditionList from "./ConditionList.tsx";
import {Condition, GraphData, K8sResource} from "../types.ts";
import Events from "./Events.tsx";
import YAMLCodeBlock from "./YAMLCodeBlock.tsx";
import RelationsGraph from "./graph/RelationsGraph.tsx";


export class ItemContext {
    public curItem: K8sResource;

    constructor() {
        this.curItem = {kind: "", apiVersion: "", metadata: {name: ""}};
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

    public getGraph: () => GraphData = () => {
        return {
            nodes: [],
            edges: []
        }
    }
}

type ItemProps = {
    bridge: ItemContext
    initial: string
    noStatus?: boolean
    noEvents?: boolean
    noRelations?: boolean
};

const InfoTabs = ({bridge, initial, noStatus, noEvents, noRelations}: ItemProps) => {
    if (window.location.hash.length > 1) {
        initial = window.location.hash.substring(1)
    }
    const [currentTabIndex, setCurrentTabIndex] = useState<string>(initial);

    const handleTabChange = (_: object, tabIndex: string) => {
        window.location.hash = tabIndex
        setCurrentTabIndex(tabIndex);
    };

    return (
        <>
            <TabContext value={currentTabIndex}>
                <Box sx={{borderBottom: 1, borderColor: 'divider'}} className="pl-2">
                    <TabList value={currentTabIndex} onChange={handleTabChange}>
                        {noStatus ? null : (<Tab label='Status' value="status"/>)}
                        {noEvents ? null : (<Tab label='Events' value="events"/>)}
                        {noRelations ? null : (<Tab label='Relations' value="relations"/>)}
                        <Tab label='YAML' value="yaml"/>
                    </TabList>
                </Box>
                <Box className="bg-gray-100">
                    <TabPanel value="yaml">{currentTabIndex == "yaml" ? getYAML(bridge) : null}</TabPanel>
                    <TabPanel
                        value="status">{currentTabIndex == "status" ? getStatus(bridge.getConditions()) : null}</TabPanel>
                    <TabPanel
                        value="events">{currentTabIndex == "events" ? getEvents(bridge.getEventsURL()) : null}</TabPanel>
                    <TabPanel
                        value="relations" style={{ height: 800 }}>{currentTabIndex == "relations" ? getRelations(bridge.getGraph()) : null}</TabPanel>
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

function getRelations(data: GraphData) {
    return <RelationsGraph nodes={data.nodes} edges={data.edges}></RelationsGraph>
}

export default InfoTabs;