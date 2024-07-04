import { afterEach, beforeEach, describe, it } from 'bun:test';
import { Role } from '@a38/core';
import { Controller, Get, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { A38Module } from './a38.module';
import { A38Resource } from './guard';

@Controller('/')
class DashboardController {
    @Get('/')
    @A38Resource('dashboard')
    dashboard() {
        return 'Dashboard';
    }
}

@Controller('/login')
class LoginController {
    @Get('/')
    @A38Resource('login')
    login() {
        return 'Login';
    }
}

@Controller('/profile')
class ProfileController {
    @Get('/')
    @A38Resource('profile')
    profile() {
        return 'Profile';
    }
}

@Controller('/admin')
class AdminController {
    @Get('/')
    @A38Resource('admin')
    admin() {
        return 'Admin';
    }
}

describe('A38Allowed', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                A38Module.forRoot({
                    defaultRole: 'guest',
                    roleResolver: {
                        useValue: context => {
                            const roleId = context.switchToHttp().getRequest().get('X-Role');
                            return roleId && new Role(roleId);
                        }
                    },
                    permissions: [
                        [null, 'dashboard', { type: 'allow', privileges: null }],
                        [null, 'error', { type: 'allow', privileges: null }],
                        [null, 'login', { type: 'allow', privileges: null }],
                        ['user', 'login', { type: 'deny', privileges: null }],
                        ['admin', null, { type: 'allow', privileges: null }],
                        ['admin', 'login', { type: 'deny', privileges: null }]
                    ]
                })
            ],
            controllers: [DashboardController, LoginController, ProfileController, AdminController]
        }).compile();
        app = moduleRef.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await app?.close();
    });

    it('should allow access to dashboard for guest', async () => {
        await request(app.getHttpServer()).get('/').expect(200).expect('Dashboard');
    });

    it('should allow access to dashboard for admin', async () => {
        await request(app.getHttpServer()).get('/').set('X-Role', 'admin').expect(200).expect('Dashboard');
    });

    it('should deny access to admin for user (403)', async () => {
        await request(app.getHttpServer()).get('/admin').set('X-Role', 'user').expect(403);
    });

    it('should deny access to profile for guest (401)', async () => {
        await request(app.getHttpServer()).get('/profile').expect(401);
    });
});
