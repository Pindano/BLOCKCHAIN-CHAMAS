// app/chama/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseClient } from "@/lib/supabase-client";
import type { Chama, ChamaMember } from "@/lib/types";
import { Plus, Users, Mail, LogOut } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";

interface ChamaWithMembers extends Chama {
  memberCount?: number;
  userRole?: string;
  creatorName?: string;
}

export default function Chama() {
  const [chamas, setChamas] = useState<ChamaWithMembers[]>([]);
  const [userChamas, setUserChamas] = useState<Record<string, ChamaMember>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedChamaForInvite, setSelectedChamaForInvite] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [formData, setFormData] = useState({ name: "", description: "", investmentType: "", targetAmount: "" });
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn } = useIsSignedIn();
  const router = useRouter();
const {evmAddress} = useEvmAddress();

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/auth");
      return;
    }

    const fetchChamas = async () => {
      const supabase = getSupabaseClient();
      const { data: session } = await supabase.auth.getSession();
      const walletAddress = evmAddress;
      if (!walletAddress) {
        setError("No wallet address found in session");
        return;
      }

      try {
        // Get user
        const { data: userData } = await supabase
          .from("users")
          .select("user_id")
          .eq("wallet_address", walletAddress)
          .single();

        if (!userData) {
          setError("User not found");
          return;
        }
        setUserId(userData.user_id);

        // Get all active chamas
        const { data: chamasData } = await supabase.from("chamas").select("*").eq("is_active", true);

        // Get user's memberships
        const { data: memberData } = await supabase.from("chama_members").select("*").eq("user_id", userData.user_id);

        const memberMap =
          memberData?.reduce(
            (acc, m) => ({
              ...acc,
              [m.chama_id]: m,
            }),
            {},
          ) || {};
        setUserChamas(memberMap);

        // Get member counts and creator names for each chama
        if (chamasData) {
          const chamasWithDetails = await Promise.all(
            chamasData.map(async (chama) => {
              const { count } = await supabase
                .from("chama_members")
                .select("*", { count: "exact", head: true })
                .eq("chama_id", chama.chama_id);

              const { data: creatorData } = await supabase
                .from("users")
                .select("first_name, last_name")
                .eq("user_id", chama.creator_id)
                .single();

              return {
                ...chama,
                memberCount: count || 0,
                userRole: memberMap[chama.chama_id]?.role,
                creatorName: creatorData ? `${creatorData.first_name} ${creatorData.last_name}` : "Unknown",
              };
            }),
          );
          setChamas(chamasWithDetails);
        }
      } catch (err) {
        console.error("Error fetching chamas:", err);
        setError("An unexpected error occurred");
      }
    };

    fetchChamas();
  }, [isSignedIn, router]);

  const handleCreateChama = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const supabase = getSupabaseClient();

    const { data: newChama, error } = await supabase
      .from("chamas")
      .insert({
        name: formData.name,
        description: formData.description,
        creator_id: userId,
        investment_type: formData.investmentType,
        target_amount: formData.targetAmount ? Number.parseFloat(formData.targetAmount) : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating chama:", error);
      setError("Failed to create chama");
    } else {
      await supabase.from("chama_members").insert({
        chama_id: newChama.chama_id,
        user_id: userId,
        role: "admin",
        voting_power: 1,
      });

      setChamas([
        ...chamas,
        {
          ...newChama,
          memberCount: 1,
          userRole: "admin",
          creatorName: "You",
        },
      ]);
      setFormData({ name: "", description: "", investmentType: "", targetAmount: "" });
      setShowCreateForm(false);
    }
  };

  const handleJoinChama = async (chamaId: string) => {
    if (!userId) return;

    const supabase = getSupabaseClient();

    const { error } = await supabase.from("chama_members").insert({
      chama_id: chamaId,
      user_id: userId,
      role: "member",
      voting_power: 1,
    });

    if (error) {
      console.error("Error joining chama:", error);
      setError("Failed to join chama");
    } else {
      const updatedChamas = chamas.map((c) =>
        c.chama_id === chamaId
          ? {
              ...c,
              memberCount: (c.memberCount || 0) + 1,
              userRole: "member",
            }
          : c,
      );
      setChamas(updatedChamas);
      setUserChamas({
        ...userChamas,
        [chamaId]: {
          chama_member_id: "",
          chama_id: chamaId,
          user_id: userId,
          role: "member",
          shares: null,
          voting_power: 1,
          contributed_amount: 0,
          status: "active",
          joined_at: new Date().toISOString(),
        },
      });
    }
  };

  const handleLeaveChama = async (chamaId: string) => {
    if (!userId) return;

    const supabase = getSupabaseClient();

    const { error } = await supabase.from("chama_members").delete().eq("chama_id", chamaId).eq("user_id", userId);

    if (error) {
      console.error("Error leaving chama:", error);
      setError("Failed to leave chama");
    } else {
      const updatedChamas = chamas.map((c) =>
        c.chama_id === chamaId
          ? {
              ...c,
              memberCount: Math.max(0, (c.memberCount || 0) - 1),
              userRole: undefined,
            }
          : c,
      );
      setChamas(updatedChamas);
      const updatedUserChamas = { ...userChamas };
      delete updatedUserChamas[chamaId];
      setUserChamas(updatedUserChamas);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChamaForInvite || !inviteEmail) return;

    const supabase = getSupabaseClient();

    const { data: invitedUser } = await supabase.from("users").select("user_id").eq("email", inviteEmail).single();

    if (!invitedUser) {
      setError("User not found");
      return;
    }

    const { data: existingMember } = await supabase
      .from("chama_members")
      .select("*")
      .eq("chama_id", selectedChamaForInvite)
      .eq("user_id", invitedUser.user_id)
      .single();

    if (existingMember) {
      setError("User is already a member");
      return;
    }

    const { error } = await supabase.from("chama_members").insert({
      chama_id: selectedChamaForInvite,
      user_id: invitedUser.user_id,
      role: "member",
      voting_power: 1,
    });

    if (error) {
      console.error("Error inviting member:", error);
      setError("Failed to invite member");
    } else {
      setInviteEmail("");
      setSelectedChamaForInvite(null);
      const updatedChamas = chamas.map((c) =>
        c.chama_id === selectedChamaForInvite
          ? {
              ...c,
              memberCount: (c.memberCount || 0) + 1,
            }
          : c,
      );
      setChamas(updatedChamas);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="text-center py-4 mb-8 bg-destructive/10 border border-destructive rounded p-4">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Chamas</h1>
              <p className="text-muted-foreground">Manage your groups and memberships</p>
            </div>
            <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Chama
            </Button>
          </div>

          {showCreateForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Create New Chama</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateChama} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Chama Name</label>
                    <Input
                      placeholder="e.g., Savings Group 2024"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-input rounded-md"
                      placeholder="Describe your chama..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Investment Type</label>
                      <Input
                        placeholder="e.g., Savings, Investment"
                        value={formData.investmentType}
                        onChange={(e) => setFormData({ ...formData, investmentType: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Amount (Optional)</label>
                      <Input
                        type="number"
                        placeholder="e.g., 10000"
                        value={formData.targetAmount}
                        onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button type="submit">Create</Button>
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {selectedChamaForInvite && (
            <Card className="mb-8 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Invite Member to Chama
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInviteMember} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Member Email</label>
                    <Input
                      type="email"
                      placeholder="member@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button type="submit">Send Invite</Button>
                    <Button variant="outline" onClick={() => setSelectedChamaForInvite(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chamas.map((chama) => (
              <Card key={chama.chama_id} className={chama.userRole ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{chama.name}</CardTitle>
                      <CardDescription>{chama.investment_type}</CardDescription>
                    </div>
                    {chama.userRole && (
                      <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-1 rounded">
                        {chama.userRole}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{chama.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Creator: {chama.creatorName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{chama.memberCount} members</span>
                    </div>
                  </div>

                  {chama.target_amount && (
                    <div className="text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Users className="w-4 h-4" />
                        <span>Progress</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, ((chama.current_amount || 0) / chama.target_amount) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-1 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>
                          {chama.current_amount} / {chama.target_amount} {chama.currency}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {chama.userRole ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link href={`/chama/${chama.chama_id}`} className="flex-1 text-center">
                            View Details
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedChamaForInvite(chama.chama_id)}
                          className="gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          Invite
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleLeaveChama(chama.chama_id)}
                          className="gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Leave
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => handleJoinChama(chama.chama_id)} className="w-full">
                        Join Chama
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {chamas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No chamas available yet</p>
              <Button onClick={() => setShowCreateForm(true)}>Create the first chama</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
