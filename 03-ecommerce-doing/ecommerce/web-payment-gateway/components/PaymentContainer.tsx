export default function PaymentContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "var(--background)", padding: "32px 20px" }}
    >
      <div className="w-full" style={{ maxWidth: "400px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {children}
      </div>
    </div>
  );
}
