import * as core from '@a38/core';
import { InjectionToken, type ModuleWithProviders, NgModule, Optional, inject } from '@angular/core';
import { A38AllowedDirective, A38DeniedDirective } from './directives';
import { GUARD_DENY_HANDLER, type GuardDenyHandler } from './guard';
import { HrbacService } from './hrbac.service';
import { A38AllowedPipe, A38DeniedPipe } from './pipes';
import { DEFAULT_ROLE, RoleStore } from './role-store';

export type Value<T> = T | InjectionToken<T> | (() => T);

export interface A38ModuleOptions {
    defaultRole: string;
    guardDenyHandler: InjectionToken<GuardDenyHandler> | GuardDenyHandler;
    roles?: Value<core.SerializeRoles>;
    resources?: Value<core.SerializeResources>;
    permissions?: Value<core.SerializedRoleResourceRuleMap>;
}

function resolveDependency<T>(value: Value<T>): T;
function resolveDependency<T>(value: Value<T> | undefined, defaultValue: T): T;
function resolveDependency<T>(value: Value<T> | undefined, defaultValue?: T): T {
    if (typeof value === 'function') return (value as () => T)();
    if (value instanceof InjectionToken) return inject(value);
    if (value) return value;

    return defaultValue!;
}

@NgModule({
    imports: [A38AllowedPipe, A38DeniedPipe, A38AllowedDirective, A38DeniedDirective],
    exports: [A38AllowedPipe, A38DeniedPipe, A38AllowedDirective, A38DeniedDirective],
    providers: [
        {
            provide: core.HRBAC,
            useFactory: () => {
                throw new Error('You need to import A38Module.forRoot in your root module/component.');
            }
        }
    ]
})
export class A38Module {
    static forRoot(options: A38ModuleOptions): ModuleWithProviders<A38Module> {
        return {
            ngModule: A38Module,
            providers: [
                { provide: DEFAULT_ROLE, useValue: options.defaultRole },
                {
                    provide: GUARD_DENY_HANDLER,
                    useFactory: () => {
                        return options.guardDenyHandler instanceof InjectionToken
                            ? inject(options.guardDenyHandler)
                            : options.guardDenyHandler;
                    }
                },
                { provide: core.RoleManager, useFactory: () => new core.RoleManager().importJSON(resolveDependency(options.roles, [])) },
                {
                    provide: core.ResourceManager,
                    useFactory: () => new core.ResourceManager().importJSON(resolveDependency(options.resources, []))
                },
                {
                    provide: core.PermissionManager,
                    useFactory: () => new core.PermissionManager().importJSON(resolveDependency(options.permissions, []))
                },
                {
                    provide: core.HRBAC,
                    useFactory: () => new core.HRBAC(inject(core.RoleManager), inject(core.ResourceManager), inject(core.PermissionManager))
                },
                HrbacService,
                RoleStore
            ]
        };
    }

    constructor(@Optional() hrbac: core.HRBAC) {
        if (!hrbac) {
            throw new Error('You need to import A38Module.forRoot in your root module/component.');
        }
    }
}
