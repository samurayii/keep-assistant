const child_process = require("child_process");
const path = require("path");

const docker_image = path.basename(process.cwd());
const command = `docker push ${docker_image}:latest`;

console.log(`cwd:  ${__dirname}`);
console.log(`exec:  ${command}`);

child_process.spawn(command, [], {
    shell: true,
    stdio: ["inherit", "inherit", "inherit"]
});