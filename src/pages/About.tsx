import Header from "@/components/Layout/Header";
import { Card } from "@/components/ui/card";

const About = () => {
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">About Haliot Research</h1>
        
        <Card className="p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              Haliot Research is a platform dedicated to connecting researchers, academics, and innovators 
              from around the world. We believe in fostering collaboration and knowledge sharing to advance 
              scientific discovery and innovation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">What We Do</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our platform enables researchers to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Share research findings and publications</li>
              <li>Connect with peers in their field</li>
              <li>Collaborate on research projects</li>
              <li>Stay updated with trending research topics</li>
              <li>Build their academic network</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Community</h2>
            <p className="text-muted-foreground leading-relaxed">
              Join thousands of researchers, academics, and innovators who are shaping the future of 
              scientific research. Whether you're a student, professor, or industry researcher, Haliot 
              Research provides the tools and community you need to succeed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              Have questions or feedback? We'd love to hear from you at{" "}
              <a href="mailto:contact@haliot.com" className="text-primary hover:underline">
                contact@haliot.com
              </a>
            </p>
          </section>
        </Card>
      </div>
    </>
  );
};

export default About;