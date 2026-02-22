import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20 text-center w-80">
          <h1 className="text-3xl font-bold text-white mb-4">Hello world 👋</h1>

          <p className="text-lg text-slate-300 mb-6">
            Count: <span className="font-semibold text-cyan-400">{count}</span>
          </p>

          <button
            className="w-full py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 transition-all duration-300 text-white font-semibold shadow-lg hover:scale-105 active:scale-95"
            onClick={() => setCount(count + 1)}
          >
            Increment
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
