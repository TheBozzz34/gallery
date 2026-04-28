import { db } from "@/db";
import { cache } from "react";
import superjson from "superjson";
import { initTRPC, TRPCError } from "@trpc/server";
import { getSession } from "@/modules/auth/lib/get-session";

type Session = Awaited<ReturnType<typeof getSession>>;

type CreateTRPCContextOptions = {
  req?: Request;
  headers?: Headers;
};

export const createTRPCContext = cache(
  async (opts?: CreateTRPCContextOptions) => {
    return { db, headers: opts?.req?.headers ?? opts?.headers };
  }
);

type Context = {
  db: typeof db;
  headers?: Headers;
  session?: Session;
  auth?: NonNullable<Session>["user"];
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(
  t.middleware(async ({ ctx, next }) => {
    const session =
      ctx.session === undefined ? await getSession(ctx.headers) : ctx.session;

    if (!session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
      });
    }

    return next({
      ctx: {
        ...ctx,
        auth: session.user,
      },
    });
  })
);
