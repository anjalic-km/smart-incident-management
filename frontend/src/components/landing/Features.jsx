const features = [
  {
    title: "Incident Management",
    description:
      "Create, track, and manage incidents across multiple projects with ease.",
  },
  {
    title: "SLA Monitoring",
    description:
      "Automated SLA tracking ensures deadlines are never missed.",
  },
  {
    title: "Role-Based Workflow",
    description:
      "Admins, Managers, Engineers, and Users have clear responsibilities.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="py-50 bg-gray-50 px-6"
    >
      <div className="max-w-6xl mx-auto text-center">

        <h2 className="text-3xl font-bold text-gray-900">
          Powerful Features
        </h2>

        <p className="mt-4 text-gray-600">
          Everything you need to manage incidents effectively.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-200"
            >
              <h3 className="text-xl font-semibold text-gray-900">
                {f.title}
              </h3>
              <p className="mt-3 text-gray-600">
                {f.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
