import * as core from '@a38/core';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { Loader } from './loader';

@Injectable()
export class HrbacService {
    protected load: ((roleOrRoleId: core.Role | string, resourceOrResourceId: core.Resource | string) => Promise<void>) | undefined;

    constructor(
        @Inject(core.HRBAC) private hrbac: core.HRBAC,
        @Optional() @Inject(Loader) private loader?: Loader
    ) {
        this.load =
            this.loader &&
            (async (roleOrRoleId: core.Role | string, resourceOrResourceId: core.Resource | string) => {
                const roleId = core.assertRoleId(roleOrRoleId);
                const resourceId = core.assertResourceId(resourceOrResourceId);

                const [roles, resources] = await Promise.all([
                    await this.loader?.loadRole?.(roleId),
                    await this.loader?.loadResource?.(resourceId)
                ]);

                if (roles) {
                    this.hrbac.getRoleManager().importJSON(roles);
                }
                if (resources) {
                    this.hrbac.getResourceManager().importJSON(resources);
                }

                const permissions = await this.loader?.loadPermissions?.(
                    this.hrbac.getRoleManager().getParentsRecursive(roleId),
                    this.hrbac.getResourceManager().getParentsRecursive(resourceId)
                );
                if (permissions) {
                    this.hrbac.getPermissionManager().importJSON(permissions);
                }
            });
    }

    getHrbac(): core.HRBAC {
        return this.hrbac;
    }

    async isAllowed(
        roleOrRoleId: core.Role | string,
        resourceOrResourceId: core.Resource | string,
        privilege: string | null = null
    ): Promise<boolean> {
        await this.load?.(roleOrRoleId, resourceOrResourceId);
        return this.hrbac.isAllowed(roleOrRoleId, resourceOrResourceId, privilege);
    }

    async isDenied(
        roleOrRoleId: core.Role | string,
        resourceOrResourceId: core.Resource | string,
        privilege: string | null = null
    ): Promise<boolean> {
        await this.load?.(roleOrRoleId, resourceOrResourceId);
        return this.hrbac.isDenied(roleOrRoleId, resourceOrResourceId, privilege);
    }
}
