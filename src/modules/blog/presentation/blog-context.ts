"use client";

import { createContext } from "@repo/shared/lib/create-context";

import type { BlogServices } from "../application/blog.ts";

const [BlogServicesContext, useBlogServices] =
  createContext<BlogServices>("BlogServices");

export { BlogServicesContext, useBlogServices };
