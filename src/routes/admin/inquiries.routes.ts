import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { parsePage, buildPageList } from "../../utils/pagination";
import { InquiryStatus } from "@prisma/client";

export const inquiriesRouter = Router();

const STATUSES: InquiryStatus[] = ["NEW", "IN_PROGRESS", "RESOLVED", "ARCHIVED"];

inquiriesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, perPage, skip, take } = parsePage(req.query.page, 20);
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const where = status && STATUSES.includes(status as InquiryStatus) ? { status: status as InquiryStatus } : {};

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { profile: { select: { fullName: true, stageName: true, slug: true } } },
      }),
      prisma.inquiry.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));

    res.render("admin/inquiries/index", {
      title: "Inquiries",
      inquiries,
      status,
      statuses: STATUSES,
      page,
      totalPages,
      pageList: buildPageList(page, totalPages),
      total,
    });
  })
);

inquiriesRouter.put(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const status = req.body.status;
    if (STATUSES.includes(status)) {
      await prisma.inquiry.update({ where: { id }, data: { status } });
      req.flash("success", "Inquiry status updated.");
    }
    res.redirect(req.get("referer") || "/admin/inquiries");
  })
);

inquiriesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.inquiry.delete({ where: { id: Number(req.params.id) } });
    req.flash("success", "Inquiry deleted.");
    res.redirect("/admin/inquiries");
  })
);
