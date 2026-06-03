import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">C</span>
              </div>
              <span className="text-xl font-bold text-foreground">Cohesiq</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              The smart way to match creators and brands in Bangladesh.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-foreground">For Creators</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/campaigns" className="text-sm text-muted-foreground hover:text-foreground">
                  Browse Campaigns
                </Link>
              </li>
              <li>
                <Link href="/creator/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                  Creator Dashboard
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-foreground">For Brands</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/creators" className="text-sm text-muted-foreground hover:text-foreground">
                  Find Creators
                </Link>
              </li>
              <li>
                <Link href="/brand/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                  Brand Dashboard
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-foreground">Company</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <span className="text-sm text-muted-foreground">About Us</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Contact</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Privacy Policy</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Cohesiq. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
