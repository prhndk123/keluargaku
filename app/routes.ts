import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  route("/auth", "routes/auth.tsx"),

  layout("routes/_authenticated/route.tsx", [
    index("routes/_authenticated/index.tsx"),
    route("/members", "routes/_authenticated/members.tsx"),
    route("/finance", "routes/_authenticated/finance.tsx"),
    route("/finance/recurring", "routes/_authenticated/finance.recurring.tsx"),
    route("/agenda", "routes/_authenticated/agenda.tsx"),
  ]),
] satisfies RouteConfig;
