export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div
      className="
        w-145
        backdrop-blur-xl
        rounded-3xl
        border border-white/30
        px-20
        py-10
        -mt-52
      "
    >
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        <img
          src="/src/assets/auth-illustration.png"
          alt="ServicePulse Logo"
          className="mx-auto mb-2 w-30 h-30"
        />
        {title}
      </h2>

      <p className="mt-1 text-sm text-gray-700 text-center">
        {subtitle}
      </p>

      <div className="mt-6">
        {children}
      </div>

      {footer && (
        <div className="mt-6 text-center text-sm">
          {footer}
        </div>
      )}
    </div>
  );
}
