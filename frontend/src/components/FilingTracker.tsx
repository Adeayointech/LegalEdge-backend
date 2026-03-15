import { useQuery } from '@tanstack/react-query';
import { documentAPI } from '../lib/api';
import { CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';

interface FilingTrackerProps {
  caseId: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  COMPLAINT: 'Complaints',
  MOTION: 'Motions',
  BRIEF: 'Briefs',
  AFFIDAVIT: 'Affidavits',
  EXHIBIT: 'Exhibits',
  PLEADING: 'Pleadings',
  DISCOVERY_REQUEST: 'Discovery Requests',
  DISCOVERY_RESPONSE: 'Discovery Responses',
  DEPOSITION: 'Depositions',
  SUBPOENA: 'Subpoenas',
  COURT_ORDER: 'Court Orders',
  JUDGMENT: 'Judgments',
  APPEAL: 'Appeals',
  CONTRACT: 'Contracts',
  CORRESPONDENCE: 'Correspondence',
  INVOICE: 'Invoices',
  RECEIPT: 'Receipts',
  EVIDENCE: 'Evidence',
  OTHER: 'Other Documents',
};

export function FilingTracker({ caseId }: FilingTrackerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['filing-stats', caseId],
    queryFn: () => documentAPI.getFilingStats(caseId),
  });

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading filing statistics...</div>;
  }

  const stats = data?.data || {};
  const types = Object.keys(stats);

  if (types.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600">No documents yet</p>
        <p className="text-sm text-gray-500 mt-1">Upload documents to track filing status</p>
      </div>
    );
  }

  const getFilingProgress = (typeStat: any) => {
    const total = typeStat.total || 0;
    const filed = (typeStat.filed || 0) + (typeStat.served || 0);
    return total > 0 ? Math.round((filed / total) * 100) : 0;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Filed & Served</p>
              <p className="text-2xl font-bold text-gray-900">
                {types.reduce((sum, type) => sum + (stats[type].filed || 0) + (stats[type].served || 0), 0)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ready to File</p>
              <p className="text-2xl font-bold text-gray-900">
                {types.reduce((sum, type) => sum + (stats[type].ready || 0), 0)}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Drafts</p>
              <p className="text-2xl font-bold text-gray-900">
                {types.reduce((sum, type) => sum + (stats[type].draft || 0), 0)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-gray-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {types.reduce((sum, type) => sum + (stats[type].rejected || 0), 0)}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Filing Status by Document Type</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {types.map((type) => {
            const typeStat = stats[type];
            const progress = getFilingProgress(typeStat);
            
            return (
              <div key={type} className="px-6 py-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {DOCUMENT_TYPE_LABELS[type] || type}
                  </h4>
                  <span className="text-sm text-gray-600">
                    {typeStat.filed + typeStat.served} / {typeStat.total} filed
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                {/* Status Breakdown */}
                <div className="flex gap-4 text-sm">
                  {typeStat.draft > 0 && (
                    <span className="text-gray-600">
                      <span className="font-medium">{typeStat.draft}</span> draft
                    </span>
                  )}
                  {typeStat.ready > 0 && (
                    <span className="text-yellow-600">
                      <span className="font-medium">{typeStat.ready}</span> ready
                    </span>
                  )}
                  {typeStat.filed > 0 && (
                    <span className="text-green-600">
                      <span className="font-medium">{typeStat.filed}</span> filed
                    </span>
                  )}
                  {typeStat.served > 0 && (
                    <span className="text-blue-600">
                      <span className="font-medium">{typeStat.served}</span> served
                    </span>
                  )}
                  {typeStat.rejected > 0 && (
                    <span className="text-red-600">
                      <span className="font-medium">{typeStat.rejected}</span> rejected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
