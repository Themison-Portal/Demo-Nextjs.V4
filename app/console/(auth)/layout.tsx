import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // Ya autenticado como staff → redirigir a console
  if (user?.isStaff) {
    redirect("/console");
  }

  return <>{children}</>;
}
