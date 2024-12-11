import { ChildNode } from './child-node.js';

export type SerializedResources = [resource: string, parents: string[]][];
export class Resource {
    constructor(
        public readonly resourceId: string,
        public readonly parents?: Resource[]
    ) {}
}

export function assertResourceId(resourceOrId: Resource | string): string {
    return typeof resourceOrId === 'string' ? resourceOrId : resourceOrId.resourceId;
}

export class ResourceManager extends ChildNode<Resource, SerializedResources> {
    protected assertEntryId = assertResourceId;
}
