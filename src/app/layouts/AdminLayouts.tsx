import React from "react";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <main>
      <Outlet />
    </main>
  );
};

export default AdminLayout;
