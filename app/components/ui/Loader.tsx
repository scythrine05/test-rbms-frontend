export const Loader = ({ name }: { name: string }) => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <div className="text-center p-4">
        <div className="w-8 h-8 border-2 border-t-[#13529e] border-r-[#13529e] border-b-[#13529e]/30 border-l-[#13529e]/30 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-600">Loading {name}...</p>
        <p className="text-xs text-gray-500 mt-1">Please wait</p>
      </div>
    </div>
  );
};
