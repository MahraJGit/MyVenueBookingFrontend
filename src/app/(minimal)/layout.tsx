import Header from "@/components/common/Header";

export default function MinimalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
