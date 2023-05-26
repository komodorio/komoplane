import {DateTime} from "luxon";


export default function getAge(date1: DateTime, date2: DateTime) {
    if (date1==date2) {
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
