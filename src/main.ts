import fs from "fs";
import { convertMultipartToVariant, Multipart } from "./multipart";
import { Model, simplifyModel } from './model';
import { File, readFile } from "./file";
import { applyReferences, Variants } from './variants';
import { Atlas } from './atlas';

const models = new Map<string, File<Model>>();
const generatedModels = new Map<string, File<Model>>();

fs.readdirSync("data/models/block")
    .forEach(file => models.set(file.replace(".json", ""), readFile<Model>(`data/models/block/${file}`, file.replace(".json", ""))));

let variants = fs.readdirSync("data/blockstates")
    .map(file => ({ name: file.replace(".json", ""), data: JSON.parse(fs.readFileSync(`data/blockstates/${file}`, "utf-8")) }))
    .map(file => {
        if (file.data.multipart)
            return convertMultipartToVariant(file as File<Multipart>, models);

        return file as File<Variants>;
    });

variants.forEach(variantFile => applyReferences(variantFile, models, generatedModels));

variants = variants.filter(variants => Object.keys(variants.data.variants).length > 0);

fs.mkdirSync("output/assets/minecraft/models/block", { recursive: true });
fs.mkdirSync("output/assets/minecraft/blockstates", { recursive: true });

fs.writeFileSync("output/pack.mcmeta", JSON.stringify({
    pack: {
        pack_format: 9,
        description: "Base shader",
    },
}));

const newModels = [...generatedModels.values()];
newModels
    .forEach(model => simplifyModel(model.data));
newModels
    .forEach(model => {
        fs.writeFileSync(`output/assets/minecraft/models/block/${model.name}.json`, JSON.stringify(model.data));
    });


const atlas = new Atlas();
fs.readdirSync("data/textures/block")
    .filter(file => file.endsWith("png") && !file.endsWith("_n.png") && !file.endsWith("_s.png"))
    .forEach(file => {
        const name = file.replace(".png", "");
        atlas.addImage(name);
    });

variants.forEach(variantFile => {
    fs.writeFileSync(`output/assets/minecraft/blockstates/${variantFile.name}.json`, JSON.stringify(variantFile.data));
});
