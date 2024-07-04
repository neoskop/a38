import type * as core from '@a38/core';
export abstract class Loader {
    loadRole?(roleId: string): Promise<core.SerializeRoles>;
    loadResource?(resourceId: string): Promise<core.SerializeResources>;
    loadPermissions?(roleIds: string[], resourceIds: string[]): Promise<core.SerializedRoleResourceRuleMap>;
}
