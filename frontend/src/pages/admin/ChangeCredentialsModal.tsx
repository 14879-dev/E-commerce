import React, { useState } from 'react';
import { X, KeyRound, User, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface ChangeCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangeCredentialsModal: React.FC<ChangeCredentialsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateCredentials } = useAdminAuth();
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedUser = newUsername.trim();
    const trimmedPass = newPassword.trim();

    if (!trimmedUser && !trimmedPass) {
      setError('Please provide a new username or new password.');
      return;
    }

    if (trimmedPass) {
      if (trimmedPass.length < 4) {
        setError('New password must be at least 4 characters long.');
        return;
      }
      if (trimmedPass !== confirmPassword) {
        setError('New passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await updateCredentials(
        trimmedUser !== user?.username ? trimmedUser : undefined,
        trimmedPass ? trimmedPass : undefined
      );

      if (res.success) {
        setSuccess('Credentials updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setSuccess(null);
          onClose();
        }, 1500);
      } else {
        setError(res.error || 'Failed to update credentials.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#565449]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#F7F4EB] border border-[#565449]/35 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#1A1A18]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#565449]/20 bg-[#F7F4EB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#565449]/15 border border-[#565449]/20 flex items-center justify-center text-[#1A1A18]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A1A18]">Account Security</h2>
              <p className="text-xs text-[#1A1A18]/80">Change your Admin username or password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#1A1A18]/70 hover:text-[#1A1A18] p-2 rounded-lg hover:bg-[#A0988A]/25 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#565449]/15 border border-[#565449]/40 text-[#1A1A18] text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-[#1A1A18] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#A0988A]/30 border border-[#565449]/30 text-[#1A1A18] text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-[#1A1A18] shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1A1A18] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#1A1A18]/70" />
              Username
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Admin username"
              className="w-full bg-[#F7F4EB] border border-[#565449]/30 rounded-xl px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder-[#565449]/50 focus:outline-none focus:border-[#565449] transition-colors"
            />
            <p className="text-[11px] text-[#1A1A18]/70">Currently logged in as: <span className="text-[#1A1A18] font-bold">{user?.username}</span> ({user?.role})</p>
          </div>

          <div className="pt-2 border-t border-[#565449]/20 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1A1A18] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#1A1A18]/70" />
                New Password (leave empty to keep current)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-[#F7F4EB] border border-[#565449]/30 rounded-xl px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder-[#565449]/50 focus:outline-none focus:border-[#565449] transition-colors"
              />
            </div>

            {newPassword.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1A18] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#1A1A18]/70" />
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-[#F7F4EB] border border-[#565449]/30 rounded-xl px-3.5 py-2.5 text-sm text-[#1A1A18] placeholder-[#565449]/50 focus:outline-none focus:border-[#565449] transition-colors"
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#1A1A18] hover:underline transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
