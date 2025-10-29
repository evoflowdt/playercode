import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Search, Filter } from "lucide-react";
import type { AuditLogWithDetails } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/lib/language-provider";


const actionColors: Record<string, string> = {
  create: "bg-green-500",
  update: "bg-blue-500",
  delete: "bg-red-500",
  login: "bg-purple-500",
  logout: "bg-gray-500",
  invite_member: "bg-cyan-500",
  remove_member: "bg-orange-500",
  update_member_role: "bg-yellow-500",
  revoke_invitation: "bg-pink-500",
  update_organization: "bg-indigo-500",
};

export default function AuditLogsPage() {
  const { t } = useLanguage();
  const actionLabels: Record<string, string> = {
    create: t("displayRegistered"),
    update: t("update"),
    delete: t("delete"),
    login: t("login"),
    logout: t("logout"),
    invite_member: t("invitationSent"),
    remove_member: t("memberRemoved"),
    update_member_role: t("update"),
    revoke_invitation: t("invitationRevoked"),
    update_organization: t("organizationUpdated"),
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");

  // Fetch audit logs
  const { data: auditLogs = [], isLoading } = useQuery<AuditLogWithDetails[]>({
    queryKey: ["/api/audit-logs"],
  });

  // Filter logs based on search and filters
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userLastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesResource = resourceFilter === "all" || log.resourceType === resourceFilter;

    return matchesSearch && matchesAction && matchesResource;
  });

  // Get unique actions and resource types for filters
  const uniqueActions = [...new Set(auditLogs.map((log) => log.action))];
  const uniqueResourceTypes = [...new Set(auditLogs.map((log) => log.resourceType))];

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <ScrollText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{t("auditLogsTitle")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("auditLogsSubtitle")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t("filters")}</CardTitle>
          <CardDescription>{t("filterAuditLogs")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchLogs")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-logs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger data-testid="select-action-filter">
                  <SelectValue placeholder={t("allActions")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allActions")}</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {actionLabels[action] || action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger data-testid="select-resource-filter">
                  <SelectValue placeholder={t("allResources")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allResources")}</SelectItem>
                  {uniqueResourceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle>
              {filteredLogs.length} {filteredLogs.length !== 1 ? t("logs") : t("log")}
            </CardTitle>
          </div>
          <CardDescription>
            {t("showingLogs").replace("{count}", filteredLogs.length.toString()).replace("{total}", auditLogs.length.toString())}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-loading">{t("loading")}</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-logs">
              {auditLogs.length === 0
                ? t("noAuditLogs")
                : t("noLogsMatchFilters")}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("timestamp")}</TableHead>
                    <TableHead>{t("user")}</TableHead>
                    <TableHead>{t("action")}</TableHead>
                    <TableHead>{t("resource")}</TableHead>
                    <TableHead>{t("details")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {log.userFirstName} {log.userLastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{log.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={actionColors[log.action] || "bg-gray-500"}>
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium capitalize">{log.resourceType}</p>
                          {log.resourceId && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {log.resourceId.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.details && (
                          <div className="max-w-xs truncate text-sm text-muted-foreground">
                            {log.details}
                          </div>
                        )}
                        {log.ipAddress && (
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            {log.ipAddress}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
