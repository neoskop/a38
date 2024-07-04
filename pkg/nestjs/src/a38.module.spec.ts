import { beforeEach, describe, expect, it } from 'bun:test';
import { Test, type TestingModule } from '@nestjs/testing';

import { HRBAC } from '@a38/core';
import { Module } from '@nestjs/common';
import { A38Module, type A38OptionsFactory } from './a38.module';

describe('A38Module', () => {
    describe.each([
        [
            'forRoot',
            async () =>
                await Test.createTestingModule({
                    imports: [A38Module.forRoot({ defaultRole: 'guest', roleResolver: { useValue: () => undefined } })],
                    exports: [A38Module]
                }).compile()
        ],
        [
            'forRootAsync#useFactory',
            async () =>
                await Test.createTestingModule({
                    imports: [
                        A38Module.forRootAsync({
                            useFactory: () => ({ defaultRole: 'guest' }),
                            roleResolver: { useValue: () => undefined }
                        })
                    ],
                    exports: [A38Module]
                }).compile()
        ],
        [
            'forRootAsync#useClass',
            async () =>
                await Test.createTestingModule({
                    imports: [
                        A38Module.forRootAsync({
                            useClass: class implements A38OptionsFactory {
                                createA38Options() {
                                    return { defaultRole: 'guest' };
                                }
                            },
                            roleResolver: { useValue: () => undefined }
                        })
                    ],
                    exports: [A38Module]
                }).compile()
        ],
        [
            'forRootAsync#useExisting',
            async () => {
                class A38OptionsFactoryImpl implements A38OptionsFactory {
                    createA38Options() {
                        return { defaultRole: 'guest' };
                    }
                }

                @Module({
                    providers: [A38OptionsFactoryImpl],
                    exports: [A38OptionsFactoryImpl]
                })
                class DepModule {}

                return await Test.createTestingModule({
                    imports: [
                        A38Module.forRootAsync({
                            imports: [DepModule],
                            useExisting: A38OptionsFactoryImpl,
                            roleResolver: { useValue: () => undefined }
                        })
                    ],
                    exports: [A38Module]
                }).compile();
            }
        ]
    ])('%s', (_, setup) => {
        let moduleRef: TestingModule;
        beforeEach(async () => {
            moduleRef = await setup();
        });

        it('should provide HRBAC', () => {
            expect(moduleRef.get(HRBAC)).toBeInstanceOf(HRBAC);
        });
    });
});
