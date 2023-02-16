import { ModelReference } from "./model";

export type Variant = ModelReference | ModelReference[];

export type Variants = {
    variants: {[key: string]: Variant},    
};
