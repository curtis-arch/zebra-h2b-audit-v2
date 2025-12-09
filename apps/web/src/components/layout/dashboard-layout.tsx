import { Sidebar } from "./sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        <div className="mx-auto max-w-[2400px] p-6 pt-20 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
