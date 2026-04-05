export default function ConfigErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.894-5.894a2.121 2.121 0 010-3l.708-.708a2.121 2.121 0 013 0L15.17 11.42M15.17 11.42l2.121-2.121a2.121 2.121 0 013 0l.708.708a2.121 2.121 0 010 3L15.17 18.84M15.17 11.42L11.42 15.17" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Blad konfiguracji sklepu</h1>
        <p className="text-gray-600 leading-relaxed">
          Konfiguracja sklepu jest nieprawidlowa lub niekompletna. Skontaktuj sie z administratorem w celu rozwiazania problemu.
        </p>
        <p className="mt-4 text-sm text-gray-400">Kod bledu: CONFIG_VALIDATION_ERROR</p>
      </div>
    </div>
  );
}
