import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          NoteTaker Pro Test
        </h1>
        <p className="text-gray-600 mb-8">
          Testing basic functionality
        </p>
        <button
          onClick={() => setCount(count + 1)}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          Count: {count}
        </button>
      </div>
    </div>
  );
}

export default App;
