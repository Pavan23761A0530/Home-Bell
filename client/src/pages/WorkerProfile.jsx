import { useEffect, useState } from 'react';
import api from '../services/api';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, Calendar, MapPin, Image as ImageIcon, BadgeCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const WorkerProfile = () => {
  const { checkUserLoggedIn } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState('view'); // view | edit
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    skills: '',
    experienceYears: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      if (res.data.success) {
        const u = res.data.data;
        setProfile(u);
        setForm({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().slice(0, 10) : '',
          gender: u.gender || '',
          address: u.address || '',
          city: u.city || '',
          state: u.state || '',
          skills: (u.skills || []).join(', '),
          experienceYears: typeof u.experienceYears === 'number' ? String(u.experienceYears) : ''
        });
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (imageFile) {
      try {
        const url = URL.createObjectURL(imageFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch {}
    } else {
      setPreviewUrl(null);
    }
  }, [imageFile]);

  const saveProfile = async () => {
    if (!form.name || !form.email || !form.phone) {
      toast.error('Name, Email and Phone are required');
      return;
    }
    setSaving(true);
    const toastId = toast.loading('Updating profile...');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('phone', form.phone);
      if (form.dateOfBirth) fd.append('dateOfBirth', form.dateOfBirth);
      if (form.gender) fd.append('gender', form.gender);
      if (form.address) fd.append('address', form.address);
      if (form.city) fd.append('city', form.city);
      if (form.state) fd.append('state', form.state);
      if (form.skills) fd.append('skills', form.skills);
      if (form.experienceYears) fd.append('experienceYears', form.experienceYears);
      if (imageFile) fd.append('profileImage', imageFile);
      const res = await api.put('/users/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        toast.success('Profile updated', { id: toastId });
        await fetchProfile();
        try { await checkUserLoggedIn(); } catch {}
        setMode('view');
        setImageFile(null);
      } else {
        toast.error('Failed to update profile', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader size="lg" /></div>;
  if (error) return <div className="flex justify-center py-20 text-error-600">{error}</div>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Worker Profile</h1>
            <p className="text-neutral-500">Manage your profile details</p>
          </div>
          {mode === 'edit' ? (
            <Button onClick={saveProfile} isLoading={saving}>
              <BadgeCheck size={16} className="mr-2" />
              Save Changes
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setMode('edit')}>
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl bg-neutral-200 overflow-hidden">
                {(previewUrl || profile?.profileImage) ? (
                  <img src={previewUrl || profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500">
                    <User size={32} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                {mode === 'edit' ? (
                  <>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Profile Picture</label>
                    <div className="flex items-center gap-3">
                      <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                      <div className="text-neutral-500 text-sm flex items-center gap-1"><ImageIcon size={16} /> JPG/PNG</div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <h2 className="text-2xl font-extrabold text-neutral-900">{profile?.name || 'Worker'}</h2>
                    <p className="text-xs tracking-wider text-neutral-500 font-semibold">WORKER PROFILE</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            {mode === 'edit' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} icon={User} />
                <Input label="Email" value={form.email} icon={Mail} disabled />
                <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} icon={Phone} />
                <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} icon={Calendar} />
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Gender</label>
                  <select
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} icon={MapPin} />
                <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                <Input label="Skills (comma-separated)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
                <Input label="Experience (years)" type="number" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
              </div>
            ) : (
              <div className="space-y-6">
                <hr className="border-neutral-200" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                  <div>
                    <p className="text-sm text-neutral-500">Email</p>
                    <p className="font-medium">{profile?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Phone</p>
                    <p className="font-medium">{profile?.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Date of Birth</p>
                    <p className="font-medium">{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Gender</p>
                    <p className="font-medium capitalize">{profile?.gender || '-'}</p>
                  </div>
                  <div className="md:col-span-1">
                    <p className="text-sm text-neutral-500">Address</p>
                    <p className="font-medium whitespace-pre-line">{[profile?.address, profile?.city, profile?.state].filter(Boolean).join('\n') || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Skills</p>
                    <p className="font-medium">{(profile?.skills || []).join(', ') || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Experience</p>
                    <p className="font-medium">{typeof profile?.experienceYears === 'number' ? `${profile.experienceYears} years` : '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;
