import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext.tsx';
import { X, CheckCircle2, ShieldOff, Shield, Search, UserCheck } from 'lucide-react';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({ isOpen, onClose }) => {
  const { allUsers, currentUser, approveUser, blockUser, changeUserRole } = useFinance();
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'BLOCKED'>('ALL');

  if (!isOpen) return null;

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = allUsers.filter(u => u.status === 'PENDING').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 transition-colors">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Kullanıcı ve Yetki Yönetimi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Google ile giriş yapan kullanıcıların onay ve rol denetimi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Stats */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="İsim veya e-posta ile ara..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded ${
                statusFilter === 'ALL' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tümü ({allUsers.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 ${
                statusFilter === 'PENDING' 
                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Onay Bekleyenler</span>
              {pendingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-2.5 py-1 text-xs font-semibold rounded ${
                statusFilter === 'APPROVED' 
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Onaylılar
            </button>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-4 space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Kriterlere uygun kullanıcı bulunamadı.
            </div>
          ) : (
            filteredUsers.map(user => {
              const isSelf = user.id === currentUser.id;
              return (
                <div
                  key={user.id}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    user.status === 'PENDING'
                      ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30'
                      : user.status === 'BLOCKED'
                      ? 'bg-red-50/70 dark:bg-red-950/10 border-red-200 dark:border-red-900/30 opacity-75'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 object-cover shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</span>
                        {isSelf && (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-200 dark:border-slate-700">
                            Sen
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{user.email}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Kayıt: {user.createdAt}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Pill */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Role toggle */}
                    <button
                      disabled={isSelf}
                      onClick={() => changeUserRole(user.id, user.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                        user.role === 'ADMIN'
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title={isSelf ? 'Kendi rolünüzü değiştiremezsiniz' : 'Rolü değiştir'}
                    >
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {user.role === 'ADMIN' ? 'Admin' : 'Üye'}
                      </span>
                    </button>

                    {/* Approve / Block controls */}
                    {user.status === 'PENDING' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => approveUser(user.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Onayla</span>
                        </button>
                        <button
                          onClick={() => blockUser(user.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-600/20 dark:hover:bg-red-600/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 text-xs font-semibold rounded-lg transition-all"
                        >
                          <ShieldOff className="w-3.5 h-3.5" />
                          <span>Engelle</span>
                        </button>
                      </div>
                    )}

                    {user.status === 'APPROVED' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-1 rounded-lg">
                          Onaylı
                        </span>
                        {!isSelf && (
                          <button
                            onClick={() => blockUser(user.id)}
                            className="text-xs text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Erişimi Engelle"
                          >
                            <ShieldOff className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {user.status === 'BLOCKED' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-2 py-1 rounded-lg">
                          Engelli
                        </span>
                        <button
                          onClick={() => approveUser(user.id)}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20"
                        >
                          Kilidi Aç
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Toplam {allUsers.length} kayıtlı Google kullanıcısı</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg font-semibold transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
