export type GetProjectsQueryType<T extends keyof typeof import('$lib/server/queries/projects')> =
  Awaited<ReturnType<typeof import('$lib/server/queries/projects')[T]>>;

export type GetTopicsQueryType<T extends keyof typeof import('$lib/server/queries/topics')> =
  Awaited<ReturnType<typeof import('$lib/server/queries/topics')[T]>>;
