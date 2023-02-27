import { Quaternion, Vector3, Matrix4, Vector4 } from '@math.gl/core';
import { decode, encode, ImageData } from "fast-png";
import fs from "fs";

const image = decode(fs.readFileSync("output/model_data.png"));

function read(x: number, y: number) {
    return [
        image.data[(x + y * image.width) * 4 + 0],
        image.data[(x + y * image.width) * 4 + 1],
        image.data[(x + y * image.width) * 4 + 2],
        image.data[(x + y * image.width) * 4 + 3],
    ];
}

const projectionMatrix = new Matrix4().perspective({ fovy: Math.PI / 4, aspect: 1, near: 0.1, far: 1000 });
const viewMatrix = new Matrix4().lookAt({ eye: [0.1, 3, 3], center: [0, 0, 0], up: [0, 1, 0] });

function drawTriangle(colors: number[], depthmap: number[], p1: Vector3, p2: Vector3, p3: Vector3, color: number[]) {
    let pix1 = new Vector4(...p1, 1.0).transform(viewMatrix).transform(projectionMatrix);
    let pix2 = new Vector4(...p2, 1.0).transform(viewMatrix).transform(projectionMatrix);
    let pix3 = new Vector4(...p3, 1.0).transform(viewMatrix).transform(projectionMatrix);
    pix1 = new Vector4().fromArray(pix1.map((x, i) => Math.round(i >= 2 ? x : x / pix1[3] * 256.0 + 256.0)));
    pix2 = new Vector4().fromArray(pix2.map((x, i) => Math.round(i >= 2 ? x : x / pix2[3] * 256.0 + 256.0)));
    pix3 = new Vector4().fromArray(pix3.map((x, i) => Math.round(i >= 2 ? x : x / pix3[3] * 256.0 + 256.0)));

    let top, middle, bottom;
    if (pix1[1] < pix2[1]) {
        if (pix1[1] < pix3[1]) {
            top = pix1;
            if (pix2[1] < pix3[1]) {
                middle = pix2;
                bottom = pix3;
            } else {
                middle = pix3;
                bottom = pix2;
            }
        } else {
            top = pix3;
            middle = pix1;
            bottom = pix2;
        }
    } else {
        if (pix2[1] < pix3[1]) {
            top = pix2;
            if (pix1[1] < pix3[1]) {
                middle = pix1;
                bottom = pix3;
            } else {
                middle = pix3;
                bottom = pix1;
            }
        } else {
            top = pix3;
            middle = pix2;
            bottom = pix1;
        }
    }

    let longSlopeX = (bottom[0] - top[0]) / (bottom[1] - top[1]);
    let shortSlope1X = (middle[0] - top[0]) / (middle[1] - top[1]);
    let shortSlope2X = (bottom[0] - middle[0]) / (bottom[1] - middle[1]);
    let longSlopeZ = (bottom[2] - top[2]) / (bottom[1] - top[1]);
    let shortSlope1Z = (middle[2] - top[2]) / (middle[1] - top[1]);
    let shortSlope2Z = (bottom[2] - middle[2]) / (bottom[1] - middle[1]);

    let x1 = top[0];
    let z1 = top[2];
    let x2 = top[0];
    let z2 = top[2];

    for (let y = top[1]; y < middle[1]; y++) {
        let zSlope = (z2 - z1) / (x2 - x1);
        let z = x1 < x2 ? z1 : z2;
        for (let x = Math.min(x1, x2); x < Math.max(x1, x2); x++) {
            let index = Math.round(x) + Math.round(y) * 512;
            if (depthmap[index] > z) {
                depthmap[index] = z;
                colors[index * 4 + 0] = color[0];
                colors[index * 4 + 1] = color[1];
                colors[index * 4 + 2] = color[2];
                colors[index * 4 + 3] = 255;
            }
            z += zSlope;
        }

        x1 += shortSlope1X;
        z1 += shortSlope1Z;
        x2 += longSlopeX;
        z2 += longSlopeZ;
    }

    for (let y = middle[1]; y < bottom[1]; y++) {
        let zSlope = (z2 - z1) / (x2 - x1);
        let z = z1;
        for (let x = Math.min(x1, x2); x < Math.max(x1, x2); x++) {
            let index = Math.round(x) + Math.round(y) * 512;
            if (depthmap[index] > z) {
                depthmap[index] = z;
                colors[index * 4 + 0] = color[0];
                colors[index * 4 + 1] = color[1];
                colors[index * 4 + 2] = color[2];
                colors[index * 4 + 3] = 255;
            }
            z += zSlope;
        }

        x1 += shortSlope2X;
        z1 += shortSlope2Z;
        x2 += longSlopeX;
        z2 += longSlopeZ;
    }
}

const ChosenRow = 1178;
const triangleIndices = [
    [0, 1, 2],
    [0, 2, 3],
    [1, 5, 6],
    [1, 6, 2],
    [5, 4, 7],
    [5, 7, 6],
    [4, 0, 3],
    [4, 3, 7],
    [3, 2, 6],
    [3, 6, 7],
    [4, 5, 1],
    [4, 1, 0],
];

const count = read(0, ChosenRow)[0];

const depthmap = new Array(512 * 512).fill(Infinity);
const colors = new Array(512 * 512 * 4).fill(0);

for (let i = 0; i < count; i++) {
    const from = read(i * 9 + 1, ChosenRow).slice(0, 3).map(x => x / 255 * 3 - 1);
    const to = read(i * 9 + 2, ChosenRow).slice(0, 3).map(x => x / 255 * 3 - 1);
    const color = [Math.random() * 255, Math.random() * 255, Math.random() * 255]
    
    const quaternion = new Quaternion().fromArray(read(i * 9 + 3, ChosenRow).map(x => x / 255));
    for (let j = 0; j < 6; j++) {
        let location = read(i * 9 + 4 + j, ChosenRow);
        
        if (location[3] > 200)
            continue;

        let locationIndex = location[0] + (location[1] << 8) + (location[2] << 16);
        let x = locationIndex & 1023;
        let y = (locationIndex >> 10) & 1023;
        let size = (2 ** (locationIndex >> 20)) * 16;

        let positions = [
            new Vector3(from[0], from[1], from[2]),
            new Vector3(to[0], from[1], from[2]),
            new Vector3(to[0], to[1], from[2]),
            new Vector3(from[0], to[1], from[2]),
            new Vector3(from[0], from[1], to[2]),
            new Vector3(to[0], from[1], to[2]),
            new Vector3(to[0], to[1], to[2]),
            new Vector3(from[0], to[1], to[2]),
        ].map(x => x.transformByQuaternion(quaternion));

        triangleIndices.forEach(([i1, i2, i3]) => {
            drawTriangle(colors, depthmap, positions[i1], positions[i2], positions[i3], color);
        });

    }
}

const png: ImageData = {
    width: 512,
    height: 512,
    data: new Uint8Array(colors),
    channels: 4,
    depth: 8,
};

fs.writeFileSync("out.png", encode(png));