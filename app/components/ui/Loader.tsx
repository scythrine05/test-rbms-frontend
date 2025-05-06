export const Loader = ({name}: {name: string}) =>      {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
            <div className="text-center p-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-t-[#3277BC] border-r-[#3277BC] border-b-[#3277BC]/20 border-l-[#3277BC]/20 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs sm:text-sm text-gray-500">Loading your {name}...</p>
            </div>
        </div>
    );
}