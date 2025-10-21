import Header from "@/components/Layout/Header";
import { Card } from "@/components/ui/card";

const Terms = () => {
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
        
        <Card className="p-8 space-y-6">
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using Haliot, you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to these terms, please do not use 
              our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
            <p className="text-muted-foreground leading-relaxed">
              Permission is granted to temporarily access the materials on Haliot for personal, 
              non-commercial use only. This is the grant of a license, not a transfer of title.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Conduct</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree to use Haliot only for lawful purposes and in a way that does not 
              infringe the rights of, restrict, or inhibit anyone else's use of the platform. 
              Prohibited behavior includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Posting false, inaccurate, or misleading information</li>
              <li>Impersonating another person or entity</li>
              <li>Harassing, threatening, or abusing other users</li>
              <li>Violating any applicable laws or regulations</li>
              <li>Attempting to gain unauthorized access to the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              Users retain ownership of content they post on Haliot. By posting content, 
              you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and 
              distribute your content on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Account Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to terminate or suspend your account at any time without prior 
              notice if you violate these terms or engage in behavior that we deem inappropriate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              The materials on Haliot are provided on an 'as is' basis. We make no warranties, 
              expressed or implied, and hereby disclaim all other warranties including, without limitation, 
              implied warranties for a particular purpose.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to revise these terms of service at any time. By using this platform, 
              you agree to be bound by the current version of these terms.
            </p>
          </section>
        </Card>
      </div>
    </>
  );
};

export default Terms;