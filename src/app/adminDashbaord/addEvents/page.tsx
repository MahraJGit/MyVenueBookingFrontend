import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import AddEventsContentPage from "./addEventsContent";

async function LoadingFallback() {
  const t = await getTranslations("common");
  return <div>{t("loading")}</div>;
}

export default function AddEventsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AddEventsContentPage />
    </Suspense>
  );
}
