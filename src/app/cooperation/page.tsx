import { CooperationPageView } from "@/app/_components/public/cooperation-page";
import { CooperationForm } from "@/app/_components/cooperation-form";
import { aryStyles } from "@/app/_components/ary-shared";

export default function CooperationPage() {
  return (
    <main>
      <CooperationPageView />

      <div style={{ maxWidth: 720, margin: "32px auto 0" }}>
        <CooperationForm />
      </div>

      <style>{aryStyles}</style>
    </main>
  );
}
