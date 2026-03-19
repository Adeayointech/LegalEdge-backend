import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { caseAPI } from '../lib/api';
import { DocumentUpload } from './DocumentUpload';
import { DocumentList } from './DocumentList';
import { FilingTracker } from './FilingTracker';
import { ArrowLeft, FileText, Upload } from 'lucide-react';

export function CaseDetailsDocuments() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'documents' | 'upload' | 'tracker'>('documents');
  const [showUpload, setShowUpload] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['case', id],
    queryFn: () => caseAPI.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading case details...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Failed to load case details
      </div>
    );
  }

  const caseData = data.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/cases/${id}`}
            className="p-2 hover:bg-slate-700/50 rounded-full transition-colors text-white"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-white heading-font">{caseData.title}</h2>
            <p className="text-gray-300">{caseData.suitNumber}</p>
          </div>
        </div>
        
        {activeTab === 'documents' && !showUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 px-4 py-2 rounded-lg hover:from-amber-400 hover:to-yellow-500 transition-all font-bold shadow-lg hover:shadow-amber-500/50"
          >
            <Upload className="w-5 h-5" />
            Upload Document
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <nav className="flex gap-8">
          <button
            onClick={() => {
              setActiveTab('documents');
              setShowUpload(false);
            }}
            className={`pb-4 border-b-2 font-medium transition ${
              activeTab === 'documents'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5 inline mr-2" />
            Documents
          </button>
          <button
            onClick={() => {
              setActiveTab('tracker');
              setShowUpload(false);
            }}
            className={`pb-4 border-b-2 font-medium transition ${
              activeTab === 'tracker'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Filing Tracker
          </button>
        </nav>
      </div>

      {/* Content */}
      <div>
        {showUpload ? (
          <DocumentUpload
            caseId={id!}
            onSuccess={() => setShowUpload(false)}
            onCancel={() => setShowUpload(false)}
          />
        ) : activeTab === 'documents' ? (
          <DocumentList caseId={id!} />
        ) : (
          <FilingTracker caseId={id!} />
        )}
      </div>
    </div>
  );
}
