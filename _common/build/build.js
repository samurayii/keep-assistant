const child_process = require("child_process");
const path = require("path");
const pkg = require(path.resolve(process.cwd(),`package.json`));

const docker_image = path.basename(process.cwd());
const command = `docker build -t ${docker_image}:${pkg.version} .`;

console.log(`cwd:  ${__dirname}`);
console.log(`exec:  ${command}`);

child_process.spawn(command, [], {
    shell: true,
    stdio: ["inherit", "inherit", "inherit"]
});