import { ChildNode } from './child-node.js';

export type SerializedRoles = [role: string, parents: string[]][];
export class Role {
    constructor(
        public readonly roleId: string,
        public readonly parents?: Role[]
    ) {}
}

export function assertRoleId(roleOrId: Role | string): string {
    return typeof roleOrId === 'string' ? roleOrId : roleOrId.roleId;
}

export class RoleManager extends ChildNode<Role, SerializedRoles> {
    protected assertEntryId = assertRoleId;
}
