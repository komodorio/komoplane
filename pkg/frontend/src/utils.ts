import {DataSet} from 'vis-data/peer';
import {Data, DataSetEdges, DataSetNodes} from 'vis-network/peer';
import {DateTime} from "luxon";
import {ClaimExtended} from "./types.ts";

export function getAge(date1: DateTime, date2: DateTime) {
    if (date1 == date2) {
        return "now"
    }

    const diff = date2.diff(date1);

    const umap = {
        "years": "yr",
        "months": "mo",
        "days": "d",
        "hours": "h",
        "minutes": "m",
        "seconds": "s",
        "milliseconds": "ms"
    }

    let units = ["years", "months", "days", "hours", "minutes", "seconds", "milliseconds"];
    for (let unit of units) {
        const val = Math.abs(diff.as(unit));
        if (val >= 1) {
            return Math.round(val) + umap[unit]
        }
    }

    return "n/a"
}

export function graphDataFromClaim(claim: ClaimExtended): Data {
    const nodes: DataSetNodes = new DataSet()
    const edges: DataSetEdges = new DataSet()

    const claimId = nodes.add({
        font: { multi: true },
        label: "<b>"+claim.metadata.name+"</b>\n<code>Claim</code>",
        shape: "box",
        color: {background: "#FFAAFF"},
        borderWidth: 2,
    })[0]

    const compId = nodes.add({
        font: { multi: true },
        label: "<b>"+claim.composition.metadata.name+"</b>\n<code>Composition</code>",
        shape: "box",
        color: {background: "#AAFFAA"}
    })[0]
    edges.add({
        from: compId, to: claimId, arrows: {from: {enabled: true}}
    })

    const xrId = nodes.add({
        font: { multi: true },
        label: "<b>"+claim.compositeResource.metadata.name+"</b>\n<code>Composite Resource</code>",
        shape: "box",
        color: {background: "#AAFFFF"}
    })[0]
    edges.add({
        from: xrId, to: claimId, arrows: {from: {enabled: true}}
    })


    claim.managedResources?.map(res => {
        const resId = nodes.add({
            font: { multi: true },
            label: "<b>"+res.metadata.name+"</b>\n<code>Managed Resource</code>",
            shape: "box",
            color: {background: "#FFFFAA"}
        })[0]
        edges.add({
            from: resId,
            to: xrId,
            arrows: {
                from: {enabled: true}
            },
            smooth: {
                enabled: true,
                type:  'cubicBezier', //'', '', '', '', '', 'curvedCW', 'curvedCCW', ''
            }
        })
    })

    return {
        nodes: nodes,
        edges: edges,
    };
}