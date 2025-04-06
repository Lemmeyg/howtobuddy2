"use client";

import { useState, useEffect } from "react";
import { Template } from "@/lib/template";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { formatDistanceToNow } from "date-fns";

interface TemplateAnalyticsProps {
  template: Template;
}

interface UsageStats {
  total_uses: number;
  unique_users: number;
  average_variables: number;
  last_used: string;
  usage_by_type: Array<{
    type: string;
    count: number;
  }>;
  recent_uses: Array<{
    id: string;
    user_id: string;
    document_id: string;
    created_at: string;
    variables: Record<string, any>;
  }>;
}

export function TemplateAnalytics({ template }: TemplateAnalyticsProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, [template.id]);

  const fetchStats = async () => {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      // Get total usage count
      const { count: totalUses } = await supabase
        .from("template_usage")
        .select("*", { count: "exact", head: true })
        .eq("template_id", template.id);

      // Get unique users count
      const { count: uniqueUsers } = await supabase
        .from("template_usage")
        .select("user_id", { count: "exact", head: true })
        .eq("template_id", template.id);

      // Get average variables count
      const { data: variablesData } = await supabase
        .from("template_usage")
        .select("variables")
        .eq("template_id", template.id);

      const averageVariables = variablesData
        ? Math.round(
            variablesData.reduce(
              (acc, curr) => acc + Object.keys(curr.variables).length,
              0
            ) / variablesData.length
          )
        : 0;

      // Get last used timestamp
      const { data: lastUsed } = await supabase
        .from("template_usage")
        .select("created_at")
        .eq("template_id", template.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Get usage by document type
      const { data: usageByType } = await supabase
        .from("template_usage")
        .select(`
          documents:document_id (
            type
          )
        `)
        .eq("template_id", template.id);

      const typeCounts = usageByType?.reduce((acc, curr) => {
        const type = curr.documents?.type || "unknown";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const usageByTypeArray = Object.entries(typeCounts || {}).map(
        ([type, count]) => ({
          type,
          count,
        })
      );

      // Get recent uses
      const { data: recentUses } = await supabase
        .from("template_usage")
        .select(`
          id,
          user_id,
          document_id,
          created_at,
          variables
        `)
        .eq("template_id", template.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        total_uses: totalUses || 0,
        unique_users: uniqueUsers || 0,
        average_variables: averageVariables,
        last_used: lastUsed?.created_at || "",
        usage_by_type: usageByTypeArray,
        recent_uses: recentUses || [],
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch template analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/templates/${template.id}/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.name}-analytics.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export analytics",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  if (!stats) {
    return <div>No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Template Analytics</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchStats}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Uses
          </h3>
          <p className="text-2xl font-bold">{stats.total_uses}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Unique Users
          </h3>
          <p className="text-2xl font-bold">{stats.unique_users}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Avg. Variables
          </h3>
          <p className="text-2xl font-bold">{stats.average_variables}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Last Used
          </h3>
          <p className="text-2xl font-bold">
            {stats.last_used
              ? formatDistanceToNow(new Date(stats.last_used), {
                  addSuffix: true,
                })
              : "Never"}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Usage by Document Type</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.usage_by_type}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Uses</h3>
        <div className="space-y-4">
          {stats.recent_uses.map((use) => (
            <div
              key={use.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium">
                  Document: {use.document_id.slice(0, 8)}...
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(use.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {Object.keys(use.variables).length} variables used
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 