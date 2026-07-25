"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProjectHeader } from "@/components/project-header-context";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "About Us", href: "/#about" },
  { label: "Contact Us", href: "/#contact" },
];

export function TopNavbar() {
  const pathname = usePathname();
  const isChatPage = pathname.startsWith("/chat");
  const isDashboard = pathname.startsWith("/dashboard");
  const { isSignedIn } = useUser();
  const { projectTitle } = useProjectHeader();

  return (
	<header className="sticky top-0 z-40 w-full self-center border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
	  <div className="relative mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
		<Link
		  href="/"
		  className="inline-flex items-center gap-1"
		  aria-label="Documind Home"
		>
		  <span className="flex size-10 items-center justify-center text-2xl">
			{/* <svg
			  xmlns="http://www.w3.org/2000/svg"
			  version="1.1"
			  viewBox="-5.0 -12.0 100.0 115.0"
			  className="fill-primary "
			>
			  <path d="m86.352 76.617c-7.7734-2.1484-9.2656-3.6406-11.41-11.41-0.1875-0.67969-0.80469-1.1484-1.5078-1.1484s-1.3203 0.46875-1.5078 1.1484c-2.1484 7.7734-3.6406 9.2656-11.41 11.41-0.67969 0.1875-1.1484 0.80469-1.1484 1.5078s0.46875 1.3203 1.1484 1.5078c7.7734 2.1484 9.2656 3.6406 11.41 11.41 0.1875 0.67969 0.80469 1.1484 1.5078 1.1484s1.3203-0.46875 1.5078-1.1484c2.1484-7.7734 3.6406-9.2656 11.41-11.41 0.67969-0.1875 1.1484-0.80469 1.1484-1.5078s-0.46875-1.3203-1.1484-1.5078z" />
			  <path d="m56.25 78.125c0-2.1016 1.4141-3.9609 3.4414-4.5195 6.6914-1.8477 7.3828-2.5391 9.2266-9.2305 0.55859-2.0234 2.418-3.4414 4.5195-3.4414 0.52734 0 1.0391 0.089844 1.5156 0.25391 0.007813-14.242 0.046875-31.504 0.046875-31.504h-12.5c-5.1719 0-9.375-4.2031-9.375-9.375v-12.496h-28.66c-4.875 0-8.8398 3.9648-8.8398 8.8398v54.195c0 4.875 3.9648 8.8398 8.8398 8.8398h32.059c-0.17578-0.49219-0.27344-1.0195-0.27344-1.5625zm-26.562-42.188h29.688c1.7266 0 3.125 1.3984 3.125 3.125s-1.3984 3.125-3.125 3.125h-29.688c-1.7266 0-3.125-1.3984-3.125-3.125s1.3984-3.125 3.125-3.125zm0 12.5h29.688c1.7266 0 3.125 1.3984 3.125 3.125s-1.3984 3.125-3.125 3.125h-29.688c-1.7266 0-3.125-1.3984-3.125-3.125s1.3984-3.125 3.125-3.125zm-3.125 15.625c0-1.7266 1.3984-3.125 3.125-3.125h29.688c1.7266 0 3.125 1.3984 3.125 3.125s-1.3984 3.125-3.125 3.125h-29.688c-1.7266 0-3.125-1.3984-3.125-3.125z" />
			  <path d="m59.375 20.312c0 1.7227 1.4023 3.125 3.125 3.125h10.957c-0.3125-0.45312-0.66016-0.88281-1.0586-1.2734l-11.949-11.789c-0.33203-0.32812-0.69922-0.60156-1.0703-0.87109v10.812z" />
			</svg> */}
			<svg
			  xmlns="http://www.w3.org/2000/svg"
			  version="1.1"
			  viewBox="-5.0 -10.0 100.0 135.0"
			  className="fill-primary"
			>
			  <path
				d="m68 42-14-14h-30c-2.2109 0-4 1.7891-4 4v56c0 2.2109 1.7891 4 4 4h40c2.2109 0 4-1.7891 4-4zm-16-10 12 12h-12zm6 16h-28v4h28zm-28-8h10v4h-10zm28 16h-28v4h28zm-28 8h28v4h-28zm22 8h-22v4h22z"
				fillRule="evenodd"
			  />
			  <path d="m86 36 1.9102 4.0898 4.0898 1.9102-4.0898 1.9102-1.9102 4.0898-1.9102-4.0898-4.0898-1.9102 4.0898-1.9102z" />
			  <path d="m88 4 2.5469 5.4531 5.4531 2.5469-5.4531 2.5469-2.5469 5.4531-2.5469-5.4531-5.4531-2.5469 5.4531-2.5469z" />
			  <path d="m72 16 3.8203 8.1797 8.1797 3.8203-8.1797 3.8203-3.8203 8.1797-3.8203-8.1797-8.1797-3.8203 8.1797-3.8203z" />
			</svg>
		  </span>
		  <span className="text-xl font-bold text-primary tracking-wide">
			DocuMind
		  </span>
		</Link>

		{isChatPage && projectTitle ? (
		  <div className="pointer-events-none absolute inset-x-0 flex justify-center px-20">
			<span className="max-w-[min(70vw,42rem)] truncate text-base font-semibold text-foreground sm:text-lg">
			  Project: {projectTitle}
			</span>
		  </div>
		) : (
		  <div>
			{!isDashboard && (
			  <NavigationMenu className="hidden md:flex">
				<NavigationMenuList>
				  {navLinks.map((link) => (
					<NavigationMenuItem key={link.href}>
					  <NavigationMenuLink
						asChild
						className={cn(
						  navigationMenuTriggerStyle(),
						  "text-base",
						  pathname === link.href && "bg-muted text-foreground",
						)}
					  >
						<Link href={link.href}>{link.label}</Link>
					  </NavigationMenuLink>
					</NavigationMenuItem>
				  ))}
				</NavigationMenuList>
			  </NavigationMenu>
			)}
		  </div>
		)}

		{!isDashboard && (
		  <div className="flex items-center gap-2">
			{!isSignedIn ? (
			  <>
				<SignInButton mode="modal">
				  <Button variant="ghost" className="text-base">
					Sign In
				  </Button>
				</SignInButton>
				<SignUpButton mode="redirect">
				  <Button className="text-base">Sign Up</Button>
				</SignUpButton>
			  </>
			) : (
			  <>
				<Button asChild className="bg-primary">
				  <Link href="/dashboard">Dashboard</Link>
				</Button>
				<UserButton />
			  </>
			)}
		  </div>
		)}
		{isDashboard && <UserButton />}
	  </div>
	</header>
  );
}
