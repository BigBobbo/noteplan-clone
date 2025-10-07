# Layout Component - Implementation Guide

## Overview
Main application layout with header, sidebar, and editor in a responsive 3-pane design.

## File Location
`src/components/layout/Layout.tsx`

## Implementation

```tsx
import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Editor } from '../editor/Editor';
import { useUIStore } from '../../store/uiStore';

export const Layout: React.FC = () => {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {!sidebarCollapsed && <Sidebar />}

        {/* Editor */}
        <Editor />
      </div>
    </div>
  );
};
```

## Features
- **Fixed Height**: Uses `h-screen` to fill viewport
- **Flex Layout**: Header on top, content below
- **Responsive**: Sidebar can be collapsed
- **Overflow Handling**: Prevents layout breaking with long content

## Styling Notes
- Uses Flexbox for layout
- Header is fixed height
- Main content area fills remaining space
- Sidebar and editor side by side
- Background colors for light/dark mode

## Testing Checklist
- [ ] Layout fills viewport
- [ ] Header stays at top
- [ ] Sidebar toggles correctly
- [ ] Editor takes remaining space
- [ ] No scrolling issues
- [ ] Dark mode works
- [ ] Responsive on different screen sizes
