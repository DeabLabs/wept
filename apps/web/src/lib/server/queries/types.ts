import type { Queries } from 'database';
import type { DbType } from 'database/queries';

export type GetProjectsQueryType<T extends keyof Queries<DbType>['Project']> = Awaited<
  ReturnType<Queries<DbType>['Project'][T]>
>;

export type GetTopicsQueryType<T extends keyof Queries<DbType>['Project']> = Awaited<
  ReturnType<Queries<DbType>['Project'][T]>
>;
