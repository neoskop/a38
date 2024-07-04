import { PermissionManager } from '@a38/core';
import { Component, NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { A38Module } from './a38.module';
import { A38AllowedPipe, A38DeniedPipe } from './pipes';
import { RoleStore } from './role-store';

@Component({
    standalone: true,
    imports: [A38AllowedPipe],
    selector: 'allow-test',
    template: `@if ('resourceA' | a38Allowed) {Allowed} @else {Denied}`
})
class AllowTestComponent {}

@Component({
    standalone: true,
    imports: [A38DeniedPipe],
    selector: 'allow-test',
    template: `@if ('resourceA' | a38Denied) {Denied} @else {Allowed}`
})
class DenyTestComponent {}

describe('Pipes', () => {
    describe('a38Allowed', () => {
        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [A38Module.forRoot({ defaultRole: 'guest', guardDenyHandler: () => false }), AllowTestComponent]
            }).compileComponents();
        });
        it('should return falsy initially', async () => {
            TestBed.inject(PermissionManager).allow('guest', 'resourceA');
            const fixture = TestBed.createComponent(AllowTestComponent);
            fixture.autoDetectChanges(true);

            expect(fixture.debugElement.nativeElement.textContent).toEqual('Denied');

            await sleep(1, TestBed.inject(NgZone));

            expect(fixture.debugElement.nativeElement.textContent).toEqual('Allowed');
        });

        it('reevaluate on role change', async () => {
            TestBed.inject(PermissionManager).allow('user', 'resourceA');
            const fixture = TestBed.createComponent(AllowTestComponent);
            fixture.autoDetectChanges(true);

            await sleep(1, TestBed.inject(NgZone));
            expect(fixture.debugElement.nativeElement.textContent).toEqual('Denied');

            TestBed.inject(RoleStore).setRole('user');
            await sleep(1, TestBed.inject(NgZone));

            expect(fixture.debugElement.nativeElement.textContent).toEqual('Allowed');
        });
    });

    describe('a38Denied', () => {
        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [A38Module.forRoot({ defaultRole: 'guest', guardDenyHandler: () => false }), DenyTestComponent]
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
            expect(fixture.debugElement.nativeElement.textContent).toEqual('Allowed');

            TestBed.inject(RoleStore).setRole('guest');
            await sleep(1, TestBed.inject(NgZone));

            expect(fixture.debugElement.nativeElement.textContent).toEqual('Denied');
        });
    });
});

function sleep(ms: number, ngZone: NgZone) {
    return ngZone.runOutsideAngular(() => new Promise<void>(resolve => setTimeout(resolve, ms)));
}
