import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('returns tenant context on /auth/me without passwordHash', async () => {
    const result = await controller.me({
      user: {
        _id: 'user-1',
        email: 'tenant@example.com',
        name: 'Tenant User',
        role: 'TENANT_OWNER',
        status: 'active',
        passwordHash: 'secret',
        tenantId: 'tenant-123',
        tenantRole: 'clinic_admin',
      },
    } as never);

    expect(result).toEqual({
      _id: 'user-1',
      email: 'tenant@example.com',
      name: 'Tenant User',
      role: 'TENANT_OWNER',
      status: 'active',
      tenantId: 'tenant-123',
      tenantRole: 'clinic_admin',
    });
  });

  it('falls back to request tenantId when JWT user object lacks it', async () => {
    const result = await controller.me({
      user: {
        _id: 'user-2',
        email: 'staff@example.com',
        name: 'Staff User',
        role: 'TENANT_STAFF',
        status: 'active',
      },
      tenantId: 'tenant-from-request',
    } as never);

    expect(result).toMatchObject({
      tenantId: 'tenant-from-request',
    });
  });
});
