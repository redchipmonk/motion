import { HiUser } from 'react-icons/hi2';

interface AttendeeAvatarProps {
  name: string;
  status: string;
}

const AttendeeAvatar = ({ name, status }: AttendeeAvatarProps) => (
  <div className="flex flex-col items-center gap-1 shrink-0">
    <div className="h-40 w-40 rounded-full bg-white flex items-center justify-center text-9xl text-[#d8b4fe] border-2 border-transparent shadow-lg text-motion-purple overflow-hidden">
      <HiUser />
    </div>
    <span className="text-base font-bold text-motion-purple text-center max-w-[160px] truncate">{name}</span>
    <span className="text-xs font-medium text-motion-purple/80 tracking-wide uppercase">
      {status === 'following' ? 'FOLLOWING' : status}
    </span>
  </div>
);

export default AttendeeAvatar;
