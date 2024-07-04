import { TestBed } from '@angular/core/testing';

import { HRBAC } from '@a38/core';
import { A38Module } from './a38.module';

describe('A38Module', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [A38Module.forRoot({ defaultRole: 'guest', guardDenyHandler: () => false })]
        }).compileComponents();
    });

    it('should provide HRBAC', () => {
        expect(TestBed.inject(HRBAC)).toBeInstanceOf(HRBAC);
    });

    it('should throw meaningful error on missing `forRoot`', async () => {
        await expect(async () => {
            TestBed.resetTestingModule();
            await TestBed.configureTestingModule({
                imports: [A38Module]
            }).compileComponents();
            TestBed.inject(HRBAC);
        }).rejects.toEqual(new Error('You need to import A38Module.forRoot in your root module/component.'));
    });
});
