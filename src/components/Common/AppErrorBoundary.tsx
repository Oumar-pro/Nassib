import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Une erreur inattendue est survenue.',
    };
  }

  componentDidCatch(error: unknown) {
    console.error('NASSIB application error:', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('nassib_user_session_v1');
      localStorage.removeItem('nassib_active_tab_v1');
    } catch {}
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-[#F8F4EA] text-[#211E1A] flex items-center justify-center p-6">
        <section className="w-full max-w-lg rounded-3xl bg-white border border-[#E8E3D7] shadow-sm p-7 text-center">
          <div className="mx-auto mb-5 w-12 h-12 rounded-2xl bg-[#073B3A]/10 text-[#073B3A] flex items-center justify-center font-bold text-xl">
            N
          </div>
          <h1 className="text-2xl font-bold text-[#073B3A]">NASSIB rencontre un problème</h1>
          <p className="mt-3 text-sm leading-6 text-[#575147]">
            L'application n'a pas pu afficher cet écran. Vos données ne sont pas remplacées par des données fictives.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={this.handleReload} className="rounded-full bg-[#073B3A] text-white px-5 py-3 font-semibold">
              Réessayer
            </button>
            <button onClick={this.handleReset} className="rounded-full border border-[#B77B4B]/50 text-[#073B3A] px-5 py-3 font-semibold">
              Réinitialiser la session locale
            </button>
          </div>
          <details className="mt-5 text-left text-xs text-[#7D766C]">
            <summary className="cursor-pointer">Détail technique</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{this.state.message}</pre>
          </details>
        </section>
      </main>
    );
  }
}
