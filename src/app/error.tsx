"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="conteudo" className="reading">
      <h1>Não foi possível abrir esta página</h1>
      <p>Tente novamente em alguns instantes.</p>
      <button onClick={reset}>Tentar novamente</button>
    </main>
  );
}
