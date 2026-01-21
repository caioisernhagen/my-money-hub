import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
}

export function MainLayout({
  children,
  title,
  subtitle,
  headerActions,
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav />
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="px-4 lg:px-8 py-6 lg:py-8">
          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 text-muted-foreground">{subtitle}</p>
                )}
              </div>
              {headerActions && (
                <div className="flex-shrink-0">{headerActions}</div>
              )}
            </div>
          </header>

          {/* Content */}
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
}
