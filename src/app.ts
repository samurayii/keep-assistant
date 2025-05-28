import config from "./lib/init";
import chalk from "chalk";
import { LoggerEventEmitter } from "logger-event-emitter";
import { buildApiServer } from "./http/build_api_server";
import { Metrics } from "./lib/metrics";
import { HealthController } from "./lib/health-controller";
import { $Singleton } from "./lib/dependency-injection";
import { Scheduler } from "./lib/scheduler";

const logger = new LoggerEventEmitter(config.logger);

logger.debug(`\nCONFIG:\n${JSON.stringify(config, null, 4)}`);
logger.debug("Initialization application");

const metrics = new Metrics(config.metrics, logger.child("metrics"));
const health_controller = new HealthController(logger.child("health-controller"));

$Singleton(Metrics.name, undefined, () => {return metrics;});
$Singleton(HealthController.name, undefined, () => {return health_controller;});

const scheduler = new Scheduler(config.scheduler, logger.child("scheduler"));

$Singleton(Scheduler.name, undefined, () => {return scheduler;});

const bootstrap = async () => {

    try {

        const api_server_logger = logger.child("api-server");
        const api_server = buildApiServer(config.api, api_server_logger);

        await metrics.run();

        metrics.createGauge("healthy", "Healthcheck status");

        const id_interval = setInterval( () => {
            metrics.add("healthy", health_controller.healthy ? 1 : 0);
        }, 1000);

        if (config.api.enable === true) {

            api_server.listen({
                port: config.api.port,
                host: config.api.hostname,
                backlog: config.api.backlog
            }, (error: Error, address: string) => {
                if (error !== null) {
                    api_server_logger.fatal(`Error start server. Error: ${chalk.red(error)}`);
                    process.exit(1);
                }
                api_server_logger.info(`Server listening on ${chalk.cyan(address)}`);
            });
        }

        const stop_app = async () => {
            clearInterval(id_interval);
            api_server.close();
            setImmediate( () => {
                process.exit();
            });
        };

        process.on("SIGTERM", () => {
            logger.info(`Signal ${chalk.cyan("SIGTERM")} received`);
            stop_app();
        });

        process.on("SIGINT", () => {
            logger.info(`Signal ${chalk.cyan("SIGINT")} received`);
            stop_app();
        });

    } catch (error) {
        logger.fatal(`Error application start.\n${error.stack}`);
        process.exit(1);
    }

};

bootstrap();