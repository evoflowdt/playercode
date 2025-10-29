import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Mail, Clock, X } from "lucide-react";
import type { TeamMember, InvitationWithDetails } from "@shared/schema";
import { useLanguage } from "@/lib/language-provider";


const roleColors: Record<string, string> = {
  owner: "bg-purple-500",
  admin: "bg-blue-500",
  editor: "bg-green-500",
  viewer: "bg-gray-500",
};

export default function TeamPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const roleLabels: Record<string, string> = {
    owner: t("owner"),
    admin: t("admin"),
    editor: t("editor"),
    viewer: t("viewer"),
  };
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("viewer");
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  // Fetch team members
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  // Fetch pending invitations
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery<InvitationWithDetails[]>({
    queryKey: ["/api/invitations"],
  });

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      return await apiRequest("POST", "/api/invitations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("viewer");
      toast({
        title: t("invitationSent"),
        description: t("invitationSent"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("failedSendInvitation"),
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await apiRequest("PATCH", `/api/team/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({
        title: t("update"),
        description: t("memberRemoved"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("failedRemoveMember"),
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/team/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
      toast({
        title: t("memberRemoved"),
        description: t("memberRemoved"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("failedRemoveMember"),
        variant: "destructive",
      });
    },
  });

  // Revoke invitation mutation
  const revokeInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return await apiRequest("DELETE", `/api/invitations/${invitationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      toast({
        title: t("invitationRevoked"),
        description: t("invitationRevoked"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("failedRevokeInvitation"),
        variant: "destructive",
      });
    },
  });

  const handleInvite = () => {
    if (!inviteEmail || !inviteRole) {
      toast({
        title: t("error"),
        description: t("failedSendInvitation"),
        variant: "destructive",
      });
      return;
    }
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const handleRemoveMember = (member: TeamMember) => {
    setMemberToRemove(member);
    setRemoveDialogOpen(true);
  };

  const confirmRemoveMember = () => {
    if (memberToRemove) {
      removeMemberMutation.mutate(memberToRemove.userId);
    }
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("teamManagement")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("teamManagementSubtitle")}
          </p>
        </div>
        <Button
          onClick={() => setInviteDialogOpen(true)}
          data-testid="button-invite-member"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {t("inviteTeamMember")}
        </Button>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>{t("teamMembers")}</CardTitle>
          <CardDescription>
            {teamMembers.length} {teamMembers.length !== 1 ? t("teamMembers").toLowerCase() : t("teamMembers").toLowerCase().slice(0, -1)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-loading">{t("loading")}</div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-members">{t("noDisplaysRegistered")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("email")}</TableHead>
                  <TableHead>{t("role")}</TableHead>
                  <TableHead>{t("invitedOn")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id} data-testid={`row-member-${member.userId}`}>
                    <TableCell className="font-medium" data-testid={`text-name-${member.userId}`}>
                      {member.userFirstName} {member.userLastName}
                    </TableCell>
                    <TableCell data-testid={`text-email-${member.userId}`}>
                      {member.userEmail}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={member.role}
                        onValueChange={(role) =>
                          updateRoleMutation.mutate({ userId: member.userId, role })
                        }
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-32" data-testid={`select-role-${member.userId}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">{t("owner")}</SelectItem>
                          <SelectItem value="admin">{t("admin")}</SelectItem>
                          <SelectItem value="editor">{t("editor")}</SelectItem>
                          <SelectItem value="viewer">{t("viewer")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member)}
                        disabled={removeMemberMutation.isPending}
                        data-testid={`button-remove-${member.userId}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>{t("pendingInvitations")}</CardTitle>
          <CardDescription>
            {invitations.length} {t("pendingInvitations").toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitationsLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-loading-invitations">{t("loading")}</div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-invitations">{t("pendingInvitations")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("email")}</TableHead>
                  <TableHead>{t("role")}</TableHead>
                  <TableHead>{t("invitedBy")}</TableHead>
                  <TableHead>{t("expiresAt")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id} data-testid={`row-invitation-${invitation.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {invitation.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[invitation.role]}>
                        {roleLabels[invitation.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invitation.inviterFirstName} {invitation.inviterLastName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeInvitationMutation.mutate(invitation.id)}
                        disabled={revokeInvitationMutation.isPending}
                        data-testid={`button-revoke-${invitation.id}`}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent data-testid="dialog-invite">
          <DialogHeader>
            <DialogTitle>{t("inviteTeamMember")}</DialogTitle>
            <DialogDescription>
              {t("teamManagementSubtitle")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("inviteEmailPlaceholder")}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                data-testid="input-invite-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{t("role")}</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="role" data-testid="select-invite-role">
                  <SelectValue placeholder={t("selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">{t("viewer")}</SelectItem>
                  <SelectItem value="editor">{t("editor")}</SelectItem>
                  <SelectItem value="admin">{t("admin")}</SelectItem>
                  <SelectItem value="owner">{t("owner")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
              data-testid="button-cancel-invite"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleInvite}
              disabled={inviteMutation.isPending}
              data-testid="button-send-invite"
            >
              {inviteMutation.isPending ? t("saving") : t("sendInvite")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent data-testid="dialog-remove-member">
          <DialogHeader>
            <DialogTitle>{t("confirmRemoveMember").replace("{name}", "")}</DialogTitle>
            <DialogDescription>
              {t("confirmRemoveMember").replace("{name}", `${memberToRemove?.userFirstName} ${memberToRemove?.userLastName}`)} {t("thisActionCannotBeUndone")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialogOpen(false)}
              data-testid="button-cancel-remove"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveMember}
              disabled={removeMemberMutation.isPending}
              data-testid="button-confirm-remove"
            >
              {removeMemberMutation.isPending ? t("saving") : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
