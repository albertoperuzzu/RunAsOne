type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
};

export default function Button({
  children,
  onClick,
  variant = "primary",
}: ButtonProps) {
  const base = "font-semibold px-4 py-2 rounded-md transition";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90",
    secondary: "bg-white text-primary hover:bg-secondary",
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
}