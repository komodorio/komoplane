import {DateTime, DurationUnit} from "luxon";

export function getAge(date1: DateTime, date2: DateTime) {
    if (date1 == date2) {
        return "now"
    }

    interface ValMap {
        [key: string]: string;
    }

    const umap: ValMap = {
        "years": "yr",
        "months": "mo",
        "days": "d",
        "hours": "h",
        "minutes": "m",
        "seconds": "s",
        "milliseconds": "ms"
    }

    const units: DurationUnit[] = ["years", "months", "days", "hours", "minutes", "seconds", "milliseconds"];
    const diff = date1.diff(date2, units);

    for (const unit of units) {
        const val = Math.abs(diff.as(unit));
        if (val >= 1) {
            return Math.round(val) + umap[unit]
        }
    }

    return "n/a"
}

export function getAgeParse(date1: string, date2?: string): string {
    const dt1 = DateTime.fromISO(date1)
    const dt2 = date2 ? DateTime.fromISO(date2) : DateTime.now()
    return getAge(dt1, dt2)
}

declare global {
    interface Window {
        heap: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }
}

export function sendStatsToHeap(name: string, prop: object) {
    if (window.heap!=undefined) {
        window.heap.track(name, prop);
    }
}
