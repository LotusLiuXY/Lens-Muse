import { CoverPreview } from "@/components/eazo-cover/cover-preview";
import { EazoCoverReady } from "@/components/eazo-cover/eazo-cover-ready";

export default function EazoCoverPreviewPage() {
  return (
    <EazoCoverReady>
      <div className="h-dvh w-full">
        <CoverPreview />
      </div>
    </EazoCoverReady>
  );
}
