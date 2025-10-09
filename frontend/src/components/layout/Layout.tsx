import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainView } from './MainView';
import { NewFileModal } from '../modals/NewFileModal';
import { DeleteConfirm } from '../modals/DeleteConfirm';
import { DateNavigator } from '../calendar/DateNavigator';
import { Timeline } from '../calendar/Timeline';
import { MiniCalendar } from '../calendar/MiniCalendar';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useUIStore } from '../../store/uiStore';
import { useCalendarStore } from '../../store/calendarStore';
import { useEffect } from 'react';

export const Layout: React.FC = () => {
  const { setTheme, sidebarCollapsed } = useUIStore();
  const { showTimeline } = useCalendarStore();

  // Initialize WebSocket connection
  useWebSocket();

  // Setup keyboard shortcuts
  useKeyboard();

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('noteplan-ui-storage');
    if (savedTheme) {
      try {
        const data = JSON.parse(savedTheme);
        if (data.state?.theme) {
          setTheme(data.state.theme);
        }
      } catch (e) {
        console.error('Failed to load theme:', e);
      }
    }
  }, [setTheme]);

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {!sidebarCollapsed && <Sidebar />}

        {/* Main content area with editor and optional timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <DateNavigator />

          <div className="flex-1 flex overflow-hidden">
            <MainView />

            {/* Right sidebar with mini calendar and timeline */}
            {showTimeline && (
              <div className="w-80 flex-shrink-0 flex flex-col border-l border-gray-200 dark:border-gray-700">
                {/* Mini Calendar */}
                <div className="flex-shrink-0">
                  <MiniCalendar />
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-hidden">
                  <Timeline />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <NewFileModal />
      <DeleteConfirm />
    </div>
  );
};
