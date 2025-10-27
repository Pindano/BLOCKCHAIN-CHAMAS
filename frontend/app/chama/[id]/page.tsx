// app/chama/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseClient } from "@/lib/supabase-client";
import type { Chama, ChamaMember } from "@/lib/types";
import { Mail, Users, TrendingUp, DollarSign, Calendar, Tag, LogOut } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";

interface ChamaWithDetails extends Chama {
  memberCount?: number;
  userRole?: string;
  creatorName?: string;
  memberDetails?: ChamaMember[];
}

export default function ChamaDetails() {
  const [chama, setChama] = useState<ChamaWithDetails | null>(null);
  const [userChama, setUserChama] = useState<ChamaMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { isSignedIn } = useIsSignedIn();
  const router = useRouter();
  const params = useParams();
  const chamaId = params.id as string;
  const { evmAddress } = useEvmAddress();
  useEffect(() => {
    if (!isSignedIn) {
      router.push("/auth");
      return;
    }

    const fetchChama = async () => {
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

        // Get chama data
        const { data: chamaData } = await supabase
          .from("chamas")
          .select("*")
          .eq("chama_id", chamaId)
          .eq("is_active", true)
          .single();

        if (!chamaData) {
          setError("Chama not found");
          return;
        }

        // Get creator name
        const { data: creatorData } = await supabase
          .from("users")
          .select("first_name, last_name")
          .eq("user_id", chamaData.creator_id)
          .single();

        // Get member count
        const { count } = await supabase
          .from("chama_members")
          .select("*", { count: "exact", head: true })
          .eq("chama_id", chamaId);

        // Get member details
        const { data: membersData } = await supabase
          .from("chama_members")
          .select("*, users(first_name, last_name, email)")
          .eq("chama_id", chamaId);

        // Get user's membership
        const { data: memberData } = await supabase
          .from("chama_members")
          .select("*")
          .eq("chama_id", chamaId)
          .eq("user_id", userData.user_id)
          .single();

        setChama({
          ...chamaData,
          memberCount: count || 0,
          userRole: memberData?.role,
          creatorName: creatorData ? `${creatorData.first_name} ${creatorData.last_name}` : "Unknown",
          memberDetails: membersData || [],
        });
        setUserChama(memberData);
      } catch (err) {
        console.error("Error fetching chama:", err);
        setError("An unexpected error occurred");
      }
    };

    fetchChama();
  }, [isSignedIn, router, chamaId]);

  const handleJoinChama = async () => {
    if (!userId || !chama) return;

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
      setChama({
        ...chama,
        memberCount: (chama.memberCount || 0) + 1,
        userRole: "member",
      });
      setUserChama({
        chama_member_id: "",
        chama_id: chamaId,
        user_id: userId,
        role: "member",
        shares: null,
        voting_power: 1,
        contributed_amount: 0,
        status: "active",
        joined_at: new Date().toISOString(),
      });
    }
  };

  const handleLeaveChama = async () => {
    if (!userId || !chama) return;

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("chama_members")
      .delete()
      .eq("chama_id", chamaId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error leaving chama:", error);
      setError("Failed to leave chama");
    } else {
      setChama({
        ...chama,
        memberCount: Math.max(0, (chama.memberCount || 0) - 1),
        userRole: undefined,
      });
      setUserChama(null);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chama || !inviteEmail) return;

    const supabase = getSupabaseClient();
    const { data: invitedUser } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", inviteEmail)
      .single();

    if (!invitedUser) {
      setError("User not found");
      return;
    }

    const { data: existingMember } = await supabase
      .from("chama_members")
      .select("*")
      .eq("chama_id", chamaId)
      .eq("user_id", invitedUser.user_id)
      .single();

    if (existingMember) {
      setError("User is already a member");
      return;
    }

    const { error } = await supabase.from("chama_members").insert({
      chama_id: chamaId,
      user_id: invitedUser.user_id,
      role: "member",
      voting_power: 1,
    });

    if (error) {
      console.error("Error inviting member:", error);
      setError("Failed to invite member");
    } else {
      setInviteEmail("");
      setShowInviteForm(false);
      setChama({
        ...chama,
        memberCount: (chama.memberCount || 0) + 1,
        memberDetails: [
          ...(chama.memberDetails || []),
          {
            chama_member_id: "",
            chama_id: chamaId,
            user_id: invitedUser.user_id,
            role: "member",
            shares: null,
            voting_power: 1,
            contributed_amount: 0,
            status: "active",
            joined_at: new Date().toISOString(),
            users: { first_name: "", last_name: "", email: inviteEmail },
          },
        ],
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
        <div className="max-w-4xl mx-auto">
          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => router.push("/chama")}>Back to Chamas</Button>
            </div>
          ) : chama ? (
            <>
              {/* Chama Details */}
              <Card className="mb-8">
               <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{chama.name}</CardTitle>
                      <CardDescription>{chama.investment_type || "N/A"}</CardDescription>
                    </div>
                    {chama.userRole && (
                      <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-1 rounded">
                        {chama.userRole}
                      </span>
                    )}
</div>
                </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Creator</p>
                        <p className="font-semibold">{chama.creatorName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-semibold">{chama.is_active ? "Active" : "Inactive"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="font-semibold">{new Date(chama.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Currency</p>
                        <p className="font-semibold">{chama.currency}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Description</p>
                      <p className="text-sm">{chama.description || "No description"}</p>
                    </div>

                    {chama.target_amount && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Financial Progress
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>
                              {chama.current_amount} / {chama.target_amount} {chama.currency}
                            </span>
                            <span>{Math.round(((chama.current_amount || 0) / chama.target_amount) * 100)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${Math.min(100, ((chama.current_amount || 0) / chama.target_amount) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Members ({chama.memberCount})
                      </p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {chama.memberDetails?.map((member: any) => (
                          <div
                            key={member.chama_member_id}
                            className="flex justify-between items-center p-3 bg-muted rounded"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {member.users?.first_name} {member.users?.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">{member.users?.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold capitalize">{member.role}</p>
                              <p className="text-xs text-muted-foreground">VP: {member.voting_power}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4 flex-wrap">
                      {chama.userRole ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowInviteForm(true)}
                            className="gap-2"
                          >
                            <Mail className="w-4 h-4" />
                            Invite Member
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleLeaveChama}
                            className="gap-2"
                          >
                            <LogOut className="w-4 h-4" />
                            Leave Chama
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" onClick={handleJoinChama} className="w-full">
                          Join Chama
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Invite Form */}
                {showInviteForm && chama.userRole && (
                  <Card className="mb-8 border-primary">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Invite Member to {chama.name}
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
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowInviteForm(false);
                              setInviteEmail("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Loading chama details...</p>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
