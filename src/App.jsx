import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import ISSTracker from './components/ISSTracker';
import NewsSection from './components/NewsSection';
import SpeedChart from './components/SpeedChart';
import ChatBot from './components/ChatBot';
import { useISS } from './hooks/useISS';
import { useNews } from './hooks/useNews';

function App() {
  const issData = useISS();
  const newsData = useNews();

  return (
    <div className="min-h-screen bg-[#faf7f2] dark:bg-navy-900 transition-colors duration-300">
      <Toaster position="top-right" />
      
      <div className="max-w-[1600px] mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Header />
        
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Main Content Area (Left Column) */}
          <div className="lg:col-span-8 space-y-8">
            <section id="iss-tracking">
              <ISSTracker issData={issData} />
            </section>
            
            <section id="news-intelligence">
              <NewsSection newsData={newsData} />
            </section>
          </div>

          {/* Sidebar Area (Right Column) */}
          <div className="lg:col-span-4 space-y-8">
            <section id="speed-trend">
              <SpeedChart positions={issData.positions} />
            </section>
            
            {/* News Distribution Chart removed as requested */}
          </div>
        </main>
      </div>

      <ChatBot dashboardData={{ issData, newsData }} />
    </div>
  );
}

export default App;
