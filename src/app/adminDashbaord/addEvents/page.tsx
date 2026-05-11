import { Suspense } from "react";
import AddEventsContentPage from "./addEventsContent";

export default function AddEventsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddEventsContentPage />
    </Suspense>
  );
}