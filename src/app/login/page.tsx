import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams?: {
    redirect?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirect = searchParams?.redirect || "/dashboard";
  return <LoginForm redirect={redirect} />;
}
