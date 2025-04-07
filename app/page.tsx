import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase/server";
import { ArrowRight, Video, FileText, Zap, Shield, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { UrlSubmissionForm } from "@/components/landing/url-submission-form";

export default async function HomePage() {
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
        <div className="flex-1 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Transform Your Videos into
            <span className="text-primary block">Professional Documents</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            Automatically convert video content into well-structured documents using AI. Save time and streamline your content creation process.
          </p>
          
          <div className="mt-8">
            <UrlSubmissionForm />
          </div>
        </div>
        <div className="flex-1 max-w-2xl w-full h-[400px] rounded-lg bg-muted/30 border flex items-center justify-center">
          {/* Add hero image or animation here */}
          <p className="text-muted-foreground">Hero Image</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30">
        <div className="container py-12 lg:py-24">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose HowToBuddy?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Video Processing</h3>
              <p className="text-muted-foreground">
                Upload any video and get accurate transcriptions powered by AI
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Smart Documents</h3>
              <p className="text-muted-foreground">
                Automatically generate well-structured documents from your videos
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Fast Processing</h3>
              <p className="text-muted-foreground">
                Get your documents in minutes with our high-speed processing
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your content is encrypted and protected with enterprise-grade security
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t">
        <div className="container py-12 lg:py-24">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative flex flex-col items-center text-center p-4">
              <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
              <h3 className="font-semibold mb-2">Upload Your Video</h3>
              <p className="text-muted-foreground">
                Simply paste your video URL or upload your video file
              </p>
            </div>
            <div className="relative flex flex-col items-center text-center p-4">
              <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
              <h3 className="font-semibold mb-2">AI Processing</h3>
              <p className="text-muted-foreground">
                Our AI analyzes your video and generates a structured document
              </p>
            </div>
            <div className="relative flex flex-col items-center text-center p-4">
              <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
              <h3 className="font-semibold mb-2">Get Your Document</h3>
              <p className="text-muted-foreground">
                Download or edit your generated document in minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="border-t bg-muted/30">
        <div className="container py-12 lg:py-24">
          <h2 className="text-3xl font-bold text-center mb-4">
            What Our Users Say
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Join hundreds of content creators who are already saving time with HowToBuddy
          </p>
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Desktop view - Grid */}
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              <blockquote className="text-lg mb-4">
                "HowToBuddy has completely transformed how I create documentation. What used to take hours now takes minutes!"
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-primary">SJ</span>
                </div>
                <div>
                  <p className="font-semibold">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">Technical Writer</p>
                </div>
              </div>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              <blockquote className="text-lg mb-4">
                "The AI-powered document generation is incredibly accurate. It's like having a personal assistant for content creation."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-primary">MR</span>
                </div>
                <div>
                  <p className="font-semibold">Michael Rodriguez</p>
                  <p className="text-sm text-muted-foreground">Content Creator</p>
                </div>
              </div>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                ))}
              </div>
              <blockquote className="text-lg mb-4">
                "The speed and accuracy of the transcription is impressive. This tool has become essential for our team's workflow."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-primary">AL</span>
                </div>
                <div>
                  <p className="font-semibold">Amy Liu</p>
                  <p className="text-sm text-muted-foreground">Product Manager</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile view - Carousel */}
          <div className="md:hidden">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-sm mx-auto"
            >
              <CarouselContent>
                <CarouselItem>
                  <div className="bg-background rounded-lg p-6 shadow-sm">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                      ))}
                    </div>
                    <blockquote className="text-lg mb-4">
                      "HowToBuddy has completely transformed how I create documentation. What used to take hours now takes minutes!"
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">SJ</span>
                      </div>
                      <div>
                        <p className="font-semibold">Sarah Johnson</p>
                        <p className="text-sm text-muted-foreground">Technical Writer</p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>

                <CarouselItem>
                  <div className="bg-background rounded-lg p-6 shadow-sm">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                      ))}
                    </div>
                    <blockquote className="text-lg mb-4">
                      "The AI-powered document generation is incredibly accurate. It's like having a personal assistant for content creation."
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">MR</span>
                      </div>
                      <div>
                        <p className="font-semibold">Michael Rodriguez</p>
                        <p className="text-sm text-muted-foreground">Content Creator</p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>

                <CarouselItem>
                  <div className="bg-background rounded-lg p-6 shadow-sm">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                      ))}
                    </div>
                    <blockquote className="text-lg mb-4">
                      "The speed and accuracy of the transcription is impressive. This tool has become essential for our team's workflow."
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">AL</span>
                      </div>
                      <div>
                        <p className="font-semibold">Amy Liu</p>
                        <p className="text-sm text-muted-foreground">Product Manager</p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-4" />
              <CarouselNext className="hidden sm:flex -right-4" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30">
        <div className="container py-12 lg:py-24 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of content creators who are saving time with HowToBuddy
          </p>
          {!session && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/register">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
} 