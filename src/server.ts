import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.port, () => {
  console.log(`Portfolio CMS listening on port ${env.port} (${env.nodeEnv})`);
});
