import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiUser, HiXMark, HiMagnifyingGlass } from 'react-icons/hi2';

interface UserListOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: Array<{
    id: string; // Handle both User._id and EventAttendee.id
    name: string;
    status: string; // 'following', 'connected', 'going', etc.
  }>;
}

const UserListOverlay: React.FC<UserListOverlayProps> = ({ isOpen, onClose, title, users }) => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 overflow-y-auto"
      onClick={onClose}
    >
      <div className="p-8 min-h-screen">
        <div className="flex justify-end mb-8">
          <button
            onClick={onClose}
            className="text-white text-4xl hover:text-motion-orange transition-colors"
            aria-label="Close"
          >
            <HiXMark />
          </button>
        </div>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">{title} ({users.length})</h2>

          {/* Search Input */}
          <div
            className="relative mb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <HiMagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 text-xl" />
            <input
              type="text"
              placeholder={`Search...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/60 focus:outline-none focus:border-motion-purple focus:ring-1 focus:ring-motion-purple transition-all"
            />
          </div>

          <div className="flex flex-col gap-4">
            {filteredUsers.map((user, i) => (
              <div
                key={`${user.id}-${i}`}
                className="flex items-center gap-6 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${user.id}`);
                  onClose();
                }}
              >
                <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center text-4xl text-[#d8b4fe] shrink-0">
                  <HiUser />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white">{user.name}</span>
                  <span className="text-sm font-medium text-white/70 uppercase tracking-wide">
                    {user.status === 'following' ? 'FOLLOWING' : user.status}
                  </span>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-white/50 text-center italic mt-4">No users found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserListOverlay;
