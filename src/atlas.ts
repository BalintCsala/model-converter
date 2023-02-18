import { loadImage, Image, createCanvas, Canvas } from "canvas";

type Texture = {
    size: number,
    albedo: Image,
    normal: Image | Canvas,
    specular: Image | Canvas,
};

type TextureLocation = {
    x: number,
    y: number,
    size: number,
};

function createPlaceholder(size: number, color: [number, number, number]) {
    const canvas = createCanvas(size, size);
    const context = canvas.getContext("2d");
    context.fillStyle = `rgb(${color})`;
    context.fillRect(0, 0, size, size);
    return canvas;
}

export class Atlas {

    private textures = new Map<string, Texture>();
    private locations = new Map<string, TextureLocation>();

    constructor() {
    }

    async addImage(name: string) {
        const albedo = await loadImage(`data/textures/block/${name}.png`);
        const size = Math.min(albedo.width, albedo.height);

        const texture: Texture = {
            albedo,
            normal: await loadImage(`data/textures/block/${name}_n.png`).catch(() => createPlaceholder(size, [127, 127, 0])),
            specular: await loadImage(`data/textures/block/${name}_s.png`).catch(() => createPlaceholder(size, [0, 10, 0])),
            size,
        };

        this.textures.set(name, texture);
    }

    public getTextureLocation(name: string) {
        return this.locations.get(name);
    }

}