"use client";
import * as React from "react";
import Link from "next/link";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";

const data = {
    navMain: [
        {
            url: "",
            items: [
                {
                    title: "Overview",
                    url: "/dashboard",
                    isActive: true,
                },
                {
                    title: "Projects",
                    url: "/dashboard/projects",
                },
                {
                    title: "Knowledge Base",
                    url: "/dashboard/knowledge-base",
                },
                {
                    title: "Bookmarks",
                    url: "/dashboard/bookmarks",
                },
                {
                    title: "Settings",
                    url: "/dashboard/settings",
                },
            ],
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar {...props}>
            <SidebarHeader>DOCUMIND</SidebarHeader>
            <SidebarContent>
                {data.navMain.map((item) => (
                    <SidebarGroup key={item.url} className="mt-10">
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {item.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={item.isActive}
                                        >
                                            <Link href={item.url}>
                                                {item.title}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
