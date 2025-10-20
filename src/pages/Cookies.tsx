import Header from "@/components/Layout/Header";
import { Card } from "@/components/ui/card";

const Cookies = () => {
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">Cookie Policy</h1>
        
        <Card className="p-8 space-y-6">
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">What Are Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files that are placed on your computer or mobile device when you 
              visit a website. They are widely used to make websites work more efficiently and provide 
              information to website owners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Haliot Research uses cookies for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>Essential Cookies:</strong> Required for the website to function properly, including authentication and security</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website</li>
              <li><strong>Performance Cookies:</strong> Improve the performance and user experience of our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Types of Cookies We Use</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Session Cookies</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Temporary cookies that expire when you close your browser. These are essential for 
                  maintaining your login session.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Persistent Cookies</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Cookies that remain on your device until they expire or you delete them. These help 
                  us remember your preferences across visits.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Third-Party Cookies</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Set by third-party services we use, such as analytics providers. These help us 
                  understand user behavior and improve our service.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You can control and manage cookies in various ways:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Most browsers allow you to refuse or accept cookies</li>
              <li>You can delete cookies that are already stored on your device</li>
              <li>You can set your browser to notify you when cookies are being sent</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Please note that disabling cookies may affect the functionality of Haliot Research and 
              limit your ability to use certain features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Browser Settings</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              For information on how to manage cookies in your specific browser, please refer to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Chrome: Settings → Privacy and Security → Cookies</li>
              <li>Firefox: Settings → Privacy & Security → Cookies</li>
              <li>Safari: Preferences → Privacy → Cookies</li>
              <li>Edge: Settings → Cookies and Site Permissions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Updates to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices 
              or for legal reasons. Please review this page periodically for the latest information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Questions</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about our use of cookies, please contact us at{" "}
              <a href="mailto:privacy@haliot.com" className="text-primary hover:underline">
                privacy@haliot.com
              </a>
            </p>
          </section>
        </Card>
      </div>
    </>
  );
};

export default Cookies;