import { createBrowserRouter } from "react-router-dom";
import publicRouters from "./public.routers";

const routes = createBrowserRouter([...publicRouters]);

export default routes;
