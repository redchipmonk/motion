

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

const AVAILABLE_TAGS = [
  "Social",
  "Food & Drink",
  "Music",
  "Tech",
  "Arts",
  "Sports",
  "Outdoors",
  "Wellness",
  "Family",
  "Nightlife",
  "Education",
  "Networking",
];

const TagInput = ({ tags, onChange }: TagInputProps) => {
  const handleToggle = (tag: string) => {
    if (tags.includes(tag)) {
      onChange(tags.filter((t) => t !== tag));
    } else {
      onChange([...tags, tag]);
    }
  };

  // Only show tags that aren't selected yet (they appear in the label area when selected)
  const availableTags = AVAILABLE_TAGS.filter((t) => !tags.includes(t));

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {availableTags.map((tag) => (
        <button
          key={tag}
          type="button" // Prevent form submission
          onClick={() => handleToggle(tag)}
          className="rounded-full border border-gray-200 bg-white px-3 py-1 font-medium text-gray-600 transition-colors hover:border-motion-primary hover:text-motion-primary"
        >
          + {tag}
        </button>
      ))}
      {availableTags.length === 0 && (
        <span className="text-gray-400 italic text-xs">All tags selected</span>
      )}
    </div>
  );
};

export default TagInput;
