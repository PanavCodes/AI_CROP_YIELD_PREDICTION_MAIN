import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  MessageCircle, 
  Heart,
  Share2,
  BookOpen,
  Award,
  TrendingUp,
  Calendar,
  MapPin,
  Phone,
  ChevronRight,
  Plus,
  Search,
  Filter,
  ThumbsUp,
  MessageSquare,
  UserPlus,
  Star
} from 'lucide-react';

const Community: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('discussions');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for community posts
  const discussions = [
    {
      id: 1,
      author: 'Rajesh Kumar',
      location: 'Hisar, Haryana',
      avatar: '👨‍🌾',
      time: '2 hours ago',
      title: 'Tips for managing wheat rust disease',
      content: 'I found that spraying neem oil mixed with garlic extract helps prevent rust disease in wheat. Has anyone else tried this method?',
      likes: 45,
      comments: 12,
      isLiked: false,
      tags: ['wheat', 'disease-control', 'organic']
    },
    {
      id: 2,
      author: 'Priya Sharma',
      location: 'Rohtak, Haryana',
      avatar: '👩‍🌾',
      time: '5 hours ago',
      title: 'Best time for fertilizer application',
      content: 'Based on soil testing, I apply DAP during sowing and urea after 30 days. This has increased my yield by 15%. Share your fertilizer schedules!',
      likes: 67,
      comments: 23,
      isLiked: true,
      tags: ['fertilizer', 'yield', 'soil-health']
    },
    {
      id: 3,
      author: 'Suresh Patel',
      location: 'Karnal, Haryana',
      avatar: '👨‍🌾',
      time: '1 day ago',
      title: 'Water conservation techniques that work',
      content: 'Drip irrigation has reduced my water usage by 40% while maintaining the same yield. Initial investment was high but worth it.',
      likes: 89,
      comments: 34,
      isLiked: false,
      tags: ['irrigation', 'water-conservation', 'drip']
    }
  ];

  const experts = [
    {
      id: 1,
      name: 'Dr. Amit Singh',
      title: 'Agricultural Scientist',
      specialty: 'Soil Health & Fertility',
      rating: 4.8,
      consultations: 234,
      avatar: '👨‍🔬',
      available: true
    },
    {
      id: 2,
      name: 'Meera Reddy',
      title: 'Crop Protection Specialist',
      specialty: 'Pest & Disease Management',
      rating: 4.9,
      consultations: 189,
      avatar: '👩‍🔬',
      available: true
    },
    {
      id: 3,
      name: 'Raj Verma',
      title: 'Irrigation Expert',
      specialty: 'Water Management',
      rating: 4.7,
      consultations: 156,
      avatar: '👨‍💼',
      available: false
    }
  ];

  const successStories = [
    {
      id: 1,
      farmer: 'Harpreet Singh',
      location: 'Jind, Haryana',
      achievement: 'Increased wheat yield by 30%',
      story: 'By following precision farming techniques and using AI predictions for irrigation timing, I achieved record yields this season.',
      image: '🌾',
      likes: 234
    },
    {
      id: 2,
      farmer: 'Anita Devi',
      location: 'Panipat, Haryana',
      achievement: 'Reduced water usage by 45%',
      story: 'Switching to drip irrigation and mulching helped me save water while improving crop quality.',
      image: '💧',
      likes: 189
    }
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'Organic Farming Workshop',
      date: 'March 15, 2024',
      time: '10:00 AM',
      location: 'Krishi Bhawan, Hisar',
      type: 'workshop',
      attendees: 45
    },
    {
      id: 2,
      title: 'Kisan Mela 2024',
      date: 'March 20, 2024',
      time: '9:00 AM',
      location: 'Agriculture University, Karnal',
      type: 'fair',
      attendees: 500
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-green-100"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
                <Users className="text-green-600" />
                Farmer Community
              </h1>
              <p className="text-gray-600 mt-2">Connect, learn, and grow together</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Plus size={18} />
              Start Discussion
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search discussions, experts, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Filter size={18} />
              Filter
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-2 border-b border-gray-200">
            {['discussions', 'experts', 'success-stories', 'events'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'text-green-600 border-green-600'
                    : 'text-gray-600 border-transparent hover:text-gray-800'
                }`}
              >
                {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content based on active tab */}
        {activeTab === 'discussions' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {discussions.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{post.avatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-800">{post.author}</h3>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin size={10} />
                            {post.location}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{post.time}</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Share2 size={18} />
                    </button>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-bold text-gray-900 mb-2">{post.title}</h4>
                    <p className="text-gray-700">{post.content}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className={`flex items-center gap-2 ${post.isLiked ? 'text-red-500' : 'text-gray-600'} hover:text-red-500 transition-colors`}>
                        <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
                        <span className="text-sm">{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors">
                        <MessageCircle size={18} />
                        <span className="text-sm">{post.comments}</span>
                      </button>
                    </div>
                    <button className="text-green-600 text-sm font-medium hover:text-green-700">
                      View Discussion →
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Trending Topics */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-lg p-5 border border-gray-100"
              >
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="text-green-600" size={20} />
                  Trending Topics
                </h3>
                <div className="space-y-2">
                  {['#wheat-harvest', '#organic-farming', '#drip-irrigation', '#soil-testing', '#pest-control'].map((topic, idx) => (
                    <button key={idx} className="block w-full text-left text-sm text-gray-600 hover:text-green-600 transition-colors">
                      {topic}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Top Contributors */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg p-5 border border-gray-100"
              >
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Award className="text-green-600" size={20} />
                  Top Contributors
                </h3>
                <div className="space-y-3">
                  {['Rajesh Kumar', 'Priya Sharma', 'Suresh Patel'].map((name, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm">
                          {name.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-700">{name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{234 - idx * 45} posts</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === 'experts' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experts.map((expert, index) => (
              <motion.div
                key={expert.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
              >
                <div className="text-center">
                  <div className="text-5xl mb-3">{expert.avatar}</div>
                  <h3 className="font-bold text-gray-800">{expert.name}</h3>
                  <p className="text-sm text-gray-600">{expert.title}</p>
                  <p className="text-xs text-green-600 mt-1">{expert.specialty}</p>
                </div>

                <div className="mt-4 flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(expert.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">{expert.rating}</span>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">{expert.consultations} consultations</p>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium">
                    <Phone size={14} className="inline mr-1" />
                    Call
                  </button>
                  <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                    <MessageSquare size={14} className="inline mr-1" />
                    Message
                  </button>
                </div>

                {expert.available && (
                  <div className="mt-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Available Now
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'success-stories' && (
          <div className="grid md:grid-cols-2 gap-6">
            {successStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
              >
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                  <div className="text-5xl mb-3">{story.image}</div>
                  <h3 className="text-xl font-bold">{story.achievement}</h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      {story.farmer.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{story.farmer}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={10} />
                        {story.location}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700">{story.story}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors">
                      <Heart size={18} />
                      <span className="text-sm">{story.likes}</span>
                    </button>
                    <button className="text-green-600 text-sm font-medium hover:text-green-700">
                      Read Full Story →
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="grid md:grid-cols-2 gap-6">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                      event.type === 'workshop' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {event.type === 'workshop' ? 'Workshop' : 'Fair'}
                    </span>
                    <h3 className="font-bold text-gray-800 text-lg">{event.title}</h3>
                  </div>
                  <BookOpen className="text-green-600" size={24} />
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={16} />
                    <span>{event.attendees} attending</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                    Register Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;