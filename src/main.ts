import fs from "fs";
import { convertMultipartToVariant, Multipart } from "./multipart";
import { Model, simplifyModel, encodeModel } from './model';
import { File, readFile } from "./file";
import { applyReferences, Variants } from './variants';
import { Atlas } from './atlas';
import { ImageData, encode } from "fast-png";

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

/*newModels
    .forEach(model => {
        fs.writeFileSync(`output/assets/minecraft/models/block/${model.name}.json`, JSON.stringify(model.data));
    });

variants.forEach(variantFile => {
    fs.writeFileSync(`output/assets/minecraft/blockstates/${variantFile.name}.json`, JSON.stringify(variantFile.data));
});*/

(async () => {
    const atlas = new Atlas();
    await Promise.all(fs.readdirSync("data/textures/block")
        .filter(file => file.endsWith("png") && !file.endsWith("_n.png") && !file.endsWith("_s.png"))
        .map(async file => {
            const name = file.replace(".png", "");
            await atlas.addTexture(name);
        }));
        
    atlas.generateLocations();
    const canvas = atlas.generateAtlas();
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync("./output/atlas.png", buffer);
    
    const rows = newModels.map(model => encodeModel(model.data, atlas));
    const maxRowLength = Math.max(...rows.map(row => row.length));
    const data = rows.map(row => [...row, ...new Array(maxRowLength - row.length).fill(0)]).flat();
    const png: ImageData = {
        width: maxRowLength / 4,
        height: rows.length,
        data: new Uint8Array(data),
        channels: 4,
        depth: 8,
    };
    fs.writeFileSync("./output/model_data.png", encode(png));
})();