import path from "path";
import express, { Express } from "express";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import flash from "connect-flash";
import methodOverride from "method-override";
import helmet from "helmet";
import mysql from "mysql2/promise";

import { env } from "./config/env";
import { loadCurrentUser } from "./middleware/auth";
import { injectLocals } from "./middleware/locals";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { publicRouter } from "./routes/public.routes";
import { adminRouter } from "./routes/admin";

const MySQLStore = MySQLStoreFactory(session);

export function createApp(): Express {
  const app = express();

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));
  app.set("trust proxy", 1);

  app.use(
    helmet({
      // Server-rendered EJS pages use inline <script>/<style> in a few
      // partials; a strict default-src would break them without a nonce
      // pipeline that this app's size doesn't warrant yet.
      contentSecurityPolicy: false,
    })
  );

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(methodOverride("_method"));
  app.use(express.static(path.join(__dirname, "..", "public")));

  // Safe fallbacks for every view local the templates read, set before the
  // session/flash/DB-backed middleware below runs. If one of those throws
  // (e.g. the database is briefly unreachable), the error page can still
  // render instead of crashing a second time on an undefined local.
  app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.currentUser = null;
    res.locals.flashSuccess = [];
    res.locals.flashError = [];
    res.locals.blocks = [];
    res.locals.settings = {
      siteName: "Portfolio CMS",
      tagline: null,
      logoUrl: null,
      faviconUrl: null,
      primaryColor: "#7c3aed",
      contactEmail: null,
      instagramUrl: null,
      twitterUrl: null,
      youtubeUrl: null,
    };
    next();
  });

  // express-mysql-session's `options` object only understands discrete
  // host/user/password/database fields, not a connection string — so we
  // hand it an already-configured mysql2 pool (which does parse a URI)
  // instead of trying to pass DATABASE_URL through its options.
  const sessionPool = mysql.createPool(env.databaseUrl);
  const sessionStore = new MySQLStore({ createDatabaseTable: true }, sessionPool);

  app.use(
    session({
      name: "portfolio_cms_sid",
      secret: env.sessionSecret,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: env.isProduction,
        sameSite: "lax",
      },
    })
  );

  app.use(flash());
  app.use(loadCurrentUser);
  app.use(injectLocals);

  app.use("/admin", adminRouter);
  app.use("/", publicRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
