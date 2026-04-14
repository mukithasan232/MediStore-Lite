// src/app/dashboard/settings/branches/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createBranch, getAllBranches } from '@/actions/branches';
import { Building2, Plus, MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BranchManagement() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    const result = await getAllBranches();
    if (result.success) setBranches(result.branches || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    const formData = new FormData(e.currentTarget);
    
    const result = await createBranch({
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      address: formData.get('address') as string,
    });

    if (result.success) {
      toast.success("New Branch Added!");
      (e.target as HTMLFormElement).reset();
      fetchBranches();
    } else {
      toast.error(result.error);
    }
    setCreating(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="text-blue-600" /> Multi-Branch Management
        </h1>
        <p className="text-gray-500 text-sm">Control all your pharmacy locations from one screen.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Branch Creation Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Add New Location</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Branch Name</label>
                <input name="name" required placeholder="Main Branch - Dhaka" className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Location Code</label>
                <input name="code" required placeholder="DHK-01" className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Full Address</label>
                <textarea name="address" required placeholder="Street, City, Area" className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" rows={3}></textarea>
              </div>
            </div>
            <button disabled={creating} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100 disabled:opacity-50">
              {creating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              {creating ? "Launching..." : "Launch Branch"}
            </button>
          </form>
        </div>

        {/* Branch List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
               <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
               <div className="text-center font-medium text-gray-400">Syncing Enterprise Nodes...</div>
             </div>
          ) : branches.length === 0 ? (
             <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl py-20 text-center">
                <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                  <Building2 size={24} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No branches found. Start by adding your first location!</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branches.map(branch => (
                <div key={branch.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 group hover:border-blue-300 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Building2 size={24} />
                    </div>
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                      {branch.code}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{branch.name}</h4>
                    <p className="text-gray-500 text-sm flex items-start gap-1.5 mt-2 leading-relaxed">
                      <MapPin size={16} className="shrink-0 mt-0.5" /> {branch.address}
                    </p>
                  </div>
                  <div className="pt-4 mt-auto border-t border-gray-50 flex justify-between items-center text-xs font-bold">
                    <div className="flex items-center gap-1.5 text-green-600">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                       Active
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 transition-colors">Local Stats →</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
