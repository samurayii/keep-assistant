import { ValidateFunction } from "ajv";
import chalk from "chalk";

export function AjvErrorHelper (validate: ValidateFunction): string {

    let result = "";

    for (const item of validate.errors) {
        result = `${result}  - Key ${chalk.yellow(item.instancePath.replace(/^\//, ""))} ${item.message}`;
        if (item.keyword === "additionalProperties") {
            result = `${result}. Key ${chalk.red(item.params?.["additionalProperty"])} superfluous`;
        }
        result = `${result}\n`;
    }

    return result;

}