import { FastifyReply } from "fastify";
import { $Inject } from "../../lib/dependency-injection";
import { IMetrics, Metrics } from "../../lib/metrics";
import { IApiServerFastifyInstance, IFastifyRequestActions } from "../interfaces";
import { IScheduler, ISchedulerTaskDataSilenceAction, Scheduler } from "../../lib/scheduler";
import chalk from "chalk";

export async function routeActions(
    fastify: IApiServerFastifyInstance,
    scheduler = $Inject<IScheduler>(Scheduler),
    metrics = $Inject<IMetrics>(Metrics)
) {
    
    const url_path_silence = "/actions/silence";
    
    metrics.createCounter("requests", "Requests for path");
    metrics.createCounter("requests_total", "Total requests count");

    metrics.add("requests_total", 0);
    metrics.add("requests", 0, {path: url_path_silence});

    metrics.createHistogram("request_time_ms", [50, 100, 200, 500, 1000], "Request duration");

    const handlerSilence = async function (request: IFastifyRequestActions, reply: FastifyReply) {

        const start_request_time = Date.now();
        const action_request: ISchedulerTaskDataSilenceAction = {
            action: "silence",
            data: {}
        };

        if (typeof request.query.namespace !== "string" && typeof request.query.container !== "string") {
            reply.code(500);
            reply.type("text/html");
            reply.send("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>keep-assistant</title></head><body>Operation is <span style=\"color: #ff0000\">FAIL</span>. Key <span style=\"color: #ff0000\">\"namespace\"</span> or <span style=\"color: #ff0000\">\"container\"</span> not set.</body></html>");
            return;
        } 

        if (typeof request.query.namespace === "string") {
            action_request.data.namespace = request.query.namespace;
        }

        if (typeof request.query.container === "string") {
            action_request.data.container = request.query.container; 
        }

        if (typeof request.query.cluster_name === "string") {
            action_request.data.cluster_name = request.query.cluster_name; 
        }

        if (typeof request.query.duration === "string") {
            try {
                action_request.data.duration = parseInt(request.query.duration);
            } catch (error) {
                fastify.logger.error(`Parsing duration error. Error: ${chalk.red(error.message)}`);
                fastify.logger.trace(error.stack);
                reply.code(500);
                reply.type("text/html");
                reply.send("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>keep-assistant</title></head><body>Operation is <span style=\"color: #ff0000\">FAIL</span>. Key <span style=\"color: #ff0000\">\"duration\"</span> not number.</body></html>");
                return;
            }
        } else {
            action_request.data.duration = 86400;
        }

        const result = await scheduler.runTask(action_request);

        metrics.add("requests_total", 1);
        metrics.add("requests", 1, {path: url_path_silence});
        metrics.add("request_time_ms", Date.now() - start_request_time, {path: url_path_silence});

        if (result.status !== "success") {
            reply.code(200);
            reply.type("text/html");
            reply.send(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>keep-assistant</title></head><body>Operation is <span style="color: #ff0000">FAIL</span>. Message: ${result.message}</body></html>`);
        } else {
            reply.code(200);
            reply.type("text/html");
            reply.send(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>keep-assistant</title></head><body>Silence rule <span style="color: #00ff00">CREATED</span>. Duration ${action_request.data.duration} seconds</body></html>`);
        }

    };

    fastify.route({
        url: url_path_silence,
        handler: handlerSilence,
        method: ["GET"]
    });
    
}
