import React, { useState, useEffect, useRef } from 'react';
import { ArrowRightIcon, UndoIcon, SparklesIcon, MapIcon, PiggyBankIcon, CalendarIcon, GlobeIcon, UserIcon, CheckCircleIcon, SendIcon, MapPinIcon, SpinnerIcon, TwitterIcon, FacebookIcon, LinkedinIcon, InstagramIcon, LockIcon, XCircleIcon } from './icons';

interface HeroSectionProps {
    onPlanTripClick: () => void;
    onResumeClick?: () => void;
    hasResumableTrip?: boolean;
    onAdminLogin?: () => void;
}

// --- Utility Hook for Scroll Animations ---
const useScrollReveal = (threshold = 0.1) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Only animate once
                }
            },
            { threshold }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [threshold]);

    return [ref, isVisible] as const;
};

// --- Parallax Hook ---
const useParallax = (speed = 0.5) => {
    const [offset, setOffset] = useState(0);
    useEffect(() => {
        const handleScroll = () => requestAnimationFrame(() => setOffset(window.scrollY * speed));
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [speed]);
    return offset;
};

const RevealSection = ({ children, className = "", delay = 0 }: { children?: React.ReactNode, className?: string, delay?: number }) => {
    const [ref, isVisible] = useScrollReveal(0.15);
    
    return (
        <div 
            ref={ref} 
            className={`transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

const LazyImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(src);

    const handleError = () => {
        if (currentSrc === src) {
            // Fallback to AI generated image if primary source fails
            const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(alt + ' travel scenery high quality')}?width=800&height=600&nologo=true&model=flux`;
            setCurrentSrc(fallbackUrl);
        } else {
            setError(true);
        }
    };

    return (
        <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 ${className}`}>
            {!error ? (
                <>
                    <img 
                        src={currentSrc} 
                        alt={alt} 
                        loading="lazy"
                        onLoad={() => setLoaded(true)}
                        onError={handleError}
                        className={`w-full h-full object-cover transition-all duration-1000 ease-out ${loaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-md'}`} 
                    />
                    {!loaded && (
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse" />
                    )}
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-cyan-900 to-blue-900 text-white p-4 text-center">
                    <GlobeIcon className="h-8 w-8 mb-2 opacity-50" />
                    <span className="text-sm font-serif tracking-wider opacity-90">{alt}</span>
                </div>
            )}
        </div>
    );
};

const HeroSection: React.FC<HeroSectionProps> = ({ onPlanTripClick, onResumeClick, hasResumableTrip, onAdminLogin }) => {
  const parallaxOffset = useParallax(0.4);
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setFormStatus('submitting');
      
      // Store feedback in localStorage for Admin Panel
      try {
          const newFeedback = {
              id: Date.now().toString(),
              name: formState.name,
              email: formState.email,
              message: formState.message,
              date: new Date().toLocaleString()
          };
          const existingFeedback = JSON.parse(localStorage.getItem('admin_feedback') || '[]');
          localStorage.setItem('admin_feedback', JSON.stringify([newFeedback, ...existingFeedback]));
      } catch (error) {
          console.error("Failed to save feedback locally", error);
      }

      // Simulate network request
      setTimeout(() => {
          setFormStatus('success');
          setFormState({ name: '', email: '', message: '' });
          setTimeout(() => setFormStatus('idle'), 3000);
      }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-sans overflow-x-hidden" id="hero-top">
        <style>{`
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(40px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up {
                animation: fadeInUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                opacity: 0;
            }
            .delay-100 { animation-delay: 0.2s; }
            .delay-200 { animation-delay: 0.4s; }
            .delay-300 { animation-delay: 0.6s; }
            .bg-grid-pattern {
                background-image: radial-gradient(rgba(6, 182, 212, 0.15) 1px, transparent 1px);
                background-size: 30px 30px;
            }
        `}</style>

        {/* Hero Section with Parallax Video */}
        <div className="relative h-screen flex items-center justify-center text-center text-white overflow-hidden">
            <div 
                className="absolute inset-0 w-full h-full z-0"
                style={{ transform: `translateY(${parallaxOffset}px)` }}
            >
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-60 dark:opacity-40 transition-opacity duration-1000 scale-110"
                    poster="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1920&auto=format&fit=crop"
                >
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-top-aerial-shot-of-seashore-with-rocks-1090-large.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-gray-900 dark:to-gray-950"></div>
            </div>
            
            <div className="relative z-10 p-4 max-w-5xl mx-auto flex flex-col items-center mt-[-50px]">
                <h1 
                  className="animate-fade-in-up text-5xl md:text-7xl lg:text-8xl font-extrabold font-serif tracking-tight mb-6 leading-tight"
                  style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
                >
                    Your World,<br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-white">Curated.</span>
                </h1>
                <p 
                  className="animate-fade-in-up delay-100 text-lg md:text-2xl max-w-3xl mx-auto mb-10 text-gray-100 leading-relaxed font-light"
                  style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
                >
                    Experience the future of travel planning. Smart itineraries, hidden gems, and seamless booking—all designed around you.
                </p>
                <div className="animate-fade-in-up delay-200 flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button
                        onClick={onPlanTripClick}
                        className="bg-cyan-600 text-white font-bold py-4 px-10 rounded-full text-lg shadow-2xl hover:bg-cyan-500 hover:scale-105 hover:shadow-cyan-500/50 transform transition-all duration-300 ease-out active:scale-95 flex items-center justify-center gap-2 group ring-4 ring-cyan-600/30"
                    >
                        Start Your Journey <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    {onResumeClick && (
                        <button
                            onClick={onResumeClick}
                            className="bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold py-4 px-10 rounded-full text-lg shadow-xl hover:bg-white/20 hover:scale-105 transform transition-all duration-300 ease-out active:scale-95 flex items-center justify-center gap-2"
                        >
                            Resume Planning <UndoIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>
            
            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer opacity-80 hover:opacity-100 transition-opacity" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
                    <div className="w-1 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
            </div>
        </div>

        {/* Features Grid */}
        <section id="features" className="py-24 px-4 bg-white dark:bg-gray-950 relative z-10 scroll-mt-20">
            <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>
            <div className="max-w-7xl mx-auto relative">
                <RevealSection className="text-center mb-20">
                    <h2 className="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-3">Intelligent Features</h2>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white font-serif">Your Personal Travel Concierge.</h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">We combine the power of advanced algorithms with deep travel data to handle the logistics, so you can focus on the experience.</p>
                </RevealSection>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <FeatureCard 
                        icon={<SparklesIcon className="w-8 h-8 text-purple-500" />}
                        title="Hyper-Personalized AI"
                        description="Our engine learns your style—whether you're a foodie, an adventurer, or a history buff—and builds a trip that feels uniquely yours."
                        delay={0}
                    />
                    <FeatureCard 
                        icon={<MapIcon className="w-8 h-8 text-cyan-500" />}
                        title="Smart Logistics"
                        description="We automatically group activities by location to minimize travel time. See your entire route visualized on an interactive map."
                        delay={100}
                    />
                    <FeatureCard 
                        icon={<PiggyBankIcon className="w-8 h-8 text-green-500" />}
                        title="Dynamic Budgeting"
                        description="Get realistic cost estimates for flights, hotels, dining, and activities. Track expenses in real-time to stay on budget."
                        delay={200}
                    />
                    <FeatureCard 
                        icon={<CalendarIcon className="w-8 h-8 text-orange-500" />}
                        title="Live Assistance"
                        description="Need to change plans? Our built-in AI Chatbot is ready 24/7 to suggest alternatives, find restaurants, or answer local queries."
                        delay={300}
                    />
                </div>
            </div>
        </section>

        {/* Travel Inspirations / Vibes */}
        <section id="vibes" className="py-24 px-4 bg-gray-50 dark:bg-gray-900 scroll-mt-20">
            <div className="max-w-7xl mx-auto">
                <RevealSection className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">Inspiration for Every Traveler</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-xl">Whether you crave adrenaline, culture, or relaxation, GlobeTrekker builds the itinerary that fits your mood.</p>
                    </div>
                    <button onClick={onPlanTripClick} className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1 transition-transform hover:translate-x-1">
                        Start a new plan <ArrowRightIcon className="h-4 w-4" />
                    </button>
                </RevealSection>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <VibeCard 
                        title="Urban Exploration" 
                        image="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=800&auto=format&fit=crop"
                        tag="Culture & Nightlife"
                        delay={0}
                    />
                    <VibeCard 
                        title="Nature Escapes" 
                        image="https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800&auto=format&fit=crop"
                        tag="Hiking & Views"
                        delay={100}
                    />
                    <VibeCard 
                        title="Culinary Journeys" 
                        image="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop"
                        tag="Food & Markets"
                        delay={200}
                    />
                </div>
            </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 px-4 bg-white dark:bg-gray-950 relative overflow-hidden scroll-mt-20">
             {/* Decorative background elements */}
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute top-1/2 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
             </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <RevealSection className="text-center mb-20">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white font-serif">Simple, yet powerful.</h2>
                    <p className="text-gray-600 dark:text-gray-400">Plan your dream vacation in three simple steps.</p>
                </RevealSection>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                    {/* Connecting Line (Desktop only) */}
                    <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-cyan-200 via-purple-200 to-cyan-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 z-0"></div>

                    <StepCard 
                        number="1"
                        title="Tell Us Your Style"
                        description="Enter your destination, dates, budget, and specific interests. The more we know, the better the plan."
                        delay={0}
                    />
                    <StepCard 
                        number="2"
                        title="AI Magic Happens"
                        description="Our engine analyzes thousands of data points to generate a perfect, logistic-optimized day-by-day itinerary instantly."
                        delay={200}
                    />
                    <StepCard 
                        number="3"
                        title="Customize & Go"
                        description="Review your plan, drag-and-drop to adjust, book flights & hotels directly, and export to PDF."
                        delay={400}
                    />
                </div>
            </div>
        </section>

        {/* Testimonials (Shifted Up) */}
        <section id="testimonials" className="py-24 px-4 bg-gray-50 dark:bg-gray-900 scroll-mt-20 border-t border-gray-100 dark:border-gray-800">
            <div className="max-w-6xl mx-auto">
                <RevealSection>
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white font-serif">Loved by Travelers</h2>
                </RevealSection>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <TestimonialCard 
                        quote="GlobeTrekker saved me hours of planning. The restaurant recommendations were spot on and the budget tracker kept me honest!"
                        author="Sarah J."
                        location="Traveled to Japan"
                        delay={0}
                    />
                    <TestimonialCard 
                        quote="I loved how it stayed within my budget while still including all the must-see sights. The map view is incredibly helpful."
                        author="Mike T."
                        location="Traveled to Italy"
                        delay={100}
                    />
                    <TestimonialCard 
                        quote="The AI chat feature is a game changer. It felt like having a local guide in my pocket giving me tips on the fly."
                        author="Elena R."
                        location="Traveled to Mexico"
                        delay={200}
                    />
                </div>
            </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="py-24 px-4 bg-gray-900 text-white relative overflow-hidden scroll-mt-20">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-16">
                    <div className="md:w-1/2">
                        <RevealSection>
                            <h4 className="text-cyan-400 font-bold uppercase tracking-widest mb-2 text-sm">About Us</h4>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 font-serif leading-tight">Travel Smarter,<br/>Not Harder.</h2>
                            <p className="text-gray-300 text-lg leading-relaxed mb-6">
                                GlobeTrekker was born from a simple idea: planning a trip should be as exciting as taking it. We believe that technology can remove the stress of logistics, leaving you free to focus on the experience.
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-4xl font-bold text-cyan-400 mb-1">50k+</h3>
                                    <p className="text-gray-400 text-sm">Trips Planned</p>
                                </div>
                                <div>
                                    <h3 className="text-4xl font-bold text-cyan-400 mb-1">120+</h3>
                                    <p className="text-gray-400 text-sm">Countries Covered</p>
                                </div>
                            </div>
                        </RevealSection>
                    </div>
                    <div className="md:w-1/2">
                        <RevealSection delay={200} className="relative">
                            <div className="grid grid-cols-2 gap-4">
                                <LazyImage src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop" alt="Team working" className="rounded-2xl shadow-2xl translate-y-8 hover:scale-105 transition-transform duration-500" />
                                <LazyImage src="https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=800&auto=format&fit=crop" alt="Travel planning" className="rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-500" />
                            </div>
                        </RevealSection>
                    </div>
                </div>
            </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 px-4 bg-gray-50 dark:bg-gray-900 scroll-mt-20">
            <div className="max-w-5xl mx-auto">
                <RevealSection className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-serif mb-4">Get in Touch</h2>
                    <p className="text-gray-600 dark:text-gray-400">Have questions or feedback? We'd love to hear from you.</p>
                </RevealSection>
                
                <RevealSection delay={100}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
                        <div className="md:w-1/2 p-8 md:p-12 bg-cyan-600 text-white flex flex-col justify-between">
                            <div>
                                <h3 className="text-2xl font-bold mb-6 font-serif">Contact Information</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 hover:bg-white/30 transition-colors">
                                            <SendIcon className="h-5 w-5" />
                                        </div>
                                        <p>hello@globetrekker.ai</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 hover:bg-white/30 transition-colors">
                                            <MapPinIcon className="h-5 w-5" />
                                        </div>
                                        <p>123 Innovation Dr, Tech City, TC 90210</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 hover:bg-white/30 transition-colors">
                                            <GlobeIcon className="h-5 w-5" />
                                        </div>
                                        <p>www.globetrekker.ai</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-12">
                                <p className="opacity-80 text-sm">Follow us on social media for daily travel inspiration.</p>
                                <div className="flex gap-4 mt-4">
                                    <a href="https://x.com/zaid4hmad" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 cursor-pointer flex items-center justify-center transition-all hover:scale-110 text-white" aria-label="Twitter">
                                        <TwitterIcon className="h-5 w-5" />
                                    </a>
                                    <a href="https://www.linkedin.com/in/mohammedjaid" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 cursor-pointer flex items-center justify-center transition-all hover:scale-110 text-white" aria-label="LinkedIn">
                                        <LinkedinIcon className="h-5 w-5" />
                                    </a>
                                    <a href="https://www.instagram.com/zaid_4hmed/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 cursor-pointer flex items-center justify-center transition-all hover:scale-110 text-white" aria-label="Instagram">
                                        <InstagramIcon className="h-5 w-5" />
                                    </a>
                                </div>
                            </div>
                        </div>
                        
                        <div className="md:w-1/2 p-6 md:p-12">
                            {formStatus === 'success' ? (
                                <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in p-4">
                                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Message Sent!</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Thank you for reaching out. We'll get back to you shortly.</p>
                                </div>
                            ) : (
                                <form className="space-y-6" onSubmit={handleContactSubmit}>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Name</label>
                                        <input 
                                            type="text" 
                                            name="name"
                                            required
                                            value={formState.name}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none transition-all focus:border-cyan-500" 
                                            placeholder="Your name" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                        <input 
                                            type="email" 
                                            name="email"
                                            required
                                            value={formState.email}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none transition-all focus:border-cyan-500" 
                                            placeholder="your@email.com" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Message</label>
                                        <textarea 
                                            name="message"
                                            required
                                            value={formState.message}
                                            onChange={handleFormChange}
                                            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none transition-all h-32 resize-none focus:border-cyan-500" 
                                            placeholder="How can we help?"
                                        ></textarea>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={formStatus === 'submitting'}
                                        className="w-full bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-3 rounded-lg hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 transform hover:-translate-y-1"
                                    >
                                        {formStatus === 'submitting' ? <SpinnerIcon className="animate-spin h-5 w-5"/> : 'Send Message'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </RevealSection>
            </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 px-4 bg-white dark:bg-gray-950 scroll-mt-20 border-t border-gray-100 dark:border-gray-800">
            <div className="max-w-4xl mx-auto">
                <RevealSection>
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white font-serif">Frequently Asked Questions</h2>
                </RevealSection>
                <div className="grid gap-6">
                    <FAQItem 
                        question="Is GlobeTrekker free to use?" 
                        answer="Yes! You can generate unlimited itineraries for free. We believe smart travel planning should be accessible to everyone." 
                        delay={0}
                    />
                    <FAQItem 
                        question="How accurate are the cost estimates?" 
                        answer="Our estimates are based on real-time data averages for your destination. While actual prices may vary based on booking time and availability, they provide a solid baseline for budgeting." 
                        delay={100}
                    />
                    <FAQItem 
                        question="Can I edit the itinerary after it's generated?" 
                        answer="Absolutely. GlobeTrekker gives you a solid starting point, but you have full control to drag-and-drop activities, remove items, or add your own custom plans." 
                        delay={200}
                    />
                    <FAQItem 
                        question="Do you handle bookings directly?" 
                        answer="We provide direct links and integrated booking simulations for flights and hotels. For the best rates, we guide you to trusted partners." 
                        delay={300}
                    />
                </div>
            </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-4 text-center bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <RevealSection className="max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white font-serif leading-tight">Ready for your next adventure?</h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">Join thousands of travelers exploring the world smarter, cheaper, and better.</p>
                <button
                    onClick={onPlanTripClick}
                    className="bg-cyan-600 text-white font-bold py-5 px-12 rounded-full text-xl shadow-xl hover:bg-cyan-500 hover:shadow-2xl hover:-translate-y-1 transform transition-all duration-300 ease-in-out active:scale-95 ring-4 ring-cyan-600/20"
                >
                    Plan My Trip Now
                </button>
                <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-500">
                    <span className="flex items-center gap-2"><CheckCircleIcon className="h-5 w-5 text-green-500"/> No credit card required</span>
                    <span className="flex items-center gap-2"><CheckCircleIcon className="h-5 w-5 text-green-500"/> Instant itinerary generation</span>
                    <span className="flex items-center gap-2"><CheckCircleIcon className="h-5 w-5 text-green-500"/> Export to PDF</span>
                </div>
            </RevealSection>
        </section>
        
        {/* Footer */}
        <footer className="bg-white dark:bg-gray-950 py-12 border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <GlobeIcon className="h-6 w-6 text-cyan-600" />
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-200 font-serif">GlobeTrekker</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    © {new Date().getFullYear()} GlobeTrekker. All rights reserved.
                </div>
                <div className="flex gap-6 text-gray-600 dark:text-gray-400 items-center">
                    <a href="#" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Privacy</a>
                    <a href="#" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Terms</a>
                    <a href="#" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Contact</a>
                    {onAdminLogin && (
                        <button 
                            onClick={onAdminLogin}
                            className="text-xs flex items-center gap-1 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors opacity-70 hover:opacity-100"
                        >
                            <LockIcon className="h-3 w-3" /> Admin Login
                        </button>
                    )}
                </div>
            </div>
        </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) => (
    <RevealSection delay={delay}>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-gray-100 dark:border-gray-700 group h-full hover:border-cyan-200 dark:hover:border-cyan-800">
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl inline-block group-hover:scale-110 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/30 transition-all duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white font-serif group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{description}</p>
        </div>
    </RevealSection>
);

const VibeCard = ({ title, image, tag, delay }: { title: string, image: string, tag: string, delay: number }) => (
    <RevealSection delay={delay}>
        <div className="relative group overflow-hidden rounded-2xl h-80 shadow-lg cursor-pointer transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
            <LazyImage src={image} alt={title} className="w-full h-full group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 ease-in-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 p-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <span className="text-xs font-bold uppercase tracking-wider bg-cyan-600 px-2 py-1 rounded mb-2 inline-block shadow-sm group-hover:bg-cyan-500 transition-colors">{tag}</span>
                <h3 className="text-2xl font-bold font-serif group-hover:text-cyan-200 transition-colors">{title}</h3>
            </div>
        </div>
    </RevealSection>
);

const StepCard = ({ number, title, description, delay }: { number: string, title: string, description: string, delay: number }) => (
    <RevealSection delay={delay} className="relative z-10 flex flex-col items-center text-center group">
        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-6 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 ring-4 ring-white dark:ring-gray-900 font-serif group-hover:shadow-cyan-500/50">
            {number}
        </div>
        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white font-serif group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-xs mx-auto text-sm leading-relaxed">{description}</p>
    </RevealSection>
);

const FAQItem = ({ question, answer, delay }: { question: string, answer: string, delay: number }) => (
    <RevealSection delay={delay}>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all hover:border-cyan-500 dark:hover:border-cyan-500 group cursor-default">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 font-serif group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{question}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{answer}</p>
        </div>
    </RevealSection>
);

const TestimonialCard = ({ quote, author, location, delay }: { quote: string, author: string, location: string, delay: number }) => (
    <RevealSection delay={delay}>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 relative hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
            <div className="text-cyan-200 dark:text-gray-700 absolute top-6 left-6 text-6xl font-serif opacity-30">"</div>
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-6 relative z-10 italic leading-relaxed font-serif flex-grow">{quote}</p>
            <div className="flex items-center gap-4 mt-auto">
                <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                    <div className="font-bold text-gray-900 dark:text-white">{author}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{location}</div>
                </div>
            </div>
        </div>
    </RevealSection>
);

export default HeroSection;