import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { authRouter } from "./auth.routes";
import { dashboardRouter } from "./dashboard.routes";
import { profilesRouter } from "./profiles.routes";
import { portfolioRouter } from "./portfolio.routes";
import { inquiriesRouter } from "./inquiries.routes";
import { mediaRouter } from "./media.routes";
import { settingsRouter } from "./settings.routes";
import { usersRouter } from "./users.routes";
import { createSimpleResourceRouter } from "./simpleResource";
import { pressConfig, awardsConfig, eventsConfig, testimonialsConfig } from "./resources";

export const adminRouter = Router();

// Login/logout must stay reachable without a session.
adminRouter.use("/", authRouter);

adminRouter.use(requireAuth);

adminRouter.use("/", dashboardRouter);
adminRouter.use("/profiles", profilesRouter);
adminRouter.use("/profiles/:profileId/portfolio", portfolioRouter);
adminRouter.use("/profiles/:profileId/press", createSimpleResourceRouter(pressConfig));
adminRouter.use("/profiles/:profileId/awards", createSimpleResourceRouter(awardsConfig));
adminRouter.use("/profiles/:profileId/events", createSimpleResourceRouter(eventsConfig));
adminRouter.use("/profiles/:profileId/testimonials", createSimpleResourceRouter(testimonialsConfig));
adminRouter.use("/inquiries", inquiriesRouter);
adminRouter.use("/media", mediaRouter);
adminRouter.use("/settings", settingsRouter);
adminRouter.use("/users", usersRouter);
