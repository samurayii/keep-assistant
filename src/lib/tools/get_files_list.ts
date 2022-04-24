import * as fs from "fs";
import * as path from "path";

export async function getFilesList (folder: string, files_list: string[]  = []): Promise<string[]> {

    const files = await fs.promises.readdir(folder);

    for (const file_path of files) {

        const full_file_path = path.resolve(folder, file_path);
        const stat = await fs.promises.stat(full_file_path);

        if (stat.isFile() === true) {
            files_list.push(full_file_path);
        } else {
            await getFilesList(full_file_path, files_list);
        }

    }

    return files_list;

}