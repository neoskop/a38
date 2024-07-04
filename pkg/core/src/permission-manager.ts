import type { HRBAC } from './hrbac.js';
import { type Resource, assertResourceId } from './resource-manager.js';
import { type Role, assertRoleId } from './role-manager.js';

export type Type = 'allow' | 'deny';

export type Assertion<ROLE extends Role = Role, RESOURCE extends Resource = Resource> = (
    hrbac: HRBAC,
    role: ROLE | null,
    resource: RESOURCE | null,
    privilege: string | null
) => boolean;

export interface SerializedRule {
    type: Type;
    privileges?: string[] | null;
}

export class Rule<ROLE extends Role = Role, RESOURCE extends Resource = Resource> {
    static fromJSON(json: unknown): Rule {
        if (
            !json ||
            typeof json !== 'object' ||
            !('type' in json) ||
            (json.type !== 'allow' && json.type !== 'deny') ||
            ('privileges' in json && !Array.isArray(json.privileges) && json.privileges !== null)
        ) {
            throw new Error(`Invalid serialize [Rule]: ${JSON.stringify(json)}`);
        }
        return new Rule(json.type, 'privileges' in json && json.privileges ? new Set(json.privileges as string[]) : null);
    }

    constructor(
        public readonly type: Type,
        public readonly privileges: ReadonlySet<string> | null,
        public readonly assertion?: Assertion<ROLE, RESOURCE>
    ) {}

    match(hrbac: HRBAC, role: ROLE, resource: RESOURCE, privilege: string | null): boolean {
        if (null === privilege) {
            if (this.privileges) return false;
        }

        if (this.privileges && privilege && !this.privileges.has(privilege)) return false;

        return !this.assertion || this.assertion(hrbac, role, resource, privilege);
    }

    toJSON(): SerializedRule {
        if (this.assertion) {
            console.warn('Cannot serialize Rule with assertion function');
        }
        return { type: this.type, privileges: this.privileges && [...this.privileges] };
    }
}

export type SerializedResourceRuleMap = [resourceId: string | null, rules: SerializedRule[]][];

export class ResourceRuleMap implements Iterable<[string | null, Rule[]]> {
    private map = new Map<string | null, Rule[]>();

    static fromJSON(json: unknown): ResourceRuleMap {
        const map = new ResourceRuleMap();

        map.importJSON(json);

        return map;
    }

    add<ROLE extends Role = Role, RESOURCE extends Resource = Resource>(resource: string | null, rule: Rule<ROLE, RESOURCE>): void {
        const rules = this.map.get(resource) ?? [];
        this.map.set(resource, rules);

        rules.push(rule as Rule);
    }

    [Symbol.iterator](): Iterator<[string | null, Rule[]]> {
        return this.map.entries();
    }

    toJSON(): SerializedResourceRuleMap {
        return [...this.map.entries()].map(([resource, rules]) => [resource, rules.map(r => r.toJSON())]);
    }

    importJSON(json: SerializedResourceRuleMap | unknown) {
        if (!Array.isArray(json)) {
            throw new Error(`Invalid serialize [ResourceRuleMap]: ${JSON.stringify(json)}`);
        }
        for (const entry of json) {
            if (!Array.isArray(entry) || entry.length !== 2) {
                throw new Error(`Invalid serialize [ResourceRuleMap] entry: ${JSON.stringify(entry)}`);
            }
            const [resource, rules] = entry as [unknown, unknown];
            if ((resource !== null && typeof resource !== 'string') || !Array.isArray(rules)) {
                throw new Error(`Invalid serialize [ResourceRuleMap] entry: ${JSON.stringify(entry)}`);
            }
            for (const rule of rules) {
                this.add(resource, Rule.fromJSON(rule));
            }
        }
        return this;
    }
}

// export type SerializedRoleResourceRuleMap = [roleId: string | null, rrmap: SerializedResourceRuleMap][];

export type SerializedPermissions = (readonly [roleId: string | null, resourceId: string | null, rule: SerializedRule])[];

export class RoleResourceRuleMap implements Iterable<[string | null, ResourceRuleMap]> {
    private map = new Map<string | null, ResourceRuleMap>();

    static fromJSON(json: unknown): RoleResourceRuleMap {
        const map = new RoleResourceRuleMap();

        map.importJSON(json);

        return map;
    }

    get(role: string | null): ResourceRuleMap {
        const map = this.map.get(role) ?? new ResourceRuleMap();
        this.map.set(role, map);

        return map;
    }
    [Symbol.iterator](): Iterator<[string | null, ResourceRuleMap]> {
        return this.map.entries();
    }

    toJSON(): SerializedPermissions {
        return [...this.map.entries()].flatMap(([role, rrMap]) => {
            return [...rrMap].flatMap(([resource, rules]) => {
                return rules.map(rule => [role, resource, rule.toJSON()] as const);
            });
        });
    }

    importJSON(json: SerializedPermissions | unknown) {
        if (!Array.isArray(json)) {
            throw new Error(`Invalid serialize [RoleResourceRuleMap]: ${JSON.stringify(json)}`);
        }
        for (const entry of json) {
            if (!Array.isArray(entry) || entry.length !== 3) {
                throw new Error(`Invalid serialize [RoleResourceRuleMap] entry: ${JSON.stringify(entry)}`);
            }

            const [role, resource, rule] = entry as [unknown, unknown, unknown];
            if ((role !== null && typeof role !== 'string') || (resource !== null && typeof resource !== 'string')) {
                throw new Error(`Invalid serialize [RoleResourceRuleMap] entry: ${JSON.stringify(entry)}`);
            }
            this.get(role).add(resource, Rule.fromJSON(rule)); //importJSON(rrMap);
        }
        return this;
    }
}

export class PermissionManager {
    private rrrm = new RoleResourceRuleMap();

    *getRules(roles: string[], resources: string[]): Generator<Rule, void, undefined> {
        const roleSet = new Set(roles);
        const resourceSet = new Set(resources);
        for (const [role, rrMap] of this.rrrm) {
            if (!(role === null || roleSet.has(role))) continue;
            for (const [resource, rules] of rrMap) {
                if (!(resource === null || resourceSet.has(resource))) continue;
                yield* rules;
            }
        }
    }

    private add<ROLE extends Role, RESOURCE extends Resource>(
        type: Type,
        role: Role | string | null,
        resource: Resource | string | null,
        privileges: string[] | null,
        assertion?: Assertion<ROLE, RESOURCE>
    ) {
        const roleId = null == role ? null : assertRoleId(role);
        const resourceId = null == resource ? null : assertResourceId(resource);

        this.rrrm.get(roleId).add(resourceId, new Rule(type, privileges && new Set(privileges), assertion));
    }

    allow<ROLE extends Role = Role, RESOURCE extends Resource = Resource>(
        role: Role | string | null = null,
        resource: Resource | string | null = null,
        privileges?: string[] | null,
        assertion?: Assertion<ROLE, RESOURCE>
    ) {
        this.add<ROLE, RESOURCE>('allow', role, resource, privileges ?? null, assertion);
    }

    deny<ROLE extends Role = Role, RESOURCE extends Resource = Resource>(
        role: Role | string | null = null,
        resource: Resource | string | null = null,
        privileges: string[] | null = null,
        assertion?: Assertion<ROLE, RESOURCE>
    ) {
        this.add<ROLE, RESOURCE>('deny', role, resource, privileges ?? null, assertion);
    }

    toJSON(): SerializedPermissions {
        return this.rrrm.toJSON();
    }

    importJSON(json: SerializedPermissions | unknown): this {
        this.rrrm.importJSON(json);
        return this;
    }
}
