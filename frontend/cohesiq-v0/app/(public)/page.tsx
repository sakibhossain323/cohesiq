import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, Building2, Briefcase, Sparkles, Target, Handshake } from "lucide-react";
import { SignUpButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              The Smart Way to Match Creators and Brands in Bangladesh
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
              Connect with top influencers or discover exciting brand campaigns. 
              Cohesiq makes creator-brand partnerships seamless and effective.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/campaigns">
                  Browse Campaigns
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/creators">Find Creators</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-4 text-3xl font-bold text-foreground">500+</p>
              <p className="mt-1 text-sm text-muted-foreground">Active Creators</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-4 text-3xl font-bold text-foreground">120+</p>
              <p className="mt-1 text-sm text-muted-foreground">Trusted Brands</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-4 text-3xl font-bold text-foreground">300+</p>
              <p className="mt-1 text-sm text-muted-foreground">Campaigns Completed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Why Choose Cohesiq?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We make influencer marketing simple, transparent, and effective for everyone.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">For Creators</h3>
                <p className="mt-2 text-muted-foreground">
                  Showcase your portfolio, set your rates, and get discovered by top brands. 
                  Apply to campaigns that match your niche and audience.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">For Brands</h3>
                <p className="mt-2 text-muted-foreground">
                  Find the perfect creators for your campaigns. Filter by niche, platform, 
                  followers, and budget. Review applications and manage everything in one place.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Handshake className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Smart Matching</h3>
                <p className="mt-2 text-muted-foreground">
                  Our platform connects the right creators with the right brands. 
                  Transparent pricing, verified profiles, and seamless communication.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Ready to get started?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Join hundreds of creators and brands already using Cohesiq to grow together.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <SignUpButton mode="modal">
                <Button size="lg">Join as Creator</Button>
              </SignUpButton>
              <SignUpButton mode="modal">
                <Button size="lg" variant="outline">Join as Brand</Button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
