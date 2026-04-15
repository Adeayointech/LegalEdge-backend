import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { caseAPI, clientAPI, branchAPI } from '../lib/api';

export function CreateCase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    suitNumber: '',
    caseType: 'CIVIL',
    status: 'PRE_TRIAL',
    courtName: '',
    courtLevel: '',
    courtLocation: '',
    judgeName: '',
    plaintiff: '',
    defendant: '',
    opposingCounsel: '',
    description: '',
    clientId: '',
    branchId: '',
    filingDate: '',
  });

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientAPI.getAll({ limit: 100 }),
  });

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchAPI.getAll({ isActive: true }),
  });

  const createClientMutation = useMutation({
    mutationFn: clientAPI.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: caseAPI.create,
    onSuccess: (response) => {
      navigate(`/cases/${response.data.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create case');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateNewClient = async () => {
    if (!clientSearch.trim()) {
      setError('Please enter a client name');
      return;
    }

    setIsCreatingClient(true);
    setError('');

    try {
      // Parse the name (assume format: "FirstName LastName" or just company name)
      const nameParts = clientSearch.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // If it's a single word, treat as company name
      const isCompany = nameParts.length === 1;

      const newClientData = isCompany
        ? {
            companyName: clientSearch.trim(),
            clientType: 'CORPORATE',
          }
        : {
            firstName,
            lastName,
            clientType: 'INDIVIDUAL',
          };

      const response = await createClientMutation.mutateAsync(newClientData);
      setFormData({ ...formData, clientId: (response as any).data?.id || (response as any).id });
      setClientSearch('');
      setShowClientDropdown(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create client');
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Auto-select if there's an exact match
    if (!formData.clientId && clientSearch.trim()) {
      const exactMatch = clients.find((client: any) => {
        const name = client.clientType === 'CORPORATE'
          ? client.companyName
          : `${client.firstName} ${client.lastName}`;
        return name.toLowerCase().trim() === clientSearch.toLowerCase().trim();
      });
      
      if (exactMatch) {
        setFormData({ ...formData, clientId: exactMatch.id });
        setTimeout(() => {
          createMutation.mutate({ ...formData, clientId: exactMatch.id });
        }, 0);
        return;
      }
    }
    
    if (!formData.clientId) {
      setError('Please select an existing client or create a new one using the button below the client field');
      return;
    }
    
    createMutation.mutate(formData);
  };

  const clients = clientsData?.data?.clients || [];
  
  const filteredClients = clientSearch.trim()
    ? clients.filter((client: any) => {
        const searchLower = clientSearch.toLowerCase().trim();
        const name = client.clientType === 'CORPORATE'
          ? client.companyName
          : `${client.firstName} ${client.lastName}`;
        return name.toLowerCase().includes(searchLower);
      })
    : clients;
  
  const selectedClient = clients.find((c: any) => c.id === formData.clientId);
  const selectedClientName = selectedClient
    ? (selectedClient.clientType === 'CORPORATE'
        ? selectedClient.companyName
        : `${selectedClient.firstName} ${selectedClient.lastName}`)
    : '';

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6">Create New Case</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Case Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Adeyemi vs Zenith Bank"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Suit Number
            </label>
            <input
              type="text"
              name="suitNumber"
              value={formData.suitNumber}
              onChange={handleChange}
              placeholder="e.g., FHC/L/CS/2024/123"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.clientId ? selectedClientName : clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                  if (formData.clientId) {
                    setFormData({ ...formData, clientId: '' });
                  }
                }}
                onFocus={() => setShowClientDropdown(true)}
                onBlur={() => {
                  // Delay to allow click on dropdown
                  setTimeout(() => setShowClientDropdown(false), 300);
                }}
                placeholder="Type client name (new or existing)..."
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {clientsLoading && (
                <div className="absolute right-3 top-2 text-gray-400 text-sm">
                  Loading...
                </div>
              )}
              {showClientDropdown && !clientsLoading && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredClients.length === 0 ? (
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      {clientSearch.trim() ? 'No existing clients found' : 'Start typing to search...'}
                    </div>
                  ) : (
                    filteredClients.map((client: any) => (
                      <div
                        key={client.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFormData({ ...formData, clientId: client.id });
                          setClientSearch('');
                          setShowClientDropdown(false);
                        }}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                      >
                        <div className="font-medium text-gray-900">
                          {client.clientType === 'CORPORATE'
                            ? client.companyName
                            : `${client.firstName} ${client.lastName}`}
                        </div>
                        {client.email && (
                          <div className="text-sm text-gray-500">{client.email}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {!formData.clientId && clientSearch.trim() && (
              <button
                type="button"
                onClick={handleCreateNewClient}
                disabled={isCreatingClient}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 hover:underline disabled:text-gray-400"
              >
                {isCreatingClient ? 'Creating client...' : `+ Create new client "${clientSearch}"`}
              </button>
            )}
            {formData.clientId && (
              <div className="mt-1 text-sm text-green-600">
                ✓ Client selected: {selectedClientName}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Case Type *
            </label>
            <select
              name="caseType"
              value={formData.caseType}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CIVIL">Civil</option>
              <option value="CRIMINAL">Criminal</option>
              <option value="CORPORATE">Corporate</option>
              <option value="FAMILY">Family</option>
              <option value="LABOUR">Labour</option>
              <option value="CONSTITUTIONAL">Constitutional</option>
              <option value="INTELLECTUAL_PROPERTY">Intellectual Property</option>
              <option value="REAL_ESTATE">Real Estate</option>
              <option value="TAX">Tax</option>
              <option value="ARBITRATION">Arbitration</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PRE_TRIAL">Pre-Trial</option>
              <option value="ONGOING">Ongoing</option>
              <option value="JUDGMENT">Judgment</option>
              <option value="APPEAL">Appeal</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              name="branchId"
              value={formData.branchId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Branch (Optional)</option>
              {branchesData?.data?.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code})
                  {branch.isHeadquarters ? ' - HQ' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Court Name
            </label>
            <input
              type="text"
              name="courtName"
              value={formData.courtName}
              onChange={handleChange}
              placeholder="e.g., Federal High Court"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Court Level
            </label>
            <input
              type="text"
              name="courtLevel"
              value={formData.courtLevel}
              onChange={handleChange}
              placeholder="e.g., High Court"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Court Location
            </label>
            <input
              type="text"
              name="courtLocation"
              value={formData.courtLocation}
              onChange={handleChange}
              placeholder="e.g., Lagos"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judge Name
            </label>
            <input
              type="text"
              name="judgeName"
              value={formData.judgeName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plaintiff
            </label>
            <input
              type="text"
              name="plaintiff"
              value={formData.plaintiff}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Defendant
            </label>
            <input
              type="text"
              name="defendant"
              value={formData.defendant}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opposing Counsel
            </label>
            <input
              type="text"
              name="opposingCounsel"
              value={formData.opposingCounsel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filing Date
            </label>
            <input
              type="date"
              name="filingDate"
              value={formData.filingDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/cases')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 disabled:bg-gray-400"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Case'}
          </button>
        </div>
      </form>
    </div>
  );
}
