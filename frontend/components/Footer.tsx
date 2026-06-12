export function Footer() {
  return (
    <footer className="w-full py-8 bg-[#E5E2DD] dark:bg-[#1C1A19] border-t border-[#1A1A1A]/10 dark:border-[#EAE6DF]/10 text-stone-500 dark:text-stone-450 mt-auto">
      <div className="flex flex-col items-center justify-center space-y-2 text-center px-6">
        <div className="font-serif italic text-lg text-[#1A1A1A] dark:text-[#EAE6DF]">WorkflowOS</div>
        <p className="text-[12px] font-light text-stone-500 dark:text-stone-400">
          &copy; 2026 WorkflowOS. Sophisticated swarm intelligence for high-performance squads.
        </p>
        <div className="flex gap-6 mt-1">
          <a href="#privacy" className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#1A1A1A]/70 dark:text-[#EAE6DF]/70 hover:text-[#1A1A1A] dark:hover:text-[#EAE6DF] transition-colors" onClick={(e) => { e.preventDefault(); alert('WorkflowOS protects intellectual assets in accordance with system sandbox limits.'); }}>Privacy Policy</a>
          <a href="#status" className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#1A1A1A]/70 dark:text-[#EAE6DF]/70 hover:text-[#1A1A1A] dark:hover:text-[#EAE6DF] transition-colors" onClick={(e) => { e.preventDefault(); alert('All nodes are operating within optimal latency. Systems online.'); }}>System Status</a>
          <a href="#docs" className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#1A1A1A]/70 dark:text-[#EAE6DF]/70 hover:text-[#1A1A1A] dark:hover:text-[#EAE6DF] transition-colors" onClick={(e) => { e.preventDefault(); alert('Please refer to @google/genai structured documentation models.'); }}>API Documentation</a>
        </div>
      </div>
    </footer>
  )
}
