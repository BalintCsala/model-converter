import { File } from "./file";

export enum Rotation {
    Deg0 = 0,
    Deg90 = 90,
    Deg180 = 180,
    Deg270 = 270,
}

export type ModelReference = {
    model: string,
    x?: Rotation,
    y?: Rotation,
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

export enum RotationAxis {
    x = "x",
    y = "y",
    z = "z",
};

export type FaceData = {
    uv?: [number, number, number, number],
    texture: string,
    cullface?: Face,
    rotation?: number,
    tintindex: string,
};

export type Element = {
    from: [number, number, number],
    to: [number, number, number],
    rotation?: {
        origin?: [number, number, number],
        axis: RotationAxis,
        angle: number,
        rescale?: boolean,
    },
    shade?: boolean,
    faces: { [key in Face]: FaceData };
};

export type Model = {
    parent?: string,
    ambientocclusion?: boolean,
    textures: { [key: string]: string; },
    elements?: Element[],
};

export type ModelStorage = Map<string, File<Model>>;

const rotateX = {
    0: (element: Element) => element,
    90: (element: Element) => {
        let [x1, y1, z1] = element.from;
        let [x2, y2, z2] = element.to;
        element.from = [x1, z1, 16 - y2];
        element.to = [x2, z2, 16 - y1];

        return element;
    },
    180: (element: Element) => {
        let [x1, y1, z1] = element.from;
        let [x2, y2, z2] = element.to;
        element.from = [x1, 16 - y2, 16 - z2];
        element.to = [x2, 16 - y1, 16 - z1];

        return element;
    },
    270: (element: Element) => {
        let [x1, y1, z1] = element.from;
        let [x2, y2, z2] = element.to;
        element.from = [x1, 16 - z2, y1];
        element.to = [x2, 16 - z1, y2];

        return element;
    },
};

const rotateY = {
    0: (element: Element) => element,
    90: (element: Element) => {
        let [x1, y1, z1] = element.from;
        let [x2, y2, z2] = element.to;
        element.from = [16 - z2, y1, x1];
        element.to = [16 - z1, y2, x2];

        return element;
    },
    180: (element: Element) => {
        let [x1, y1, z1] = element.from;
        let [x2, y2, z2] = element.to;
        element.from = [16 - x2, y1, 16 - z2];
        element.to = [16 - x1, y2, 16 - z1];

        return element;
    },
    270: (element: Element) => {
        let [x1, y1, z1] = element.from;
        let [x2, y2, z2] = element.to;
        element.from = [z1, y1, 16 - x2];
        element.to = [z2, y2, 16 - x1];

        return element;
    },
};

const xRotationFaceMapping = {
    0: {
        down: "down",
        up: "up",
        south: "south",
        north: "north",
        east: "east",
        west: "west",
    },
    90: {
        east: "east",
        west: "west",
        down: "south",
        up: "north",
        north: "down",
        south: "up",
    },
    180: {
        east: "east",
        west: "west",
        down: "up",
        up: "down",
        north: "south",
        south: "north",
    },
    270: {
        down: "north",
        up: "south",
        west: "west",
        east: "east",
        north: "up",
        south: "down",
    },
};

const yRotationFaceMapping = {
    0: {
        down: "down",
        up: "up",
        south: "south",
        north: "north",
        east: "east",
        west: "west",
    },
    90: {
        down: "down",
        up: "up",
        north: "east",
        east: "south",
        south: "west",
        west: "north",
    },
    180: {
        down: "down",
        up: "up",
        north: "south",
        south: "north",
        east: "west",
        west: "east",
    },
    270: {
        down: "down",
        up: "up",
        north: "west",
        west: "south",
        south: "east",
        east: "north",
    },
};

const uvRotationMapping = {
    0: (uv: [number, number, number, number]) => uv,
    90: (uv: [number, number, number, number]) => [uv[1], 16 - uv[2], uv[3], 16 - uv[0]],
    180: (uv: [number, number, number, number]) => [16 - uv[2], 16 - uv[3], 16 - uv[0], 16 - uv[1]],
    270: (uv: [number, number, number, number]) => [16 - uv[3], uv[0], 16 - uv[1], uv[2]],
};

const xRotationMapping = {
    0: {
        [RotationAxis.x]: RotationAxis.x,
        [RotationAxis.y]: RotationAxis.y,
        [RotationAxis.z]: RotationAxis.z,
    },
    90: {
        [RotationAxis.x]: RotationAxis.x,
        [RotationAxis.y]: RotationAxis.z,
        [RotationAxis.z]: RotationAxis.y,
    },
    180: {
        [RotationAxis.x]: RotationAxis.x,
        [RotationAxis.y]: RotationAxis.y,
        [RotationAxis.z]: RotationAxis.z,
    },
    270: {
        [RotationAxis.x]: RotationAxis.x,
        [RotationAxis.y]: RotationAxis.z,
        [RotationAxis.z]: RotationAxis.y,
    },
};

const yRotationMapping = {
    0: {
        [RotationAxis.x]: RotationAxis.x,
        [RotationAxis.y]: RotationAxis.y,
        [RotationAxis.z]: RotationAxis.z,
    },
    90: {
        [RotationAxis.x]: RotationAxis.z,
        [RotationAxis.y]: RotationAxis.y,
        [RotationAxis.z]: RotationAxis.x,
    },
    180: {
        [RotationAxis.x]: RotationAxis.x,
        [RotationAxis.y]: RotationAxis.y,
        [RotationAxis.z]: RotationAxis.z,
    },
    270: {
        [RotationAxis.x]: RotationAxis.z,
        [RotationAxis.y]: RotationAxis.y,
        [RotationAxis.z]: RotationAxis.x,
    },
};

const xRotateOrigin = {
    0: (origin: [number, number, number]) => origin,
    90: (origin: [number, number, number]) => [origin[0], origin[2], 16 - origin[1]],
    180: (origin: [number, number, number]) => [origin[0], 16 - origin[1], 16 - origin[2]],
    270: (origin: [number, number, number]) => [origin[0], 16 - origin[2], origin[1]],
};

const yRotateOrigin = {
    0: (origin: [number, number, number]) => origin,
    90: (origin: [number, number, number]) => [16 - origin[2], origin[1], origin[0]],
    180: (origin: [number, number, number]) => [16 - origin[0], origin[1], 16 - origin[2]],
    270: (origin: [number, number, number]) => [origin[2], origin[1], 16 - origin[0]],
};

export function stripModelName(name: string) {
    return name.replace(/(minecraft:)?(block\/)?/, "");
}

export function getAbsoluteModel(model: Model, models: Map<string, File<Model>>) {
    const result = model;
    while (!result.elements) {
        if (!result.parent)
            throw new Error(`No elements or parent for model`);

        const parentName = stripModelName(result.parent);

        if (!models.has(parentName))
            throw new Error(`No model with name: ${parentName}`);

        const parent = models.get(parentName)!.data;
        result.textures = { ...parent.textures, ...result.textures };
        result.elements = parent.elements;
        result.parent = parent.parent;
    }

    return result;
}

export function applyReferenceRotation(reference: ModelReference, models: Map<string, File<Model>>) {
    const baseModel = models.get(stripModelName(reference.model))!.data;
    let absoluteModel: Model;
    try {
        absoluteModel = getAbsoluteModel(baseModel, models);
    } catch (ex) {
        return baseModel;
    }

    absoluteModel = JSON.parse(JSON.stringify(absoluteModel)) as Model;
    if (!absoluteModel.elements)
        return absoluteModel;

    const xRotator = rotateX[reference.x ?? 0];
    const yRotator = rotateY[reference.y ?? 0];
    const xFaceMapping = xRotationFaceMapping[reference.x ?? 0]!;
    const yFaceMapping = yRotationFaceMapping[reference.y ?? 0]!;
    const xUVRotator = uvRotationMapping[reference.x ?? 0] as (uv: [number, number, number, number]) => [number, number, number, number];
    const yUVRotator = uvRotationMapping[reference.y ?? 0] as (uv: [number, number, number, number]) => [number, number, number, number];
    const xRotationAxis = xRotationMapping[reference.x ?? 0] as { [key in RotationAxis]: RotationAxis };
    const yRotationAxis = yRotationMapping[reference.y ?? 0] as { [key in RotationAxis]: RotationAxis };
    const xOriginRotator = xRotateOrigin[reference.x ?? 0] as (origin: [number, number, number]) => [number, number, number];
    const yOriginRotator = yRotateOrigin[reference.y ?? 0] as (origin: [number, number, number]) => [number, number, number];

    absoluteModel.elements = absoluteModel.elements.map(element => {
        const rotated = yRotator(xRotator(element));

        const newFaces: { [key in Face]?: FaceData } = {};
        for (let key in rotated.faces) {
            const face = rotated.faces[key as Face];
            newFaces[yFaceMapping[xFaceMapping[key as Face] as Face] as Face] = face;

            if (face.cullface) {
                face.cullface = yFaceMapping[xFaceMapping[face.cullface] as Face] as Face;
            }

            if (face.uv) {
                if (key === Face.up || key === Face.down) {
                    face.uv = yUVRotator(face.uv);
                } else if (key === Face.east || key === Face.west) {
                    face.uv = xUVRotator(face.uv);
                }
            }
        }
        rotated.faces = newFaces as { [key in Face]: FaceData };

        if (rotated.rotation) {
            rotated.rotation.axis = yRotationAxis[xRotationAxis[rotated.rotation.axis]];
            if (rotated.rotation.origin) {
                rotated.rotation.origin = yOriginRotator(xOriginRotator(rotated.rotation.origin));
            }
            
            if (reference.x === 90 || reference.x === 180) {
                rotated.rotation.angle *= -1;
            }

            if (reference.y === 90 || reference.y === 180) {
                rotated.rotation.angle *= -1;
            }
        }

        return rotated;
    });

    return absoluteModel;
}

function renameTextures(model: Model, suffix: string) {
    const result = JSON.parse(JSON.stringify(model)) as Model;

    for (let key in result.textures) {
        if (result.textures[key].startsWith("#") && !result.textures[key].endsWith("__")) {
            result.textures[key] += suffix;
        }

        if (key === "particle")
            continue;

        result.textures[key + suffix] = result.textures[key];
        delete result.textures[key];
    }

    if (!result.elements)
        return result;

    result.elements = result.elements.map(element => {
        for (let key in element.faces) {
            const texture = element.faces[key as Face].texture;
            if (texture.startsWith("#") && !texture.endsWith("__")) {
                element.faces[key as Face].texture += suffix;
            }
        }

        return element;
    });

    return result;
}

export function mergeModels(models: Model[]) {
    let renamedModels = models.map((model, i) => renameTextures(model, `_part${i}__`));
    const result = renamedModels[0];
    for (let i = 1; i < renamedModels.length; i++) {
        result.textures = { ...renamedModels[i].textures, ...result.textures };
        result.elements = [...(result.elements ?? []), ...(renamedModels[i].elements ?? [])];
    }

    return result;
}

export function simplifyModel(model: Model) {
    delete model.parent;
    
    const newTextures: { [key: string]: string } = {};
    const mapping = new Map<string, string>();
    for (let key in model.textures) {
        let texturePath = model.textures[key];
        while (texturePath.startsWith("#")) {
            texturePath = model.textures[texturePath.replace("#", "")];
        }
        if (key === "particle") {
            newTextures[key] = texturePath;
        } else {
            const newKey = texturePath.replace(/(minecraft:)?(block\/)?/, "");
            newTextures[newKey] = texturePath;
            mapping.set(key, newKey);
        }
    }
    model.textures = newTextures;
    
    model.elements?.forEach(element => {
        for (let key in element.faces) {
            const face = element.faces[key as Face];
            face.texture = "#" + mapping.get(face.texture.replace("#", ""))!;
        }  
    });
}