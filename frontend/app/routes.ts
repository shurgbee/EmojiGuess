import { type RouteConfig, index , route} from "@react-router/dev/routes";

export default [
    route("/", "routes/home.tsx"),
    route("game", "routes/game.tsx")
] satisfies RouteConfig;
