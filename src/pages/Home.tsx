import React from 'react';
import { Link } from 'react-router-dom';
// নিশ্চিত করুন এই ফাইলটি ঠিক এই পাথে আছে
import HeroSection from '../components/HeroSection'; 
import { BookOpen, GraduationCap, School, ArrowRight } from 'lucide-react';

export function Home() {
  const services = [
    {
      title: 'HSC প্রস্তুতি',
      description: 'বিগত বছরের প্রশ্ন এবং লেকচার ভিডিওর মাধ্যমে আপনার HSC প্রস্তুতি সম্পন্ন করুন।',
      link: '/hsc',
      icon: BookOpen, // এখানে সরাসরি কম্পোনেন্ট হিসেবে রাখা হলো
      color: 'bg-blue-50',
      iconColor: 'text-blue-500'
    },
    {
      title: 'SSC প্রস্তুতি',
      description: 'SSC শিক্ষার্থীদের জন্য বিশেষ সাজেশন্স এবং অধ্যায়ভিত্তিক গুরুত্বপূর্ণ আলোচনা।',
      link: '/ssc',
      icon: School,
      color: 'bg-green-50',
      iconColor: 'text-green-500'
    },
    {
      title: 'অ্যাডমিশন গাইড',
      description: 'ইঞ্জিনিয়ারিং এবং ভার্সিটি ভর্তি পরীক্ষার পূর্ণাঙ্গ গাইডলাইন ও প্রশ্ন ব্যাংক।',
      link: '/admission',
      icon: GraduationCap,
      color: 'bg-purple-50',
      iconColor: 'text-purple-500'
    }
  ];

  return (
    <div className="animate-fadeIn min-h-screen bg-gray-50">
      <HeroSection />

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            আমাদের সেবা সমূহ
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            আপনার পড়াশোনাকে আরও সহজ এবং কার্যকর করতে আমরা নিয়ে এসেছি বিষয়ভিত্তিক ভিডিও এবং সমাধান।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon; // ডাইনামিক রেন্ডারিং
            return (
              <Link 
                key={index} 
                to={service.link}
                className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-blue-100"
              >
                <div className={`${service.color} w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className={`w-8 h-8 ${service.iconColor}`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-6 line-clamp-2">
                  {service.description}
                </p>
                <div className="flex items-center text-blue-600 font-semibold">
                  শুরু করুন <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">কেন সারথি আপনার সেরা বন্ধু?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard count="৫০০+" label="লেকচার ভিডিও" />
            <StatCard count="১০০%" label="ফ্রি এক্সেস" />
            <StatCard count="১০+" label="এক্সপার্ট মেন্টর" />
            <StatCard count="২৪/৭" label="সাপোর্ট" />
          </div>
        </div>
      </section>
    </div>
  );
}

// আলাদা ছোট কম্পোনেন্ট যাতে মেইন কোড ক্লিন থাকে
function StatCard({ count, label }: { count: string, label: string }) {
  return (
    <div className="p-4">
      <div className="text-blue-600 font-bold text-4xl mb-2">{count}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}
