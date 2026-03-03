import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

const ProviderProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [profile, setProfile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const { checkUserLoggedIn } = useAuth();
  const [docs, setDocs] = useState({
    aadhaar: null,
    pan: null,
    license: null
  });
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    experienceYears: '',
    serviceCategories: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/providers/me');
      if (res.data.success) {
        const p = res.data.data;
        setProfile(p);
        setForm({
          name: p.user?.name || '',
          email: p.user?.email || '',
          phone: p.phone || '',
          businessName: p.businessName || '',
          experienceYears: p.experienceYears ?? '',
          serviceCategories: Array.isArray(p.serviceCategories) ? p.serviceCategories.join(', ') : '',
          gender: p.gender || '',
          dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0,10) : '',
          address: p.address || p.location?.formattedAddress || '',
          city: p.city || '',
          state: p.state || '',
          pincode: p.pincode || ''
        });
        setImagePreview(p.profileImage || '');
        const hasCore = !!(p.phone || p.businessName || p.experienceYears);
        setIsEditing(!hasCore);
      } else {
        setIsEditing(true);
      }
    } catch {
      toast.error('Failed to load provider profile');
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG/PNG allowed');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onDoc = (type) => (e) => {
    const file = e.target.files?.[0] || null;
    setDocs(prev => ({ ...prev, [type]: file }));
  };

  const saveDocuments = async () => {
    const entries = Object.entries(docs).filter(([, file]) => !!file);
    for (const [type, file] of entries) {
      const fd = new FormData();
      fd.append('documentType', type);
      fd.append('document', file);
      await api.post('/providers/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('phone', form.phone || '');
    fd.append('businessName', form.businessName || '');
    fd.append('experienceYears', String(form.experienceYears || ''));
    fd.append('serviceCategories', form.serviceCategories || '');
    if (form.gender) fd.append('gender', form.gender);
    if (form.dateOfBirth) fd.append('dateOfBirth', form.dateOfBirth);
    fd.append('address', form.address || '');
    fd.append('city', form.city || '');
    fd.append('state', form.state || '');
    fd.append('pincode', form.pincode || '');
    if (imageFile) fd.append('profileImage', imageFile);

    setSaving(true);
    const toastId = toast.loading('Saving provider profile...');
    try {
      // Update the user name through users profile endpoint
      if (form.name?.trim()) {
        await api.put('/users/profile', { name: form.name });
      }
      const res = await api.put('/providers/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (!res.data.success) throw new Error(res.data.error || 'Failed to save');
      await saveDocuments();
      toast.success('Profile updated', { id: toastId });
      await fetchProfile();
      await checkUserLoggedIn(); // refresh global name/profileImage for navbar and overview
      setIsEditing(false);
      setDocs({ aadhaar: null, pan: null, license: null });
      setImageFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Save failed', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const initials = (name) => {
    if (!name) return 'PR';
    return name.split(' ').filter(Boolean).slice(0,2).map(s => s[0].toUpperCase()).join('');
  };

  const formatDOB = (d) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('en-GB'); } catch { return d; }
  };

  if (loading) return <div>Loading...</div>;

  const incomplete = !form.phone || !form.businessName || !form.experienceYears;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Profile & Docs</h1>
          <p className="text-neutral-600 mt-1">Manage your professional profile and verification documents.</p>
        </div>
      </header>

      {incomplete && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          Complete your profile to build trust and receive more jobs.
        </div>
      )}

      {!isEditing && (
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="shrink-0">
              {imagePreview ? (
                <img src={imagePreview} alt="Provider" className="w-40 h-40 object-cover rounded-xl border border-neutral-200" />
              ) : (
                <div className="w-40 h-40 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-4xl font-semibold text-neutral-500">
                  {initials(form.name)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900">
                {form.name || 'Provider'}
              </h2>
              <p className="text-sm uppercase tracking-wider text-neutral-500 mt-1">Professional Profile</p>
              <hr className="my-4 border-neutral-200" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
                <div className="flex gap-3"><span className="font-semibold w-32">Business</span><span>{form.businessName || '-'}</span></div>
                <div className="flex gap-3"><span className="font-semibold w-32">Email</span><span>{form.email || '-'}</span></div>
                <div className="flex gap-3"><span className="font-semibold w-32">Phone</span><span>{form.phone || '-'}</span></div>
                <div className="flex gap-3"><span className="font-semibold w-32">DOB</span><span>{formatDOB(form.dateOfBirth)}</span></div>
                <div className="flex gap-3"><span className="font-semibold w-32">Gender</span><span className="capitalize">{form.gender || '-'}</span></div>
                <div className="flex gap-3 sm:col-span-2"><span className="font-semibold w-32">Categories</span><span>{form.serviceCategories || '-'}</span></div>
                <div className="flex gap-3 sm:col-span-2">
                  <span className="font-semibold w-32">Address</span>
                  <div>
                    <div>{form.address || '-'}</div>
                    <div>{[form.city, form.state, form.pincode].filter(Boolean).join(', ')}</div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={() => setIsEditing(true)} variant="outline">Edit Profile</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {isEditing && (
        <Card className="p-6">
          <form onSubmit={onSave} className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Full Name" name="name" value={form.name} onChange={onChange} />
              <Input label="Email" name="email" value={form.email} readOnly />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Phone" name="phone" value={form.phone} onChange={onChange} />
              <Input label="Business Name" name="businessName" value={form.businessName} onChange={onChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input label="Experience (years)" name="experienceYears" type="number" value={form.experienceYears} onChange={onChange} />
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Date of Birth</label>
                <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={onChange} className="w-full p-3 border border-neutral-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Gender</label>
                <select name="gender" value={form.gender} onChange={onChange} className="w-full p-3 border border-neutral-300 rounded-lg">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <Input label="Service Categories (comma separated)" name="serviceCategories" value={form.serviceCategories} onChange={onChange} />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Input label="Address" name="address" value={form.address} onChange={onChange} className="md:col-span-2" />
              <Input label="City" name="city" value={form.city} onChange={onChange} />
              <Input label="State" name="state" value={form.state} onChange={onChange} />
              <Input label="Pincode" name="pincode" value={form.pincode} onChange={onChange} />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center">
                  {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-neutral-400 text-sm">No image</span>}
                </div>
                <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={onImage} className="block w-full text-sm text-neutral-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Aadhaar / ID Proof</label>
                <input type="file" accept="image/*,application/pdf" onChange={onDoc('aadhaar')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">PAN Card</label>
                <input type="file" accept="image/*,application/pdf" onChange={onDoc('pan')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">License / Certification</label>
                <input type="file" accept="image/*,application/pdf" onChange={onDoc('license')} />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit" isLoading={saving}>Save Changes</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default ProviderProfile;
