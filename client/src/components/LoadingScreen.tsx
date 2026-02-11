interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message = 'Loading...' }: LoadingScreenProps) => (
  <div className="flex h-screen items-center justify-center bg-motion-lavender">
    <div className="text-xl font-bold text-motion-plum animate-pulse">{message}</div>
  </div>
);

export default LoadingScreen;
