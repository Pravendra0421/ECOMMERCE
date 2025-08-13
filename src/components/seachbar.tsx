'use client'
import React, { useState, useRef, useEffect } from 'react';
import { CiSearch } from "react-icons/ci"; // Importing the search icon from react-icons
import { useRouter } from 'next/navigation';
const SearchInput: React.FC<{ searchProduct: (searchTerm: string) => void }> = ({ searchProduct }) => {
  const [showInput, setShowInput] = useState(false);
  const [searchTerm,setSearchTerm]=useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleIconClick = () => {
    setShowInput(true); 
  };
  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus(); 
    }
  }, [showInput]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowInput(false);
      }
    };
    if (showInput) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInput]);
  const handleInputChange =(event:React.ChangeEvent<HTMLInputElement>)=>{
      setSearchTerm(event.target.value);
    };
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && searchTerm.trim() !== '') {
      // Yahan par aap apni search logic daal sakte hain
      console.log("Searching for:", searchTerm);
      router.push(`/search?query=${encodeURIComponent(searchTerm)}`);

      
      // Optionally, input ko clear kar sakte hain search ke baad
      setSearchTerm('');
      
      // Aur input ko hide bhi kar sakte hain
      // setShowInput(false);
    }
  };

  return (
    <div ref={searchContainerRef} className="relative flex items-center justify-center p-4">
      {!showInput && (
        <button
          onClick={handleIconClick}
          className="p-3 text-black rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-all duration-300 ease-in-out"
          aria-label="Open search input"
        >
          <CiSearch className="text-xl" />
        </button>
      )}
      {showInput && (
        <div className="relative w-full max-w-md flex items-center">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onKeyDown={handleKeyDown}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 transition-all duration-300 ease-in-out text-lg"
          />
          <div className="absolute left-3 text-gray-400">
            <CiSearch className="text-lg" />
          </div>
        </div>
      )}
    </div>
  );
};
export default SearchInput;
