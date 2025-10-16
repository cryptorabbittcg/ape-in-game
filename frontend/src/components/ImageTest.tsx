import React from 'react';

const ImageTest: React.FC = () => {
  return (
    <div className="p-8 bg-gray-800 text-white">
      <h2 className="text-2xl mb-4">Image Test Component</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg mb-2">Test 1: Direct img tag</h3>
          <img 
            src="/assets/bots/sandy.png" 
            alt="Sandy Test" 
            className="w-20 h-20 rounded-full border-2 border-purple-500"
            onLoad={() => console.log('✅ Sandy image loaded successfully')}
            onError={(e) => console.error('❌ Sandy image failed to load:', e)}
          />
        </div>

        <div>
          <h3 className="text-lg mb-2">Test 2: All bot images</h3>
          <div className="flex space-x-4">
            {['sandy', 'aida', 'lana', 'enj1n', 'nifty'].map(bot => (
              <div key={bot} className="text-center">
                <img 
                  src={`/assets/bots/${bot}.png`} 
                  alt={`${bot} avatar`} 
                  className="w-16 h-16 rounded-full border-2 border-purple-500"
                  onLoad={() => console.log(`✅ ${bot} image loaded successfully`)}
                  onError={(e) => console.error(`❌ ${bot} image failed to load:`, e)}
                />
                <p className="text-xs mt-1">{bot}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg mb-2">Test 3: With background styling</h3>
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden">
            <img 
              src="/assets/bots/sandy.png" 
              alt="Sandy with background" 
              className="w-full h-full object-cover"
              onLoad={() => console.log('✅ Sandy with background loaded successfully')}
              onError={(e) => console.error('❌ Sandy with background failed to load:', e)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageTest;
