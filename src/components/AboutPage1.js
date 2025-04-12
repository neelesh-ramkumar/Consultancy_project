import React from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { FaHistory, FaLeaf, FaUsers, FaTrophy, FaQuoteLeft } from "react-icons/fa"; 
import { useInView } from "react-intersection-observer";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
// Import translation hook
import { useTranslation } from "../utils/TranslationContext";

// Text Reveal Component for Smooth Animations
const TextReveal = ({ children, delay }) => (
  <motion.span
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.6, delay }}
    className="inline-block"
  >
    {children}
  </motion.span>
);

// Progress Bar Component - Improved padding for mobile
const ProgressBar = ({ label, percentage }) => {
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });

  return (
    <div ref={ref} className="mb-4 sm:mb-6 px-1 sm:px-0">
      <div className="flex justify-between mb-1 sm:mb-2">
        <span className="text-sm sm:text-base text-gray-700">{label}</span>
        <span className="text-sm sm:text-base text-blue-600">{percentage}%</span>
      </div>
      <div className="h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-teal-500"
          initial={{ width: 0 }}
          animate={inView ? { width: `${percentage}%` } : {}}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// Enhanced responsive StatCard
const StatCard = ({ number, label, prefix = "", suffix = "", icon }) => {
  const { t } = useTranslation();
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (inView) {
      const duration = 2000;
      const steps = 60;
      const increment = number / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= number) {
          setCount(number);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [inView, number]);

  return (
    <motion.div
      ref={ref}
      className="bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-2xl 
                 transition-all duration-500 relative overflow-hidden group border border-gray-100"
      whileHover={{ scale: 1.02, y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 
                    group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <h4 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 
                     bg-clip-text text-transparent mb-2">
          {prefix}{count}{suffix}
        </h4>
        <p className="text-sm sm:text-base text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{t(label, "about")}</p>
        <div className="h-1 w-10 sm:w-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mt-2 sm:mt-3 
                     group-hover:w-full transition-all duration-500" />
      </div>
    </motion.div>
  );
};

// Improved responsive Timeline
const Timeline = ({ events }) => {
  const { t } = useTranslation();
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  
  return (
    <div ref={ref} className="relative max-w-3xl mx-auto mt-10 sm:mt-16 mb-12 sm:mb-20 px-4 sm:px-0">
      {/* Mobile timeline (vertical) */}
      <div className="md:hidden relative pl-8 space-y-8">
        <div className="absolute h-full w-1 bg-gradient-to-b from-blue-200 via-blue-400 to-blue-200 
                    left-0 rounded-full" />
        {events.map((event, index) => (
          <motion.div
            key={event.year}
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.2 }}
          >
            <div className="absolute w-5 h-5 bg-blue-500 rounded-full left-0 -translate-x-[10px] mt-1.5 border-2 border-white" />
            <motion.div 
              className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-lg border border-gray-100
                      hover:shadow-xl transition-all duration-300 group"
              whileHover={{ y: -3 }}
            >
              <span className="inline-block px-2 py-0.5 text-sm bg-blue-50 text-blue-600 rounded-full font-bold 
                          mb-1 group-hover:bg-blue-100 transition-colors duration-300">{event.year}</span>
              <p className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-300">
                {t(event.description, "about")}
              </p>
            </motion.div>
          </motion.div>
        ))}
      </div>
      
      {/* Desktop timeline (left-right) */}
      <div className="hidden md:block">
        <div className="absolute h-full w-1 bg-gradient-to-b from-blue-200 via-blue-400 to-blue-200 
                    left-1/2 transform -translate-x-1/2 rounded-full" />
        {events.map((event, index) => (
          <motion.div
            key={event.year}
            className={`flex ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} mb-8`}
            initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.2 }}
          >
            <div className="w-1/2 px-6">
              <motion.div 
                className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-100
                        hover:shadow-xl transition-all duration-300 group"
                whileHover={{ y: -5 }}
              >
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-bold 
                            mb-2 group-hover:bg-blue-100 transition-colors duration-300">{event.year}</span>
                <p className="text-gray-700 group-hover:text-gray-900 transition-colors duration-300">
                  {t(event.description, "about")}
                </p>
                <div className="h-1 w-0 bg-gradient-to-r from-blue-300 to-blue-100 rounded-full mt-3 
                          group-hover:w-full transition-all duration-500" />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Responsive AnimatedSection
const AnimatedSection = ({ icon, title, children, delay }) => {
  const { t } = useTranslation();
  const iconColors = {
    FaHistory: "from-purple-500 to-pink-500",
    FaLeaf: "from-green-500 to-emerald-500",
    FaUsers: "from-blue-500 to-cyan-500"
  };

  return (
    <motion.section
      className="group mb-10 sm:mb-16 p-4 sm:p-8 bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl 
                 hover:shadow-2xl transition-all duration-500 border-l-4 sm:border-l-8 border-transparent 
                 hover:border-gradient-to-r relative overflow-hidden mx-4 sm:mx-auto"
      initial={{ opacity: 0, y: 50, x: -50 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.9, delay, type: "spring", stiffness: 100 }}
      whileHover={{ y: -5, borderWidth: 12 }}
    >
      {/* Enhanced background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 
                      transition-opacity duration-500 -z-10" 
           style={{ background: `linear-gradient(to right, var(--${iconColors[icon.type.name]}))` }} 
      />

      <div className="relative z-10">
        <motion.div
          className="flex items-center gap-3 sm:gap-6 mb-4 sm:mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: delay + 0.2 }}
          whileHover={{ rotate: 5 }}
        >
          {icon &&
            React.cloneElement(icon, {
              className: `text-4xl sm:text-6xl bg-gradient-to-r ${iconColors[icon.type.name]} 
                         bg-clip-text text-transparent transform transition-transform 
                         duration-300 group-hover:scale-110`,
            })}
          <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 
                       bg-clip-text text-transparent drop-shadow-md">
            {t(title, "about")}
          </h3>
        </motion.div>

        <motion.div
          className="pl-4 sm:pl-16 space-y-3 sm:space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: delay + 0.4 }}
        >
          <div className="h-1 w-16 sm:w-24 bg-gradient-to-r from-gray-300 to-gray-400 
                       rounded-full group-hover:w-24 sm:group-hover:w-32 transition-all duration-300" />
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
            {children}
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
};

const AboutPage = () => {
  const { t } = useTranslation();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const achievements = [
    { year: 2020, description: t("Company founded", "about") },
    { year: 2021, description: t("First international export", "about") },
    { year: 2022, description: t("Sustainability certification", "about") },
    { year: 2023, description: t("Industry innovation award", "about") },
  ];

  const testimonials = [
    {
      quote: t("KSP Yarns has consistently delivered exceptional quality.", "home"),
      author: "Jane Smith",
      role: t("Fashion Designer", "about")
    },
    // Add more testimonials...
  ];

  const sustainabilityMetrics = [
    { label: t("Renewable Energy Usage", "about"), percentage: 75 },
    { label: t("Water Recycling", "about"), percentage: 85 },
    { label: t("Waste Reduction", "about"), percentage: 90 }
  ];

  const enhancedTestimonials = [
    {
      quote: t("KSP Yarns has consistently delivered exceptional quality products that meet our high standards.", "home"),
      author: "Jane Smith",
      role: t("Fashion Designer", "about"),
      company: "Fashion Forward Inc.",
      image: "/testimonial1.jpg"
    },
    {
      quote: t("Their commitment to sustainability aligns perfectly with our values. Excellent service!", "home"),
      author: "John Doe",
      role: t("Production Manager", "about"),
      company: "Eco Textiles Ltd.",
      image: "/testimonial2.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 sm:h-2 bg-gradient-to-r from-blue-600 to-blue-400 origin-left z-50"
        style={{ scaleX }}
      />
      
      <motion.div 
        className="max-w-5xl mx-auto text-center pt-16 sm:pt-24 pb-10 sm:pb-16 px-4"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r 
                     from-purple-600 via-blue-600 to-teal-500 bg-clip-text text-transparent 
                     drop-shadow-lg tracking-tight"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {t("About KSP Yarns", "about")}
        </motion.h1>
        <motion.p 
          className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {t("Pioneering excellence in textile manufacturing since 2020", "about")}
        </motion.p>
      </motion.div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto mb-12 sm:mb-20 px-4">
        <StatCard number={100} suffix="+" label="Products Manufactured" />
        <StatCard number={20} suffix="+" label="States Served" />
        <StatCard number={98} suffix="%" label="Customer Satisfaction" />
      </div>

      {/* Our History Section */}
      <AnimatedSection icon={<FaHistory />} title="Our History" delay={0.2}>
        {t("Founded in 2020, KSP Yarns has been at the forefront of textile excellence. What started as a small family-owned business has evolved into a globally recognized manufacturer of premium-quality yarns, trusted by industry leaders worldwide. Our journey reflects our commitment to quality and innovation.", "about")}
      </AnimatedSection>

      {/* Enhanced Sustainability Section */}
      <AnimatedSection icon={<FaLeaf />} title="Our Commitment to Sustainability" delay={0.6}>
        {t("At KSP Yarns, sustainability is not just a buzzword—it's a core value. We embrace eco-friendly manufacturing processes, utilizing recycled materials and implementing energy-efficient production methods. Our comprehensive waste reduction strategies and green initiatives demonstrate our dedication to preserving our environment for future generations.", "about")}
        <div className="mt-8">
          {sustainabilityMetrics.map((metric, index) => (
            <ProgressBar key={index} {...metric} />
          ))}
        </div>
      </AnimatedSection>

      {/* Our Team Section */}
      <AnimatedSection icon={<FaUsers />} title="Our Team" delay={1}>
        {t("Our success is driven by our exceptional team. From expert technicians to visionary designers, every member of the KSP Yarns family brings unique skills and dedication to their role. We foster a culture of innovation, collaboration, and continuous learning, ensuring we stay at the cutting edge of textile manufacturing.", "about")}
      </AnimatedSection>

      {/* Achievement Timeline */}
      <div className="mb-12 sm:mb-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-10">{t("Our Journey", "home")}</h2>
        <Timeline events={achievements} />
      </div>

      {/* Enhanced Testimonials */}
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 py-10 sm:py-16 px-4 rounded-2xl sm:rounded-3xl shadow-inner mx-4 sm:mx-auto max-w-[calc(100%-2rem)] sm:max-w-5xl">
        <div className="max-w-4xl mx-auto">
          <motion.h2 
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-10"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            {t("What Our Clients Say", "home")}
          </motion.h2>
          
          <div className="relative">
            <Carousel
              showArrows={true}
              showStatus={false}
              showThumbs={false}
              infiniteLoop={true}
              autoPlay={true}
              interval={5000}
              renderArrowPrev={(clickHandler, hasPrev) => (
                <button 
                  onClick={clickHandler} 
                  className="absolute left-0 z-10 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white/80 hover:bg-white w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full shadow-md flex items-center justify-center transition-all duration-300"
                  aria-label="Previous testimonial"
                >
                  <span className="text-blue-600 text-sm sm:text-xl">&#10094;</span>
                </button>
              )}
              renderArrowNext={(clickHandler, hasNext) => (
                <button 
                  onClick={clickHandler} 
                  className="absolute right-0 z-10 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white/80 hover:bg-white w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full shadow-md flex items-center justify-center transition-all duration-300"
                  aria-label="Next testimonial"
                >
                  <span className="text-blue-600 text-sm sm:text-xl">&#10095;</span>
                </button>
              )}
            >
              {enhancedTestimonials.map((testimonial, index) => (
                <motion.div 
                  key={index} 
                  className="px-2 sm:px-4 pb-8 sm:pb-12"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6">
                      <div className="relative mb-3 sm:mb-0 mx-auto sm:mx-0">
                        <img
                          src={testimonial.image}
                          alt={testimonial.author}
                          className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-white shadow-md"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1 sm:p-1.5 rounded-full">
                          <FaQuoteLeft className="text-xs sm:text-sm" />
                        </div>
                      </div>
                      <div className="ml-0 sm:ml-4 text-center sm:text-left">
                        <strong className="block text-base sm:text-lg md:text-xl font-semibold text-gray-800">{testimonial.author}</strong>
                        <span className="text-gray-500 text-xs sm:text-sm md:text-base">{testimonial.role}</span>
                        <span className="block text-blue-600 text-xs sm:text-sm md:text-base font-medium">{testimonial.company}</span>
                      </div>
                    </div>
                    
                    <div className="mb-3 sm:mb-4 flex justify-center sm:justify-start">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-400 text-sm sm:text-base">★</span>
                      ))}
                    </div>
                    
                    <p className="text-gray-700 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
                    
                    <div className="h-1 w-10 sm:w-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mx-auto"></div>
                  </div>
                </motion.div>
              ))}
            </Carousel>
          </div>
          
          <div className="mt-6 sm:mt-10 text-center">
            <motion.a
              href="#contact"
              className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-300 text-xs sm:text-sm md:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t("Share Your Experience", "about")}
            </motion.a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;