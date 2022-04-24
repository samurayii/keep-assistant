/* eslint-disable @typescript-eslint/no-var-requires */
const { compileFromFile } = require("json-schema-to-typescript");
const path = require("path");
const fs = require("fs");

const config_path = process.argv[2];
const full_config_path = path.resolve(process.cwd(), config_path);

if (fs.existsSync(full_config_path) === false) {
    console.error(`Config file ${full_config_path} not found`);
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(full_config_path));

const getPrefix = (folder_path, prefix) => {

    const basename = path.basename(folder_path);
    const args = basename.replace(/(_|-)/g, " ").split(" ");

    for (const element of args) {
        if (element.length > 0) {
            prefix = `${prefix}${element[0].toUpperCase() + element.slice(1)}`;
        }
    }

    return prefix;
};

const compileInterfaceFolder = async (target_path, destination_path, prefix) => {

    const files = await fs.promises.readdir(target_path);

    for (const file_path of files) {

        const full_file_path = path.resolve(target_path, file_path);

        const stat = fs.statSync(full_file_path);
    
        if (stat.isDirectory() === true) {
            await compileInterfaceFolder(full_file_path, destination_path, getPrefix(full_file_path, prefix));
        } else {
            await compileInterfaceFile(full_file_path, destination_path, prefix);
        }

    }

};

const compileInterfaceFile = async (target_path, destination_path, prefix = "I") => {
    
    let body = await compileFromFile(target_path, config.compiler);

    body = body.replace(/interface /g, `interface ${prefix}`);

    if (fs.existsSync(destination_path) === false) {
        fs.writeFileSync(destination_path, `${body}\n`);
    } else {
        fs.appendFileSync(destination_path, `${body}\n`);
    }

};

const compileSchema = async () => {

    for (const target_config of config.targets) {

        const full_target_path = path.resolve(process.cwd(), target_config.target);
        const full_destination_path = path.resolve(process.cwd(), target_config.destination);
    
        if (fs.existsSync(full_target_path) === false) {
            console.error(`Target path ${full_target_path} not found`);
            process.exit(1);
        }

        if (fs.existsSync(full_destination_path) === true) {
            fs.unlinkSync(full_destination_path);
        }
    
        const stat = fs.statSync(full_target_path);
    
        if (stat.isDirectory() === true) {
            await compileInterfaceFolder(full_target_path, full_destination_path, getPrefix(full_target_path.replace(full_target_path, "").replace(/^(\/|\\)/,""), target_config.prefix));
        } else {
            await compileInterfaceFile(full_target_path, full_destination_path, target_config.prefix);
        }
    
    }

};

compileSchema();