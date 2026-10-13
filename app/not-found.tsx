import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="font-display text-3xl">Thread not found</h1>
      <Link href="/" className="text-gold">
        Back to Idea Wars
      </Link>
    </div>
  );
}
