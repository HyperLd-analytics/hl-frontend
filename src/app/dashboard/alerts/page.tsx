"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Settings,
  Bell,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { AlertRule } from "@/types/dashboard";

function severityFromPriority(priority: number): string {
  if (priority >= 90) return "critical";
  if (priority >= 70) return "high";
  if (priority >= 50) return "medium";
  return "low";
}

function AlertCard({
  alert,
  onToggle,
  onDelete,
}: {
  alert: AlertRule;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const severity = severityFromPriority(alert.priority);

  const severityColor = {
    critical: "bg-red-500/10 text-red-500 border-red-500/20",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  }[severity];

  return (
    <Card className="p-4 border-border/50 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`mt-0.5 p-1.5 rounded-md border shrink-0 ${severityColor}`}
          >
            {severity === "critical" || severity === "high" ? (
              <AlertTriangle className="h-3.5 w-3.5" />
            ) : (
              <Bell className="h-3.5 w-3.5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-sm">
                {alert.name ?? `Alert #${alert.id.slice(0, 8)}`}
              </h4>
              <Badge className={`text-[10px] px-1.5 py-0.5 border-0 ${severityColor}`}>
                {severity}
              </Badge>
              {alert.is_active ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  <XCircle className="h-2.5 w-2.5" /> Paused
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-medium">{alert.alert_type}</span>
              {alert.target && <> · {alert.target}</>}
            </p>
            {alert.last_triggered && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Last triggered: {new Date(alert.last_triggered).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onToggle(alert.id, !alert.is_active)}
          >
            {alert.is_active ? (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:text-red-500"
            onClick={() => onDelete(alert.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [telegramChannel, setTelegramChannel] = useState("");

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/alerts", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        // AlertsResponse: { alerts: AlertRule[] } or AlertRule[]
        setAlerts(Array.isArray(data) ? data : (data.alerts ?? []));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleAlert = useCallback(async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/v1/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: active }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, is_active: active } : a))
        );
      }
    } catch (e) {
      console.error("Failed to toggle alert", e);
    }
  }, []);

  const deleteAlert = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/v1/alerts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete alert", e);
    }
  }, []);

  const bindTelegram = useCallback(async () => {
    if (!telegramChannel.trim()) return;
    try {
      const res = await fetch("/api/v1/alerts/bind-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: telegramChannel }),
      });
      if (res.ok) {
        alert("Telegram channel bound successfully!");
        setTelegramChannel("");
      } else {
        alert("Failed to bind Telegram channel");
      }
    } catch (e) {
      console.error("Failed to bind Telegram", e);
    }
  }, [telegramChannel]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const filtered = alerts.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.name?.toLowerCase().includes(q) ||
      a.alert_type?.toLowerCase().includes(q) ||
      a.target?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alert Rules</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor wallet activity and get notified of significant changes
          </p>
        </div>
        <Button size="sm" className="h-9" onClick={() => setShowCreate((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" /> Create Alert
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="p-5 border-border/50">
          <h3 className="font-semibold mb-4">Create New Alert</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Alert Name</label>
              <Input placeholder="e.g. Whale Alert" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Alert Type</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="pnl_change">PnL Change</option>
                <option value="position_size">Position Size</option>
                <option value="new_wallet">New Wallet</option>
                <option value="funding_rate">Funding Rate</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value={90}>Critical (90)</option>
                <option value={70}>High (70)</option>
                <option value={50}>Medium (50)</option>
                <option value={30}>Low (30)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Target</label>
              <Input placeholder="e.g. 0x... or ALL" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="h-8">Create</Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Telegram Binding */}
      <Card className="p-4 border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">Telegram Notifications</h3>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Telegram channel name or ID"
            value={telegramChannel}
            onChange={(e) => setTelegramChannel(e.target.value)}
            className="h-9 max-w-sm"
          />
          <Button variant="outline" size="sm" className="h-9" onClick={bindTelegram}>
            Bind Channel
          </Button>
        </div>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search alerts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Loading alerts...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "No alerts match your search" : "No alerts configured yet"}
            </p>
            {!search && (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCreate(true)}>
                Create your first alert
              </Button>
            )}
          </div>
        ) : (
          filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onToggle={toggleAlert}
              onDelete={deleteAlert}
            />
          ))
        )}
      </div>
    </div>
  );
}
