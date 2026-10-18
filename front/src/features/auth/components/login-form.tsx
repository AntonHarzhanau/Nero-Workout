"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loginAction } from "../actions/login";
import { useActionForm } from "../hooks/use-action-form";
import { LoginInput, loginSchema } from "../schemas";
import { InputField } from "@/components/input-field";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type LoginFormProps = {
  returnTo: string;
};

export default function LoginForm({ returnTo }: LoginFormProps) {
  const {
    register,
    onSubmit,
    formState: { errors, isSubmitting },
  } = useActionForm<LoginInput>({
    action: loginAction.bind(null, returnTo),
    fields: ["email", "password"],
    formOptions: {
      resolver: zodResolver(loginSchema),
      defaultValues: {
        email: "",
        password: "",
      },
    },
  });

  return (
    <>
      <h2 className="font-heading text-3xl">Connexion</h2>

      <p className="mt-2 text-sm text-muted-foreground">
        Accédez à votre journal d&apos;entraînement.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-5 space-y-3">
        <InputField
          label="Adresse email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          error={errors.email?.message}
          {...register("email")}
        />

        <InputField
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          required
          maxLength={4096}
          error={errors.password?.message}
          {...register("password")}
        />

        {errors.root?.message && (
          <p role="alert" className="text-sm text-destructive">
            {errors.root?.message}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link
          href={`/register?${new URLSearchParams({ next: returnTo })}`}
          className="text-primary hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </>
  );
}
