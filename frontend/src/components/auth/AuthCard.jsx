import AuthIllustration from "./AuthIllustration";

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8">

        <AuthIllustration />

        <h2 className="text-xl font-semibold text-gray-900 text-center">
          {title}
        </h2>

        <p className="text-sm text-gray-500 text-center mt-1">
          {subtitle}
        </p>

        <div className="mt-6">
          {children}
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-gray-600">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
