import type { User } from '@prisma/client';
import { useRouteLoaderData } from '@remix-run/react';

import type { loader } from '~/root';

type PublicUser = Omit<User, 'password'>;

export function User(): PublicUser | null {
  const data = useRouteLoaderData<typeof loader>('root');
  if (!data || !data.user) return null;
  const deserializedUser: PublicUser = {
    ...data.user,
    createdAt: new Date(data.user.createdAt),
    updatedAt: new Date(data.user.updatedAt),
  };
  return deserializedUser;
}
