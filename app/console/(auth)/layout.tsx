import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { ROUTES } from "@/lib/routes";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // Ya autenticado como staff → redirigir a console
  if (user?.isStaff) {
    redirect(ROUTES.CONSOLE.HOME);
  }

  return <>{children}</>;
}
