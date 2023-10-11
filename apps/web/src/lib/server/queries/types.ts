export type GetProjectsQueryType<T extends keyof typeof import('database')['Queries']['Project']> =
  Awaited<ReturnType<typeof import('database')['Queries']['Project'][T]>>;

export type GetTopicsQueryType<T extends keyof typeof import('database')['Queries']['Topic']> =
  Awaited<ReturnType<typeof import('database')['Queries']['Topic'][T]>>;
