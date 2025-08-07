import { FastifyReply } from "fastify";
import { $Inject } from "../../lib/dependency-injection";
import { IMetrics, Metrics } from "../../lib/metrics";
import { IApiServerFastifyInstance, IFastifyRequestActionsInstancePost, IFastifyRequestActionsMemoryDBGet, IFastifyRequestActionsMemoryDBPost, IFastifyRequestActionsSilence } from "../interfaces";
import { IScheduler, ISchedulerTaskDataSilenceAction, ISchedulerTaskDataSilenceActionInstances, Scheduler } from "../../lib/scheduler";
import chalk from "chalk";
import { IMemoryDB, MemoryDB } from "../../lib/memory-db";

export async function routeActions(
    fastify: IApiServerFastifyInstance,
    scheduler = $Inject<IScheduler>(Scheduler),
    memory_db = $Inject<IMemoryDB>(MemoryDB),
    metrics = $Inject<IMetrics>(Metrics)
) {
    
    const url_path_silence = "/actions/silence";
    const url_path_memory_db = "/actions/memorydb";
    const url_path_instance = "/actions/silence/instance";
    
    metrics.createCounter("requests", "Requests for path");
    metrics.createCounter("requests_total", "Total requests count");

    metrics.add("requests_total", 0);
    metrics.add("requests", 0, {path: url_path_silence});
    metrics.add("requests", 0, {path: url_path_memory_db});

    metrics.createHistogram("request_time_ms", [50, 100, 200, 500, 1000], "Request duration");

    const handlerSilence = async function (request: IFastifyRequestActionsSilence, reply: FastifyReply) {

        const start_request_time = Date.now();
        const action_request: ISchedulerTaskDataSilenceAction = {
            action: "silence",
            data: {}
        };

        if (
            typeof request.query.namespace !== "string" && 
            typeof request.query.container !== "string" && 
            typeof request.query.fingerprint !== "string"
        ) {
            reply.code(500);
            reply.type("text/html");
            reply.send("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>keep-assistant</title></head><body>Operation is <span style=\"color: #ff0000\">FAIL</span>. Key <span style=\"color: #ff0000\">\"fingerprint\"</span>, <span style=\"color: #ff0000\">\"namespace\"</span> or <span style=\"color: #ff0000\">\"container\"</span> not set.</body></html>");
            return;
        }
        
        if (typeof request.query.fingerprint === "string") {
            if (request.query.fingerprint.length > 64 || request.query.fingerprint.length === 0) {
                reply.code(500);
                reply.type("text/html");
                reply.send("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>keep-assistant</title></head><body>Operation is <span style=\"color: #ff0000\">FAIL</span>. Parameters is not correct.</body></html>");
                return;
            }
            action_request.data.fingerprint = request.query.fingerprint;
        }

        if (typeof request.query.namespace === "string") {
            if (request.query.namespace.length > 64 || request.query.namespace.length === 0) {
                reply.code(500);
                reply.type("text/html");
                reply.send("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>keep-assistant</title></head><body>Operation is <span style=\"color: #ff0000\">FAIL</span>. Parameters is not correct.</body></html>");
                return;
            }
            action_request.data.namespace = request.query.namespace;
        }

        if (typeof request.query.container === "string") {
            if (request.query.container.length > 64 || request.query.container.length === 0) {
                reply.code(500);
                reply.type("text/html");
                reply.send("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>keep-assistant</title></head><body>Operation is <span style=\"color: #ff0000\">FAIL</span>. Parameters is not correct.</body></html>");
                return;
            }
            action_request.data.container = request.query.container; 
        }

        if (typeof request.query.cluster_name === "string") {
            if (request.query.cluster_name.length > 32 || request.query.cluster_name.length === 0) {
                reply.code(500);
                reply.type("text/html");
                reply.send("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>keep-assistant</title></head><body>Operation is <span style=\"color: #ff0000\">FAIL</span>. Parameters is not correct.</body></html>");
                return;
            }
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

    const handlerMemoryDBGet = async function (request: IFastifyRequestActionsMemoryDBGet, reply: FastifyReply) {

        const start_request_time = Date.now();

        if (typeof request.query.key !== "string") {
            reply.code(500);
            reply.type("application/json");
            reply.send({
                status: "fail",
                message: "Operation is fail. ID is not set"
            });
            return;
        } 

        if (request.query.key.length > 32 || request.query.key.length === 0) {
            reply.code(500);
            reply.type("application/json");
            reply.send({
                status: "fail",
                message: "Operation is fail. Key is not set"
            });
            return;
        }

        if (memory_db.exist(request.query.key) === true) {
            reply.code(200);
            reply.type("application/json");
            reply.send({
                status: "success",
                data: memory_db.get(request.query.key)
            });
        } else {
            reply.code(404);
            reply.type("application/json");
            reply.send({
                status: "fail",
                message: `Operation is fail. Key "${request.query.key}" not found`
            });
        }

        metrics.add("requests_total", 1);
        metrics.add("requests", 1, {path: url_path_memory_db});
        metrics.add("request_time_ms", Date.now() - start_request_time, {path: url_path_memory_db});

    };

    const handlerMemoryDBPost = async function (request: IFastifyRequestActionsMemoryDBPost, reply: FastifyReply) {

        const start_request_time = Date.now();

        if (typeof request.body.status !== "string" || typeof request.body.key !== "string") {
            reply.code(500);
            reply.type("application/json");
            reply.send({
                status: "fail",
                message: "Operation is fail. Key \"status\" or \"key\" not set"
            });
            return;
        }

        if (request.body.status.length > 32 || request.body.key.length > 32 || request.body.status.length === 0 || request.body.key.length === 0) {
            reply.code(500);
            reply.type("application/json");
            reply.send({
                status: "fail",
                message: "Operation is fail. Key \"status\" or \"key\" not set"
            });
            return;
        }

        let ttl = 240;

        if (typeof request.body.ttl === "number") {
            ttl = request.body.ttl;
        }

        memory_db.put(request.body.key, request.body.status, ttl);       

        metrics.add("requests_total", 1);
        metrics.add("requests", 1, {path: url_path_memory_db});
        metrics.add("request_time_ms", Date.now() - start_request_time, {path: url_path_memory_db});

        reply.code(200);
        reply.type("application/json");
        reply.send({
            status: "success",
            message: `Operation is success. Key "${request.body.key}" added`
        });

    };

    const handlerInstancePost = async function (request: IFastifyRequestActionsInstancePost, reply: FastifyReply) {

        const start_request_time = Date.now();

        if (typeof request.body.instance !== "string") {
            reply.code(500);
            reply.type("application/json");
            reply.send({
                status: "fail",
                message: "Operation is fail. Key \"instance\" not set"
            });
            return;
        }

        if (request.body.instance.length === 0 || request.body.instance.length > 64) {
            reply.code(500);
            reply.type("application/json");
            reply.send({
                status: "fail",
                message: "Operation is fail. Key \"instance\" not set"
            });
            return;
        }

        const action_request: ISchedulerTaskDataSilenceActionInstances = {
            action: "silence:instances",
            data: {
                duration: 86400,
                instance: request.body.instance,
                actor: ""
            }
        };

        if (request.body.actor !== undefined) {
            if (request.body.actor.length === 0 || request.body.actor.length > 64) {
                reply.code(500);
                reply.type("application/json");
                reply.send({
                    status: "fail",
                    message: "Operation is fail. Key \"actor\" not set"
                });
                return;
            }
            action_request.data.actor = request.body.actor;
        }

        if (typeof request.body.duration === "number") {
            action_request.data.duration = request.body.duration;
        }      

        const result = await scheduler.runTask(action_request);

        metrics.add("requests_total", 1);
        metrics.add("requests", 1, {path: url_path_silence});
        metrics.add("request_time_ms", Date.now() - start_request_time, {path: url_path_silence});

        if (result.status !== "success") {
            reply.code(200);
            reply.type("application/json");
            reply.send({
                status: "fail",
                message: `Operation is fail. Message: ${result.message}`
            });
        } else {
            reply.code(200);
            reply.type("application/json");
            reply.send({
                status: "success",
                message: `Silence rule created. Duration ${action_request.data.duration} seconds`
            });
        }

    };

    fastify.route({
        url: url_path_instance,
        handler: handlerInstancePost,
        method: ["POST"]
    });
    
    fastify.route({
        url: url_path_silence,
        handler: handlerSilence,
        method: ["GET"]
    });

    fastify.route({
        url: url_path_memory_db,
        handler: handlerMemoryDBPost,
        method: ["POST"]
    });

    fastify.route({
        url: url_path_memory_db,
        handler: handlerMemoryDBGet,
        method: ["GET"]
    });
    
}
