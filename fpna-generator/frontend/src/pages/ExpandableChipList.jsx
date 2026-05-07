import React, { useState, useRef, useEffect } from 'react';
import './ExpandableChipList.css';

export default function ExpandableChipList({ title = "Available Products", items = [] }) {
  // Set how many items are visible by default
  const [maxVisible, setMaxVisible] = useState(3);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Safely close the dropdown if the user clicks somewhere else on the screen
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ensure the user can only type valid numbers in the input
  const handleMaxChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setMaxVisible(isNaN(val) || val < 0 ? 0 : val);
  };

  // Slice the array based on the user's selected limit
  const visibleItems = items.slice(0, maxVisible);
  const hiddenItems = items.slice(maxVisible);

  if (!items || items.length === 0) return null;

  return (
    <div className="expandable-chip-container">
      <div className="chip-header">
        <span className="chip-title">{title}</span>
        
        {/* The Editable Number Input */}
        <div className="chip-controls">
          <label>Visible limit:</label>
          <input
            type="number"
            min="0"
            max={items.length}
            value={maxVisible}
            onChange={handleMaxChange}
            className="chip-limit-input"
          />
        </div>
      </div>

      <div className="chip-row">
        {/* Render the visible items as horizontal chips */}
        {visibleItems.map((item, i) => (
          <span key={i} className="chip-item">{item}</span>
        ))}

        {/* Render the "+ (Remaining)" dropdown button if there is overflow */}
        {hiddenItems.length > 0 && (
          <div className="dropdown-wrapper" ref={dropdownRef}>
            <button
              className="chip-item chip-more-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              +{hiddenItems.length} more
            </button>

            {/* The absolute positioned dropdown menu */}
            {dropdownOpen && (
              <div className="chip-dropdown-menu">
                {hiddenItems.map((item, i) => (
                  <div key={i} className="dropdown-item">{item}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}