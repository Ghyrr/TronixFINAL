import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, ShieldCheck, UserCog } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { fetchAllAdmins, emptyPermissions } from '@/api/admin';
import { createAdminAccount, updateAdminAccount, AdminApiError, type AdminAccountInput } from '@/api/adminUsers';

import { Badge, ErrorState, LoadingState, Notice } from '@/components/ui/PageState';
import { Field, TextInput, SelectInput } from '@/components/ui/FormFields';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useDocumentMeta } from '@/lib/useDocumentMeta';
import type { Admin, AdminRole, AdminPermissions, PermissionKey } from '@/lib/types';
import type { TranslationKey } from '@/i18n/translations';

const PERMISSION_KEYS: PermissionKey[] = ['products', 'orders', 'customers', 'inventory', 'settings'];

export function AdminAdminsPage() {
  const { t } = useLanguage();
  const { admin: currentAdmin } = useAuth();
  const { notify } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);

  useDocumentMeta({ title: `${t('admin.admins.title')} | TRONIX Admin` });

  const load = async () => {
    setLoading(true);
    try { setAdmins(await fetchAllAdmins()); setError(false); } catch { setError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  if (currentAdmin?.role !== 'super_admin') {
    return <div className="py-16 text-center text-slate-500">{t('admin.noPermission')}</div>;
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={load} />;

  const handleSave = async (input: AdminAccountInput, id?: string) => {
    try {
      if (id) {
        await updateAdminAccount(id, input);
      } else {
        await createAdminAccount(input as AdminAccountInput & { email: string; password: string; full_name: string });
      }
      await load();
      notify('success', t('admin.admins.saved'));
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      if (err instanceof AdminApiError) {
        notify('error', t(`admin.admins.error.${err.code}` as TranslationKey));
      } else {
        notify('error', t('admin.admins.error.generic'));
      }
    }
  };

  const handleToggleActive = async (admin: Admin) => {
    try {
      await updateAdminAccount(admin.id, { is_active: !admin.is_active });
      await load();
      notify('success', t('admin.admins.saved'));
    } catch (err) {
      if (err instanceof AdminApiError) {
        notify('error', t(`admin.admins.error.${err.code}` as TranslationKey));
      } else {
        notify('error', t('admin.admins.error.generic'));
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('admin.admins.title')}</h1>
        <button type="button" onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
          <Plus className="h-4 w-4" />
          {t('admin.admins.new')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start">{t('common.name')}</th>
              <th className="px-4 py-3 text-start">{t('admin.admins.role')}</th>
              <th className="px-4 py-3 text-start">{t('admin.admins.permissions')}</th>
              <th className="px-4 py-3 text-center">{t('common.status')}</th>
              <th className="px-4 py-3 text-end">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{admin.full_name}</p>
                      <p className="text-xs text-slate-500" dir="ltr">{admin.email}</p>
                    </div>
                    {admin.id === currentAdmin?.id && <Badge tone="blue">{t('admin.admins.youBadge')}</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${admin.role === 'super_admin' ? 'text-brand-700' : 'text-slate-700'}`}>
                    {admin.role === 'super_admin' ? <ShieldCheck className="h-4 w-4" /> : <UserCog className="h-4 w-4" />}
                    {t(`admin.admins.role.${admin.role}`)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {PERMISSION_KEYS.filter((p) => admin.role === 'super_admin' || admin.permissions[p]).map((p) => (
                      <Badge key={p} tone="slate">{t(`admin.admins.perm.${p}`)}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge tone={admin.is_active ? 'green' : 'red'}>{admin.is_active ? t('common.active') : t('common.inactive')}</Badge>
                </td>
                <td className="px-4 py-3 text-end">
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={() => { setEditing(admin); setShowForm(true); }} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      {t('common.edit')}
                    </button>
                    {admin.id !== currentAdmin?.id && (
                      <button
                        type="button"
                        onClick={() => handleToggleActive(admin)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium ${admin.is_active ? 'border-brand-300 text-brand-700 hover:bg-brand-50' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}
                      >
                        {admin.is_active ? t('admin.admins.deactivate') : t('admin.admins.activate')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <AdminForm
          initial={editing}
          currentAdminId={currentAdmin?.id}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function AdminForm({ initial, currentAdminId, onSave, onCancel }: {
  initial: Admin | null;
  currentAdminId?: string;
  onSave: (input: AdminAccountInput, id?: string) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [email, setEmail] = useState(initial?.email ?? '');
  const [fullName, setFullName] = useState(initial?.full_name ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>(initial?.role ?? 'admin');
  const [permissions, setPermissions] = useState<AdminPermissions>(initial?.permissions ?? emptyPermissions());

  const togglePerm = (key: PermissionKey) => {
    if (role === 'super_admin') return;
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const input: AdminAccountInput = {
      email: email.trim(),
      full_name: fullName.trim(),
      role,
      permissions: role === 'super_admin' ? emptyPermissions() : permissions,
    };
    if (password) input.password = password;
    if (initial) {
      onSave(input, initial.id);
    } else {
      if (!password || password.length < 8) return;
      onSave({ ...input, password });
    }
  };

  return (
    <Modal
      open
      onClose={onCancel}
      title={initial ? t('admin.admins.edit') : t('admin.admins.new')}
      size="lg"
      footer={
        <>
          <button type="button" onClick={onCancel} className="btn-secondary">{t('common.cancel')}</button>
          <button type="submit" form="admin-form" className="btn-primary">{t('common.save')}</button>
        </>
      }
    >
      <form id="admin-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {initial?.id === currentAdminId && (
          <Notice tone="info">{t('admin.admins.error.cannot_modify_self')}</Notice>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('auth.fullName')} required>
            {(id) => <TextInput id={id} value={fullName} onChange={(e) => setFullName(e.target.value)} required />}
          </Field>
          <Field label={t('auth.email')} required>
            {(id) => <TextInput id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" required disabled={!!initial} />}
          </Field>
          <Field label={t('admin.admins.role')}>
            {(id) => (
              <SelectInput id={id} value={role} onChange={(e) => setRole(e.target.value as AdminRole)} disabled={initial?.id === currentAdminId}>
                <option value="admin">{t('admin.admins.role.admin')}</option>
                <option value="super_admin">{t('admin.admins.role.super_admin')}</option>
              </SelectInput>
            )}
          </Field>
          <Field label={initial ? t('admin.admins.passwordOptional') : t('auth.password')} required={!initial} hint={t('auth.passwordHint')}>
            {(id) => <TextInput id={id} type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" required={!initial} />}
          </Field>
        </div>

        {role !== 'super_admin' && (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{t('admin.admins.permissions')}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PERMISSION_KEYS.map((key) => (
                <label key={key} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5">
                  <span className="text-sm text-slate-700">{t(`admin.admins.perm.${key}`)}</span>
                  <input type="checkbox" checked={permissions[key]} onChange={() => togglePerm(key)} className="h-4 w-4 accent-brand-600" />
                </label>
              ))}
            </div>
          </div>
        )}
        {role === 'super_admin' && (
          <Notice tone="info">{t('admin.admins.role.super_admin')} — full access to all sections.</Notice>
        )}
      </form>
    </Modal>
  );
}
