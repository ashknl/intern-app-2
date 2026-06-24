import { House } from 'lucide-react';

export default function Home() {
  return (
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <House size={24} /> Home
      </h2>
      <p className="mt-2 text-muted-foreground">Welcome to the application.</p>
    </div>
  );
}
