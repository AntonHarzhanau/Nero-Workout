import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-20 max-w-7xl items-center px-6">
        <Link href="/" className="text-2xl font-semibold tracking-widest">
          NERO
        </Link>
      </header>

      <main className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-6xl items-center gap-8 px-6 pt-2 pb-6 lg:grid-cols-2 lg:gap-24">
        <section className="hidden lg:block">
          <div className="mb-8 h-px w-14 bg-primary" />
            <h1 className="font-heading text-7xl leading-tight">
              Journal
              <br />
              d&apos;entraînement.
            </h1>

            <p className="mt-7 max-w-xs leading-7 text-muted-foreground">
              Retrouvez vos séances, préparez vos plans et suivez votre progression.
            </p>
        </section>

        <section className="mx-auto w-full max-w-md rounded-xl border bg-card px-6 py-5 sm:px-8 sm:py-6">
          {children}
        </section>
      </main>
    </div>
  );
}
