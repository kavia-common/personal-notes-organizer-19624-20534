import React from "react";

export default function NotFound() {
  return (
    <main className="app-shell min-h-screen flex items-center justify-center px-6">
      <section
        className="surface p-8 max-w-lg w-full text-center"
        role="alert"
        aria-live="assertive"
      >
        <h1 className="text-3xl font-black mb-2">404 – Page Not Found</h1>
        <p className="text-white/70">
          The page you’re looking for doesn’t exist.
        </p>
      </section>
    </main>
  );
}
