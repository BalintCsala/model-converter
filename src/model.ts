import { File } from "./file";

export type ModelReference = { 
    model: string,
    x?: number,
    y?: number,
    uvlock?: boolean,
    weight?: number,
};

export enum Face {
    down = "down",
    up = "up",
    south = "south",
    north = "north",
    east = "east",
    west = "west",
};

export type Model = {
    parent?: string,
    ambientocclusion?: boolean,
    textures: {[key: string]: string},
    elements?: {
        from: [number, number, number],
        to: [number, number, number],
        rotation?:  {
            origin?: [number, number, number],
            axis: "x" | "y" | "z",
            angle: number,
            rescale?: boolean,
        },
        shade?: boolean,
        faces: {[key in Face]: {
            uv: [number, number, number, number],
            texture: string,
            cullface?: Face,
            rotation?: number,
            tintindex: string,
        }}
    }[],
};

export function stripModelName(name: string) {
    return name.replace(/(minecraft:)?(block\/)?/, "");
}

export function getAbsoluteModel(model: Model, models: Map<string, File<Model>>) {
    const result = model;
    while (result.parent) {
        const parentName = stripModelName(result.parent);
        if (!models.has(parentName))
            throw new Error(`No model with name: ${parentName}`);

        const parent = models.get(parentName)!.data;
        result.textures = {...parent.textures, ...result.textures};
        result.elements = parent.elements;
        result.parent = parent.parent;
    }

    return result;
}

function renameTextures(model: Model, suffix: string) {
    for (let key in model.textures) {
        if (model.textures[key].startsWith("#") && !model.textures[key].endsWith("__")) {
            model.textures[key] += suffix;
        }

        if (key === "particle")
            continue;

        model.textures[key + suffix] = model.textures[key];
        delete model.textures[key];
    }

    if (!model.elements)
        return model;

    model.elements = model.elements.map(element => {
        for (let key in element.faces) {
            const texture = element.faces[key as Face].texture;
            if (texture.startsWith("#") && !texture.endsWith("__")) {
                element.faces[key as Face].texture += suffix;
            }
        }

        return element;
    });

    return model;
}

export function mergeModels(models: Model[]) {
    let renamedModels = models.map((model, i) => renameTextures(model, `_part${i}__`));
    const result = renamedModels[0];
    for (let i = 1; i < renamedModels.length; i++) {
        result.textures = {...renamedModels[i].textures, ...result.textures};
        result.elements = [...(result.elements ?? []), ...(renamedModels[i].elements ?? [])];
    }

    return result;
}
