const xhr = new XMLHttpRequest();
const TRACK_EVENT_TYPE = "track"
const IDENTIFY_EVENT_TYPE = "identify"
const BASE_ANALYTIC_MSG = {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    headers: {
        "Content-Type": "application/json",
        "api-key": "komodor.analytics@admin.com",
    },
    redirect: "follow",
    referrerPolicy: "no-referrer"
}
xhr.onload = function () {
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.responseText.startsWith("{")) {
        const status = JSON.parse(xhr.responseText);
        const version = status.CurVer
        if (status.Analytics) {
            enableDD(version)
            enableHeap(version, status.ClusterMode)
            enableSegmentBackend(version, status.ClusterMode)
        }
    }
}
xhr.open('GET', '/status', true);
xhr.send(null);


function enableDD(version) {
    (function (h, o, u, n, d) {
        h = h[d] = h[d] || {
            q: [], onReady: function (c) {
                h.q.push(c)
            }
        }
        d = o.createElement(u);
        d.async = true;
        d.src = n
        n = o.getElementsByTagName(u)[0];
        n.parentNode.insertBefore(d, n)
    })(window, document, 'script', 'https://www.datadoghq-browser-agent.com/datadog-rum-v4.js', 'DD_RUM')
    DD_RUM.onReady(function () {
        DD_RUM.init({
            clientToken: 'TODO', // TODO
            applicationId: 'TODO', // TODO
            site: 'datadoghq.com',
            service: 'komoplane',
            version: version,
            trackInteractions: true,
            trackResources: true,
            trackLongTasks: true,
            defaultPrivacyLevel: 'mask',
            sessionReplaySampleRate: 0
        })
    })
}

function enableHeap(version, inCluster) {
    window.heap = window.heap || [], heap.load = function (e, t) {
        window.heap.appid = e, window.heap.config = t = t || {};
        let r = document.createElement("script");
        r.type = "text/javascript", r.async = !0, r.src = "https://cdn.heapanalytics.com/js/heap-" + e + ".js";
        let a = document.getElementsByTagName("script")[0];
        a.parentNode.insertBefore(r, a);
        for (let n = function (e) {
            return function () {
                heap.push([e].concat(Array.prototype.slice.call(arguments, 0)))
            }
        }, p = ["addEventProperties", "addUserProperties", "clearEventProperties", "identify", "resetIdentity", "removeEventProperty", "setEventProperties", "track", "unsetEventProperty"], o = 0; o < p.length; o++) heap[p[o]] = n(p[o])
    };
    heap.load("TODO"); // TODO
    window.heap.addEventProperties({
        'version': version,
        'installationMode': inCluster ? "cluster" : "local"
    });
}

function sendStats(name, prop) {
    if (window.heap) {
        window.heap.track(name, prop);
    }
}

function enableSegmentBackend(version, ClusterMode) {
    sendToSegmentThroughAPI("komoplane loaded", {
        version,
        'installationMode': ClusterMode ? "cluster" : "local"
    }, TRACK_EVENT_TYPE)
}

function sendToSegmentThroughAPI(eventName, properties, segmentCallType) {
    const userId = getUserId();
    try {
        sendData(properties, segmentCallType, userId, eventName);
    } catch (e) {
        console.log("failed sending data to segment", e);
    }
}

function sendData(data, eventType, userId, eventName) {
    const body = createBody(eventType, userId, data, eventName);
    return fetch(`https://api.komodor.com/analytics/segment/${eventType}`, {
        ...BASE_ANALYTIC_MSG,
        body: JSON.stringify(body),
    });
}

function createBody(segmentCallType, userId, params, eventName) {
    const data = {userId: userId};
    if (segmentCallType === IDENTIFY_EVENT_TYPE) {
        data["traits"] = params;
    } else if (segmentCallType === TRACK_EVENT_TYPE) {
        if (!eventName) {
            throw new Error("no eventName parameter on segment track call");
        }
        data["properties"] = params;
        data["eventName"] = eventName;
    }
    return data;
}

const getUserId = (() => {
    let userId = null;
    return () => {
        if (!userId) {
            userId = crypto.randomUUID();
        }
        return userId;
    };
})();
