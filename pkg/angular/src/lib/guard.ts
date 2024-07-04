import { Resource } from '@a38/core';
import { InjectionToken, Injector, inject, runInInjectionContext } from '@angular/core';
import {
    type ActivatedRouteSnapshot,
    type CanActivateChildFn,
    type CanActivateFn,
    type GuardResult,
    Router,
    type RouterStateSnapshot
} from '@angular/router';
import { HrbacService } from './hrbac.service';
import { RoleStore } from './role-store';

export type GuardDenyHandler = (
    roleId: string,
    resource: RouteResource,
    privilege: string | null
) => GuardResult | string | Promise<GuardResult | string>;
export const GUARD_DENY_HANDLER = new InjectionToken<GuardDenyHandler>('A38 Guard Deny Handler');

export class RouteResource extends Resource {
    constructor(
        resourceId: string,
        public readonly route: ActivatedRouteSnapshot,
        public readonly state: RouterStateSnapshot
    ) {
        super(resourceId);
    }
}

export function a38Allowed(resourceId: string, privilege: string | null = null): CanActivateFn & CanActivateChildFn {
    return async (route, state) => {
        const router = inject(Router);
        const injector = inject(Injector);
        const guardDenyHandler = inject(GUARD_DENY_HANDLER);
        const roleId = inject(RoleStore).role();
        const resource = new RouteResource(resourceId, route, state);

        const isAllowed = await inject(HrbacService).isAllowed(roleId, resource, privilege);
        if (!isAllowed) {
            const result = await runInInjectionContext(injector, () => guardDenyHandler(roleId, resource, privilege));

            if (typeof result === 'string') {
                return router.parseUrl(result);
            }

            return result;
        }
        return true;
    };
}
