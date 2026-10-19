import RegisterForm from "@/features/auth/components/register-form";
import { getCurrentUser } from "@/features/auth/get-current-user";
import { getSafeReturnTo } from "@/features/auth/return-to";
import { redirect } from "next/navigation";

type RegisterPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;
  const returnTo = getSafeReturnTo(params.next);

  const user = await getCurrentUser();

  if (user) {
    redirect(returnTo);
  }

  return <RegisterForm returnTo={returnTo} />;
}
