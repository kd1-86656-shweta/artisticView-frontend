import { useAppSelector } from '@/store';
import type { SubFeatureAccess } from '@/types/api';

/** Backend privilege check mirror, e.g. usePermission('USER_FOLLOW'). Hides UI the API would reject anyway. */
export function usePermission(name: string): boolean {
  return useAppSelector((s) => s.auth.session?.permissions.includes(name) ?? false);
}

const NO_ACCESS = { canRead: false, canWrite: false, canDelete: false };

/** Read/write/delete on one sub-feature, as agasty-frontend's useSubFeaturePermissions. */
export function useSubFeature(name: string): Pick<SubFeatureAccess, 'canRead' | 'canWrite' | 'canDelete'> {
  return useAppSelector((s) => {
    for (const feature of s.auth.session?.features ?? []) {
      const sub = feature.subFeatures.find((sf) => sf.name === name);
      if (sub) {
        return sub;
      }
    }
    return NO_ACCESS;
  });
}
