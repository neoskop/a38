import { ChildNode } from './child-node.js';

export type SerializeResources = [resource: string, parents: string[]][];
export class Resource {
    constructor(public readonly resourceId: string) {}
}

export function assertResourceId(resourceOrId: Resource | string): string {
    return typeof resourceOrId === 'string' ? resourceOrId : resourceOrId.resourceId;
}

export class ResourceManager extends ChildNode<Resource> {
    protected assertEntryId = assertResourceId;
}
