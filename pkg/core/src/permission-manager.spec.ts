import { beforeEach, describe, expect, it } from 'bun:test';
import { PermissionManager, Rule } from './permission-manager.js';

describe('PermissionManager', () => {
    let manager: PermissionManager;

    beforeEach(() => {
        manager = new PermissionManager();
    });

    it('should resolve permission rules', () => {
        const assertA = () => true;
        const assertB = () => true;
        const assertC = () => true;
        manager.allow('roleA', 'resource', ['privilegeA'], assertA);
        manager.deny('roleB', 'resource', ['privilegeB'], assertB);
        manager.allow('roleC', 'resource', null, assertC);
        manager.allow('roleD');

        const rules = [...manager.getRules(['roleA', 'roleB'], ['resource'])];

        expect(rules).toEqual([new Rule('allow', new Set(['privilegeA']), assertA), new Rule('deny', new Set(['privilegeB']), assertB)]);
    });

    it('should serialize to JSON', () => {
        manager.allow('roleA', 'resource', ['privilegeA']);
        manager.deny('roleB', 'resource', ['privilegeB', 'privilegeC']);
        manager.allow('roleC', 'resource');
        manager.allow('roleD');

        const json = manager.toJSON();

        expect(json).toEqual([
            ['roleA', [['resource', [{ type: 'allow', privileges: ['privilegeA'] }]]]],
            ['roleB', [['resource', [{ type: 'deny', privileges: ['privilegeB', 'privilegeC'] }]]]],
            ['roleC', [['resource', [{ type: 'allow', privileges: null }]]]],
            ['roleD', [[null, [{ type: 'allow', privileges: null }]]]]
        ]);
    });

    it('should deserialize from JSON', () => {
        manager.allow('roleA', 'resource', ['privilegeA']);
        manager.deny('roleB', 'resource', ['privilegeB', 'privilegeC']);
        manager.allow('roleC', 'resource');
        manager.allow('roleD');

        const json = manager.toJSON();

        const otherManager = new PermissionManager().fromJSON(json);

        expect(otherManager).toEqual(manager);
    });
});
