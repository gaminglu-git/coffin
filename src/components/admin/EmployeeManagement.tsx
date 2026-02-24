"use client";

import { useState, useEffect } from "react";
import { Mail, UserPlus, Shield, MailPlus, X, Pencil } from "lucide-react";
import { listEmployees, createEmployee, inviteEmployee, type Employee } from "@/app/actions/employees";
import { listRoles, getEmployeeRoles, setEmployeeRoles as saveEmployeeRoles } from "@/app/actions/roles";
import { getMailAccounts, addMailAccount, removeMailAccount, setPrimaryMailAccount, type MailAccount } from "@/app/actions/mail-accounts";
import { getCurrentEmployee } from "@/app/actions/employees";

type CreateMode = "direct" | "invite" | null;

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [directEmail, setDirectEmail] = useState("");
  const [directName, setDirectName] = useState("");
  const [directPassword, setDirectPassword] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<{ id: string; displayName: string }[]>([]);
  const [employeeRoles, setEmployeeRolesState] = useState<string[]>([]);
  const [mailAccounts, setMailAccounts] = useState<MailAccount[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newMailEmail, setNewMailEmail] = useState("");
  const [savingRoles, setSavingRoles] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    const list = await listEmployees();
    setEmployees(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    listRoles().then(setRoles);
  }, []);

  useEffect(() => {
    const check = async () => {
      const emp = await getCurrentEmployee();
      if (!emp) return;
      const empRoles = await getEmployeeRoles(emp.id);
      setIsAdmin(empRoles.includes("admin"));
    };
    check();
  }, []);

  useEffect(() => {
    if (!selectedEmployee) return;
    getEmployeeRoles(selectedEmployee.id).then(setEmployeeRolesState);
    getMailAccounts(selectedEmployee.id).then(setMailAccounts);
  }, [selectedEmployee]);

  const handleSaveRoles = async () => {
    if (!selectedEmployee) return;
    setSavingRoles(true);
    const result = await saveEmployeeRoles(selectedEmployee.id, employeeRoles);
    if (result.error) setError(result.error);
    else setSuccess("Rollen gespeichert.");
    setSavingRoles(false);
  };

  const handleAddMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !newMailEmail.trim()) return;
    const result = await addMailAccount(selectedEmployee.id, newMailEmail.trim(), "custom", mailAccounts.length === 0);
    if (result.error) setError(result.error);
    else {
      setNewMailEmail("");
      getMailAccounts(selectedEmployee.id).then(setMailAccounts);
      setSuccess("E-Mail-Konto hinzugefügt.");
    }
  };

  const handleRemoveMail = async (accountId: string) => {
    if (!selectedEmployee) return;
    const result = await removeMailAccount(accountId, selectedEmployee.id);
    if (result.error) setError(result.error);
    else {
      getMailAccounts(selectedEmployee.id).then(setMailAccounts);
      setSuccess("E-Mail-Konto entfernt.");
    }
  };

  const handleSetPrimaryMail = async (accountId: string) => {
    if (!selectedEmployee) return;
    const result = await setPrimaryMailAccount(accountId, selectedEmployee.id);
    if (result.error) setError(result.error);
    else getMailAccounts(selectedEmployee.id).then(setMailAccounts);
  };

  const handleCreateDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!directEmail || !directName || !directPassword) {
      setError("Bitte alle Felder ausfüllen.");
      return;
    }
    const result = await createEmployee(directEmail, directName, directPassword);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Mitarbeiter wurde angelegt.");
      setDirectEmail("");
      setDirectName("");
      setDirectPassword("");
      setCreateMode(null);
      fetchEmployees();
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!inviteEmail || !inviteName) {
      setError("Bitte E-Mail und Anzeigename eingeben.");
      return;
    }
    const result = await inviteEmployee(inviteEmail, inviteName);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Einladung wurde gesendet.");
      setInviteEmail("");
      setInviteName("");
      setCreateMode(null);
      fetchEmployees();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h3 className="text-lg font-medium text-gray-800">HR / Personal</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCreateMode(createMode === "direct" ? null : "direct");
              setError("");
              setSuccess("");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-mw-green text-white rounded-xl text-sm font-medium hover:bg-mw-green-dark transition"
          >
            <UserPlus size={16} /> Direkt anlegen
          </button>
          <button
            onClick={() => {
              setCreateMode(createMode === "invite" ? null : "invite");
              setError("");
              setSuccess("");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
          >
            <Mail size={16} /> Per E-Mail einladen
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg">
          {success}
        </div>
      )}

      {createMode === "direct" && (
        <form
          onSubmit={handleCreateDirect}
          className="p-6 bg-white rounded-xl border border-gray-200 space-y-4"
        >
          <h4 className="font-medium text-gray-800">Mitarbeiter direkt anlegen</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail
            </label>
            <input
              type="email"
              value={directEmail}
              onChange={(e) => setDirectEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anzeigename
            </label>
            <input
              type="text"
              value={directName}
              onChange={(e) => setDirectName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="z.B. Walter"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passwort
            </label>
            <input
              type="password"
              value={directPassword}
              onChange={(e) => setDirectPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-mw-green text-white rounded-lg text-sm font-medium hover:bg-mw-green-dark"
            >
              Anlegen
            </button>
            <button
              type="button"
              onClick={() => setCreateMode(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {createMode === "invite" && (
        <form
          onSubmit={handleInvite}
          className="p-6 bg-white rounded-xl border border-gray-200 space-y-4"
        >
          <h4 className="font-medium text-gray-800">Mitarbeiter per E-Mail einladen</h4>
          <p className="text-sm text-gray-600">
            Der Mitarbeiter erhält eine E-Mail und kann sein Passwort selbst setzen.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anzeigename
            </label>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="z.B. Katrin"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-mw-green text-white rounded-lg text-sm font-medium hover:bg-mw-green-dark"
            >
              Einladung senden
            </button>
            <button
              type="button"
              onClick={() => setCreateMode(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Laden...</div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Noch keine Mitarbeiter angelegt.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  E-Mail
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                  Angelegt
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedEmployee?.id === emp.id ? "bg-mw-green/5" : ""}`}
                  onClick={() => setSelectedEmployee(selectedEmployee?.id === emp.id ? null : emp)}
                >
                  <td className="py-3 px-4">{emp.display_name}</td>
                  <td className="py-3 px-4 text-gray-600">{emp.email}</td>
                  <td className="py-3 px-4 text-gray-500 text-sm">
                    {new Date(emp.created_at).toLocaleDateString("de-DE")}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmployee(selectedEmployee?.id === emp.id ? null : emp);
                      }}
                      className="p-1.5 text-gray-400 hover:text-mw-green rounded-lg transition"
                      title="Details"
                    >
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-800">{selectedEmployee.display_name}</h4>
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-gray-600">{selectedEmployee.email}</p>

              {isAdmin && (
                <div>
                  <h5 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Shield size={16} /> Rechte
                  </h5>
                  <div className="flex flex-wrap gap-3">
                    {roles.map((r) => (
                      <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={employeeRoles.includes(r.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEmployeeRolesState([...employeeRoles, r.id]);
                            } else {
                              setEmployeeRolesState(employeeRoles.filter((id) => id !== r.id));
                            }
                          }}
                          className="rounded border-gray-300 text-mw-green focus:ring-mw-green"
                        />
                        <span className="text-sm">{r.displayName}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveRoles}
                    disabled={savingRoles}
                    className="mt-2 px-3 py-1.5 bg-mw-green text-white rounded-lg text-sm font-medium hover:bg-mw-green-dark disabled:opacity-50"
                  >
                    {savingRoles ? "Speichern…" : "Rollen speichern"}
                  </button>
                </div>
              )}

              <div>
                <h5 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MailPlus size={16} /> E-Mail-Konten
                </h5>
                <ul className="space-y-2 mb-3">
                  {mailAccounts.map((acc) => (
                    <li key={acc.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-gray-700">
                        {acc.email}
                        {acc.isPrimary && (
                          <span className="ml-1 text-xs text-mw-green">(Standard)</span>
                        )}
                      </span>
                      <div className="flex items-center gap-1">
                        {!acc.isPrimary && mailAccounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryMail(acc.id)}
                            className="text-xs text-mw-green hover:underline"
                          >
                            Als Standard
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMail(acc.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <form onSubmit={handleAddMail} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="E-Mail-Adresse hinzufügen"
                    value={newMailEmail}
                    onChange={(e) => setNewMailEmail(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-mw-green text-white rounded-lg text-sm font-medium hover:bg-mw-green-dark"
                  >
                    Hinzufügen
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
        )}
    </div>
  );
}
