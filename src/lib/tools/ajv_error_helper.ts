import Ajv from "ajv";
import chalk from "chalk";

export function AjvErrorHelper (validate: Ajv.ValidateFunction): string {

    let result = "";

    for (const item of validate.errors) {
        result = `${result}  - Key ${chalk.yellow(item.dataPath.replace(/^\./g, ""))} ${item.message}\n`;
    }

    return result;

}