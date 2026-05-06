import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchAPI, branchAPI } from '../lib/api';
import { Search, Filter, FileText, Briefcase, Users, Calendar, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdvancedSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'cases' | 'documents' | 'clients'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [status, setStatus] = useState('');
  const [caseType, setCaseType] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [branchId, setBranchId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const navigate = useNavigate();

  // Fetch branches for filter
  const { data: branchesData } = useQuery({
    queryKey: ['branches', true],
    queryFn: () => branchAPI.getAll({ isActive: true }),
  });

  const branches = branchesData?.data || [];

  // Search query
  const { data: searchResults, isLoading, refetch, error: searchError } = useQuery({
    queryKey: ['search', searchQuery, searchType, status, caseType, documentType, branchId, startDate, endDate, page],
    queryFn: async () => {
      console.log('[SEARCH] Searching with params:', {
        query: searchQuery,
        searchType,
        status,
        caseType,
        documentType,
        branchId,
        startDate,
        endDate,
        page,
        limit: 20,
      });
      const response = await searchAPI.globalSearch({
        query: searchQuery,
        searchType,
        status,
        caseType,
        documentType,
        branchId,
        startDate,
        endDate,
        page,
        limit: 20,
      });
      console.log('[SEARCH] Results:', response.data);
      return response;
    },
    enabled: false, // Only search on manual trigger
  });

  const results = searchResults?.data || {
    cases: [],
    documents: [],
    clients: [],
    totalResults: 0,
    casesCount: 0,
    documentsCount: 0,
    clientsCount: 0,
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[SEARCH] handleSearch called');
    console.log('[SEARCH] Current search query:', searchQuery);
    setPage(1);
    console.log('[SEARCH] Calling refetch...');
    refetch().then(result => {
      console.log('[SEARCH] Refetch completed:', result);
    }).catch(error => {
      console.error('[SEARCH] Refetch error:', error);
    });
  };

  const clearFilters = () => {
    setStatus('');
    setCaseType('');
    setDocumentType('');
    setBranchId('');
    setStartDate('');
    setEndDate('');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      CLOSED: 'bg-gray-100 text-gray-800',
      WON: 'bg-green-100 text-green-800',
      LOST: 'bg-red-100 text-red-800',
      SETTLED: 'bg-purple-100 text-purple-800',
      FILED: 'bg-green-100 text-green-800',
      UNFILED: 'bg-yellow-100 text-yellow-800',
      ARCHIVED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white heading-font">Advanced Search</h1>
        <p className="text-slate-400 mt-1 text-sm sm:text-base">Search across cases, documents, and clients</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, name, email, phone..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm sm:text-base"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            onClick={() => {
              console.log('[SEARCH] Button clicked!');
            }}
            className="px-4 sm:px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition disabled:bg-blue-300 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Search</span>
            <span className="sm:hidden">Go</span>
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-gray-700 text-sm sm:text-base whitespace-nowrap"
          >
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            Filters
          </button>
        </div>

        {/* Search Type Tabs */}
        <div className="flex gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto">
          {[
            { value: 'all', label: 'All Results', icon: Search },
            { value: 'cases', label: 'Cases', icon: Briefcase },
            { value: 'documents', label: 'Documents', icon: FileText },
            { value: 'clients', label: 'Clients', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSearchType(tab.value as any)}
                className={`px-3 sm:px-4 py-2 font-medium transition border-b-2 flex items-center gap-1 sm:gap-2 text-sm sm:text-base whitespace-nowrap ${
                  searchType === tab.value
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.value === 'all' ? 'All' : tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Filter Options</h3>
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              {(searchType === 'all' || searchType === 'cases' || searchType === 'documents') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="CLOSED">Closed</option>
                    <option value="WON">Won</option>
                    <option value="LOST">Lost</option>
                    <option value="SETTLED">Settled</option>
                    <option value="FILED">Filed</option>
                    <option value="UNFILED">Unfiled</option>
                  </select>
                </div>
              )}

              {/* Case Type Filter */}
              {(searchType === 'all' || searchType === 'cases') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Case Type
                  </label>
                  <select
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">All Types</option>
                    <option value="CIVIL">Civil</option>
                    <option value="CRIMINAL">Criminal</option>
                    <option value="FAMILY">Family</option>
                    <option value="CORPORATE">Corporate</option>
                    <option value="PROPERTY">Property</option>
                    <option value="LABOR">Labor</option>
                    <option value="TAX">Tax</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              )}

              {/* Document Type Filter */}
              {(searchType === 'all' || searchType === 'documents') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">All Types</option>
                    <option value="PLEADING">Pleading</option>
                    <option value="MOTION">Motion</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="EVIDENCE">Evidence</option>
                    <option value="CORRESPONDENCE">Correspondence</option>
                    <option value="COURT_ORDER">Court Order</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              )}

              {/* Branch Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">All Branches</option>
                  {branches.map((branch: any) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Results Summary */}
      {searchError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Search Error</p>
          <p className="text-sm">{(searchError as any)?.response?.data?.error || (searchError as any)?.message || 'Unknown error'}</p>
        </div>
      )}

      {!isLoading && searchResults && results.totalResults === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
          <p className="font-semibold">No results found</p>
          <p className="text-sm mt-1">Try adjusting your search query or filters</p>
        </div>
      )}

      {results.totalResults > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-4 sm:mb-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <span className="font-semibold text-gray-900 text-sm sm:text-base">
              {results.totalResults} total results
            </span>
            {results.casesCount > 0 && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                {results.casesCount} cases
              </span>
            )}
            {results.documentsCount > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                {results.documentsCount} documents
              </span>
            )}
            {results.clientsCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                {results.clientsCount} clients
              </span>
            )}
          </div>
        </div>
      )}

      {/* Cases Results */}
      {results.cases.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Cases ({results.casesCount})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {results.cases.map((caseItem: any) => (
              <div
                key={caseItem.id}
                onClick={() => navigate(`/cases/${caseItem.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{caseItem.title}</h3>
                    <p className="text-sm text-gray-600">
                      {caseItem.suitNumber} • {caseItem.courtName}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                    {caseItem.status.replace('_', ' ')}
                  </span>
                </div>
                {caseItem.description && (
                  <p className="text-sm text-gray-600 mb-2">{caseItem.description.substring(0, 150)}...</p>
                )}
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Client: {caseItem.client.companyName || `${caseItem.client.firstName} ${caseItem.client.lastName}`}</span>
                  {caseItem.branch && <span>Branch: {caseItem.branch.name}</span>}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(caseItem.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Results */}
      {results.documents.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents ({results.documentsCount})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {results.documents.map((doc: any) => (
              <div
                key={doc.id}
                onClick={() => navigate(`/cases/${doc.case.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                    <p className="text-sm text-gray-600">{doc.fileName}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                    {doc.status}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Case: {doc.case.title} ({doc.case.suitNumber})</span>
                  <span>Type: {doc.documentType}</span>
                  <span>Uploaded by: {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clients Results */}
      {results.clients.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Clients ({results.clientsCount})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {results.clients.map((client: any) => (
              <div
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {client.companyName || `${client.firstName} ${client.lastName}`}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {client.email} • {client.phone}
                    </p>
                  </div>
                  <span className="text-sm text-gray-600">
                    {client._count.cases} case{client._count.cases !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Type: {client.clientType}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(client.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {results.totalResults === 0 && searchQuery && !isLoading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">
            Try adjusting your search query or filters
          </p>
        </div>
      )}

      {/* Initial State */}
      {!searchQuery && results.totalResults === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Searching</h3>
          <p className="text-gray-600">
            Enter a search term to find cases, documents, and clients
          </p>
        </div>
      )}
    </div>
  );
}
