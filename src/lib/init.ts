import { Command } from "commander";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";
import jtomler from "jtomler";
import json_from_schema from "json-from-default-schema";
import * as config_schema from "./schemes/config.json";
import { IAppConfig } from "./config.interfaces";
import { AjvErrorHelper } from "./tools/ajv_error_helper";
import { findPackage } from "./tools/find_package";

type TOptions = {
    config: string
}

const program = new Command();
const pkg = findPackage();

if (pkg === undefined) {
    console.error(`${chalk.bgRed(" FATAL ")} package.json not found`);
    process.exit(1);
}

program.version(`${pkg.name} version: ${pkg.version}`, "-v, --version", "output the current version.");
program.name(pkg.name);
program.option("-c, --config <type>", "Path to config file.");

program.parse(process.argv);

const options = program.opts<TOptions>();

if (process.env["TEMPLATE_CONFIG_PATH"] === undefined) {
	if (options.config === undefined) {
		console.error(`${chalk.bgRed(" FATAL ")} Not set --config key`);
		process.exit(1);
	}
} else {
	options.config = process.env["TEMPLATE_CONFIG_PATH"];
}

const full_config_path = path.resolve(process.cwd(), options.config);

if (!fs.existsSync(full_config_path)) {
    console.error(`${chalk.bgRed(" FATAL ")} Config file ${chalk.red(full_config_path)} not found`);
    process.exit(1);
}

let config: IAppConfig;

try {
    config = <IAppConfig>json_from_schema(jtomler.parseFileSync(full_config_path), config_schema);
} catch (error) {
    console.error(`${chalk.bgRed(" FATAL ")} Config file ${chalk.red(full_config_path)} parsing error. Error: ${chalk.red(error.message)}`);
    process.exit(1);
}

const ajv = new Ajv({
    allErrors: true, 
    strict: false
});
const validate = ajv.compile(config_schema);

if (validate(config) === false) {
    const error_text = AjvErrorHelper(validate);
    console.error(`${chalk.bgRed(" FATAL ")} Config schema errors:\n${error_text}`);
    process.exit(1);
}

config.api.prefix = `/${config.api.prefix.replace(/(^\/|\/$)/g,"")}`;

export default config;