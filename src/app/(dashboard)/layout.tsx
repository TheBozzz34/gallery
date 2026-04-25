import { Metadata } from "next";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/modules/dashboard/ui/components/site-header";
import CreatePhotoModal from "@/modules/photos/ui/components/create-photo-modal";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";
import { getSession } from "@/modules/auth/lib/get-session";

export const metadata: Metadata = {
  title: {
    template: "%s - Dashboard",
    default: "Dashboard",
  },
};

async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <DashboardSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        {children}
        <CreatePhotoModal />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Layout;
