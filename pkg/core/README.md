# @a38/core

Core of the A38 hierarchical RBAC library


## Installation

```bash
npm install @a38/core   # for NPM
yarn add @a38/core      # for Yarn
pnpm add @a38/core      # for PNPM
```

## Usage

```typescript
import { HRBAC, PermissionManager, ResourceManager, RoleManager } from '@a38/core';

const roleManager = new RoleManager();
roleManager.setParents('guest', []); // optional
roleManager.setParents('user', ['guest']); // role 'user' extends role 'guest'
roleManager.setParents('admin', ['user']); // role 'admin' extends role 'user'

const resourceManager = new ResourceManager();
resourceManager.setParents('dashboard', []); // optional
resourceManager.setParents('login', []); // optional
resourceManager.setParents('profile', []); // optional
resourceManager.setParents('admin', []); // optional

const permissionManager = new PermissionManager();
permissionManager.allow('guest', 'dashboard'); // allow 'guest' access to 'dashboard'
permissionManager.allow('guest', 'login'); // allow 'guest' access to 'dashboard'

permissionManager.allow('user', 'profile'); // allow 'user' access to 'profile'
permissionManager.deny('user', 'login'); // deny 'user' access to login

permissionManager.allow('admin'); // allow 'admin' access to everything
permissionManager.deny('admin', 'login'); // deny 'admin' access to login

const hrbac = new HRBAC(roleManager, resourceManager, permissionManager);

hrbac.isAllowed('guest', 'dashboard'); // -> true
hrbac.isAllowed('guest', 'login'); // -> true
hrbac.isAllowed('guest', 'profile'); // -> false
hrbac.isAllowed('guest', 'admin'); // -> false

hrbac.isAllowed('user', 'login'); // -> false
hrbac.isAllowed('user', 'profile'); // -> true

hrbac.isAllowed('admin', 'login'); // -> false
hrbac.isAllowed('admin', 'profile'); // -> true
hrbac.isAllowed('admin', 'admin'); // -> true
```

## Docs

See the [documentation](https://neoskop.github.io/a38/modules/_a38_core.html)

## License

@a38/core is licensed under the MIT License, See the [LICENSE](../../LICENSE) file for more details

## Sponsoring

The project development and maintenance is sponsored by [Neoskop](https://neoskop.de).