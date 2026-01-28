const steps = [
  "User creates an issue",
  "Manager reviews and sets priority",
  "Engineer resolves the issue",
  "SLA tracked automatically",
];

export default function Workflow() {
  return (
    <section
      id="workflow"
      className="py-50 bg-white px-6"
    >
      <div className="max-w-5xl mx-auto text-center">

        <h2 className="text-4xl font-bold text-gray-900">
          How It Works
        </h2>

        <p className="mt-4 text-gray-600">
          A simple and structured incident workflow.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step}
              className="p-5 rounded-lg border border-gray-200 bg-gray-50"
            >
              <div className="text-blue-600 font-bold text-2xl">
                {index + 1}
              </div>
              <p className="mt-2 text-gray-700">
                {step}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
