import {useEffect, useRef} from "react";
import {Data, Network, Options} from 'vis-network/peer';
import Box from '@mui/material/Box';

type ItemProps = {
    data: Data;
};

export const RelationsGraph = ({data}: ItemProps) => {
    // A reference to the div rendered by this component
    const domNode = useRef<HTMLDivElement>(null);

    // A reference to the vis network instance
    const network = useRef<Network | null>(null);

    useEffect(() => {
        const options: Options = {
            layout: {
                improvedLayout: true,
                hierarchical: {
                    enabled: true,
                    levelSeparation: 300,
                    //nodeSpacing: 200,
                    treeSpacing: 200,
                    blockShifting: true,
                    edgeMinimization: true,
                    parentCentralization: true,
                    direction: 'RL',        // UD, DU, LR, RL
                    sortMethod: 'directed',  // hubsize, directed
                    shakeTowards: 'roots'  // roots, leaves
                }
            }
        };

        if (domNode.current) {
            network.current = new Network(domNode.current, data, options);
        }
    }, [domNode, network, data]);

    return (
        // FIXME: weird thing goes on here with flex-1 usage
        <Box className="flex-1" ref={domNode}/>
    );
};