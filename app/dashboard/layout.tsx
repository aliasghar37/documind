import dynamic from "next/dynamic";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import React from "react";
import MyBreadCrumb from "./components/MyBreadcrumb";

const AppSidebar = dynamic(
    () =>
        import("@/app/dashboard/app-sidebar").then(
            (module) => module.AppSidebar,
        ),
    // {
    // ssr: false,
    // },
);

export default function Page({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                        />
                        <Breadcrumb>
                            <MyBreadCrumb />
                        </Breadcrumb>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4">
                        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                            <div className="aspect-video rounded-xl bg-muted/50" />
                            <div className="aspect-video rounded-xl bg-muted/50" />
                            <div className="aspect-video rounded-xl bg-muted/50" />
                        </div>
                        <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
                    </div>
                </SidebarInset>
            </SidebarProvider>
            {children}
        </>
    );
}
