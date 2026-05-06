import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { caseAPI } from '../lib/api';
import { ArrowLeft, Calendar, FileText, User, Clock } from 'lucide-react';
import { DeadlineList } from './DeadlineList';
import { HearingList } from './HearingList';
import { AssignedLawyers } from './AssignedLawyers';
import { useState } from 'react';

export function CaseDetails() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'deadlines' | 'hearings'>('overview');

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
  const client = caseData.client;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/cases"
            className="p-2 hover:bg-slate-700/50 rounded-full transition-colors text-white"
          >
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-3xl font-bold text-white heading-font">{caseData.title}</h2>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/cases/${id}/documents`}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 px-4 py-2 rounded-lg hover:from-amber-400 hover:to-yellow-500 transition-all font-bold shadow-lg hover:shadow-amber-500/50"
          >
            <FileText className="w-5 h-5" />
            Documents
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('deadlines')}
              className={`px-6 py-3 text-sm font-medium flex items-center gap-2 ${
                activeTab === 'deadlines'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              Deadlines ({caseData._count.deadlines})
            </button>
            <button
              onClick={() => setActiveTab('hearings')}
              className={`px-6 py-3 text-sm font-medium flex items-center gap-2 ${
                activeTab === 'hearings'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Hearings ({caseData._count.hearings})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Case Information</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Suit Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseData.suitNumber || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Case Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseData.caseType.replace('_', ' ')}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      caseData.status === 'ONGOING'
                        ? 'bg-green-100 text-green-800'
                        : caseData.status === 'PRE_TRIAL'
                        ? 'bg-blue-100 text-blue-800'
                        : caseData.status === 'CLOSED'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {caseData.status.replace('_', '-')}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Branch</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseData.branch?.name || 'N/A'}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Court Details</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Court Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseData.courtName || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Court Level</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseData.courtLevel || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseData.courtLocation || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Judge</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseData.judgeName || 'N/A'}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Parties</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Plaintiff</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseData.plaintiff || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Defendant</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseData.defendant || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Opposing Counsel</dt>
                <dd className="mt-1 text-sm text-gray-900">{caseData.opposingCounsel || 'N/A'}</dd>
              </div>
            </dl>
          </div>

          {caseData.description && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{caseData.description}</p>
            </div>
          )}
        </div>

          {/* Sidebar */}
          <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <User size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold">Client</h3>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {client.clientType === 'CORPORATE'
                ? client.companyName
                : `${client.firstName} ${client.lastName}`}
            </p>
            {client.email && <p className="text-sm text-gray-500 mt-1">{client.email}</p>}
            {client.phone && <p className="text-sm text-gray-500">{client.phone}</p>}
          </div>

          <AssignedLawyers
            caseId={id!}
            assignedLawyers={caseData.assignedLawyers || []}
          />

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold">Quick Stats</h3>
            </div>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Documents</dt>
                <dd className="text-sm font-medium text-gray-900">{caseData._count.documents}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Deadlines</dt>
                <dd className="text-sm font-medium text-gray-900">{caseData._count.deadlines}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Hearings</dt>
                <dd className="text-sm font-medium text-gray-900">{caseData._count.hearings}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
          )}

          {activeTab === 'deadlines' && <DeadlineList caseId={id!} />}

          {activeTab === 'hearings' && <HearingList caseId={id!} />}
        </div>
      </div>
    </div>
  );
}
