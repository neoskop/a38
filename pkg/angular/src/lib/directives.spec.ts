import { PermissionManager } from '@a38/core';
import { Component, NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { A38Module } from './a38.module';
import { A38AllowedDirective, A38DeniedDirective } from './directives';
import { DEFAULT_ROLE, RoleStore } from './role-store';

@Component({
    standalone: true,
    imports: [A38AllowedDirective],
    selector: 'allow-test',
    template: `<ng-container *a38Allowed="'resourceA'">Allowed</ng-container>`
})
class AllowTestComponent {}

@Component({
    standalone: true,
    imports: [A38AllowedDirective],
    selector: 'allow-extended-test',
    template: `<ng-container *a38Allowed="'resourceA';role:'user';privilege:'priv'">Allowed</ng-container>`
})
class AllowExtendedTestComponent {}

@Component({
    standalone: true,
    imports: [A38DeniedDirective],
    selector: 'allow-test',
    template: `<ng-container *a38Denied="'resourceA'">Denied</ng-container>`
})
class DenyTestComponent {}

@Component({
    standalone: true,
    imports: [A38DeniedDirective],
    selector: 'allow-extended-test',
    template: `<ng-container *a38Denied="'resourceA';role:'user';privilege:'priv'">Denied</ng-container>`
})
class DenyExtendedTestComponent {}

describe('Directives', () => {
    describe('a38Allowed', () => {
        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [
                    A38Module.forRoot({ defaultRole: 'guest', guardDenyHandler: () => false }),
                    AllowTestComponent,
                    AllowExtendedTestComponent
                ]
            }).compileComponents();
        });
        it('should return falsy initially', async () => {
            TestBed.inject(PermissionManager).allow('guest', 'resourceA');
            const fixture = TestBed.createComponent(AllowTestComponent);
            fixture.autoDetectChanges(true);

            expect(fixture.debugElement.nativeElement.textContent).toEqual('');

            await sleep(1, TestBed.inject(NgZone));

            expect(fixture.debugElement.nativeElement.textContent).toEqual('Allowed');
        });

        it('reevaluate on role change', async () => {
            TestBed.inject(PermissionManager).allow('user', 'resourceA');
            const fixture = TestBed.createComponent(AllowTestComponent);
            fixture.autoDetectChanges(true);

            await sleep(1, TestBed.inject(NgZone));
            expect(fixture.debugElement.nativeElement.textContent).toEqual('');

            TestBed.inject(RoleStore).setRole('user');
            await sleep(1, TestBed.inject(NgZone));

            expect(fixture.debugElement.nativeElement.textContent).toEqual('Allowed');
        });

        it('should utilize provided role and privilege', async () => {
            TestBed.inject(PermissionManager).allow('user', 'resourceA', ['priv']);
            const baseFixture = TestBed.createComponent(AllowTestComponent);
            const extendedFixture = TestBed.createComponent(AllowExtendedTestComponent);
            baseFixture.autoDetectChanges(true);
            extendedFixture.autoDetectChanges(true);

            await sleep(1, TestBed.inject(NgZone));
            expect(baseFixture.debugElement.nativeElement.textContent).toEqual('');
            expect(extendedFixture.debugElement.nativeElement.textContent).toEqual('Allowed');
        });
    });

    describe('a38Denied', () => {
        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [
                    A38Module.forRoot({ defaultRole: 'guest', guardDenyHandler: () => false }),
                    DenyTestComponent,
                    DenyExtendedTestComponent
                ]
            }).compileComponents();
        });
        it('should return truethy initially', async () => {
            const fixture = TestBed.createComponent(DenyTestComponent);
            fixture.autoDetectChanges(true);

            expect(fixture.debugElement.nativeElement.textContent).toEqual('Denied');

            await sleep(1, TestBed.inject(NgZone));

            expect(fixture.debugElement.nativeElement.textContent).toEqual('Denied');
        });

        it('reevaluate on role change', async () => {
            TestBed.inject(PermissionManager).allow('user', 'resourceA');
            TestBed.inject(RoleStore).setRole('user');
            const fixture = TestBed.createComponent(DenyTestComponent);
            fixture.autoDetectChanges(true);

            await sleep(1, TestBed.inject(NgZone));
            expect(fixture.debugElement.nativeElement.textContent).toEqual('');

            TestBed.inject(RoleStore).setRole('guest');
            await sleep(1, TestBed.inject(NgZone));

            expect(fixture.debugElement.nativeElement.textContent).toEqual('Denied');
        });

        it('should utilize provided role and privilege', async () => {
            TestBed.inject(PermissionManager).allow(null);
            TestBed.inject(PermissionManager).deny('user', 'resourceA', ['priv']);
            const baseFixture = TestBed.createComponent(DenyTestComponent);
            const extendedFixture = TestBed.createComponent(DenyExtendedTestComponent);
            baseFixture.autoDetectChanges(true);
            extendedFixture.autoDetectChanges(true);

            await sleep(1, TestBed.inject(NgZone));
            expect(baseFixture.debugElement.nativeElement.textContent).toEqual('');
            expect(extendedFixture.debugElement.nativeElement.textContent).toEqual('Denied');
        });
    });
});

function sleep(ms: number, ngZone: NgZone) {
    return ngZone.runOutsideAngular(() => new Promise<void>(resolve => setTimeout(resolve, ms)));
}
