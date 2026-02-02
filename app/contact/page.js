'use client';

import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  MessageSquare,
  Heart,
  Star,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  User,
  Building,
  AlertCircle
} from 'lucide-react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { SettingContext } from '../context/SettingContext';

const Contact = () => {
  const { settings } = useContext(SettingContext) || {};

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});

  const inquiryTypes = [
    { id: 'general', name: 'General Inquiry', icon: MessageSquare },
    { id: 'support', name: 'Customer Support', icon: Heart },
    { id: 'business', name: 'Business Partnership', icon: Building },
    { id: 'feedback', name: 'Feedback & Reviews', icon: Star }
  ];

  // --- Helpers to support both shapes of settings payload ---
  // Some payloads use settings.contact, some use settings.generalSettings.contact
  const contactData =
    settings?.contact ||
    settings?.generalSettings?.contact ||
    settings?.generalSettings?.contact ||
    null;

  // branding / seo top-level fallbacks
  const branding =
    settings?.branding ||
    settings?.generalSettings?.branding ||
    settings?.generalSettings?.branding ||
    null;

  const seo =
    settings?.seo ||
    settings?.generalSettings?.seo ||
    settings?.generalSettings?.seo ||
    null;

  const siteTitle =
    settings?.siteTitle ||
    seo?.siteTitle ||
    settings?.generalSettings?.seo?.siteTitle ||
    'Pink Dreams - Premium Fashion Store';

  const siteDescription =
    settings?.siteDescription ||
    seo?.siteDescription ||
    settings?.generalSettings?.seo?.siteDescription ||
    'Discover the latest trends in fashion. Shop premium clothing, accessories, and more at Pink Dreams.';

  // Extract contact pieces safely
  const emails = Array.isArray(contactData?.emails) ? contactData.emails : [];
  const phones = Array.isArray(contactData?.phones) ? contactData.phones : [];
  // address may be single object or addresses array
  const address =
    contactData?.address ||
    (Array.isArray(contactData?.addresses) ? contactData.addresses[0] : null) ||
    null;
  const social = contactData?.social || {};
  const hours = contactData?.hours || {};

  // Build dynamic contact info cards (fallback to static defaults if settings missing)
  const defaultContactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      primary: 'hello@pinkstore.com',
      secondary: 'support@pinkstore.com',
      description: 'Send us an email anytime!'
    },
    {
      icon: Phone,
      title: 'Call Us',
      primary: '+1 (555) 123-4567',
      secondary: '+1 (555) 987-6543',
      description: 'Mon-Fri 9AM-6PM EST'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      primary: '123 Pink Street',
      secondary: 'Beauty City, BC 12345',
      description: 'Come see our showroom!'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      primary: 'Mon-Fri: 9AM-6PM',
      secondary: 'Sat: 10AM-4PM',
      description: 'Closed on Sundays'
    }
  ];

  const effectiveContactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      primary: emails[0]?.email || defaultContactInfo[0].primary,
      secondary: emails[1]?.email || defaultContactInfo[0].secondary,
      description: 'Send us an email anytime!'
    },
    {
      icon: Phone,
      title: 'Call Us',
      primary: phones[0]?.number || defaultContactInfo[1].primary,
      secondary: phones[1]?.number || defaultContactInfo[1].secondary,
      description: 'Mon-Fri 9AM-6PM EST' 
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      primary: address?.line1 || defaultContactInfo[2].primary,
      secondary:
        (address && `${address.city || ''}${address.state ? ', ' + address.state : ''} ${address.zip || ''}`) ||
        address?.line2 ||
        defaultContactInfo[2].secondary,
      description: 'Come see our showroom!'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      primary:
        hours?.weekdays
          ? `${formatTime(hours.weekdays.open)} - ${formatTime(hours.weekdays.close)}`
          : defaultContactInfo[3].primary,
      secondary:
        hours?.saturday && !hours.saturday.closed
          ? `${formatTime(hours.saturday.open)} - ${formatTime(hours.saturday.close)}`
          : defaultContactInfo[3].secondary,
      description: hours?.weekdays ? 'Business hours (local time)' : defaultContactInfo[3].description
    }
  ];

  // Build social links dynamically from settings.social
  const socialIconMap = {
    instagram: { Icon: Instagram, color: 'hover:text-pink-600' },
    facebook: { Icon: Facebook, color: 'hover:text-blue-600' },
    twitter: { Icon: Twitter, color: 'hover:text-blue-400' },
    youtube: { Icon: Youtube, color: 'hover:text-red-600' }
  };

  const effectiveSocialLinks =
    Object.keys(social).length > 0
      ? Object.entries(social)
          .filter(([k, v]) => v && typeof v === 'string' && v.trim() !== '')
          .map(([key, url]) => {
            const map = socialIconMap[key.toLowerCase()];
            return {
              icon: map?.Icon || Globe,
              name: key.charAt(0).toUpperCase() + key.slice(1),
              url,
              color: map?.color || 'hover:text-gray-700'
            };
          })
      : [
          { icon: Facebook, name: 'Facebook', url: '#', color: 'hover:text-blue-600' },
          { icon: Instagram, name: 'Instagram', url: '#', color: 'hover:text-pink-600' },
          { icon: Twitter, name: 'Twitter', url: '#', color: 'hover:text-blue-400' },
          { icon: Youtube, name: 'YouTube', url: '#', color: 'hover:text-red-600' }
        ];

  // Utility: format "HH:MM" -> "9:00 AM"
  function formatTime(t) {
    if (!t || typeof t !== 'string') return t || '';
    // t expected '09:00' or '9:00'
    const [hh, mm] = t.split(':').map((s) => parseInt(s, 10));
    if (isNaN(hh)) return t;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
  }

  // --- Form validation (unchanged, just present) ---
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    } else if (formData.message.trim().length > 1000) {
      newErrors.message = 'Message must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          inquiryType: formData.inquiryType
        })
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          inquiryType: 'general'
        });
        setErrors({});

        // Optional: Show contact ID to user
        console.log('Contact ID:', result.contactId);

        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus(null);
        }, 5000);
      } else {
        setSubmitStatus('error');
        console.error('Contact form error:', result.message);
      }
    } catch (error) {
      console.error('Network error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white">
      {/* Header */}
      <Header />

      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{siteTitle}</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">{siteDescription}</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Contact Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {effectiveContactInfo.map((info, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl mb-4">
                <info.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{info.title}</h3>
              <p className="text-gray-800 font-medium break-words">{info.primary}</p>
              {info.secondary && <p className="text-gray-600 text-sm">{info.secondary}</p>}
              <p className="text-gray-500 text-sm mt-2">{info.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a Message</h2>
                <p className="text-gray-600">Fill out the form below and we'll get back to you as soon as possible.</p>
              </div>

              {/* Submit Status */}
              <AnimatePresence>
                {submitStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
                      submitStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {submitStatus === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-medium">
                      {submitStatus === 'success' ? "Message sent successfully! We'll get back to you soon." : 'Failed to send message. Please try again.'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Inquiry Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">What can we help you with?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {inquiryTypes.map((type) => (
                      <motion.label
                        key={type.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                          formData.inquiryType === type.id ? 'bg-pink-100 border-2 border-pink-500 text-pink-700' : 'bg-gray-50 border-2 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <input type="radio" name="inquiryType" value={type.id} checked={formData.inquiryType === type.id} onChange={handleInputChange} className="sr-only" />
                        <type.icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{type.name}</span>
                      </motion.label>
                    ))}
                  </div>
                </div>

                {/* Name and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 ${errors.name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter your full name" />
                    </div>
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 ${errors.email ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter your email address" />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 ${errors.subject ? 'border-red-500' : 'border-gray-300'}`} placeholder="What's this about?" />
                  {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                  <textarea id="message" name="message" value={formData.message} onChange={handleInputChange} rows={6} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 resize-none ${errors.message ? 'border-red-500' : 'border-gray-300'}`} placeholder="Tell us more about your inquiry..." />
                  {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
                  <p className="mt-2 text-sm text-gray-500">{formData.message.length}/1000 characters</p>
                </div>

                {/* Submit Button */}
                <motion.button type="submit" disabled={isSubmitting} whileHover={{ scale: isSubmitting ? 1 : 1.02 }} whileTap={{ scale: isSubmitting ? 1 : 0.98 }} className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-3 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg hover:shadow-xl'}`}>
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-8">
            {/* Social Media */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Follow Us</h3>
              <p className="text-gray-600 mb-4">Stay connected with us on social media for the latest updates and behind-the-scenes content.</p>
              <div className="flex gap-4">
                {effectiveSocialLinks.map((socialItem, index) => (
                  <motion.a key={index} href={socialItem.url} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className={`w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 transition-colors duration-200 ${socialItem.color}`}>
                    <socialItem.icon className="w-6 h-6" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Answers</h3>
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">What are your shipping times?</h4>
                  <p className="text-sm text-gray-600">We typically ship within 1-2 business days, and delivery takes 3-7 business days depending on your location.</p>
                </div>
                <div className="border-b border-gray-100 pb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Do you offer international shipping?</h4>
                  <p className="text-sm text-gray-600">Yes! We ship worldwide. International shipping times vary by location, typically 7-14 business days.</p>
                </div>
                <div className="border-b border-gray-100 pb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">What is your return policy?</h4>
                  <p className="text-sm text-gray-600">We offer a 30-day return policy for unused items in original packaging. Return shipping is free for defective items.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">How can I track my order?</h4>
                  <p className="text-sm text-gray-600">Once your order ships, you'll receive a tracking number via email. You can also check your order status in your account.</p>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Business Hours</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Monday - Friday</span>
                  <span className="font-medium text-gray-900">{hours?.weekdays ? `${formatTime(hours.weekdays.open)} - ${formatTime(hours.weekdays.close)}` : '9:00 AM - 6:00 PM'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Saturday</span>
                  <span className="font-medium text-gray-900">{hours?.saturday && !hours.saturday.closed ? `${formatTime(hours.saturday.open)} - ${formatTime(hours.saturday.close)}` : '10:00 AM - 4:00 PM'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Sunday</span>
                  <span className="font-medium text-gray-900">{hours?.sunday && hours.sunday.closed ? 'Closed' : hours?.sunday ? `${formatTime(hours.sunday.open)} - ${formatTime(hours.sunday.close)}` : 'Closed'}</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white/50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>Response Time:</strong> We typically respond to emails within 24 hours during business days.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
