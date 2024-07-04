import { InjectionToken, computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

export interface RoleStoreState {
    defaultRole: string;
    currentRole: string | undefined;
}

export const DEFAULT_ROLE = new InjectionToken<string>('A38 Default Role');
export const ROLE_STATE = new InjectionToken<RoleStoreState>('[A38] Role State', {
    factory: () => ({
        defaultRole: inject(DEFAULT_ROLE),
        currentRole: undefined
    })
});

export const RoleStore = signalStore(
    withState(() => inject(ROLE_STATE)),
    withComputed(store => ({
        role: computed(() => store.currentRole() ?? store.defaultRole())
    })),
    withMethods(store => ({
        setRole(role: string): void {
            patchState(store, state => ({ ...state, currentRole: role }));
        }
    }))
);
