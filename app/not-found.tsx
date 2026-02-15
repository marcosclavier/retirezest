import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h2 className="mt-6 text-6xl font-extrabold text-gray-900">404</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">Page not found</p>
          <p className="mt-2 text-sm text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div>
          <Link
            href="/"
            className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}
