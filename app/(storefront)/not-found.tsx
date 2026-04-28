import Link from "next/link";

export default function StorefrontNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Strona nie znaleziona</h1>
        <p className="text-gray-600 leading-relaxed">
          Strona, której szukasz, nie istnieje lub została przeniesiona.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium underline underline-offset-4 text-gray-600 hover:text-gray-900"
        >
          Wróć na stronę główną
        </Link>
      </div>
    </div>
  );
}
