import LoginForm from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/features/auth/get-current-user";
import { getSafeReturnTo } from "@/features/auth/return-to";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;
  const returnTo = getSafeReturnTo(params.next);

  const user = await getCurrentUser();

  if (user) {
    redirect(returnTo);
  }
  return <LoginForm returnTo={returnTo} />;
}
