import fs from "fs";

export type File<T> = {
    name: string,
    data: T,
};

export function readFile<T>(path: string, name: string) {
    return {
        name,
        data: JSON.parse(fs.readFileSync(path).toString()) as T,
    };
}
