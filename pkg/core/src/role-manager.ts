import { ChildNode } from './child-node.js';

export type SerializeRoles = [role: string, parents: string[]][];
export class Role {
    constructor(public readonly roleId: string) {}
}

export function assertRoleId(roleOrId: Role | string): string {
    return typeof roleOrId === 'string' ? roleOrId : roleOrId.roleId;
}

export class RoleManager extends ChildNode<Role> {
    protected assertEntryId = assertRoleId;
}
