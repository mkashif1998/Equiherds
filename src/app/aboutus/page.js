import TopSection from "../components/topSection";
import Image from "next/image";

export const metadata = {
  title: "About us | Equiherds",
};

export default function AboutPage() {
  return (
    <div className="font-sans">
      <TopSection title="About us" bgImage="/slider/3.jpeg" />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Welcome to Equiherds
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Your premier destination for horse stable management, training services, and equestrian excellence. 
              We connect horse owners with top-quality stables and professional trainers across the region.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-brand mb-6">Our Mission</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                To provide a comprehensive platform that simplifies horse stable management, 
                connects horse owners with trusted service providers, and promotes the highest 
                standards of equestrian care and training.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-brand rounded-full mt-3"></div>
                  <p className="text-gray-600">Quality assurance for all stable services</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-brand rounded-full mt-3"></div>
                  <p className="text-gray-600">Professional trainer certification</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-brand rounded-full mt-3"></div>
                  <p className="text-gray-600">Transparent pricing and booking</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/slider/1.jpeg"
                alt="Horse stable"
                width={500}
                height={400}
                className="rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <Image
                src="/slider/2.jpg"
                alt="Horse training"
                width={500}
                height={400}
                className="rounded-xl shadow-lg"
              />
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-3xl font-bold text-brand mb-6">Our Vision</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                To become the leading digital platform in the equestrian industry, 
                revolutionizing how horse owners manage their equine care needs while 
                supporting the growth and development of professional stable services.
              </p>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h4 className="text-xl font-semibold text-gray-800 mb-3">Why Choose Us?</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center space-x-2">
                    <span className="text-brand">✓</span>
                    <span>Verified and certified stable providers</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-brand">✓</span>
                    <span>24/7 customer support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-brand">✓</span>
                    <span>Secure online booking system</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-brand">✓</span>
                    <span>Real-time availability updates</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-brand text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Our Impact</h3>
            <p className="text-xl opacity-90">Numbers that speak for our success</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-lg opacity-90">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-lg opacity-90">Partner Stables</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-lg opacity-90">Successful Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">4.8★</div>
              <div className="text-lg opacity-90">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Meet Our Team</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Dedicated professionals passionate about equestrian excellence
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-brand to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">MK</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-2">Muhammad Kashif</h4>
              <p className="text-brand font-medium mb-2">Founder & CEO</p>
              <p className="text-gray-600 text-sm">
                Passionate about revolutionizing the equestrian industry through technology
              </p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">JS</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-2">John Smith</h4>
              <p className="text-brand font-medium mb-2">Head of Operations</p>
              <p className="text-gray-600 text-sm">
                Expert in stable management with 15+ years of equestrian experience
              </p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">SW</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-2">Sarah Wilson</h4>
              <p className="text-brand font-medium mb-2">Customer Success Manager</p>
              <p className="text-gray-600 text-sm">
                Dedicated to ensuring exceptional customer experiences
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Our Core Values</h3>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-3">Excellence</h4>
              <p className="text-gray-600">
                We strive for the highest standards in all our services and partnerships
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-3">Trust</h4>
              <p className="text-gray-600">
                Building lasting relationships through transparency and reliability
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-3">Innovation</h4>
              <p className="text-gray-600">
                Continuously improving our platform to better serve the equestrian community
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-brand to-green-600 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of horse owners who trust Equiherds for their equestrian needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/services"
              className="bg-white text-brand px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse Services
            </a>
            <a
              href="/contactus"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-brand transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}


