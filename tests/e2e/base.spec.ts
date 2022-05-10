import { LoggerEventEmitter } from "logger-event-emitter";
import { buildApiServer } from "../../src/http/build_api_server";
import { IAppConfig } from "../../src/lib/config.interfaces";
import * as superagent from "superagent";
import { expect } from "chai";

describe("Base API", async function() {

    const config: IAppConfig = {
        logger: {
            level: "trace",  
            name: "testing-logger",        
            enable: false,    
            timestamp: "none"
        },
        api: {
            enable: true,    
            logging: false,
            hostname: "0.0.0.0",
            port: 3001,
            prefix: "/api",
            backlog: 511,
            connection_timeout: 0,
            keep_alive_timeout: 5000,
            body_limit: "1mb",
            trust_proxy: false
        }
    };

    const logger = new LoggerEventEmitter(config.logger);
    const api_server = buildApiServer(config.api, logger);

    before( (done) => {
        api_server.listen({
            port: config.api.port,
            host: config.api.hostname,
            backlog: config.api.backlog
        }, () => {
            done();
        });
    });

    after( async () => {
        await api_server.close();
    });

    it("/_ping", async function () {
        const response = await superagent(`http://localhost:${config.api.port}/_ping`);  
        expect(response.statusCode).to.equal(200);        
    });

    it("/_ping (prefix /v1)", async function () {
        const response = await superagent(`http://localhost:${config.api.port}${config.api.prefix}/v1/_ping`);  
        expect(response.statusCode).to.equal(200);        
    });

    it("/healthcheck", async function () {
        const response = await superagent(`http://localhost:${config.api.port}/healthcheck`);  
        expect(response.statusCode).to.equal(200);        
    });

    it("/healthcheck (prefix /v1)", async function () {
        const response = await superagent(`http://localhost:${config.api.port}${config.api.prefix}/v1/healthcheck`);  
        expect(response.statusCode).to.equal(200);        
    });

    it("/healthcheck/readiness", async function () {
        const response = await superagent(`http://localhost:${config.api.port}/healthcheck/readiness`);  
        expect(response.statusCode).to.equal(200);        
    });

    it("/healthcheck/readiness (prefix /v1)", async function () {
        const response = await superagent(`http://localhost:${config.api.port}${config.api.prefix}/v1/healthcheck/readiness`);  
        expect(response.statusCode).to.equal(200);        
    });

    it("/healthcheck/liveness", async function () {
        const response = await superagent(`http://localhost:${config.api.port}/healthcheck/readiness`);  
        expect(response.statusCode).to.equal(200);        
    });

    it("/healthcheck/liveness (prefix /v1)", async function () {
        const response = await superagent(`http://localhost:${config.api.port}${config.api.prefix}/v1/healthcheck/readiness`);  
        expect(response.statusCode).to.equal(200);        
    });

});