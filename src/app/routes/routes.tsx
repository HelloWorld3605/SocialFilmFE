import { createBrowserRouter } from "react-router-dom";
import adminRoutes from "./admin.routers";
import publicRouters from "./public.routers";

const routes = createBrowserRouter([...publicRouters]);

export default routes;
