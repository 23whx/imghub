import React from 'react';
import { ArrowRight, Image, Grid3x3, Users, Scissors, Camera, Droplet, Video, Minimize } from 'lucide-react';

const ToolCard = ({ title, description, icon, href, color = 'orange' }) => {
  const colorClasses = {
    orange: 'from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600',
    blue: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
    purple: 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    green: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
    red: 'from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600',
    indigo: 'from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600',
  };

  // Icon mapping
  const iconMap = {
    Image,
    Grid3x3,
    Users,
    Scissors,
    Camera,
    Droplet,
    Video,
    Minimize,
  };

  const IconComponent = iconMap[icon] || Image;

  return (
    <a
      href={href}
      className={`group relative bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
          <IconComponent className="w-8 h-8 text-white" />
        </div>
        <ArrowRight className="w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/90 text-sm leading-relaxed">{description}</p>
      
      {/* Decorative element */}
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-tl-full"></div>
    </a>
  );
};

export default ToolCard;