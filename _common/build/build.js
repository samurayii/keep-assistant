const child_process = require("child_process");
const path = require("path");
const pkg = require(path.resolve(process.cwd(),`package.json`));

if (process.env["BUILD_IMAGE"] === undefined) {
    console.error("Error: Environment 'BUILD_IMAGE' not set");
    process.exit(1);
}

const docker_image = process.env["BUILD_IMAGE"];
const command = `docker build -t ${docker_image}:${pkg.version} .`;

console.log(`cwd:  ${__dirname}`);
console.log(`exec:  ${command}`);

child_process.spawn(command, [], {
    shell: true,
    stdio: ["inherit", "inherit", "inherit"]
});