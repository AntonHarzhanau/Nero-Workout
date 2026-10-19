"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputField } from "@/components/input-field";
import { Button } from "@/components/ui/button";
import { registerAction } from "../actions/register";
import { useActionForm } from "@/hooks/use-action-form";
import { registerSchema, type RegisterInput } from "../schemas";

type RegisterFormProps = {
  returnTo: string;
};

export default function RegisterForm({ returnTo }: RegisterFormProps) {
  const {
    register,
    onSubmit,
    formState: { errors, isSubmitting },
  } = useActionForm<RegisterInput>({
    action: registerAction.bind(null, returnTo),
    fields: ["name", "username", "email", "password"],
    formOptions: {
      resolver: zodResolver(registerSchema),
      defaultValues: {
        name: "",
        username: "",
        email: "",
        password: "",
      },
    },
  });

  return (
    <>
      <h2 className="font-heading text-3xl">Créer un compte</h2>

      <p className="mt-2 text-sm text-muted-foreground">
        Commencez votre journal d’entraînement.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-5 space-y-3">
        <InputField
          label="Nom"
          autoComplete="name"
          required
          maxLength={100}
          error={errors.name?.message}
          {...register("name")}
        />

        <InputField
          label="Nom d’utilisateur"
          autoComplete="username"
          required
          minLength={3}
          maxLength={32}
          error={errors.username?.message}
          {...register("username")}
        />

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
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={4096}
          error={errors.password?.message}
          {...register("password")}
        />

        {errors.root?.message && (
          <p role="alert" className="text-sm text-destructive">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Création…" : "Créer un compte"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link
          href={`/login?${new URLSearchParams({ next: returnTo })}`}
          className="text-primary hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </>
  );
}
