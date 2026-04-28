import { cache } from "react";
import { auth } from "./auth";
import { headers } from "next/headers";

export const getSession = cache(async (requestHeaders?: Headers) => {
  return await auth.api.getSession({
    headers: requestHeaders ?? (await headers()),
  });
});

export const getActiveSessions = cache(async (requestHeaders?: Headers) => {
  return await auth.api.listSessions({
    headers: requestHeaders ?? (await headers()),
  });
});
