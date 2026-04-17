import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Input, Button, WhatsAppIcon, Avatar, Notification, ConfirmModal } from '../components/ui';
import api from '../api/client';
import { Plus, Edit2, Trash2, Phone, Download, Upload, Users, X, PlusCircle, Save } from 'lucide-react';


interface Record {
  id?: number;
  name: string;
  category: string;
  date: string;
  status: string;
  gender?: string;
  origin?: string;
}

interface Enquiry {
  id: number;
  month: string;
  year: number;
  value: number;
}

interface DailyEnquiry {
  id: number;
  date: string;
  value: number;
}

interface BulkRow {
  name: string;
  category: string;
  date: string;
  status: string;
}

export function AdminPanel() {
  const [data, setData] = useState<Record[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [dailyEnquiries, setDailyEnquiries] = useState<DailyEnquiry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [todayEnquiry, setTodayEnquiry] = useState<DailyEnquiry | null>(null);
  const [activeTab, setActiveTab] = useState<'records' | 'enquiries' | 'settings'>('records');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [genderFilter, setGenderFilter] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Record | null>(null);
  const [formData, setFormData] = useState<Record>({ name: '', category: 'Design', date: new Date().toISOString().split('T')[0], status: 'Interested' });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [projectTitle, setProjectTitle] = useState('');
  const [manualTotal, setManualTotal] = useState(0);
  const [recoveryPin, setRecoveryPin] = useState('1234');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);

  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([
    { name: '', category: 'Design', date: new Date().toISOString().split('T')[0], status: 'Interested' }
  ]);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Modal/Notification State
  const [notification, setNotification] = useState({ isOpen: false, message: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, onCancel: () => {} });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/records', {
        params: { 
          page, 
          limit: 10,
          gender: genderFilter || undefined,
          origin: originFilter || undefined
        }
      });
      setData(res.data.records);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      console.error('Error fetching records:', error);
    }
  };

  const fetchEnquiries = async () => {
    try {
      const res = await api.get('/enquiries');
      setEnquiries(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDailyEnquiries = async () => {
    try {
      const res = await api.get('/enquiries/daily');
      setDailyEnquiries(res.data);
      
      // Find today's enquiry
      const today = new Date().toISOString().split('T')[0];
      const found = res.data.find((e: DailyEnquiry) => e.date === today);
      if (found) {
        setTodayEnquiry(found);
      } else {
        setTodayEnquiry({ id: 0, date: today, value: 0 });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setProjectTitle(res.data.project_title || '');
      setManualTotal(parseInt(res.data.total_enquiries_override) || 0);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, genderFilter, originFilter]);
  
  useEffect(() => {
    const found = dailyEnquiries.find(e => e.date === selectedDate);
    if (found) {
      setTodayEnquiry(found);
    } else {
      setTodayEnquiry({ id: 0, date: selectedDate, value: 0 });
    }
  }, [selectedDate, dailyEnquiries]);

  useEffect(() => {
    fetchEnquiries();
    fetchDailyEnquiries();
    fetchSettings();
  }, []);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setConfirmModal({
      isOpen: true,
      title: 'Save Settings',
      message: 'Are you sure you want to update the dashboard settings?',
      onConfirm: async () => {
        setIsSavingSettings(true);
        try {
          await api.put('/settings', { 
            project_title: projectTitle,
            total_enquiries_override: manualTotal 
          });
          setNotification({ isOpen: true, message: 'Settings updated successfully!' });
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          setNotification({ isOpen: true, message: 'Failed to update settings.' });
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } finally {
          setIsSavingSettings(false);
        }
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Clear selection when page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

  const handleEnquiryChange = (id: number, field: keyof Enquiry, val: string) => {
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, [field]: field === 'value' ? (parseInt(val) || 0) : val } : e));
  };

  const saveEnquiry = async (enq: Enquiry) => {
    setConfirmModal({
      isOpen: true,
      title: 'Update Enquiry',
      message: `Are you sure you want to save changes for ${enq.month} ${enq.year}?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await api.put(`/enquiries/${enq.id}`, { 
            month: enq.month, 
            year: enq.year, 
            value: enq.value 
          });
          setNotification({ isOpen: true, message: 'Monthly enquiry updated successfully!' });
        } catch (e) {
          console.error(e);
          setNotification({ isOpen: true, message: 'Failed to save enquiry value' });
        }
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const saveDailyEnquiry = async (id: number, val: number, date?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Update Daily Enquiries',
      message: `Are you sure you want to save the enquiry count for ${date}?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          if (id && id > 0) {
            await api.put(`/enquiries/daily/${id}`, { value: val });
          } else {
            await api.post('/enquiries/daily', { date, value: val });
          }
          fetchDailyEnquiries();
          setNotification({ isOpen: true, message: 'Daily enquiry updated successfully!' });
        } catch (e) {
          console.error(e);
          setNotification({ isOpen: true, message: 'Failed to save daily enquiry value' });
        }
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleOpenModal = (record?: Record) => {
    if (record) {
      setCurrentRecord(record);
      setFormData(record);
    } else {
      setCurrentRecord(null);
      setFormData({ name: '', category: 'Design', date: new Date().toISOString().split('T')[0], status: 'Interested' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = currentRecord?.id ? 'update' : 'add';
    
    setConfirmModal({
      isOpen: true,
      title: `${action === 'update' ? 'Update' : 'Add'} Record`,
      message: `Are you sure you want to ${action} this record?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          if (currentRecord?.id) {
            await api.put(`/records/${currentRecord.id}`, formData);
          } else {
            await api.post('/records', formData);
          }
          setIsModalOpen(false);
          fetchRecords();
          setNotification({ isOpen: true, message: `Record ${action === 'update' ? 'updated' : 'added'} successfully!` });
        } catch (error) {
          console.error('Error saving record', error);
          setNotification({ isOpen: true, message: 'Failed to save record.' });
        }
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleDelete = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Record',
      message: 'Are you sure you want to delete this record?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await api.delete(`/records/${id}`);
          fetchRecords();
          setNotification({ isOpen: true, message: 'Record deleted successfully!' });
        } catch (error) {
          console.error('Error deleting record', error);
          setNotification({ isOpen: true, message: 'Failed to delete record.' });
        }
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotification({ isOpen: true, message: 'New password and confirm password must match.' });
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: 'Reset Password',
      message: 'Are you sure you want to change your password?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await api.put('/auth/reset-password', {
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword
          });
          setNotification({ isOpen: true, message: 'Password updated successfully!' });
          setIsPasswordModalOpen(false);
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
          setNotification({ isOpen: true, message: error.response?.data?.error || 'Failed to update password.' });
        }
      },
      onCancel: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  // ── Checkbox Selection ──
  const toggleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(r => r.id!)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ── Bulk Delete ──
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} record(s)?`)) return;

    setIsBulkDeleting(true);
    try {
      await api.delete('/records/bulk', { data: { ids: Array.from(selectedIds) } });
      setSelectedIds(new Set());
      fetchRecords();
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to delete selected records.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // ── Bulk Add ──
  const addBulkRow = () => {
    setBulkRows(prev => [...prev, { name: '', category: 'Design', date: new Date().toISOString().split('T')[0], status: 'Interested' }]);
  };

  const removeBulkRow = (index: number) => {
    setBulkRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateBulkRow = (index: number, field: keyof BulkRow, value: string) => {
    setBulkRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const handleBulkAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = bulkRows.filter(r => r.name.trim());
    if (validRows.length === 0) {
      alert('Please add at least one record with a name.');
      return;
    }

    try {
      const res = await api.post('/records/bulk', { records: validRows });
      alert(`Successfully added ${res.data.inserted} record(s).`);
      setIsBulkAddOpen(false);
      setBulkRows([{ name: '', category: 'Design', date: new Date().toISOString().split('T')[0], status: 'Interested' }]);
      fetchRecords();
    } catch (error) {
      console.error('Bulk add error:', error);
      alert('Failed to add records.');
    }
  };

  // ── CSV Export ──
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await api.get('/records/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'records_export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export records.');
    } finally {
      setIsExporting(false);
    }
  };

  // ── CSV Import ──
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setConfirmModal({
      isOpen: true,
      title: 'Import Records',
      message: `Are you sure you want to import records from ${file.name}?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsImporting(true);
        try {
          const text = await file.text();
          const res = await api.post('/records/import', { csvData: text });
          setNotification({ isOpen: true, message: `Successfully imported ${res.data.imported} record(s).` });
          fetchRecords();
        } catch (error) {
          console.error('Import error:', error);
          setNotification({ isOpen: true, message: 'Failed to import CSV file.' });
        } finally {
          setIsImporting(true); // Should be false in finally, fixing below
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      onCancel: () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Panel</h1>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Button variant="secondary" onClick={() => setIsPasswordModalOpen(true)} className="gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Reset </span>Password
          </Button>
          <Button onClick={() => handleOpenModal()} className="gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add Record
          </Button>
        </div>
      </div>

      <div className="flex gap-4 sm:gap-6 border-b border-slate-200 dark:border-slate-800 pb-px mb-4 sm:mb-6 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
        <button 
          className={`font-semibold pb-2 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${activeTab === 'records' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          onClick={() => setActiveTab('records')}
        >
          Employees
        </button>
        <button 
          className={`font-semibold pb-2 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${activeTab === 'enquiries' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          onClick={() => setActiveTab('enquiries')}
        >
          Enquiries
        </button>
        <button 
          className={`font-semibold pb-2 border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${activeTab === 'settings' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      {activeTab === 'records' ? (
        <Card className="glass animate-in fade-in duration-300">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Manage Records</CardTitle>
            <div className="flex gap-1.5 sm:gap-2 items-center flex-wrap">
              {/* Bulk Action Toolbar */}
              {selectedIds.size > 0 && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isBulkDeleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
                </Button>
              )}
              <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setIsBulkAddOpen(true)}>
                <Users className="w-3.5 h-3.5" /> Bulk Add
              </Button>
              <Button variant="secondary" size="sm" className="gap-1.5" onClick={handleExport} disabled={isExporting}>
                <Download className="w-3.5 h-3.5" /> {isExporting ? 'Exporting...' : 'Export CSV'}
              </Button>
              <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                <Upload className="w-3.5 h-3.5" /> {isImporting ? 'Importing...' : 'Import CSV'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
              />

              <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

              <select 
                className="h-7 sm:h-8 rounded-md border border-slate-300 bg-transparent px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-100 dark:bg-dark-card"
                value={genderFilter}
                onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Genders</option>
                <option value="Male">Men</option>
                <option value="Female">Women</option>
              </select>
              <select 
                className="h-7 sm:h-8 rounded-md border border-slate-300 bg-transparent px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-100 dark:bg-dark-card"
                value={originFilter}
                onChange={(e) => { setOriginFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Origins</option>
                <option value="Indian">Indian Names</option>
                <option value="Foreign">Foreign Names</option>
              </select>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 w-8 sm:w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer accent-blue-600"
                      checked={data.length > 0 && selectedIds.size === data.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 font-medium">Name</th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 font-medium text-center">Contact</th>
                  <th className="hidden sm:table-cell px-6 py-3 font-medium">Status</th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-dark-border">
                {data.map((record) => (
                  <tr key={record.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(record.id!) ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}>
                    <td className="px-2 sm:px-4 py-2 sm:py-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer accent-blue-600"
                        checked={selectedIds.has(record.id!)}
                        onChange={() => toggleSelect(record.id!)}
                      />
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar name={record.name} />
                        <span className="truncate max-w-[80px] sm:max-w-none">{record.name}</span>
                      </div>
                    </td>
                    <td className="px-1 sm:px-6 py-2 sm:py-4 text-center">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                         <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                           <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                         </Button>
                         <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-full text-[#25D366] hover:bg-[#25D366]/10 dark:hover:bg-[#25D366]/20">
                           <WhatsAppIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                         </Button>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4">{record.status}</td>
                    <td className="px-1 sm:px-6 py-2 sm:py-4 text-right flex justify-end gap-1 sm:gap-2">
                      <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-auto sm:w-auto p-0 sm:p-1" onClick={() => handleOpenModal(record)}>
                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-auto sm:w-auto p-0 sm:p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(record.id!)}>
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                   <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      No records found. Click "Add Record" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="border-t border-slate-200 dark:border-dark-border px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">Showing </span><span className="font-medium text-slate-900 dark:text-slate-100">{(page - 1) * 10 + 1}</span>-<span className="font-medium text-slate-900 dark:text-slate-100">{Math.min(page * 10, total)}</span> of <span className="font-medium text-slate-900 dark:text-slate-100">{total}</span>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}><span className="hidden sm:inline">Previous</span><span className="sm:hidden">Prev</span></Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </Card>
      ) : activeTab === 'enquiries' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Daily Enquiries Override</CardTitle>
              <p className="text-sm text-slate-500">Manual override for enquiry counts on a specific date for the dashboard.</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-end max-w-md">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Date</label>
                  <Input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-10"
                  />
                </div>
                {todayEnquiry && (
                  <>
                    <div className="flex-1 space-y-1.5">
                      <label className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                        Enquiry Count
                      </label>
                      <Input 
                        type="number" 
                        value={todayEnquiry.value} 
                        className="text-lg font-semibold h-10"
                        onChange={(e) => setTodayEnquiry({ ...todayEnquiry, value: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <Button 
                      onClick={() => saveDailyEnquiry(todayEnquiry.id, todayEnquiry.value, todayEnquiry.date)}
                      className="h-10"
                    >
                      Update
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Monthly Enquiries</CardTitle>
              <p className="text-sm text-slate-500">Edit values below. Changes are saved automatically when you click away.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
                {enquiries.slice(0, 6).map(enq => (
                  <div key={enq.id} className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 focus-within:ring-2 ring-brand-500/50 transition-all">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Month</label>
                      <Input 
                        value={enq.month} 
                        className="h-8 text-xs font-semibold px-2 uppercase"
                        onChange={(e) => handleEnquiryChange(enq.id, 'month', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Year</label>
                      <Input 
                        type="number"
                        value={enq.year} 
                        className="h-8 text-xs font-semibold px-2"
                        onChange={(e) => handleEnquiryChange(enq.id, 'year', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">Enquiries</label>
                      <Input 
                        type="number" 
                        value={enq.value} 
                        className="h-8 text-sm font-bold px-2"
                        onChange={(e) => handleEnquiryChange(enq.id, 'value', e.target.value)}
                      />
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="w-full gap-1.5 h-8 text-[10px] font-bold uppercase"
                      onClick={() => saveEnquiry(enq)}
                    >
                      <Save className="w-3 h-3" /> Save
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="glass animate-in fade-in duration-300 max-w-2xl">
          <CardHeader>
            <CardTitle>Application Settings</CardTitle>
            <p className="text-sm text-slate-500">General configuration for the dashboard.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSettingsSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dashboard Project Title</label>
                <Input 
                  value={projectTitle} 
                  onChange={(e) => setProjectTitle(e.target.value)} 
                  placeholder="e.g. Website Development Leads"
                  required
                />
                <p className="text-xs text-slate-500">This title appears in the sidebar/header across the entire application.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Manual Total Enquiries Override</label>
                <Input 
                  type="number"
                  value={manualTotal} 
                  onChange={(e) => setManualTotal(parseInt(e.target.value) || 0)} 
                  placeholder="e.g. 1000"
                />
                <p className="text-xs text-slate-500">This value will be displayed as the total enquiries count on the dashboard (set to 0 to show live count).</p>
              </div>
               <div className="pt-4 border-t border-slate-200 dark:border-dark-border mt-6 flex justify-end">
                <Button type="submit" disabled={isSavingSettings}>
                  {isSavingSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-dark-border">
              <h3 className="text-sm font-semibold mb-4">Security Recovery PIN</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reset Password PIN</label>
                  <div className="flex gap-2">
                    <Input 
                      type="text"
                      value={recoveryPin} 
                      onChange={(e) => setRecoveryPin(e.target.value)} 
                      placeholder="e.g. 1234"
                      className="max-w-[200px]"
                    />
                    <Button 
                      variant="outline" 
                      onClick={async () => {
                        setIsSavingPin(true);
                        try {
                          await api.put('/auth/update-pin', { newPin: recoveryPin });
                          setNotification({ isOpen: true, message: 'Recovery PIN updated successfully!' });
                        } catch (e) {
                          setNotification({ isOpen: true, message: 'Failed to update PIN.' });
                        } finally {
                          setIsSavingPin(false);
                        }
                      }}
                      disabled={isSavingPin}
                    >
                      {isSavingPin ? 'Updating...' : 'Update PIN'}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">This PIN is required if you ever forget your admin password and need to reset it from the login screen.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg mx-3 sm:mx-0 shadow-xl animate-in fade-in zoom-in duration-200">
            <CardHeader>
              <CardTitle>{currentRecord ? 'Edit Record' : 'Add New Record'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Website Overhaul" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-100 dark:bg-dark-card"
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Interested">Interested</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-dark-border mt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit">{currentRecord ? 'Save Changes' : 'Add Record'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Add Modal */}
      {isBulkAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-3xl mx-3 sm:mx-0 shadow-xl animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Bulk Add Records</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsBulkAddOpen(false)} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1">
              <form onSubmit={handleBulkAddSubmit} className="space-y-3 pt-2">
                <div className="space-y-2">
                  {bulkRows.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-semibold text-slate-400 w-6 text-center shrink-0">{idx + 1}</span>
                      <Input
                        placeholder="Name *"
                        value={row.name}
                        onChange={(e) => updateBulkRow(idx, 'name', e.target.value)}
                        className="flex-1"
                        required
                      />
                      <select
                        className="h-10 rounded-md border border-slate-300 bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-100 dark:bg-dark-card"
                        value={row.category}
                        onChange={(e) => updateBulkRow(idx, 'category', e.target.value)}
                      >
                        <option value="Design">Design</option>
                        <option value="Development">Development</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="Other">Other</option>
                      </select>
                      <select
                        className="h-10 rounded-md border border-slate-300 bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-100 dark:bg-dark-card"
                        value={row.status}
                        onChange={(e) => updateBulkRow(idx, 'status', e.target.value)}
                      >
                        <option value="Interested">Interested</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      {bulkRows.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 shrink-0" onClick={() => removeBulkRow(idx)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button type="button" variant="secondary" className="w-full gap-2 border-dashed" onClick={addBulkRow}>
                  <PlusCircle className="w-4 h-4" /> Add Another Row
                </Button>

                <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-dark-border mt-4">
                  <span className="text-sm text-slate-500">{bulkRows.filter(r => r.name.trim()).length} record(s) ready</span>
                  <div className="flex gap-3">
                    <Button type="button" variant="ghost" onClick={() => setIsBulkAddOpen(false)}>Cancel</Button>
                    <Button type="submit">Add All Records</Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-sm mx-3 sm:mx-0 shadow-xl animate-in fade-in zoom-in duration-200">
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <Input type="password" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input type="password" required value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <Input type="password" required value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-dark-border mt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Update Password</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notification / Custom Alert Area */}
      <Notification 
        isOpen={notification.isOpen} 
        message={notification.message} 
        onClose={() => setNotification({ ...notification, isOpen: false })} 
      />
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}
