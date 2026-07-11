"use client";

import { usePathname } from "next/navigation";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

export default function MyBreadcrumb() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((part, index) => ({
	label: decodeURIComponent(part).replace(/-/g, " "),
	href: "/" + parts.slice(0, index + 1).join("/"),
	isLast: index === parts.length - 1,
  }));

  return (
	<BreadcrumbList className="text-base">
	  {crumbs.map((crumb) => (
		<React.Fragment key={crumb.href}>
		  <BreadcrumbItem>
			{crumb.isLast ? (
			  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
			) : (
			  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
			)}
		  </BreadcrumbItem>
		  {!crumb.isLast && <BreadcrumbSeparator />}
		</React.Fragment>
	  ))}
	</BreadcrumbList>
  );
}
