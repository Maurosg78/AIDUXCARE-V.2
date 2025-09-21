<button
  onClick={() => canAccessSOAP() && setActiveTab('soap')}
  disabled={!canAccessSOAP()}
  className={`py-4 px-1 border-b-2 font-medium text-sm ${
    activeTab === 'soap'
      ? 'border-blue-500 text-blue-600'
      : canAccessSOAP()
        ? 'border-transparent text-gray-500 hover:text-gray-700'
        : 'border-transparent text-gray-300 cursor-not-allowed'
  }`}
>
  SOAP {!canAccessSOAP() && '(Requires Analysis)'}
</button>
