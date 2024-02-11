import { withAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DUB_DOMAINS, LEGAL_USER_ID, ensureArray } from "@dub/utils";

// GET /api/admin/links
export const GET = withAdmin(async ({ searchParams }) => {
  const {
    domain,
    search,
    sort = "createdAt",
    page,
  } = searchParams as {
    domain?: string;
    search?: string;
    sort?: "createdAt" | "clicks" | "lastClicked";
    page?: string;
  };

  const response = await prisma.link.findMany({
    where: {
      ...(domain
        ? { domain }
        : {
            domain: {
              in: DUB_DOMAINS.map((domain) => domain.slug),
            },
          }),
      ...(search && {
        OR: [
          {
            key: { contains: search },
          },
          {
            url: { contains: search },
          },
        ],
      }),
      userId: {
        not: LEGAL_USER_ID,
      },
    },
    include: {
      user: true,
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
    },
    orderBy: {
      [sort]: "desc",
    },
    take: 100,
    ...(page && {
      skip: (parseInt(page) - 1) * 100,
    }),
  });

  const links = response.map((link) => ({
    ...link,
    tags: link.tags.map(({ tag }) => tag),
  }));

  return NextResponse.json(links);
});
