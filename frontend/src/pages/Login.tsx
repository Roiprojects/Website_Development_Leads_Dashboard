import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from '../components/ui';
import api from '../api/client';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password must match');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.post('/auth/recover-password', { username, recoveryKey, newPassword });
      setSuccessMsg('Password recovered successfully! You can now sign in.');
      setIsRecovering(false);
      setRecoveryKey('');
      setNewPassword('');
      setConfirmPassword('');
      setPassword(''); // clear the login password field so they type the new one
    } catch (err: any) {
      setError(err.response?.data?.error || 'Recovery failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md glass">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <p className="text-sm text-slate-500">Sign in to manage dashboard records</p>
        </CardHeader>
        <CardContent>
          {isRecovering ? (
            <form onSubmit={handleRecover} className="space-y-4 pt-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">
                  Username
                </label>
                <Input 
                  type="text" 
                  placeholder="admin" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">
                  Security Recovery PIN
                </label>
                <Input 
                  type="password" 
                  placeholder="Enter your 4-6 digit PIN" 
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">
                  Confirm New Password
                </label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Recovering...' : 'Reset Password'}
              </Button>
              <div className="text-center pt-2">
                <button type="button" onClick={() => { setIsRecovering(false); setError(''); }} className="text-sm text-brand-600 hover:underline dark:text-brand-400 focus:outline-none">
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4 pt-4" autoComplete="off">
              {successMsg && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  {successMsg}
                </div>
              )}
              {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">
                Username
              </label>
              <Input 
                type="text" 
                placeholder="admin" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="off"
                name="dashboard-username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                name="dashboard-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="text-center pt-2">
              <button type="button" onClick={() => { setIsRecovering(true); setError(''); setSuccessMsg(''); }} className="text-sm text-brand-600 hover:underline dark:text-brand-400 focus:outline-none">
                Forgot Password?
              </button>
            </div>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
