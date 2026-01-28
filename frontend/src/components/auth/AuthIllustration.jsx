import illustration from "../../assets/auth-illustration.png";

export default function AuthIllustration() {
  return (
    <div className="flex justify-center mb-6">
      <img
        src={illustration}
        alt="ServicePlus Authentication Illustration"
        className="h-32 w-auto"
        draggable={false}
      />
    </div>
  );
}
