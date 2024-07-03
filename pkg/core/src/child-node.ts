export type SerializedChildNodes = [id: string, parents: string[]][];

export abstract class ChildNode<T> {
    protected parents = new Map<string, string[]>();

    protected abstract assertEntryId(entryOrId: T | string): string;

    getParents(entryOrId: T | string): string[] {
        const id = this.assertEntryId(entryOrId);

        const parents = this.parents.get(id) ?? this.setParents(id, []);

        return parents;
    }

    setParents(entryOrId: T | string, parents: string[]) {
        const id = this.assertEntryId(entryOrId);
        this.parents.set(id, parents);

        return parents;
    }

    addParents(entryOrId: T | string, parents: string[]) {
        const currentParents = this.getParents(entryOrId);

        for (const parent of parents) {
            if (!currentParents.includes(parent)) {
                currentParents.push(parent);
            }
        }
    }

    getParentsRecursive(entryOrId: T | string): string[] {
        const stack = [this.assertEntryId(entryOrId)];
        const result: string[] = [];

        while (true) {
            const e = stack.pop();
            if (undefined === e) break;
            if (result.includes(e)) continue;
            result.push(e);

            stack.push(...this.getParents(e).toReversed());
        }

        return result;
    }

    toJSON(): SerializedChildNodes {
        return [...this.parents.entries()];
    }

    importJSON(json: SerializedChildNodes | unknown) {
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
