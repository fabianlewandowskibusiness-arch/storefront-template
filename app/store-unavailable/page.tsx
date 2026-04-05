export default function StoreUnavailablePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Sklep tymczasowo niedostepny</h1>
        <p className="text-gray-600 leading-relaxed">
          Nie udalo sie polaczyc z serwerem konfiguracji. Sprobuj ponownie za kilka minut.
        </p>
        <p className="mt-4 text-sm text-gray-400">Kod bledu: STORE_UNAVAILABLE</p>
      </div>
    </div>
  );
}
