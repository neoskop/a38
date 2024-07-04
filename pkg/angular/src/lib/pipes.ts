import { type Resource, type Role, assertResourceId, assertRoleId } from '@a38/core';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef, type OnDestroy, Pipe, type PipeTransform, inject } from '@angular/core';
import { HrbacService } from './hrbac.service';
import { RoleStore } from './role-store';

@Pipe({ standalone: true, name: 'a38Allowed', pure: false })
export class A38AllowedPipe implements PipeTransform, OnDestroy {
    private roleStore = inject(RoleStore);
    private hrbacServie = inject(HrbacService);
    private cdr = inject(ChangeDetectorRef);

    private innerAsyncPipe = new AsyncPipe(this.cdr);

    private latestRoleId?: string;
    private latestResourceId?: string;
    private latestPrivilege?: string | null;
    private latestPromise?: Promise<boolean>;

    private getPromise(role: Role | string, resource: Resource | string, privilege: string | null): Promise<boolean> {
        const roleId = assertRoleId(role);
        const resourceId = assertResourceId(resource);
        if (
            !this.latestPromise ||
            this.latestRoleId !== roleId ||
            this.latestResourceId !== resourceId ||
            this.latestPrivilege !== privilege
        ) {
            this.latestRoleId = roleId;
            this.latestResourceId = resourceId;
            this.latestPrivilege = privilege;
            this.latestPromise = this.hrbacServie.isAllowed(role, resource, privilege);
        }

        return this.latestPromise;
    }

    ngOnDestroy(): void {
        this.innerAsyncPipe.ngOnDestroy();
    }

    transform(resource: Resource | string, privilege: string | null = null, role: Role | string = this.roleStore.role()) {
        return this.innerAsyncPipe.transform(this.getPromise(role, resource, privilege));
    }
}

@Pipe({ standalone: true, name: 'a38Denied', pure: false })
export class A38DeniedPipe extends A38AllowedPipe {
    override transform(resource: string | Resource, privilege?: string | null, role?: string | Role): boolean {
        return !super.transform(resource, privilege, role);
    }
}
