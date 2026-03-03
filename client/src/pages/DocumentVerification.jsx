import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DocumentVerification = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/providers/me');
      if (res.data.success) {
        setProfile(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPEG, PNG, PDF, and DOC files are allowed');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      toast.error('Please select a file and document type');
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('documentType', documentType);

    setUploading(true);
    const toastId = toast.loading('Uploading document...');
    
    try {
      const res = await api.post('/providers/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        toast.success('Document uploaded successfully!', { id: toastId });
        setSelectedFile(null);
        setDocumentType('');
        fetchProfile(); // Refresh profile
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload document', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (index) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const res = await api.delete(`/providers/documents/${index}`);
      if (res.data.success) {
        toast.success('Document deleted successfully');
        fetchProfile(); // Refresh profile
      }
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Document Verification</h1>
        <p className="text-gray-600">Upload documents to verify your credentials and get approved as a provider.</p>
      </div>

      {/* Verification Status */}
      <div className={`p-6 rounded-xl border ${
        profile?.verificationStatus === 'verified' ? 'bg-green-50 border-green-200' :
        profile?.verificationStatus === 'pending' ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center">
          {profile?.verificationStatus === 'verified' ? (
            <CheckCircle className="text-green-600 mr-3" size={24} />
          ) : profile?.verificationStatus === 'pending' ? (
            <AlertCircle className="text-yellow-600 mr-3" size={24} />
          ) : (
            <AlertCircle className="text-red-600 mr-3" size={24} />
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              Verification Status: <span className={
                profile?.verificationStatus === 'verified' ? 'text-green-700' :
                profile?.verificationStatus === 'pending' ? 'text-yellow-700' :
                'text-red-700'
              }>{profile?.verificationStatus?.toUpperCase()}</span>
            </h3>
            <p className="text-sm text-gray-600">
              {profile?.verificationStatus === 'verified' 
                ? 'Your documents have been verified. You can now receive job requests.'
                : profile?.verificationStatus === 'pending'
                ? 'Your documents are under review. Please wait for approval.'
                : 'Please upload documents to get verified and start receiving job requests.'}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Documents</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
            >
              <option value="">Select Document Type</option>
              <option value="license">License</option>
              <option value="insurance">Insurance Certificate</option>
              <option value="certification">Certification</option>
              <option value="id">Government ID</option>
              <option value="bank_statement">Bank Statement</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document File
            </label>
            <div className="flex items-center space-x-2">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <Upload className="mr-2" size={18} />
                  <span>{selectedFile ? selectedFile.name : 'Choose File'}</span>
                </div>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">Max file size: 5MB. Formats: JPG, PNG, PDF, DOC</p>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !documentType}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2" size={18} />
                Upload Document
              </>
            )}
          </button>
        </div>
      </div>

      {/* Uploaded Documents */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Documents</h2>
        
        {profile?.documents && profile.documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.documents.map((doc, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <FileText className="text-blue-600 mr-2" size={20} />
                    <div>
                      <h3 className="font-medium text-gray-900 capitalize">{doc.type}</h3>
                      <p className="text-sm text-gray-500">
                        {doc.verified ? (
                          <span className="text-green-600 flex items-center"><CheckCircle size={14} className="mr-1" /> Verified</span>
                        ) : (
                          <span className="text-yellow-600">Pending Review</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="mt-3">
                  <a 
                    href={`${API_URL}${doc.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Document
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No documents uploaded yet.</p>
        )}
      </div>
    </div>
  );
};

export default DocumentVerification;
