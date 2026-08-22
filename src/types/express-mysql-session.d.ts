declare module "express-mysql-session" {
  import session from "express-session";

  interface MySQLStoreOptions {
    uri?: string;
    createDatabaseTable?: boolean;
    [key: string]: unknown;
  }

  class MySQLStore extends session.Store {
    constructor(options: MySQLStoreOptions, connection?: unknown, callback?: unknown, ...rest: unknown[]);
  }

  function factory(sessionModule: typeof session): typeof MySQLStore;
  export = factory;
}
