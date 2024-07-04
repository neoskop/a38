import type * as core from '@a38/core';
export abstract class Loader {
    loadRole?(roleId: string): Promise<core.SerializedRoles>;
    loadResource?(resourceId: string): Promise<core.SerializedResources>;
    loadPermissions?(roleIds: string[], resourceIds: string[]): Promise<core.SerializedPermissions>;
}
