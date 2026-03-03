import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const CustomerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    profileImage: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: ''
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/profile');
      if (res.data.success && res.data.data) {
        const u = res.data.data;
        const next = {
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          profileImage: u.profileImage || '',
          dateOfBirth: u.dateOfBirth ? String(u.dateOfBirth).slice(0, 10) : '',
          gender: u.gender || '',
          address: u.address || '',
          city: u.city || '',
          state: u.state || ''
        };
        setForm(next);
        const hasProfile =
          !!(next.name || next.phone || next.gender || next.address || next.city || next.state);
        setIsEditing(!hasProfile);
      } else {
        setForm(prev => ({ ...prev, email: '' }));
        setIsEditing(true);
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG or PNG images are allowed');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (!imageFile) setImagePreview(form.profileImage || '');
    // Cleanup object URL when file changes/unmounts
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        try { URL.revokeObjectURL(imagePreview); } catch {}
      }
    };
  }, [form.profileImage, imageFile]);

  const validate = () => {
    if (!form.name?.trim()) return 'Full Name is required';
    if (!form.email?.trim()) return 'Email is required';
    if (!form.phone?.trim()) return 'Phone is required';
    if (!form.gender?.trim()) return 'Gender is required';
    return null;
  };

  const onSave = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('phone', form.phone);
    if (form.dateOfBirth) fd.append('dateOfBirth', form.dateOfBirth);
    fd.append('gender', form.gender);
    fd.append('address', form.address || '');
    fd.append('city', form.city || '');
    fd.append('state', form.state || '');
    if (imageFile) {
      fd.append('profileImage', imageFile);
    }
    setSaving(true);
    const toastId = toast.loading('Saving profile...');
    try {
      const res = await api.put('/users/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Profile saved', { id: toastId });
        await fetchProfile();
        setIsEditing(false);
        setImageFile(null);
      } else {
        toast.error(res.data.error || 'Failed to save', { id: toastId });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const formatDOB = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-GB');
    } catch {
      return iso;
    }
  };

  const initials = (name) => {
    if (!name) return 'CU';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(s => s[0].toUpperCase())
      .join('');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">My Profile</h1>
          <p className="text-neutral-600 mt-1">Manage your personal details.</p>
        </div>
      </header>

      {!isEditing && (
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="shrink-0">
              {form.profileImage ? (
                <img
                  src={form.profileImage}
                  alt="Profile"
                  className="w-40 h-40 object-cover rounded-xl border border-neutral-200"
                />
              ) : (
                <div className="w-40 h-40 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-4xl font-semibold text-neutral-500">
                  {initials(form.name)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900">
                {form.name || 'Customer'}
              </h2>
              <p className="text-sm uppercase tracking-wider text-neutral-500 mt-1">Customer Profile</p>
              <hr className="my-4 border-neutral-200" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
                <div className="flex gap-3">
                  <span className="font-semibold text-neutral-800 w-28">Email</span>
                  <span className="text-neutral-700">{form.email || '-'}</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-neutral-800 w-28">Phone</span>
                  <span className="text-neutral-700">{form.phone || '-'}</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-neutral-800 w-28">Date of Birth</span>
                  <span className="text-neutral-700">{formatDOB(form.dateOfBirth)}</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-neutral-800 w-28">Gender</span>
                  <span className="text-neutral-700 capitalize">{form.gender || '-'}</span>
                </div>
                <div className="flex gap-3 sm:col-span-2">
                  <span className="font-semibold text-neutral-800 w-28">Address</span>
                  <div className="text-neutral-700">
                    <div>{form.address || '-'}</div>
                    <div className="mt-0.5">{form.city || ''}</div>
                    <div className="mt-0.5">{form.state || ''}</div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Update Profile
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {isEditing && (
        <Card className="p-6">
          <form onSubmit={onSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Full Name" name="name" value={form.name} onChange={onChange} required />
            <Input label="Email" name="email" value={form.email} readOnly />
            <Input label="Phone" name="phone" value={form.phone} onChange={onChange} required />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">Profile Image</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-neutral-400 text-sm">No image</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={onImageChange}
                  className="block w-full text-sm text-neutral-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Date of Birth</label>
              <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={onChange} className="w-full p-3 border border-neutral-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Gender</label>
              <select name="gender" value={form.gender} onChange={onChange} className="w-full p-3 border border-neutral-300 rounded-lg" required>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input label="Address" name="address" value={form.address} onChange={onChange} />
            <Input label="City" name="city" value={form.city} onChange={onChange} />
            <Input label="State" name="state" value={form.state} onChange={onChange} />
            <div className="md:col-span-2 flex justify-end gap-3">
              {!loading && (
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              )}
              <Button type="submit" isLoading={saving}>Save Changes</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default CustomerProfile;
