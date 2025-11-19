"use client";

import {
  AlertCircle,
  BarChart3,
  Cpu,
  Layers,
  LayoutDashboard,
  Menu,
  Package,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    href: "/products",
    icon: Package,
  },
  {
    name: "Cohorts",
    href: "/cohorts",
    icon: Layers,
  },
  {
    name: "Components",
    href: "/components",
    icon: Cpu,
  },
  {
    name: "Field Population",
    href: "/field-population",
    icon: BarChart3,
  },
  {
    name: "Gap Analysis",
    href: "/gap-analysis",
    icon: AlertCircle,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          aria-label="Toggle menu"
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          variant="outline"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 border-r bg-sidebar transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center border-b px-6">
            <Link
              className="flex items-center gap-2 font-semibold text-sidebar-foreground"
              href="/"
              onClick={() => setIsOpen(false)}
            >
              <Package className="h-6 w-6" />
              <span className="text-lg">Zebra Config</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  href={item.href}
                  key={item.name}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <Separator />

          {/* Footer */}
          <div className="p-4">
            <p className="text-muted-foreground text-xs">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
