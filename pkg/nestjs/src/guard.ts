import assert from 'node:assert';
import { Resource, Role } from '@a38/core';
import { type CanActivate, type ExecutionContext, Inject, Injectable, SetMetadata, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HrbacService } from './hrbac.service';
import { DEFAULT_ROLE } from './tokens';
import type { MaybeAsync } from './types';

export abstract class RoleResolver<T extends Role = Role> {
    abstract resolveRoleFromContext(context: ExecutionContext): MaybeAsync<T | undefined>;
}
export type RoleResolverFn<T extends Role = Role> = (context: ExecutionContext) => MaybeAsync<T | undefined>;

export class RouteResource extends Resource {
    constructor(
        resourceId: string,
        public readonly context: ExecutionContext
    ) {
        super(resourceId);
    }
}

const RESOURCE_ID = 'A38 ResourceId';
const PRIVILEGE = 'A38 Privilege';

export function A38Resource(resourceId: string, privilege?: string | null): MethodDecorator {
    return (target, property, descriptor) => {
        SetMetadata(RESOURCE_ID, resourceId)(target, property, descriptor);
        SetMetadata(PRIVILEGE, privilege === undefined ? String(property) : privilege)(target, property, descriptor);
        UseGuards(A38Allowed)(target, property, descriptor);
    };
}

@Injectable()
export class A38Allowed implements CanActivate {
    constructor(
        @Inject(HrbacService) private hrbacService: HrbacService,
        @Inject(Reflector) private reflector: Reflector,
        @Inject(RoleResolver) private roleResolver: RoleResolver,
        @Inject(DEFAULT_ROLE) private defaultRole: string
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const [resourceId, privilege] = this.resolveResourceIdAndPrivilege(context);

        // Routes without a `A38Resource` decorator are not restricted
        if (!resourceId) return true;

        const role = (await this.roleResolver.resolveRoleFromContext(context)) ?? new Role(this.defaultRole);
        const resource = new RouteResource(resourceId, context);

        assert(role instanceof Role, 'role returned by RoleResolver must be instanceof Role');

        if (await this.hrbacService.isDenied(role, resource, privilege)) {
            if (role.roleId === this.defaultRole) {
                throw new UnauthorizedException();
            }
            return false;
        }

        return true;
    }

    private resolveResourceIdAndPrivilege(
        context: ExecutionContext
    ): [resourceId: string | undefined, privilege: string | null | undefined] {
        const resourceId = this.reflector.get<string | undefined>(RESOURCE_ID, context.getHandler());
        const privilege = this.reflector.get<string | null>(PRIVILEGE, context.getHandler());

        return [resourceId, privilege];
    }
}
