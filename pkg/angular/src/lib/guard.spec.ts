import { Location } from '@angular/common';
import { Component, input } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterModule } from '@angular/router';

import { A38Module } from './a38.module';
import { a38Allowed, defineRouteResourceData } from './guard';
import { RoleStore } from './role-store';

@Component({
    standalone: true,
    selector: 'a38-dashboard',
    template: 'Dashboard'
})
class DashboardComponent {}

@Component({
    standalone: true,
    selector: 'a38-login',
    template: 'Login'
})
class LoginComponent {}

@Component({
    standalone: true,
    selector: 'a38-admin',
    template: 'Admin'
})
class AdminComponent {}

@Component({
    standalone: true,
    selector: 'a38-error',
    template: 'Error({{code()}})'
})
class ErrorComponent {
    code = input.required<string>();
}

@Component({
    standalone: true,
    selector: 'a38-root',
    imports: [RouterModule],
    template: '<router-outlet></router-outlet>'
})
class RootComponent {}

describe('a38Allowed', () => {
    let fixture: ComponentFixture<RootComponent>;
    let router: Router;
    let location: Location;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [
                RootComponent,
                A38Module.forRoot({
                    defaultRole: 'guest',
                    guardDenyHandler: roleId => {
                        if (roleId === 'guest') {
                            return router.parseUrl('/login');
                        }
                        return router.parseUrl('/error/403');
                    },
                    permissions: [
                        [
                            null,
                            [
                                ['dashboard', [{ type: 'allow', privileges: null }]],
                                ['error', [{ type: 'allow', privileges: null }]],
                                ['login', [{ type: 'allow', privileges: null }]]
                            ]
                        ],
                        ['user', [['login', [{ type: 'deny', privileges: null }]]]],
                        [
                            'admin',
                            [
                                [null, [{ type: 'allow', privileges: null }]],
                                ['login', [{ type: 'deny', privileges: null }]]
                            ]
                        ]
                    ]
                }),
                RouterModule.forRoot(
                    [
                        {
                            path: '',
                            pathMatch: 'full',
                            component: DashboardComponent,
                            // data: { ...defineRouteResourceData('dashboard') },
                            canActivate: [a38Allowed('dashboard')]
                        },
                        {
                            path: 'login',
                            component: LoginComponent,
                            // data: { ...defineRouteResourceData('login') },
                            canActivate: [a38Allowed('login')]
                        },
                        {
                            path: 'admin',
                            component: AdminComponent,
                            // data: { ...defineRouteResourceData('admin') },
                            canActivate: [a38Allowed('admin')]
                        },
                        {
                            path: 'error/:code',
                            component: ErrorComponent,
                            // data: { ...defineRouteResourceData('error') },
                            canActivate: [a38Allowed('error')]
                        },
                        {
                            path: '**',
                            redirectTo: '/'
                        }
                    ],
                    { bindToComponentInputs: true }
                )
            ]
        });

        await TestBed.compileComponents();

        fixture = TestBed.createComponent(RootComponent);
        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
        router.initialNavigation();
        fixture.autoDetectChanges(true);
    });

    it('should allow access to dashboard for guest', async () => {
        await router.navigate(['/']);
        expect(location.path()).toEqual('');
        expect(fixture.debugElement.nativeNode.textContent).toEqual('Dashboard');
    });

    it('should allow access to dashboard for admin', async () => {
        TestBed.inject(RoleStore).setRole('admin');
        await router.navigate(['/']);
        expect(location.path()).toEqual('');
        expect(fixture.debugElement.nativeNode.textContent).toEqual('Dashboard');
    });

    it('should redirect to error for user accessing admin', async () => {
        TestBed.inject(RoleStore).setRole('user');
        await router.navigate(['/admin']);
        expect(location.path()).toEqual('/error/403');
        fixture.detectChanges(); // Required to render inputs
        expect(fixture.debugElement.nativeNode.textContent).toEqual('Error(403)');
    });

    it('should redirect to login for guest accessing admin', async () => {
        await router.navigate(['/admin']);
        expect(location.path()).toEqual('/login');
        expect(fixture.debugElement.nativeNode.textContent).toEqual('Login');
    });
});
