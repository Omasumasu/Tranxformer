interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex items-center border-b px-6 py-3">
      <h2 className="text-lg font-medium">{title}</h2>
    </header>
  );
}
