"use client";

import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";

type TopbarProps = {
  onMenuClick?: () => void;
};

const Topbar = ({ onMenuClick }: TopbarProps) => {
  return (
    <DashboardTopbar
      onMenuClick={onMenuClick}
      notificationsHref="/userDashboard/notifications"
      notificationsVariant="user"
    />
  );
};

export default Topbar;
