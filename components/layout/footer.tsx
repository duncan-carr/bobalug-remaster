import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-primary">
              <img
                src="/bobalug-logo.png"
                alt="BobaLUG"
                className="h-6 w-6 object-contain"
              />
            </div>
            <span className="font-semibold">BobaLUG</span>
          </div>

          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <Link href="/members" className="hover:text-foreground">
              Members
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2025 BobaLUG. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

