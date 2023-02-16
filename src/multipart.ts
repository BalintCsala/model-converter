import { File, readFile } from "./file";
import { Model, ModelReference, getAbsoluteModel, mergeModels, stripModelName } from "./model";
import { Variants } from "./variants";

type Case = {[key: string]: string};

export type Multipart = {
    multipart: {
        when?: Case | {
            OR: Case[]
        },
        apply: ModelReference | ModelReference[]
    }[],
};

function checkMatch(combination: Case, base: Case) {
    for (let key in combination) {
        if (key in base && combination[key] !== base[key])
            return false;
    }
    return true;
}

function caseToVariant(combination: Case) {
    const parts = [];
    for (const key in combination) {
        parts.push(`${key}=${combination[key]}`);
    }
    return parts.join(",");
}


export function convertMultipartToVariant(blockstate: File<Multipart>, models: Map<string, File<Model>>) {
    const multipart = blockstate.data;
    const parts = multipart.multipart;
    
    const conditions = new Map<string, Set<string>>();
    parts.forEach(part => {
        if (!part.when)
            return;

        const cases = (part.when.OR instanceof Array) ? part.when.OR : [part.when as Case];
        cases.forEach(cas => {
            for (let key in cas) {
                if (!conditions.has(key)) {
                    conditions.set(key, new Set());
                }
                const value = cas[key];
                conditions.get(key)?.add(value);
                if (value === "true") {
                    conditions.get(key)?.add("false");
                }
            }
        });
    });

    const conditionEntries = [...conditions].map(([key, values]) => [key, Array.from(values)]) as [string, string[]][];
    let combinationCount = 1;
    conditionEntries.forEach(([, values]) => {
        combinationCount *= values.length;
    });

    let counter = 0;

    const combinations = [];
    while (counter < combinationCount) {
        let copy = counter; 
        const combination: {[key: string]: string} = {};
        conditionEntries.forEach(([key, values]) => {
            combination[key] = values[copy % values.length]; 
            copy = Math.floor(copy / values.length);
        });
        combinations.push(combination);
        counter++;
    }

    const generatedReferences = new Map<string, ModelReference>();
    const variants: File<Variants> = {
        name: blockstate.name,
        data: {
            variants: {}, 
        },
    };

    combinations.forEach(combination => {
        let key = "";
        const usedModels: ModelReference[] = [];
        parts.forEach(part => {
            if (!part.when) {
                key += "1";
                if (part.apply instanceof Array) {
                    usedModels.push(...part.apply);
                } else {
                    usedModels.push(part.apply);
                }
                return;
            }

            const cases = (part.when.OR instanceof Array) ? part.when.OR : [part.when as Case];
            const matches = cases.some(cas => checkMatch(combination, cas));
            if (!matches) {
                key += "0";
                return;
            }

            key += "1";
            if (part.apply instanceof Array) {
                usedModels.push(...part.apply);
            } else {
                usedModels.push(part.apply);
            }
        });

        const variantKey = caseToVariant(combination);
        if (!generatedReferences.has(key)) {
            const mergedModel = mergeModels(usedModels.map(reference => {
                const name = stripModelName(reference.model);
                return getAbsoluteModel(readFile<Model>(`data/models/block/${name}.json`, name).data, models);
            }));
            const name = `${blockstate.name}_generated_model_${generatedReferences.size}`;
            models.set(name, {name, data: mergedModel});
            generatedReferences.set(key, {model: name});
        } 
        variants.data.variants[variantKey] = generatedReferences.get(key)!;
    });

    return variants;
}
