import { createBrowserRouter } from "react-router-dom";
import adminRouters from "./admin.routers";
import publicRouters from "./public.routers";

const routes = createBrowserRouter([...publicRouters, ...adminRouters]);

export default routes;
