export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="max-w-4xl text-center">

        <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
          ServicePulse
        </h1>

        <p className="mt-6 text-lg text-gray-600">
          An intelligent Incident & SLA Management Platform
          built for modern teams.
        </p>

        <p className="mt-2 text-gray-500">
          Track issues, enforce SLAs, and resolve incidents faster.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <a
            href="#contact"
            className="px-8 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Contact Us
          </a>


          <a
            href="#features"
            className="px-8 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Learn More
          </a>
        </div>

      </div>
    </section>
  );
}
