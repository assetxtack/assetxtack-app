interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

// Single source of truth for avatar color, shape, and initial logic — used by Header, Sidebar, Navbar
const SIZE_CLASSES: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
};

export default function Avatar({ name, size = "sm" }: AvatarProps) {
  const initial = (name || "U").charAt(0).toUpperCase();

  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-lg bg-[#FFB020]/20 border border-[#FFB020]/30 text-[#FFB020] font-bold flex items-center justify-center shrink-0`}
    >
      {initial}
    </div>
  );
}