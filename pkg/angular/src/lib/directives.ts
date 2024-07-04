import type { Resource, Role } from '@a38/core';
import { NgIf } from '@angular/common';
import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { HrbacService } from './hrbac.service';
import { RoleStore } from './role-store';

@Directive({ standalone: true, selector: '[a38Allowed]' })
export class A38AllowedDirective {
    private roleStore = inject(RoleStore);
    private hrbacServie = inject(HrbacService);

    private innerNgIf = new NgIf(inject(ViewContainerRef), inject(TemplateRef));

    recource = input.required<Resource | string>({ alias: 'a38Allowed' });
    role = input<Role | string | undefined>(undefined, { alias: 'a38AllowedRole' });
    privilege = input<string | null | undefined>(undefined, { alias: 'a38AllowedPrivilege' });

    constructor() {
        effect(() => {
            const role = this.role() ?? this.roleStore.role();

            this.hrbacServie.isAllowed(role, this.recource(), this.privilege()).then(isAllowed => {
                this.innerNgIf.ngIf = isAllowed;
            });
        });
    }
}

@Directive({ standalone: true, selector: '[a38Denied]' })
export class A38DeniedDirective {
    private roleStore = inject(RoleStore);
    private hrbacServie = inject(HrbacService);

    private innerNgIf = new NgIf(inject(ViewContainerRef), inject(TemplateRef));

    recource = input.required<Resource | string>({ alias: 'a38Denied' });
    role = input<Role | string | undefined>(undefined, { alias: 'a38DeniedRole' });
    privilege = input<string | null | undefined>(undefined, { alias: 'a38DeniedPrivilege' });

    constructor() {
        effect(() => {
            const role = this.role() ?? this.roleStore.role();

            this.hrbacServie.isDenied(role, this.recource(), this.privilege()).then(isDenied => {
                this.innerNgIf.ngIf = isDenied;
            });
        });
        this.innerNgIf.ngIf = true;
    }
}
