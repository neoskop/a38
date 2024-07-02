import { beforeEach, describe, expect, it } from 'bun:test';
import { HRBAC } from './hrbac.js';
import { PermissionManager } from './permission-manager.js';
import { Resource, ResourceManager } from './resource-manager.js';
import { Role, RoleManager } from './role-manager.js';

class DocumentResource extends Resource {
    constructor(public author: string) {
        super('document');
    }
}

class ProfileResource extends Resource {
    constructor(public owner: string) {
        super('profile');
    }
}

class UserRole extends Role {
    constructor(
        public id: string,
        role: string
    ) {
        super(role);
    }
}

const authorA = new UserRole('a', 'author');
const authorB = new UserRole('b', 'author');
const editor = new UserRole('c', 'editor');
const admin = new UserRole('z', 'admin');
const user = new UserRole('u', 'user');
const userV = new UserRole('v', 'user');

const documentA = new DocumentResource('a');
const profileU = new ProfileResource('u');
const profileV = new ProfileResource('v');

describe('HRBAC', () => {
    let hrbac: HRBAC;

    beforeEach(() => {
        hrbac = new HRBAC(new RoleManager(), new ResourceManager(), new PermissionManager());
        hrbac.getRoleManager().addParents('user', ['guest']);
        hrbac.getRoleManager().addParents('author', ['user']);
        hrbac.getRoleManager().addParents('author', ['creator']);
        hrbac.getRoleManager().addParents('editor', ['user', 'manager']);

        hrbac.getPermissionManager().deny();

        hrbac.getPermissionManager().allow('admin');

        hrbac.getPermissionManager().allow('guest', 'document', ['read']);
        hrbac.getPermissionManager().allow('guest', 'document-comment', ['read', 'create']);

        hrbac.getPermissionManager().allow('user', 'document', ['list']);

        hrbac
            .getPermissionManager()
            .allow('user', 'profile', null, (_rba: HRBAC, role: UserRole | null, resource: ProfileResource | null) => {
                return role!.id === resource!.owner;
            });
        hrbac.getPermissionManager().allow('user', 'ffa');

        hrbac.getPermissionManager().allow('author', 'document', ['create']);
        hrbac
            .getPermissionManager()
            .allow('author', 'document', ['update'], (_rba: HRBAC, role: UserRole | null, resource: DocumentResource | null) => {
                return role!.id === resource!.author;
            });

        hrbac.getPermissionManager().allow('editor', 'document', ['update']);

        hrbac.getPermissionManager().deny('banned');
    });

    describe('permissions', () => {
        it('guest', () => {
            expect(hrbac.isAllowed('guest', documentA, 'read')).toBeTrue();
            expect(hrbac.isDenied('guest', documentA, 'read')).toBeFalse();
            expect(hrbac.isAllowed('guest', documentA, 'update')).toBeFalse();
            expect(hrbac.isDenied('guest', documentA, 'update')).toBeTrue();
        });
        it('admin', () => {
            expect(hrbac.isAllowed(admin, 'settings')).toBeTrue();
            expect(hrbac.isDenied(admin, 'settings')).toBeFalse();
        });

        it('user', () => {
            expect(hrbac.isAllowed(user, documentA, 'read')).toBeTrue();
            expect(hrbac.isDenied(user, documentA, 'read')).toBeFalse();
            expect(hrbac.isAllowed(user, documentA, 'list')).toBeTrue();
            expect(hrbac.isDenied(user, documentA, 'list')).toBeFalse();
            expect(hrbac.isAllowed(user, documentA, 'update')).toBeFalse();
            expect(hrbac.isDenied(user, documentA, 'update')).toBeTrue();

            expect(hrbac.isAllowed(user, 'ffa')).toBeTrue();
            expect(hrbac.isAllowed(userV, 'ffa')).toBeTrue();

            expect(hrbac.isAllowed(user, profileU)).toBeTrue();
            expect(hrbac.isAllowed(user, profileV)).toBeFalse();

            expect(hrbac.isAllowed(user, documentA)).toBeFalse();
        });

        it('editor', () => {
            expect(hrbac.isAllowed(editor, documentA, 'read')).toBeTrue();
            expect(hrbac.isDenied(editor, documentA, 'read')).toBeFalse();
            expect(hrbac.isAllowed(editor, documentA, 'list')).toBeTrue();
            expect(hrbac.isDenied(editor, documentA, 'list')).toBeFalse();
            expect(hrbac.isAllowed(editor, documentA, 'update')).toBeTrue();
            expect(hrbac.isDenied(editor, documentA, 'update')).toBeFalse();
            expect(hrbac.isAllowed(editor, documentA, 'create')).toBeFalse();
            expect(hrbac.isDenied(editor, documentA, 'create')).toBeTrue();
            expect(hrbac.isAllowed(editor, documentA, 'remove')).toBeFalse();
            expect(hrbac.isDenied(editor, documentA, 'remove')).toBeTrue();
        });

        it('author', () => {
            expect(hrbac.isAllowed(authorA, documentA, 'read')).toBeTrue();
            expect(hrbac.isAllowed(authorA, documentA, 'list')).toBeTrue();
            expect(hrbac.isAllowed(authorA, documentA, 'update')).toBeTrue();
            expect(hrbac.isAllowed(authorA, documentA, 'create')).toBeTrue();
            expect(hrbac.isAllowed(authorA, documentA, 'remove')).toBeFalse();

            expect(hrbac.isAllowed(authorB, documentA, 'read')).toBeTrue();
            expect(hrbac.isAllowed(authorB, documentA, 'list')).toBeTrue();
            expect(hrbac.isAllowed(authorB, documentA, 'update')).toBeFalse();
            expect(hrbac.isAllowed(authorB, documentA, 'create')).toBeTrue();
            expect(hrbac.isAllowed(authorB, documentA, 'remove')).toBeFalse();
        });
    });

    it('should support resource inheritance', () => {
        hrbac = new HRBAC(new RoleManager(), new ResourceManager(), new PermissionManager());
        hrbac.getResourceManager().addParents('child', ['parent']);
        hrbac.getPermissionManager().deny();
        hrbac.getPermissionManager().allow('role', 'parent');

        expect(hrbac.isAllowed('role', 'child')).toBeTrue();
    });
});
