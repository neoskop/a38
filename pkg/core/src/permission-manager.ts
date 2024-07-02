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

export class Rule<ROLE extends Role = Role, RESOURCE extends Resource = Resource> {
    static fromJSON(json: unknown): Rule {
        if (
            !json ||
            typeof json !== 'object' ||
            !('type' in json) ||
            (json.type !== 'allow' && json.type !== 'deny') ||
            !('privileges' in json) ||
            (!Array.isArray(json.privileges) && json.privileges !== null)
        ) {
            throw new Error(`Invalid serialize [Rule]: ${JSON.stringify(json)}`);
        }
        return new Rule(json.type, json.privileges && new Set(json.privileges));
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

    toJSON() {
        if (this.assertion) {
            console.warn('Cannot serialize Rule with assertion function');
        }
        return { type: this.type, privileges: this.privileges && [...this.privileges] };
    }
}

export class ResourceRuleMap implements Iterable<[string | null, Rule[]]> {
    private map = new Map<string | null, Rule[]>();

    static fromJSON(json: unknown): ResourceRuleMap {
        if (!Array.isArray(json)) {
            throw new Error(`Invalid serialize [ResourceRuleMap]: ${JSON.stringify(json)}`);
        }
        const map = new ResourceRuleMap();

        for (const entry of json) {
            if (!Array.isArray(entry) || entry.length !== 2) {
                throw new Error(`Invalid serialize [ResourceRuleMap] entry: ${JSON.stringify(entry)}`);
            }
            const [resource, rules] = entry as [unknown, unknown];
            if ((resource !== null && typeof resource !== 'string') || !Array.isArray(rules)) {
                throw new Error(`Invalid serialize [ResourceRuleMap] entry: ${JSON.stringify(entry)}`);
            }
            for (const rule of rules) {
                map.add(resource, Rule.fromJSON(rule));
            }
        }

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

    toJSON() {
        return [...this.map.entries()].map(([resource, rules]) => [resource, rules.map(r => r.toJSON())]);
    }
}

export class RoleResourceRuleMap implements Iterable<[string | null, ResourceRuleMap]> {
    private map = new Map<string | null, ResourceRuleMap>();

    static fromJSON(json: unknown): RoleResourceRuleMap {
        if (!Array.isArray(json)) {
            throw new Error(`Invalid serialize [RoleResourceRuleMap]: ${JSON.stringify(json)}`);
        }
        const map = new RoleResourceRuleMap();

        for (const entry of json) {
            if (!Array.isArray(entry) || entry.length !== 2) {
                throw new Error(`Invalid serialize [RoleResourceRuleMap] entry: ${JSON.stringify(entry)}`);
            }

            const [role, rrMap] = entry as [unknown, unknown];
            if (role !== null && typeof role !== 'string') {
                throw new Error(`Invalid serialize [RoleResourceRuleMap] entry: ${JSON.stringify(entry)}`);
            }
            map.map.set(role, ResourceRuleMap.fromJSON(rrMap));
        }

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

    toJSON() {
        return [...this.map.entries()].map(([resource, rrMap]) => [resource, rrMap.toJSON()]);
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

    toJSON() {
        return this.rrrm.toJSON();
    }

    fromJSON(json: unknown): this {
        this.rrrm = RoleResourceRuleMap.fromJSON(json);
        return this;
    }
}
