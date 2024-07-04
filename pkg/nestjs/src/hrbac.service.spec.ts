import { type Mock, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import * as core from '@a38/core';
import { HrbacService } from './hrbac.service';
import { Loader } from './loader';

describe('HrbacService', () => {
    let loader: { [K in keyof Loader]-?: Mock<NonNullable<Loader[K]>> };
    let roleManagerImportJSONMock: Mock<core.RoleManager['importJSON']>;
    let resourceManagerImportJSONMock: Mock<core.ResourceManager['importJSON']>;
    let permissionManagerImportJSONMock: Mock<core.PermissionManager['importJSON']>;
    let service: HrbacService;
    beforeEach(() => {
        loader = Object.assign(Object.create(Loader.prototype), {
            loadRole: mock(),
            loadResource: mock(),
            loadPermissions: mock()
        });
        const roleManager = new core.RoleManager();
        const resourceManager = new core.ResourceManager();
        const permissionManager = new core.PermissionManager();
        roleManagerImportJSONMock = spyOn(roleManager, 'importJSON');
        resourceManagerImportJSONMock = spyOn(resourceManager, 'importJSON');
        permissionManagerImportJSONMock = spyOn(permissionManager, 'importJSON');
        service = new HrbacService(new core.HRBAC(roleManager, resourceManager, permissionManager), loader);
    });

    it('should load role from loader', async () => {
        loader.loadRole.mockResolvedValueOnce([['roleA', ['depA', 'depB']]]);
        expect(await service.isAllowed('roleA', 'resourceA')).toBeFalsy();
        expect(loader.loadRole).toHaveBeenCalledWith('roleA');
        expect(roleManagerImportJSONMock).toHaveBeenCalledWith([['roleA', ['depA', 'depB']]]);
    });

    it('should load resource from loader', async () => {
        loader.loadResource.mockResolvedValueOnce([['resourceA', ['depA', 'depB']]]);
        expect(await service.isAllowed('roleA', 'resourceA')).toBeFalsy();
        expect(loader.loadResource).toHaveBeenCalledWith('resourceA');
        expect(resourceManagerImportJSONMock).toHaveBeenCalledWith([['resourceA', ['depA', 'depB']]]);
    });

    it('should load permissions from loader', async () => {
        service
            .getHrbac()
            .getRoleManager()
            .importJSON([['roleA', ['depA', 'depB']]]);
        service
            .getHrbac()
            .getResourceManager()
            .importJSON([['resourceA', ['depA', 'depB']]]);
        loader.loadPermissions.mockResolvedValueOnce([['roleA', [['resourceA', [{ type: 'allow', privileges: null }]]]]]);
        expect(await service.isAllowed('roleA', 'resourceA')).toBeTruthy();
        expect(loader.loadPermissions).toHaveBeenCalledWith(['roleA', 'depA', 'depB'], ['resourceA', 'depA', 'depB']);
        expect(permissionManagerImportJSONMock).toHaveBeenCalledWith([['roleA', [['resourceA', [{ type: 'allow', privileges: null }]]]]]);
    });
});
