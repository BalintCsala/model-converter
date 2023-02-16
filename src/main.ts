import fs from "fs";
import { convertMultipartToVariant, Multipart } from "./multipart";
import { Model } from "./model";
import { File, readFile } from "./file";

const models = new Map<string, File<Model>>();

fs.readdirSync("data/models/block")
    .forEach(file => models.set(file.replace(".json", ""), readFile<Model>(`data/models/block/${file}`, file.replace(".json", ""))));

const testFile = {
    name: "oak_fence",
    data: JSON.parse(fs.readFileSync("data/blockstates/oak_fence.json").toString()) as Multipart,
};

const variantFile = convertMultipartToVariant(testFile, models);

fs.mkdirSync("output/assets/minecraft/models/block", {recursive: true});
fs.mkdirSync("output/assets/minecraft/blockstates", {recursive: true});
[...models.values()].forEach(model => {
    fs.writeFileSync(`output/assets/minecraft/models/block/${model.name}.json`, JSON.stringify(model.data, null, 4));
});

fs.writeFileSync(`output/assets/minecraft/blockstates/${variantFile.name}.json`, JSON.stringify(variantFile.data, null, 4));
