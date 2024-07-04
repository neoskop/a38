import * as core from '@a38/core';
import {
    type ClassProvider,
    type DynamicModule,
    type ExistingProvider,
    type FactoryProvider,
    type InjectionToken,
    Module,
    type Provider,
    type ValueProvider
} from '@nestjs/common';
import { RoleResolver, type RoleResolverFn } from './guard';
import { HrbacService } from './hrbac.service';
import { DEFAULT_ROLE } from './tokens';
import type { MaybeAsync } from './types';

export interface A38ModuleOptions {
    global?: boolean;
    defaultRole: string;
    roleResolver:
        | PartialValueProvider<RoleResolver | RoleResolverFn>
        | PartialFactoryProvider<RoleResolver | RoleResolverFn>
        | PartialClassProvider<RoleResolver>
        | PartialExistingProvider<RoleResolver>;
    roles?: core.SerializedRoles;
    resources?: core.SerializedResources;
    permissions?: core.SerializedPermissions;
}

export type PartialValueProvider<T> = Pick<ValueProvider<T>, 'useValue'>;
export type PartialClassProvider<T> = Pick<ClassProvider<T>, 'useClass'>;
export type PartialFactoryProvider<T> = Pick<FactoryProvider<T>, 'useFactory' | 'inject'>;
export type PartialExistingProvider<T> = Pick<ExistingProvider<T>, 'useExisting'>;

export type PartialProvider<T> = PartialClassProvider<T> | PartialFactoryProvider<T> | PartialExistingProvider<T>;

export type A38AsyncModuleOptions = Pick<DynamicModule, 'imports' | 'exports' | 'global'> &
    Pick<A38ModuleOptions, 'roleResolver'> &
    (
        | PartialClassProvider<A38OptionsFactory>
        | PartialFactoryProvider<Omit<A38ModuleOptions, 'global' | 'roleResolver'>>
        | PartialExistingProvider<A38OptionsFactory>
    );

const A38_OPTIONS = 'A38_OPTIONS';
const A38_ROLE_RESOLVER = 'A38_ROLE_RESOLVER';

export interface A38OptionsFactory {
    createA38Options(): MaybeAsync<Omit<A38ModuleOptions, 'global' | 'roleResolver'>>;
}

@Module({
    providers: [
        {
            provide: core.HRBAC,
            useFactory: () => {
                throw new Error('You need to import A38Module.forRoot in your root module.');
            }
        }
    ]
})
// biome-ignore lint/complexity/noStaticOnlyClass: NestJS Module
export class A38Module {
    static forRoot(options: A38ModuleOptions): DynamicModule {
        return {
            module: A38Module,
            global: options.global,
            providers: [
                { provide: DEFAULT_ROLE, useValue: options.defaultRole },
                ...createRoleResolverProviders(options.roleResolver, A38_ROLE_RESOLVER),
                {
                    provide: RoleResolver,
                    useFactory: (roleResolverOrFn: RoleResolver | RoleResolverFn): RoleResolver =>
                        typeof roleResolverOrFn === 'function' ? { resolveRoleFromContext: roleResolverOrFn } : roleResolverOrFn,
                    inject: [A38_ROLE_RESOLVER]
                },
                { provide: core.RoleManager, useFactory: () => new core.RoleManager().importJSON(options.roles ?? []) },
                {
                    provide: core.ResourceManager,
                    useFactory: () => new core.ResourceManager().importJSON(options.resources ?? [])
                },
                {
                    provide: core.PermissionManager,
                    useFactory: () => new core.PermissionManager().importJSON(options.permissions ?? [])
                },
                {
                    provide: core.HRBAC,
                    useFactory: (
                        roleManager: core.RoleManager,
                        resourceManager: core.ResourceManager,
                        permissionManager: core.PermissionManager
                    ) => new core.HRBAC(roleManager, resourceManager, permissionManager),
                    inject: [core.RoleManager, core.ResourceManager, core.PermissionManager]
                },
                HrbacService
            ],
            exports: [DEFAULT_ROLE, core.RoleManager, core.ResourceManager, core.PermissionManager, core.HRBAC, HrbacService, RoleResolver]
        };
    }

    static forRootAsync(options: A38AsyncModuleOptions): DynamicModule {
        return {
            module: A38Module,
            global: options.global,
            imports: options.imports,
            exports: [
                ...(options.exports ?? []),
                DEFAULT_ROLE,
                core.RoleManager,
                core.ResourceManager,
                core.PermissionManager,
                core.HRBAC,
                HrbacService,
                RoleResolver
            ],
            providers: [
                { provide: DEFAULT_ROLE, useFactory: (options: A38ModuleOptions) => options.defaultRole, inject: [A38_OPTIONS] },
                ...createRoleResolverProviders(options.roleResolver, A38_ROLE_RESOLVER),
                {
                    provide: RoleResolver,
                    useFactory: (roleResolverOrFn: RoleResolver | RoleResolverFn): RoleResolver =>
                        typeof roleResolverOrFn === 'function' ? { resolveRoleFromContext: roleResolverOrFn } : roleResolverOrFn,
                    inject: [A38_ROLE_RESOLVER]
                },
                {
                    provide: core.RoleManager,
                    useFactory: (options: A38ModuleOptions) => new core.RoleManager().importJSON(options.roles ?? []),
                    inject: [A38_OPTIONS]
                },
                {
                    provide: core.ResourceManager,
                    useFactory: (options: A38ModuleOptions) => new core.ResourceManager().importJSON(options.resources ?? []),
                    inject: [A38_OPTIONS]
                },
                {
                    provide: core.PermissionManager,
                    useFactory: (options: A38ModuleOptions) => new core.PermissionManager().importJSON(options.permissions ?? []),
                    inject: [A38_OPTIONS]
                },
                {
                    provide: core.HRBAC,
                    useFactory: (
                        roleManager: core.RoleManager,
                        resourceManager: core.ResourceManager,
                        permissionManager: core.PermissionManager
                    ) => new core.HRBAC(roleManager, resourceManager, permissionManager),
                    inject: [core.RoleManager, core.ResourceManager, core.PermissionManager]
                },
                HrbacService,
                ...createAsyncOptionsProviders(options, A38_OPTIONS)
            ]
        };
    }
}

function createRoleResolverProviders(
    roleResolver:
        | PartialValueProvider<RoleResolver | RoleResolverFn>
        | PartialFactoryProvider<RoleResolver | RoleResolverFn>
        | PartialClassProvider<RoleResolver>
        | PartialExistingProvider<RoleResolver>,
    token: InjectionToken
): Provider[] {
    if ('useValue' in roleResolver) {
        return [{ provide: token, useValue: roleResolver.useValue }];
    }

    if ('useExisting' in roleResolver) {
        return [{ provide: token, useExisting: roleResolver.useExisting }];
    }

    if ('useFactory' in roleResolver) {
        return [{ provide: token, useFactory: roleResolver.useFactory, inject: roleResolver.inject }];
    }

    return [roleResolver.useClass, { provide: token, useClass: roleResolver.useClass }];
}

function createAsyncOptionsProviders(options: A38AsyncModuleOptions, token: InjectionToken): Provider[] {
    if ('useExisting' in options) {
        return [{ provide: token, useFactory: (factory: A38OptionsFactory) => factory.createA38Options(), inject: [options.useExisting] }];
    }

    if ('useFactory' in options) {
        return [{ provide: token, useFactory: options.useFactory, inject: options.inject }];
    }

    return [
        options.useClass,
        { provide: token, useFactory: (factory: A38OptionsFactory) => factory.createA38Options(), inject: [options.useClass] }
    ];
}
