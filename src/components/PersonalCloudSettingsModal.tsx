import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Link,
  Lock,
  RefreshCw,
  FolderSync,
  HelpCircle
} from 'lucide-react';
import {
  PersonalCloudConfig,
  getPersonalCloudConfig,
  savePersonalCloudConfig,
  testPersonalCloudConnection
} from '../utils/personalCloudStorage';

interface PersonalCloudSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (config: PersonalCloudConfig) => void;
}

export const PersonalCloudSettingsModal: React.FC<PersonalCloudSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [config, setConfig] = useState<PersonalCloudConfig>(getPersonalCloudConfig());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getPersonalCloudConfig());
      setTestResult(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testPersonalCloudConnection(config);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    savePersonalCloudConfig(config);
    setSavedSuccess(true);
    if (onConfigSaved) onConfigSaved(config);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative text-zinc-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                Personal API Connector (BYOC)
              </h2>
              <p className="text-xs text-zinc-400">
                Sync athlete folders directly to your own private API or local disks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Zero-Storage Privacy Guarantee */}
        <div className="bg-emerald-950/40 border border-emerald-500/40 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-emerald-200">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-black text-emerald-300">100% Zero-Knowledge & Local-First Guarantee</p>
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              We never host or store your athlete reports or biomechanical footage on our servers. All data stays strictly on your local device and syncs only to your personal cloud destination.
            </p>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase text-zinc-400 tracking-wider">
            Choose Your Sync Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Option 1: Local Synced Cloud Folder */}
            <div
              onClick={() => setConfig({ ...config, provider: 'download_sync' })}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${
                config.provider === 'download_sync'
                  ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-white">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <span>Local Synced Folder</span>
                </div>
                {config.provider === 'download_sync' && (
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Exports athlete folders (`.klutchh-bundle`) directly into your synced iCloud Drive, Dropbox, or OneDrive folder.
              </p>
            </div>

            {/* Option 2: Custom Cloud Endpoint / Webhook */}
            <div
              onClick={() => setConfig({ ...config, provider: 'custom_webhook' })}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${
                config.provider === 'custom_webhook'
                  ? 'bg-sky-500/10 border-sky-500 text-white shadow-md'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-white">
                  <Link className="w-4 h-4 text-sky-400" />
                  <span>Personal Cloud Endpoint</span>
                </div>
                {config.provider === 'custom_webhook' && (
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                )}
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Connect your own private S3, Nextcloud, Supabase, or REST Webhook endpoint to receive automated folder syncs.
              </p>
            </div>

          </div>
        </div>

        {/* Custom Webhook Configuration */}
        {config.provider === 'custom_webhook' && (
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <h3 className="text-xs font-black uppercase text-sky-400 tracking-wide flex items-center gap-1.5">
              <Link className="w-4 h-4" /> Personal Server Endpoint Details
            </h3>
            
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-300">Target URL (HTTPS)</label>
              <input
                type="url"
                placeholder="https://my-coach-server.com/api/athlete-sync"
                value={config.customEndpointUrl || ''}
                onChange={(e) => setConfig({ ...config, customEndpointUrl: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-300">
                Authorization Header / Bearer Token (Optional)
              </label>
              <input
                type="password"
                placeholder="Bearer secret_token_xyz"
                value={config.customAuthHeader || ''}
                onChange={(e) => setConfig({ ...config, customAuthHeader: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 font-mono"
              />
              <p className="text-[10px] text-zinc-500">Stored safely inside your browser's private localStorage.</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !config.customEndpointUrl}
                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Pinging Server...' : 'Test Connection'}</span>
              </button>

              {testResult && (
                <div className={`text-[11px] font-bold flex items-center gap-1.5 ${testResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Migration Hint */}
        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div className="text-[11px] text-zinc-400 leading-relaxed">
            <p className="text-zinc-200 font-bold mb-1">Quick Device Migration Tip</p>
            You can also send your <strong>.klutchh-bundle</strong> backup file via WhatsApp, AirDrop, or Email. Once received on a new device, just use the <strong>Open .klutchh</strong> tool to restore your full library instantly.
          </div>
        </div>

        {/* Auto Sync Toggle */}
        <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-zinc-200">Auto-Sync on Save</span>
            <p className="text-[10px] text-zinc-400">Automatically trigger sync to your personal cloud whenever a report is saved</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.autoSyncOnSave}
              onChange={(e) => setConfig({ ...config, autoSyncOnSave: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4" />
                <span>Save Cloud Settings</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
