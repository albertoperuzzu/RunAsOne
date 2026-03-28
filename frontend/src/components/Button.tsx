type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "garmin" | "syncGarmin";
  disabled?: boolean;
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
}: ButtonProps) {
  const base = "font-semibold px-4 py-2 rounded-lg transition";
  const variants = {
    primary:    "btn-gradient w-40 mt-2",
    secondary:  "border-2 border-accent/70 text-viola bg-white/10 w-40 mt-2 hover:bg-white/20",
    garmin:     "bg-garmin text-white mb-2 hover:bg-garmin/90",
    syncGarmin: "bg-garmin text-white text-sm px-2 py-1 hover:bg-garmin/90",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} disabled:opacity-50`}
    >
      {children}
    </button>
  );
}
