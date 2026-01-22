import React from 'react';
import { Shield, Star, Award, Zap, Trophy } from 'lucide-react';

const icons = {
    shield: Shield,
    star: Star,
    award: Award,
    zap: Zap,
    trophy: Trophy
};

const colors = {
    orange: 'bg-orange-100 text-orange-600 border-orange-200',
    blue: 'bg-blue-100 text-blue-600 border-blue-200',
    green: 'bg-green-100 text-green-600 border-green-200',
    purple: 'bg-purple-100 text-purple-600 border-purple-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200'
};

const GamificationBadge = ({ icon = 'star', color = 'orange', label, subtext }) => {
    const IconComponent = icons[icon] || Star;
    const colorClass = colors[color] || colors.orange;

    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${colorClass} transition-transform hover:scale-105 shadow-sm`}>
            <div className="p-2 bg-white/50 rounded-full">
                <IconComponent size={20} className="fill-current opacity-80" />
            </div>
            <div>
                <p className="font-bold text-sm leading-tight">{label}</p>
                {subtext && <p className="text-xs opacity-75">{subtext}</p>}
            </div>
        </div>
    );
};

export default GamificationBadge;
