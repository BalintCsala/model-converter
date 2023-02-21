import { loadImage, Image, createCanvas, Canvas } from "canvas";

const MIN_TEXTURE_SIZE = 16;
const MAX_ATLAS_SIZE = 32768;
const GRID_WIDTH = MAX_ATLAS_SIZE / MIN_TEXTURE_SIZE;

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

export function encodeLocation(location: TextureLocation) {
    let data = (Math.round(Math.log2(location.size / MIN_TEXTURE_SIZE)) << 20) | (location.x << 10) | location.y;
    return [
        data & 0xFF,
        (data >> 8) & 0xFF,
        (data >> 16) & 0xFF,
        (data >> 24) & 0xFF,
    ];
}

function createPlaceholder(size: number, color: [number, number, number]) {
    const canvas = createCanvas(size, size);
    const context = canvas.getContext("2d");
    context.fillStyle = `rgb(${color})`;
    context.fillRect(0, 0, size, size);
    return canvas;
}

export class Atlas {

    private textures = new Map<string, Texture>();
    private width = 0;
    private height = 0;

    public locations = new Map<string, TextureLocation>();

    public async addTexture(name: string) {
        if (this.textures.has(name))
            return;

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

    private findPlace(places: boolean[], size: number) {
        const requiredPlaces = size / MIN_TEXTURE_SIZE;
        for (let i = 0; i < GRID_WIDTH; i++) {
            for (let j = 0; j < 2 * i + 1; j++) {
                const x = Math.min(i, j);
                const y = i - Math.max(0, j - i);

                let foundX = false;
                for (let dx = 0; dx < requiredPlaces; dx++) {
                    let foundY = false;
                    for (let dy = 0; dy < requiredPlaces; dy++) {
                        if (places[x + dx + (y + dy) * GRID_WIDTH]) {
                            foundY = true;
                            break;
                        }
                    }

                    if (foundY) {
                        foundX = true;
                        break;
                    }
                }

                if (foundX)
                    continue;

                for (let dx = 0; dx < requiredPlaces; dx++) {
                    for (let dy = 0; dy < requiredPlaces; dy++) {
                        places[x + dx + (y + dy) * GRID_WIDTH] = true;
                    }
                }

                return { x, y, size: requiredPlaces };
            }
        }

        throw new Error("Atlas is full!");
    }

    public generateLocations() {
        const places: boolean[] = [];

        Array.from(this.textures.entries())
            .sort(([, tex1], [, tex2]) => tex2.size - tex1.size)
            .forEach(([name, texture]) => {
                const location = this.findPlace(places, texture.size);
                this.locations.set(name, location);
                this.width = Math.max(this.width, (location.x + location.size) * MIN_TEXTURE_SIZE);
                this.height = Math.max(this.height, (location.y + location.size) * MIN_TEXTURE_SIZE);
            });
    }

    public generateAtlas() {
        const canvas = createCanvas(this.width * 2, this.height * 2);
        const context = canvas.getContext("2d");

        console.log(this.width, this.height);


        for (const [name, location] of this.locations.entries()) {
            const texture = this.textures.get(name)!;
            context.drawImage(
                texture.albedo,
                0, 0, location.size * MIN_TEXTURE_SIZE, location.size * MIN_TEXTURE_SIZE,
                location.x * MIN_TEXTURE_SIZE, location.y * MIN_TEXTURE_SIZE, location.size * MIN_TEXTURE_SIZE, location.size * MIN_TEXTURE_SIZE
            );
            context.drawImage(
                texture.normal,
                0, 0, location.size * MIN_TEXTURE_SIZE, location.size * MIN_TEXTURE_SIZE,
                location.x * MIN_TEXTURE_SIZE + this.width, location.y * MIN_TEXTURE_SIZE, location.size * MIN_TEXTURE_SIZE, location.size * MIN_TEXTURE_SIZE
            );
            context.drawImage(
                texture.specular,
                0, 0, location.size * MIN_TEXTURE_SIZE, location.size * MIN_TEXTURE_SIZE,
                location.x * MIN_TEXTURE_SIZE, location.y * MIN_TEXTURE_SIZE + this.height, location.size * MIN_TEXTURE_SIZE, location.size * MIN_TEXTURE_SIZE
            );
        }

        return canvas;
    }

}