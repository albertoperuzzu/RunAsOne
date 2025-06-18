type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "strava";
};

export default function Button({
  children,
  onClick,
  variant = "primary",
}: ButtonProps) {
  const base = "font-semibold px-4 py-2 rounded-md transition";
  const variants = {
    strava: "bg-strava text-white mb-2 hover:bg-strava/90",
    primary: "bg-magenta w-40 mt-2 text-white hover:bg-magenta/90",
    secondary: "bg-white w-40 mt-2 text-primary hover:bg-secondary",
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
}