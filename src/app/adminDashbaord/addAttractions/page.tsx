import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import AddAttractionsContentPage from "./addAttractionsContent";

async function LoadingFallback() {
  const t = await getTranslations("common");
  return <div>{t("loading")}</div>;
}

export default function AddAttractionsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AddAttractionsContentPage />
    </Suspense>
  );
}
