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

    protected resolve(roleOrRoleId: Role | string, resourceOrResourceId: Resource | string, privilege: string | null): Type | null {
        const role = typeof roleOrRoleId === 'string' ? new Role(roleOrRoleId) : roleOrRoleId;
        const resource = typeof resourceOrResourceId === 'string' ? new Resource(resourceOrResourceId) : resourceOrResourceId;

        const roles = this.getRoleManager().getParentsRecursive(role).toReversed();
        const resources = this.getResourceManager().getParentsRecursive(resource).toReversed();
        const rules = [...this.getPermissionManager().getRules(roles, resources)].toReversed();

        for (const rule of rules) {
            if (rule.match(this, role, resource, privilege)) {
                return rule.type;
            }
        }

        return 'deny';
    }

    isAllowed(roleOrRoleId: Role | string, resourceOrResourceId: Resource | string, privilege: string | null = null): boolean {
        return this.resolve(roleOrRoleId, resourceOrResourceId, privilege) === 'allow';
    }

    isDenied(roleOrRoleId: Role | string, resourceOrResourceId: Resource | string, privilege: string | null = null): boolean {
        return this.resolve(roleOrRoleId, resourceOrResourceId, privilege) === 'deny';
    }
}
