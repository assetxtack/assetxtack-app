const fs = require('fs');

// 1. Update avatar API route: add adminAuth.updateUser for photoURL
let avatarRoute = fs.readFileSync('app/api/profile/avatar/route.ts', 'utf8');

// Add updateUser import and call after Firestore update
avatarRoute = avatarRoute.replace(
  'import { getAdminAuth } from "@/lib/firebase-admin";',
  'import { getAdminAuth } from "@/lib/firebase-admin";\nimport { updateUser } from "firebase-admin/auth";'
);

avatarRoute = avatarRoute.replace(
  /await userDocRef\.set\(\s*\{[\s\S]*?\}\s*,\s*\{ merge: true \}\s*\);[\s\n]*[\t ]*return NextResponse\.json\(\{ success: true, avatarUrl \}/,
  `await userDocRef.set(
      {
        avatarUrl: avatarUrl,
        lastAvatarUpdate: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    try {
      const adminAuth = getAdminAuth();
      if (adminAuth) {
        await updateUser(adminAuth, userId, { photoURL: avatarUrl });
      }
    } catch (err) {
      console.error("Failed to update Auth photoURL:", err);
    }

    return NextResponse.json({ success: true, avatarUrl:`
);
fs.writeFileSync('app/api/profile/avatar/route.ts', avatarRoute);
console.log('Updated avatar route with adminAuth.updateUser');

// 2. Update Avatar component to accept optional src prop
const avatarContent = `interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  src?: string | null;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-lg",
};

export default function Avatar({ name, size = "sm", src }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={\`\${SIZE_CLASSES[size]} rounded-lg object-cover\`}
      />
    );
  }

  const initial = (name || "U").charAt(0).toUpperCase();

  return (
    <div
      className={\`\${SIZE_CLASSES[size]} rounded-lg bg-[#FFB020]/20 border border-[#FFB020]/30 text-[#FFB020] font-bold flex items-center justify-center shrink-0\`}
    >
      {initial}
    </div>
  );
}
`;
fs.writeFileSync('app/components/Avatar.tsx', avatarContent);
console.log('Updated Avatar component with src prop');

// 3. Update Sidebar to use user.photoURL or avatarUrl
let sidebar = fs.readFileSync('app/components/dashboard/Sidebar.tsx', 'utf8');

// Update Avatar usage in sidebar
sidebar = sidebar.replace(
  '<Avatar name={displayName} size="md" />',
  '<Avatar name={displayName} size="md" src={user?.photoURL || userData?.avatarUrl || null} />'
);

fs.writeFileSync('app/components/dashboard/Sidebar.tsx', sidebar);
console.log('Updated Sidebar');

// 4. Update Header to use user.photoURL for avatar
let header = fs.readFileSync('app/components/dashboard/Header.tsx', 'utf8');

// Replace initial-based avatar divs with photoURL-based img
// First occurrence: the button avatar (w-8 h-8)
header = header.replace(
  `<div className="w-8 h-8 rounded-lg bg-[#7C5CFC]/20 text-[#7C5CFC] font-bold text-sm flex items-center justify-center border border-[#7C5CFC]/30 shrink-0">
              {userInitial}
            </div>`,
  `{user?.photoURL ? (
              <img src={user.photoURL} alt={displayName} className="w-8 h-8 rounded-lg object-cover border border-[#7C5CFC]/30 shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#7C5CFC]/20 text-[#7C5CFC] font-bold text-sm flex items-center justify-center border border-[#7C5CFC]/30 shrink-0">
                {userInitial}
              </div>
            )}`
);

// Second occurrence: dropdown profile avatar (w-12 h-12)
header = header.replace(
  `<div className="w-12 h-12 rounded-xl bg-[#7C5CFC]/20 border border-[#7C5CFC]/30 text-[#7C5CFC] font-bold text-lg flex items-center justify-center shrink-0">
              {userInitial}
            </div>`,
  `{user?.photoURL ? (
              <img src={user.photoURL} alt={displayName} className="w-12 h-12 rounded-xl object-cover border border-[#7C5CFC]/30 shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#7C5CFC]/20 border border-[#7C5CFC]/30 text-[#7C5CFC] font-bold text-lg flex items-center justify-center shrink-0">
                {userInitial}
              </div>
            )}`
);

fs.writeFileSync('app/components/dashboard/Header.tsx', header);
console.log('Updated Header');

// 5. Update Navbar to use user.photoURL for avatar
let navbar = fs.readFileSync('app/components/Navbar.tsx', 'utf8');

// Update Avatar usages in Navbar (both occurrences)
navbar = navbar.replace(
  '<Avatar name={displayName} size="sm" />',
  '<Avatar name={displayName} size="sm" src={user?.photoURL || null} />'
);
navbar = navbar.replace(
  '<Avatar name={displayName} size="md" />',
  '<Avatar name={displayName} size="md" src={user?.photoURL || null} />'
);

fs.writeFileSync('app/components/Navbar.tsx', navbar);
console.log('Updated Navbar');

// 6. Update AuthContext to include photoURL from auth user
let authCtx = fs.readFileSync('app/context/AuthContext.tsx', 'utf8');

authCtx = authCtx.replace(
  /setUser\({\s*\.\.\.authUser,\s*isVerified:/,
  `setUser({
      ...authUser,
      photoURL: (authUser as any).photoURL || "",
      isVerified:`
);

fs.writeFileSync('app/context/AuthContext.tsx', authCtx);
console.log('Updated AuthContext');
