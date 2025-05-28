import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { $Inject } from "../../lib/dependency-injection";
import { IMetrics, Metrics } from "../../lib/metrics";
//import { IScheduler, Scheduler } from "../../lib/scheduler";


export async function routeActions(
    fastify: FastifyInstance,
    //scheduler = $Inject<IScheduler>(Scheduler),
    metrics = $Inject<IMetrics>(Metrics)
) {
    
    const url_path = "/actions";
    
    metrics.createCounter("requests", "Requests for path");
    metrics.createCounter("requests_total", "Total requests count");

    metrics.add("requests_total", 0);
    metrics.add("requests", 0, {
        path: url_path
    });

    metrics.createHistogram("request_time_ms", [50, 100, 200, 500, 1000], "Request duration");

    const handler = async function (request: FastifyRequest, reply: FastifyReply) {

        console.log(request.query["d"]);

        reply.send("OK");

    };

    fastify.route({
        url: url_path,
        handler: handler,
        method: ["GET"]
    });
    
}
