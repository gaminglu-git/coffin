"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Mail, UserPlus } from "lucide-react";
import { listEmployees, createEmployee, inviteEmployee, type Employee } from "@/app/actions/employees";

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

  const fetchEmployees = async () => {
    setLoading(true);
    const list = await listEmployees();
    setEmployees(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

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
        <h3 className="text-lg font-medium text-gray-800">Mitarbeiter</h3>
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
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">{emp.display_name}</td>
                  <td className="py-3 px-4 text-gray-600">{emp.email}</td>
                  <td className="py-3 px-4 text-gray-500 text-sm">
                    {new Date(emp.created_at).toLocaleDateString("de-DE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
