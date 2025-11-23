"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, Users, Vote, User, LogOut, Menu, Plus } from "lucide-react"
import { useUser } from "@/lib/UserContext"
import { useSignOut } from "@coinbase/cdp-hooks"
import Image from "next/image"

export function Navbar() {
    const router = useRouter()
    const pathname = usePathname()
    const { user } = useUser()
    const { signOut } = useSignOut()

    // Hide navbar on landing and auth pages
    const shouldHideNavbar = pathname === "/" || pathname?.startsWith("/auth")

    if (shouldHideNavbar) {
        return null
    }

    const initials = user
        ? `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase()
        : "U"

    const navItems = [
        { name: "Home", path: "/", icon: Home },
        
    ]



    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => router.push("/dashboard")}
                    >
                       
                        <span className="text-xl font-bold">Chama DAO</span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => router.push(item.path)}
                                className={`text-sm font-medium transition-colors hover:text-[var(--kente-orange)] ${pathname === item.path
                                    ? "text-[var(--kente-orange)]"
                                    : "text-muted-foreground"
                                    }`}
                            >
                                {item.name}
                            </button>
                        ))}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <Button
                                    onClick={() => router.push("/chama/create")}
                                    className="hidden md:flex gap-2"
                                    size="sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Chama
                                </Button>

                                {/* User Menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-full">
                                            <Avatar className="w-8 h-8">
                                                <AvatarFallback className="bg-[var(--kente-orange)] text-white text-sm">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>
                                            <div>
                                                <p className="font-medium">
                                                    {user.first_name} {user.last_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                                            <Home className="w-4 h-4 mr-2" />
                                            Dashboard
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push("/profile")}>
                                            <User className="w-4 h-4 mr-2" />
                                            Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={signOut}
                                            className="text-red-600"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Log Out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <Button
                                onClick={() => router.push("/auth")}
                                size="sm"
                            >
                                Sign In
                            </Button>
                        )}

                        {/* Mobile Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild className="md:hidden">
                                <Button variant="ghost" size="icon">
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {navItems.map((item) => (
                                    <DropdownMenuItem
                                        key={item.path}
                                        onClick={() => router.push(item.path)}
                                    >
                                        <item.icon className="w-4 h-4 mr-2" />
                                        {item.name}
                                    </DropdownMenuItem>
                                ))}
                                {user && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => router.push("/chama/create")}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Chama
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </nav>
    )
}
