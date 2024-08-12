import type { PermissionManager, Type } from './permission-manager.js';
import { Resource, type ResourceManager } from './resource-manager.js';
import { Role, type RoleManager } from './role-manager.js';

export class HRBAC {
    constructor(
        private roleManager: RoleManager,
        private resourceManager: ResourceManager,
        private permissionManager: PermissionManager
    ) {}

    getRoleManager(): RoleManager {
        return this.roleManager;
    }

    getResourceManager(): ResourceManager {
        return this.resourceManager;
    }

    getPermissionManager(): PermissionManager {
        return this.permissionManager;
    }

    protected async resolve(
        roleOrRoleId: Role | string,
        resourceOrResourceId: Resource | string,
        privilege: string | null
    ): Promise<Type | null> {
        const role = typeof roleOrRoleId === 'string' ? new Role(roleOrRoleId) : roleOrRoleId;
        const resource = typeof resourceOrResourceId === 'string' ? new Resource(resourceOrResourceId) : resourceOrResourceId;

        const roles = this.getRoleManager().getParentsRecursive(role).toReversed();
        const resources = this.getResourceManager().getParentsRecursive(resource).toReversed();
        const rules = [...this.getPermissionManager().getRules(roles, resources)].toReversed();

        for (const rule of rules) {
            if (await rule.match(this, role, resource, privilege)) {
                return rule.type;
            }
        }

        return 'deny';
    }

    async isAllowed(
        roleOrRoleId: Role | string,
        resourceOrResourceId: Resource | string,
        privilege: string | null = null
    ): Promise<boolean> {
        return (await this.resolve(roleOrRoleId, resourceOrResourceId, privilege)) === 'allow';
    }

    async isDenied(
        roleOrRoleId: Role | string,
        resourceOrResourceId: Resource | string,
        privilege: string | null = null
    ): Promise<boolean> {
        return (await this.resolve(roleOrRoleId, resourceOrResourceId, privilege)) === 'deny';
    }
}
