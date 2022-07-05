import React from 'react';

// =============================================================================
// Typedefs
// =============================================================================

interface EmojiProps {
  ariaLabel: string;
}

// =============================================================================
// Main Component
// =============================================================================

const Emoji: React.FC<EmojiProps> = React.memo((props) => (
  <span role="img" aria-label={props.ariaLabel}>
    {props.children}
  </span>
));

export default Emoji;
