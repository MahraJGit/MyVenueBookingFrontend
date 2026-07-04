"use client";

import { useTranslations } from "next-intl";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";

type TopbarProps = {
  onMenuClick?: () => void;
};

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const t = useTranslations("userDashboard");

  return (
    <DashboardTopbar
      onMenuClick={onMenuClick}
      searchPlaceholder={t("searchPlaceholder")}
      notificationsHref="/userDashboard/notifications"
      notificationsVariant="user"
    />
  );
};

export default Topbar;
