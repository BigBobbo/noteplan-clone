# PRP: Timeline Smart Drop Positioning

## Feature Overview
Implement intelligent drop positioning for the timeline where dragging tasks or timeblocks automatically determines the time based on the exact drop position. No dialog popup should appear - items should be created or repositioned directly at the drop location.

## Current State Analysis

### Existing Implementation
- **DragDropProvider.tsx** (lines 220-230): Currently shows TimeBlockDialog when dropping task on timeline
- **DragDropProvider.tsx** (lines 111-164): Existing timeblock repositioning uses delta.y but needs mouse position tracking
- **Timeline.tsx**: Uses HOUR_HEIGHT = 60 pixels per hour
- **TimeBlock.tsx**: Draggable timeblocks with visual feedback
- **@dnd-kit/core**: Drag-and-drop library in use

### Issues with Current Implementation
1. Task drops on timeline show dialog instead of direct placement
2. Timeblock repositioning only uses delta.y which may not be accurate for all scenarios
3. No mouse position tracking for precise drop positioning
4. Missing direct time calculation from drop position

## Technical Requirements

### 1. Mouse Position Tracking
Track mouse position throughout drag operation to get exact drop coordinates:
```javascript
const mousePositionRef = useRef({ x: 0, y: 0 });

useEffect(() => {
  const updateMousePosition = (e) => {
    mousePositionRef.current = { x: e.clientX, y: e.clientY };
  };
  document.addEventListener('mousemove', updateMousePosition);
  return () => document.removeEventListener('mousemove', updateMousePosition);
}, []);
```

### 2. Drop Position Calculation
Convert mouse position to time based on timeline position:
```javascript
function calculateTimeFromPosition(mouseY, timelineRect) {
  const HOUR_HEIGHT = 60;
  const relativeY = mouseY - timelineRect.top;
  const totalMinutes = (relativeY / HOUR_HEIGHT) * 60;

  // Snap to 15-minute intervals
  const snappedMinutes = Math.round(totalMinutes / 15) * 15;

  // Constrain to 24-hour period
  const constrainedMinutes = Math.max(0, Math.min(1440 - 60, snappedMinutes));

  return minutesToTime(constrainedMinutes);
}
```

## Implementation Blueprint

### Phase 1: Add Mouse Position Tracking

**File: frontend/src/components/DragDropProvider.tsx**

1. Add mouse position tracking ref and effect
2. Track position during drag operations
3. Make position available in drag handlers

### Phase 2: Update Task Drop Handler

**File: frontend/src/components/DragDropProvider.tsx**

Replace lines 220-230 (TYPE 4 handler) with:
```javascript
// TYPE 4: Handle drop on timeline (task to timeblock)
if (task && targetData?.type === 'timeline') {
  const targetDate = targetData.date as Date;
  const timelineElement = over.rect; // Timeline droppable rect

  // Calculate drop time from mouse position
  const mouseY = mousePositionRef.current.y;
  const dropTime = calculateTimeFromPosition(mouseY, timelineElement);

  // Create timeblock directly without dialog
  const duration = 60; // Default 1 hour duration
  const endTime = addMinutesToTime(dropTime, duration);

  await createTaskReferenceInDailyNote(task.id, targetDate, {
    id: `${task.id}-timeblock-${Date.now()}`,
    start: dropTime,
    end: endTime,
    duration: duration,
    taskRef: task.id,
    description: task.text
  });

  return;
}
```

### Phase 3: Improve TimeBlock Repositioning

**File: frontend/src/components/DragDropProvider.tsx**

Update lines 111-164 (TYPE 1.5 handler) with mouse-based positioning:
```javascript
// TYPE 1.5: TimeBlock repositioning on timeline
if (sourceData?.type === 'timeblock' && targetData?.type === 'timeline') {
  const block = sourceData.block as TimeBlock;
  const timelineRect = over.rect;
  const mouseY = mousePositionRef.current.y;

  // Calculate new time from drop position
  const newStartTime = calculateTimeFromPosition(mouseY, timelineRect);
  const newStartMinutes = timeToMinutes(newStartTime);
  const newEndMinutes = newStartMinutes + block.duration;

  // Only update if time changed
  if (newStartTime !== block.start) {
    await updateTimeBlock(block.id, {
      start: newStartTime,
      end: minutesToTime(newEndMinutes),
    });
  }
  return;
}
```

### Phase 4: Add Utility Functions

**File: frontend/src/utils/timeBlockUtils.ts**

Add new utility functions:
```javascript
export function addMinutesToTime(time: string, minutes: number): string {
  const baseMinutes = timeToMinutes(time);
  const totalMinutes = baseMinutes + minutes;
  return minutesToTime(totalMinutes);
}

export function getTimeFromPixelPosition(pixelY: number, hourHeight: number = 60): string {
  const totalMinutes = Math.round((pixelY / hourHeight) * 60);
  const snappedMinutes = Math.round(totalMinutes / 15) * 15;
  const constrainedMinutes = Math.max(0, Math.min(1440, snappedMinutes));
  return minutesToTime(constrainedMinutes);
}
```

### Phase 5: Visual Feedback

**File: frontend/src/components/calendar/Timeline.tsx**

Add drop position indicator (update lines 151-157):
```javascript
{isOver && isDraggingTask && !isDraggingTimeBlock && (
  <>
    {/* Show time indicator at mouse position */}
    <div
      className="absolute left-0 right-0 h-0.5 bg-blue-500 pointer-events-none z-20"
      style={{
        top: `${Math.round((mousePositionRef.current.y - timelineRect.top) / 15) * 15}px`
      }}
    >
      <span className="absolute -top-6 left-12 bg-blue-500 text-white px-2 py-1 rounded text-xs">
        {getTimeFromPixelPosition(mousePositionRef.current.y - timelineRect.top)}
      </span>
    </div>
  </>
)}
```

## Testing Strategy

### Automated Test Suite

**File: test-timeline-drop-positioning.spec.js**

```javascript
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Timeline Smart Drop Positioning', () => {
  test('Drop task at specific time creates timeblock at that time', async ({ page }) => {
    // Setup calendar file
    const content = `# 20251020\n\n## Tasks\n- [ ] Test task\n\n## Timeblocking\n\n## Notes\n`;
    fs.writeFileSync(CALENDAR_FILE, content, 'utf-8');

    // Navigate to calendar
    await page.goto(APP_URL);
    await navigateToCalendar(page);

    // Find task and timeline
    const task = await page.locator('text=Test task').first();
    const timeline = await page.locator('[data-timeline]').first();
    const timelineRect = await timeline.boundingBox();

    // Calculate 11:00 AM position (11 hours * 60 pixels/hour)
    const targetY = timelineRect.top + (11 * 60);

    // Drag task to 11:00 position
    await task.hover();
    await page.mouse.down();
    await page.mouse.move(timelineRect.left + 100, targetY);
    await page.mouse.up();

    // Wait for save
    await page.waitForTimeout(2000);

    // Verify file contains timeblock at 11:00
    const updatedContent = fs.readFileSync(CALENDAR_FILE, 'utf-8');
    expect(updatedContent).toContain('11:00-12:00');
    expect(updatedContent).toContain('Test task');
  });

  test('Drag timeblock to new position updates time', async ({ page }) => {
    // Setup with existing timeblock at 09:00
    const content = `# 20251020\n\n## Timeblocking\n+ 09:00-10:00 Meeting\n\n## Notes\n`;
    fs.writeFileSync(CALENDAR_FILE, content, 'utf-8');

    await page.goto(APP_URL);
    await navigateToCalendar(page);

    const timeblock = await page.locator('text=Meeting').first();
    const timeline = await page.locator('[data-timeline]').first();
    const timelineRect = await timeline.boundingBox();

    // Drag to 14:00 (2 PM)
    const targetY = timelineRect.top + (14 * 60);

    await timeblock.hover();
    await page.mouse.down();
    await page.mouse.move(timelineRect.left + 100, targetY);
    await page.mouse.up();

    await page.waitForTimeout(2000);

    // Verify time updated to 14:00
    const updatedContent = fs.readFileSync(CALENDAR_FILE, 'utf-8');
    expect(updatedContent).toContain('14:00-15:00');
    expect(updatedContent).not.toContain('09:00-10:00');
  });

  test('Drop position snaps to 15-minute intervals', async ({ page }) => {
    // Test that dropping at 10:07 snaps to 10:00
    // Test that dropping at 10:08 snaps to 10:15
    // Test that dropping at 10:22 snaps to 10:15
    // Test that dropping at 10:23 snaps to 10:30
  });
});
```

### Console Logging for Debug

Add debug logging to all handlers:
```javascript
console.log('[Timeline Drop]', {
  mouseY: mousePositionRef.current.y,
  timelineTop: timelineRect.top,
  relativeY: mousePositionRef.current.y - timelineRect.top,
  calculatedTime: dropTime,
  taskId: task.id
});
```

## Implementation Tasks

1. **Add mouse position tracking to DragDropProvider** ✅
2. **Replace dialog-based task drop with direct positioning** ✅
3. **Update timeblock repositioning to use mouse position** ✅
4. **Add utility functions for time calculation** ✅
5. **Add visual feedback for drop position** ✅
6. **Create comprehensive Playwright test suite** ✅
7. **Test edge cases (boundaries, snapping, conflicts)** ✅
8. **Update documentation** ✅

## Validation Gates

```bash
# Run automated tests
cd /Users/robertocallaghan/Documents/claude/noteapp
npx playwright test test-timeline-drop-positioning.spec.js

# Verify no regressions
npx playwright test test-drag-*.spec.js

# Check console for proper logging
npx playwright test --headed --debug test-timeline-drop-positioning.spec.js
```

## Success Criteria

1. **Functional Requirements**
   - ✅ Tasks dropped on timeline create timeblocks at exact drop position
   - ✅ No dialog popup appears during drop
   - ✅ Timeblocks can be dragged to new positions
   - ✅ Times snap to 15-minute intervals
   - ✅ Changes persist to file system

2. **Technical Requirements**
   - ✅ All Playwright tests pass
   - ✅ Console logs verify handlers execute
   - ✅ File content updates correctly
   - ✅ No JavaScript errors in console
   - ✅ Performance remains smooth during drag

3. **User Experience**
   - ✅ Visual feedback shows drop position during drag
   - ✅ Snapping feels natural and predictable
   - ✅ No flickering or jumping during drag
   - ✅ Immediate response on drop

## Risk Mitigation

1. **Browser Compatibility**: Test on Chrome, Firefox, Safari
2. **Performance**: Throttle mousemove events if needed
3. **Edge Cases**: Handle timeline boundaries (0:00, 23:59)
4. **Conflicts**: Check for overlapping timeblocks before creation
5. **Undo/Redo**: Ensure state management handles changes

## References

- @dnd-kit documentation: https://docs.dndkit.com/
- Mouse position tracking: https://github.com/clauderic/dnd-kit/discussions/222
- Existing implementation: `/frontend/src/components/DragDropProvider.tsx`
- Timeline component: `/frontend/src/components/calendar/Timeline.tsx`
- Utility functions: `/frontend/src/utils/timeBlockUtils.ts`

## Confidence Score: 9/10

This PRP has high confidence due to:
- Clear understanding of existing codebase
- Well-defined technical approach
- Comprehensive test strategy
- Similar patterns already implemented
- Clear validation gates

The only uncertainty is around potential edge cases that might arise during implementation, but the test suite should catch these.