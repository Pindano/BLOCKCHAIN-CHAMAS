// sidebar.tsx
"use client"

import { useEffect, useState } from "react"
import { useSignOut, useIsSignedIn } from "@coinbase/cdp-hooks"
import { useEvmAddress } from "@coinbase/cdp-hooks"
import { usePathname, useRouter } from "next/navigation" // Added for routing
import { Button } from "@/components/ui/button"
import { LogOut, User, Users, Vote, Home, Menu } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"
import type { User as UserType } from "@/lib/types"

export default function Sidebar() {
  const { signOut } = useSignOut()
  const { evmAddress } = useEvmAddress()
  const [user, setUser] = useState<UserType | null>(null)
  const [isOpen, setIsOpen] = useState(false) // For mobile toggle
  const pathname = usePathname() // Get current route
  const router = useRouter() // For programmatic navigation
const { isSignedIn } = useIsSignedIn();
  useEffect(() => {
    const fetchUser = async () => {
      if (!isSignedIn) {
        setUser(null);
        return;
      }

      const supabase = getSupabaseClient();

      // Grab the current Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Adjust the path if your wallet address lives elsewhere in the metadata
      const walletAddress = evmAddress
      if (!walletAddress) {
        console.warn("No wallet address found in session");
        setUser(null);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", walletAddress)
        .single();

      if (error) {
        console.error("Error fetching user for sidebar:", error);
        setUser(null);
      } else {
        setUser(data);
      }
    };

    fetchUser();
  }, [isSignedIn]);

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  // Navigation items
  const navItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/chama", icon: Users, label: "Chamas" },
    { href: "/proposal", icon: Vote, label: "Proposals" },
    { href: "/profile", icon: User, label: "Profile" },
  ]

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="w-6 h-6" />
      </Button>

      {/* Sidebar */}
      <aside
        className={`w-64 bg-card border-r border-border p-6 flex flex-col h-screen sticky top-0 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 z-40 lg:z-auto`}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Chama DAO</h1>
          <p className="text-xs text-muted-foreground mt-1">Decentralized Group Management</p>
        </div>

        

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)} // Navigate on click
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                pathname === item.href ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full justify-start gap-3 bg-transparent hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </Button>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
