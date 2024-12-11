export type SerializedChildNodes = [id: string, parents: string[]][];

export abstract class ChildNode<T extends { parents?: T[] }, S extends SerializedChildNodes> {
    protected parents = new Map<string, string[]>();

    protected abstract assertEntryId(entryOrId: T | string): string;

    has(entryOrId: T | string): boolean {
        const id = this.assertEntryId(entryOrId);

        return this.parents.has(id);
    }

    getParents(entryOrId: T | string): (T | string)[] {
        const id = this.assertEntryId(entryOrId);

        const parents: (T | string)[] = [];

        if (typeof entryOrId !== 'string' && entryOrId.parents) {
            parents.push(...entryOrId.parents);
        }

        if (this.parents.has(id)) {
            parents.push(...this.parents.get(id)!);
        }

        return parents;
    }

    setParents(entryOrId: T | string, parents: string[]) {
        const id = this.assertEntryId(entryOrId);
        this.parents.set(id, parents);

        return parents;
    }

    addParents(entryOrId: T | string, parents: string[]) {
        const currentParents = this.parents.get(this.assertEntryId(entryOrId)) ?? [];
        this.parents.set(this.assertEntryId(entryOrId), currentParents);

        for (const parent of parents) {
            if (!currentParents.includes(parent)) {
                currentParents.push(parent);
            }
        }
    }

    getParentsRecursive(entryOrId: T | string): string[] {
        const stack = [entryOrId];
        const result: string[] = [];

        while (true) {
            const e = stack.pop();
            if (undefined === e) break;
            if (result.includes(this.assertEntryId(e))) continue;
            result.push(this.assertEntryId(e));

            stack.push(...this.getParents(e).toReversed());
        }

        return result;
    }

    toJSON(): S {
        return [...this.parents.entries()] as S;
    }

    importJSON(json: S | unknown) {
        if (!Array.isArray(json)) {
            throw new Error(`Invalid serialize [${Object.getPrototypeOf(this).constructor.name}]: ${JSON.stringify(json)}`);
        }
        for (const entry of json) {
            if (!Array.isArray(entry) || entry.length !== 2) {
                throw new Error(`Invalid serialize [${Object.getPrototypeOf(this).constructor.name}] entry: ${JSON.stringify(entry)}`);
            }

            const [role, parents] = entry as [unknown, unknown];
            if (typeof role !== 'string' || !Array.isArray(parents) || parents.some(p => typeof p !== 'string')) {
                throw new Error(`Invalid serialize [${Object.getPrototypeOf(this).constructor.name}] entry: ${JSON.stringify(entry)}`);
            }
            this.setParents(role, parents);
        }
        return this;
    }
}
