"use client";

import { ClipboardList, ExternalLink, History, Save, UsersRound } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RoleGate from "@/components/shell/RoleGate";
import { apiRequest } from "@/lib/api";
import type { AdminUser, AuditLogRead, DisputeRead, DisputeStatus, UserRole } from "@/lib/types";

type AdminTab = "users" | "disputes" | "audit";
const roles: UserRole[] = ["Admin", "Registrar", "Elder", "User"];
const statuses: DisputeStatus[] = ["open", "under_review", "resolved", "rejected"];

function AdminWorkspace() {
  const [tab, setTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [disputes, setDisputes] = useState<DisputeRead[]>([]);
  const [logs, setLogs] = useState<AuditLogRead[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [userRows, disputeRows, logRows] = await Promise.all([
      apiRequest<AdminUser[]>("/admin/users"),
      apiRequest<DisputeRead[]>("/admin/disputes"),
      apiRequest<AuditLogRead[]>("/admin/audit-logs"),
    ]);
    setUsers(userRows);
    setDisputes(disputeRows);
    setLogs(logRows);
    setNotes(Object.fromEntries(disputeRows.map((item) => [item.id, item.resolution_notes ?? ""])));
  }, []);

  useEffect(() => {
    load().catch(() => setError("Could not load administration records."));
  }, [load]);

  async function updateUser(user: AdminUser, changes: { role?: UserRole; is_active?: boolean }) {
    setError(null);
    setMessage(null);
    try {
      const updated = await apiRequest<AdminUser>(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage("User access updated.");
      setLogs(await apiRequest<AuditLogRead[]>("/admin/audit-logs"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update user.");
    }
  }

  async function updateDispute(dispute: DisputeRead) {
    setError(null);
    setMessage(null);
    try {
      const updated = await apiRequest<DisputeRead>(`/admin/disputes/${dispute.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: dispute.status,
          resolution_notes: notes[dispute.id] || null,
        }),
      });
      setDisputes((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage("Dispute updated.");
      setLogs(await apiRequest<AuditLogRead[]>("/admin/audit-logs"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update dispute.");
    }
  }

  return (
    <div className="content-stack">
      <section className="section-title admin-title">
        <div><span className="eyebrow">role-based control</span><h1>Administration</h1></div>
        <Link className="btng" href="/registry">Manage registry <ExternalLink size={17} /></Link>
      </section>
      <div className="segmented" role="tablist" aria-label="Administration views">
        <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}><UsersRound size={17} />Users</button>
        <button className={tab === "disputes" ? "active" : ""} onClick={() => setTab("disputes")}><ClipboardList size={17} />Disputes</button>
        <button className={tab === "audit" ? "active" : ""} onClick={() => setTab("audit")}><History size={17} />Audit</button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-ok">{message}</p>}

      {tab === "users" && (
        <section className="panel">
          <div className="panel-heading"><h2>User access</h2><p className="muted-copy">Assign operational roles and deactivate accounts that should no longer sign in.</p></div>
          <div className="record-list">{users.map((user) => (
            <article className="admin-record" key={user.id}>
              <div className="record-identity"><strong>{user.full_name}</strong><span>{user.email}</span></div>
              <label className="compact-field">Role<select value={user.role} onChange={(event) => updateUser(user, { role: event.target.value as UserRole })}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
              <label className="switch-field"><input type="checkbox" checked={user.is_active} onChange={(event) => updateUser(user, { is_active: event.target.checked })} /><span>Active</span></label>
            </article>
          ))}</div>
        </section>
      )}

      {tab === "disputes" && (
        <section className="panel">
          <div className="panel-heading"><h2>Record disputes</h2><p className="muted-copy">Review concerns submitted from family records and document the outcome.</p></div>
          <div className="record-list">
            {disputes.length === 0 && <p className="empty-copy">No disputes have been submitted.</p>}
            {disputes.map((dispute) => (
              <article className="dispute-record" key={dispute.id}>
                <div className="record-identity"><strong>{dispute.entity_type} record</strong><span>{dispute.entity_id}</span></div>
                <p>{dispute.reason}</p>
                <label className="field">Resolution notes<textarea value={notes[dispute.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [dispute.id]: event.target.value }))} /></label>
                <div className="button-row"><select className="compact-select" value={dispute.status} onChange={(event) => setDisputes((current) => current.map((item) => item.id === dispute.id ? { ...item, status: event.target.value as DisputeStatus } : item))}>{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select><button className="btnp" onClick={() => updateDispute(dispute)}><Save size={17} />Save</button></div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "audit" && (
        <section className="panel">
          <div className="panel-heading"><h2>Audit history</h2><p className="muted-copy">The latest 250 administrative and registry changes.</p></div>
          <div className="record-list audit-list">
            {logs.length === 0 && <p className="empty-copy">No audited changes yet.</p>}
            {logs.map((log) => <article className="record-row" key={log.id}><div><strong>{log.action.replaceAll(".", " ")}</strong><span>{log.entity_type}{log.entity_id ? ` · ${log.entity_id}` : ""}</span></div><time>{new Date(log.created_at).toLocaleString()}</time></article>)}
          </div>
        </section>
      )}
    </div>
  );
}

export default function AdminPage() {
  return <RoleGate allowed={["Admin"]}><AdminWorkspace /></RoleGate>;
}
