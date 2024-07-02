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
}
