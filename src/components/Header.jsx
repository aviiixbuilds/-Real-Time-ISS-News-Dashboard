import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <p className="text-[#3a86ff] font-bold tracking-[0.2em] text-[10px] uppercase mb-1" style={{ fontVariant: 'all-small-caps' }}>
          Mission Control Dashboard
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] dark:text-white tracking-tight leading-none">
          Real-Time ISS and News Intelligence
        </h1>
      </div>
      <ThemeToggle />
    </header>
  );
}
