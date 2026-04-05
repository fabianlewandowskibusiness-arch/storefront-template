export default function StoreNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Sklep nie znaleziony</h1>
        <p className="text-gray-600 leading-relaxed">
          Nie udalo sie znalezc sklepu o podanym identyfikatorze. Sprawdz konfiguracje lub skontaktuj sie z administratorem.
        </p>
        <p className="mt-4 text-sm text-gray-400">Kod bledu: STORE_NOT_FOUND</p>
      </div>
    </div>
  );
}
