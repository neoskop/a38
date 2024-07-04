import { Resource } from '@a38/core';
import { InjectionToken, Injector, inject, runInInjectionContext } from '@angular/core';
import {
    type ActivatedRouteSnapshot,
    type CanActivateChildFn,
    type CanActivateFn,
    type Data,
    type GuardResult,
    type MaybeAsync,
    Router,
    type RouterStateSnapshot
} from '@angular/router';
import { HrbacService } from './hrbac.service';
import { RoleStore } from './role-store';

const RESOURCE_ID = Symbol('RESOURCE_ID');
const PRIVILEGE = Symbol('PRIVILEGE');

export type GuardDenyHandler = (
    roleId: string,
    resource: RouteResource,
    privilege: string | null
) => GuardResult | string | Promise<GuardResult | string>;
export const GUARD_DENY_HANDLER = new InjectionToken<GuardDenyHandler>('A38 Guard Deny Handler');

export interface RouteResourceData {
    [RESOURCE_ID]: Resource | string;
    [PRIVILEGE]: string | null;
}

export class RouteResource extends Resource {
    constructor(
        resourceId: string,
        public readonly route: ActivatedRouteSnapshot,
        public readonly state: RouterStateSnapshot
    ) {
        super(resourceId);
    }
}

export function defineRouteResourceData(resourceId: string, privilege: string | null = null): RouteResourceData {
    return { [RESOURCE_ID]: resourceId, [PRIVILEGE]: privilege };
}

function getRouteResourceData(data: Data): [resourceId: string, privilege: string | null] {
    if (!(RESOURCE_ID in data)) {
        throw new Error(`Missing RESOURCE_ID in route data, ${JSON.stringify(data)} given.`);
    }
    if (!(PRIVILEGE in data)) {
        throw new Error(`Missing PRIVILEGE in route data, ${JSON.stringify(data)} given.`);
    }

    return [data[RESOURCE_ID], data[PRIVILEGE]];
}

/**
 * @todo: try to use a factory method to provide resourceId and privilege
 */
export const _a38Allowed: CanActivateFn & CanActivateChildFn = async (route, state) => {
    const router = inject(Router);
    const injector = inject(Injector);
    const guardDenyHandler = inject(GUARD_DENY_HANDLER);
    const roleId = inject(RoleStore).role();
    const [resourceId, privilege] = getRouteResourceData(route.data);
    const resource = new RouteResource(resourceId, route, state);

    const isAllowed = await inject(HrbacService).isAllowed(roleId, resource, privilege);
    // console.log({ roleId, resourceId, isAllowed });
    if (!isAllowed) {
        const result = await runInInjectionContext(injector, () => guardDenyHandler(roleId, resource, privilege));

        if (typeof result === 'string') {
            return router.parseUrl(result);
        }

        return result;
    }
    return true;
};

export function a38Allowed(resourceId: string, privilege: string | null = null): CanActivateFn & CanActivateChildFn {
    return async (route, state) => {
        const router = inject(Router);
        const injector = inject(Injector);
        const guardDenyHandler = inject(GUARD_DENY_HANDLER);
        const roleId = inject(RoleStore).role();
        const resource = new RouteResource(resourceId, route, state);

        const isAllowed = await inject(HrbacService).isAllowed(roleId, resource, privilege);
        // console.log({ roleId, resourceId, isAllowed });
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
