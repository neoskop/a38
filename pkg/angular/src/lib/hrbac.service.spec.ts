import { TestBed } from '@angular/core/testing';

import * as core from '@a38/core';
import { HrbacService } from './hrbac.service';
import { Loader } from './loader';

describe('HrbacService', () => {
    let loader: jest.Mocked<Required<Loader>>;
    let roleManagerImportJSONMock: jest.SpyInstance<ReturnType<core.RoleManager['importJSON']>, Parameters<core.RoleManager['importJSON']>>;
    let resourceManagerImportJSONMock: jest.SpyInstance<
        ReturnType<core.ResourceManager['importJSON']>,
        Parameters<core.ResourceManager['importJSON']>
    >;
    let permissionManagerImportJSONMock: jest.SpyInstance<
        ReturnType<core.PermissionManager['importJSON']>,
        Parameters<core.PermissionManager['importJSON']>
    >;
    let service: HrbacService;
    beforeEach(async () => {
        loader = Object.assign(Object.create(Loader.prototype), {
            loadRole: jest.fn(),
            loadResource: jest.fn(),
            loadPermissions: jest.fn()
        });
        const roleManager = new core.RoleManager();
        const resourceManager = new core.ResourceManager();
        const permissionManager = new core.PermissionManager();
        roleManagerImportJSONMock = jest.spyOn(roleManager, 'importJSON');
        resourceManagerImportJSONMock = jest.spyOn(resourceManager, 'importJSON');
        permissionManagerImportJSONMock = jest.spyOn(permissionManager, 'importJSON');
        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: core.HRBAC,
                    useValue: new core.HRBAC(roleManager, resourceManager, permissionManager)
                },
                { provide: Loader, useValue: loader },
                HrbacService
            ]
        }).compileComponents();
        service = TestBed.inject(HrbacService);
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
