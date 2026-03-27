import StepProgress from "@/components/shared/StepProgress";

export default function ListingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="container mx-auto px-6 pt-6 pb-4">
        <StepProgress currentStep={2} />
      </div>
      {children}
    </>
  );
}
